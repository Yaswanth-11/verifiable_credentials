import {
  createDiscloseCryptosuite,
  createSignCryptosuite,
  createVerifyCryptosuite,
} from "@digitalbazaar/bbs-2023-cryptosuite";
import { documentLoader } from "./documentLoader.js";

import {
  createDiscloseCryptosuite as eccreateDiscloseCryptosuite,
  createSignCryptosuite as eccreateSignCryptosuite,
  createVerifyCryptosuite as eccreateVerifyCryptosuite,
} from "@digitalbazaar/ecdsa-sd-2023-cryptosuite";

import { createCryptosuite } from "@digitalbazaar/ecdsa-xi-2023-cryptosuite";
import { cryptosuite as eddsaRdfc2022CryptoSuite } from "@digitalbazaar/eddsa-rdfc-2022-cryptosuite";

import { DataIntegrityProof } from "@digitalbazaar/data-integrity";


import * as rlc from "@digitalbazaar/vc-revocation-list";

import jsigs from "jsonld-signatures";
const {
  purposes: { AssertionProofPurpose },
} = jsigs;

import * as vc from "@digitalbazaar/vc";

import logger from "../utils/logger.js";
import { DocumentFromDid, setDIDtoRemoteDocuments } from "./DID.js";

import { getJwkfromDidMultibase } from "./keyPairUtils.js";

import { calculateJwkThumbprint } from "jose";
import { buildValidatedUrl } from "../utils/urlValidator.js";

export const signDocument = async (
  inputDocument,
  mandatoryFields,
  signerKeys,
  purpose,
) => {
  logger.info("signDocument | Core Document Sign/derive Started..");

  try {
    let SignedDocument;
    const credential = { ...inputDocument };

    logger.info(`Document signing purpose: ${purpose}`);
    logger.info(`Document signing mandatory fields: ${mandatoryFields}`);

    if (purpose == "issue" && signerKeys) {
      let signSuite;

      if (process.env.IssuerKeyAlgorithm == "BBS") {
        // setup bbs-2023 suite for signing unlinkable VCs
        signSuite = new DataIntegrityProof({
          signer: signerKeys.signer(),
          cryptosuite: createSignCryptosuite({
            mandatoryPointers: mandatoryFields,
          }),
        });
      } else {
        // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
        signSuite = new DataIntegrityProof({
          signer: signerKeys.signer(),
          cryptosuite: eccreateSignCryptosuite({
            mandatoryPointers: mandatoryFields,
          }),
        });
      }

      //credential.issuanceDate = "2010-01-01T01:00:00Z";
      SignedDocument = await vc.issue({
        credential,
        suite: signSuite,
        documentLoader,
      });
    } else if (purpose == "derive" && !signerKeys) {
      await setDIDtoRemoteDocuments(credential);
      let discloseSuite;
      if (process.env.IssuerKeyAlgorithm == "BBS") {
        discloseSuite = new DataIntegrityProof({
          cryptosuite: createDiscloseCryptosuite({
            selectivePointers: mandatoryFields,
          }),
        });
      } else {
        discloseSuite = new DataIntegrityProof({
          cryptosuite: eccreateDiscloseCryptosuite({
            selectivePointers: mandatoryFields,
          }),
        });
      }

      SignedDocument = await vc.derive({
        verifiableCredential: credential,
        suite: discloseSuite,
        documentLoader,
      });
    }

    return SignedDocument;
  } catch (error) {
    logger.error("signDocument | Error occured during Document Sign/derive");
    throw error;
  }
};

/**
 * Signs the Verifiable Presentation document.
 *
 * @param {Object} inputDocument - The input presentation document.
 * @param {string} nonce - The nonce for the challenge.
 * @param {Object} signerKeys - The key pair for signing the document.
 * @returns {Promise<Object>} - The signed Verifiable Presentation document.
 */
