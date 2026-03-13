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

import sd from "../SD-JWT/transmute sd-jwt/index.js";

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

export const signDocument = async (
  inputDocument,
  mandatoryFields,
  signerKeys,
  purpose
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
  signerKeys
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
      "signRlcDocument | Signing the Revocation List Credential document."
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
      "signRlcDocument | Revocation List Credential successfully signed."
    );
    return signedCredential;
  } catch (error) {
    logger.error("signRlcDocument | Error in occured during rlc signing");
    throw error;
  }
};

/**
 * Signs the JWT Credential using issuer's key pair.
 *
 * @param {Object} inputDocument - The prepared Credential document.
 * @param {Object} keyPair - Issuer's key pair for signing the document.
 * @returns {Promise<Object>} Signed JWT Credential.
 */

export const signJWTDocument = async (
  inputDocument,
  keyPair,
  kid,
  iss,
  mode
) => {
  try {
    logger.info("Signing the JWT Credential document.");

    let typ;
    let cty;
    let alg;

    if (mode == "issue") {
      alg = "ES256";
      typ = "application/vc+sd-jwt";
      cty = "application/vc";
    } else if (mode == "derive") {
      alg = "ES256";
      typ = "application/vp+sd-jwt";
      cty = "application/vp";
    }

    logger.info(`signJWTDocument | Signing mode: ${mode}`);
    logger.info(`signJWTDocument | Signing algorithm crv: ${keyPair.crv}`);
    logger.info(`signJWTDocument | Signing algorithm alg: ${alg}`);

    const publicKeyJwk = {};
    publicKeyJwk.x = keyPair.x;
    publicKeyJwk.y = keyPair.y;
    publicKeyJwk.kty = keyPair.kty;
    publicKeyJwk.crv = keyPair.crv;

    const secretKeyJwk = {};
    secretKeyJwk.x = keyPair.x;
    secretKeyJwk.y = keyPair.y;
    secretKeyJwk.d = keyPair.d;
    secretKeyJwk.kty = keyPair.kty;
    secretKeyJwk.crv = keyPair.crv;
    secretKeyJwk.alg = alg;

    //TODO add iss, iat, exp to the credential
    //holder public jwk

    const iat = Math.floor(Date.now() / 1000); // current timestamp in seconds
    const exp = iat + 365 * 24 * 60 * 60; // 1 year from now

    const signedCredential = await sd
      .issuer({
        alg,
        kid: kid,
        typ,
        iss,
        cty,
        secretKeyJwk: secretKeyJwk,
      })
      .issue({
        claimset: inputDocument,
        iat,
        exp,
      });

    logger.info("JWT Credential successfully signed.");
    return signedCredential;
  } catch (error) {
    logger.error("Error in occured during credential signing");
    throw error;
  }
};