export const signPresentationDocument = async (
  inputDocument,
  nonce,
  signerKeys,
) => {
  logger.info("Signing Verifiable Presentation document.");

  try {
    const suite = new DataIntegrityProof({
      signer: signerKeys.signer(),
      cryptosuite: createCryptosuite(),
    });

    const signedDocument = await vc.signPresentation({
      presentation: inputDocument,
      suite,
      challenge: nonce,
      documentLoader,
    });

    return signedDocument;
  } catch (error) {
    logger.error("Error signing Verifiable Presentation document.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Signs the Revocation List Credential using issuer's key pair.
 *
 * @param {Object} inputDocument - The prepared Revocation List Credential document.
 * @param {Object} keyPair - Issuer's key pair for signing the document.
 * @returns {Promise<Object>} Signed Revocation List Credential.
 */
export const signRlcDocument = async (inputDocument, keyPair) => {
  try {
    logger.info(
      "signRlcDocument | Signing the Revocation List Credential document.",
    );

    // create suite
    const suite = new DataIntegrityProof({
      signer: await keyPair.signer(),
      cryptosuite: createCryptosuite(),
    });

    // create signed credential
    const signedCredential = await jsigs.sign(inputDocument, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader,
    });

    logger.info(
      "signRlcDocument | Revocation List Credential successfully signed.",
    );
    return signedCredential;
  } catch (error) {
    logger.error("signRlcDocument | Error in occured during rlc signing");
    throw error;
  }
};


/**
 * Verifies the Revocation List Credential's proof.
 *
 * @param {Object} RevokeListCredential - The Revocation List Credential to be verified.
 * @returns {Promise<Object>} Verification result.
 */
export const verifyRlcDocument = async (RevokeListCredential) => {
  try {
    logger.info("Verifying Revocation List Credential.");

    await setDIDtoRemoteDocuments(RevokeListCredential);

    const ecsuite = new DataIntegrityProof({
      cryptosuite: createCryptosuite(),
    });

    // verify the derived credential
    const verificationResult = await jsigs.verify(RevokeListCredential, {
      suite: ecsuite,
      purpose: new AssertionProofPurpose(),
      documentLoader,
    });

    if (!verificationResult.verified) {
      logger.error("Proof verification failed.");
      throw new Error("Proof verification failed.");
    }

    return verificationResult;
  } catch (error) {
    logger.error("Error in verifying Revocation List Credential.", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const verifyVerifiablePresentation = async (presentation) => {
  logger.info("verifiable presentation verification started...");
  try {
    let verifySuite;

    await setDIDtoRemoteDocuments(presentation);
    await setDIDtoRemoteDocuments(presentation.verifiableCredential[0]);

    let response = await fetch(
      buildValidatedUrl(presentation.verifiableCredential[0].credentialStatus
        .revocationListCredential)
    );

    let text = await response.text(); // get raw string

    let dataChange = JSON.parse(text); // convert stringified JSON → object

    if (typeof dataChange === "string") {
      dataChange = JSON.parse(dataChange);
    }

    logger.info(`Data change ${JSON.stringify(dataChange, null, 2)}`);

    await setDIDtoRemoteDocuments(dataChange);

    if (process.env.IssuerKeyAlgorithm == "BBS") {
      verifySuite = new DataIntegrityProof({
        cryptosuite: createVerifyCryptosuite(),
      });
    } else {
      verifySuite = new DataIntegrityProof({
        cryptosuite: eccreateVerifyCryptosuite(),
      });
    }

    const edsuite = new DataIntegrityProof({
      cryptosuite: eddsaRdfc2022CryptoSuite,
    });

    const rlcsuite = new DataIntegrityProof({
      cryptosuite: createCryptosuite(),
    });

    const challenge = presentation.proof.challenge;

    async function checkStatus(options) {
      const result = await rlc.checkStatus({
        credential: options.presentation.verifiableCredential[0],
        suite: rlcsuite,
        documentLoader: options.documentLoader,
        verifyRevocationListCredential: true,
        verifyMatchingIssuers: false,
      });
      return result;
    }

    const result1 = await vc.verify({
      challenge,
      suite: [verifySuite, rlcsuite],
      documentLoader,
      presentation,
      checkStatus,
    });

    // logger.info(
    //   `Presentation verification result: ${JSON.stringify(result1, null, 2)}`
    // );

    logger.info(
      `Presentation verification result: ${JSON.stringify(
        result1,
        (key, value) => {
          if (value instanceof Error) {
            return { message: value.message, stack: value.stack }; // Convert Error to plain object
          }
          return value;
        },
        2,
      )}`,
    );

    if (result1.error) {
      const firstError = [].concat(result1.error)[0];
      throw firstError;
    }

    return result1;
  } catch (error) {
    logger.error("Error in verifying verifiable presentation.", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};



export const verifyverifiableCredential = async (credential) => {
  logger.info("verifiable credential verification started...");
  try {
    let verifySuite;

    await setDIDtoRemoteDocuments(credential);

    if (process.env.IssuerKeyAlgorithm == "BBS") {
      verifySuite = new DataIntegrityProof({
        cryptosuite: createVerifyCryptosuite(),
      });
    } else {
      verifySuite = new DataIntegrityProof({
        cryptosuite: eccreateVerifyCryptosuite(),
      });
    }

    const rlcsuite = new DataIntegrityProof({
      cryptosuite: createCryptosuite(),
    });

    async function checkStatus(options) {
      const result = await rlc.checkStatus({
        credential: credential,
        suite: rlcsuite,
        documentLoader: options.documentLoader,
        verifyRevocationListCredential: true,
        verifyMatchingIssuers: false,
      });
      return result;
    }

    const result1 = await vc.verifyCredential({
      suite: [verifySuite, rlcsuite],
      documentLoader,
      credential,
      checkStatus,
    });

    // logger.info(
    //   `Presentation verification result: ${JSON.stringify(result1, null, 2)}`
    // );

    logger.info(
      `Presentation verification result: ${JSON.stringify(
        result1,
        (key, value) => {
          if (value instanceof Error) {
            return { message: value.message, stack: value.stack }; // Convert Error to plain object
          }
          return value;
        },
        2,
      )}`,
    );

    if (result1.error) {
      const firstError = [].concat(result1.error)[0];
      throw firstError;
    }

    return result1;
  } catch (error) {
    logger.error("Error in verifying verifiable presentation.", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