export const deriveJWTDocument = async (
  verifiableCredential,
  disclosure,
  keyPair
) => {
  try {
    /*
    const publicKeyJwk = {};
    publicKeyJwk.x = keyPair.x;
    publicKeyJwk.kty = keyPair.kty;
    publicKeyJwk.crv = keyPair.crv;
    publicKeyJwk.alg = "EdDSA";
    publicKeyJwk.kid = await calculateJwkThumbprint(publicKeyJwk);

    const secretKeyJwk = {};
    secretKeyJwk.x = keyPair.x;
    secretKeyJwk.d = keyPair.d;
    secretKeyJwk.kty = keyPair.kty;
    secretKeyJwk.crv = "Ed25519";
    secretKeyJwk.alg = "EdDSA";
    secretKeyJwk.kid = await calculateJwkThumbprint(secretKeyJwk);

    */

    logger.info(`deriveJWTDocument | KeyPair crv: ${keyPair.crv}`);

    logger.info(`deriveJWTDocument | KeyPair kty: ${keyPair.kty}`);

    const publicKeyJwk = {};
    publicKeyJwk.x = keyPair.x;
    publicKeyJwk.y = keyPair.y;
    publicKeyJwk.kty = keyPair.kty;
    publicKeyJwk.crv = keyPair.crv;
    publicKeyJwk.alg = "ES256";

    const secretKeyJwk = {};
    secretKeyJwk.x = keyPair.x;
    secretKeyJwk.y = keyPair.y;
    secretKeyJwk.d = keyPair.d;
    secretKeyJwk.kty = keyPair.kty;
    secretKeyJwk.crv = keyPair.crv;
    secretKeyJwk.alg = "ES256";

    const vp = await sd.holder({ alg: "ES256", secretKeyJwk }).issue({
      token: verifiableCredential,
      disclosure,
    });
    logger.info("JWT Credential successfully derived.");

    return vp;
  } catch (error) {
    logger.error("Error occured during jwt credential deriving");
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

    let dataChange = await fetch(
      presentation.verifiableCredential[0].credentialStatus
        .revocationListCredential
    );
    const dataCredential = await dataChange.json();

    logger.info(`Data change  ${JSON.stringify(dataCredential, null, 0)}`);

    await setDIDtoRemoteDocuments(dataCredential);

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
        2
      )}`
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

export const verifyJwtVerifiablePresentationCore = async (presentation) => {
  logger.info("verifiable presentation verification started...");
  try {
    // Sample resolver object
    const resolver = {
      /**
       * Resolves the public key for the given key ID (kid).
       * @param {string} kid - The Key ID (public key DID).
       * @returns {Promise<Object>} - Resolves to the public key in JWK format.
       */
      resolve: async (kid) => {
        try {
          const publicKeyJwk = await getJwkfromDidMultibase(kid);

          return publicKeyJwk;
        } catch (error) {
          console.error("Error resolv ing public key:", error);
          throw error;
        }
      },
    };
    const presentationResult = await sd.verifier({ resolver }).verify({
      token: presentation,
    });
    let credentialResult = [];
    if (presentationResult) {
      presentationResult.claimset.verifiableCredential.map(async (vc) => {
        vc = vc?.id.split(",")[1];
        let vc1 =
          "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWV1VlVBN1hkeENudFdLUThQeWtlVFpqYWFFQXlxYUFVTEFhb3dObjRpNGhkdSN6RG5hZXVWVUE3WGR4Q250V0tROFB5a2VUWmphYUVBeXFhQVVMQWFvd05uNGk0aGR1IiwidHlwIjoiYXBwbGljYXRpb24vdmMrc2Qtand0IiwiY3R5IjoiYXBwbGljYXRpb24vdmMifQ.eyJfc2RfYWxnIjoic2hhLTI1NiIsIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly93M2lkLm9yZy92Yy1yZXZvY2F0aW9uLWxpc3QtMjAyMC92MSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzA1MC9hcGkvdmMvc2FtcGxlRG9jRmV0Y2giXSwi…akhvSGxZT0JEZWQwdVlCcmNaZyIsImplMU8tb3Z3MUxsM0JRZEJ2NVJ3dWdjcGt4eTZEbzRLb3Jrd1k5U2ZjaXciLCJvektwNmJHTzZ3a05mWnZGS3hyNDRRTy1KMVdaMFN2UktyMXhBWU9nUWI4IiwiclllUVJ6UktzYnhNWWdydmhVc1hUVzh0V2lIZHlCWkxOV1lrUVFzNnI3RSIsInZnRXBaTEVURFdTWnFvYlNQNFZPYWxnbThOODRDM1dfMHVuRDhhZG1QWWciXX19fQ.3fBqv6tnUAujWPZdr0R8iekMcTbCtZKUOSb92Lg2DRzl-Q9S43VZUr2v5_-2pAR1Q9MueY1HP19WyvoahX2SzA~WyJfQzZLMmdvMTdUemVyRldLdC1sTXpnIiwgInBob3RvIiwgInBob3RvVmFsdWUiXQ~WyJhOG56Y1ZvOG5kaUU1bjM4YVBQYXdRIiwgImVtYWlsIiwgImVtYWlsLmNvbSJd~";
        _result = await sd.verifier({ resolver }).verify({
          token: vc1,
        });
        credentialResult.push(_result);
      });
    }
    return [].concat(presentationResult, ...credentialResult);
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
        2
      )}`
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
