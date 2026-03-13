import { driver } from "@digitalbazaar/did-method-key";
import * as Ed25519Multikey from "@digitalbazaar/ed25519-multikey";
import * as EcdsaMultikey from "@digitalbazaar/ecdsa-multikey";
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey";

import { remoteDocuments } from "../services/initialServices.js";

import logger from "../utils/logger.js";

/**
 * Generate a DID (Decentralized Identifier) and its corresponding DID Document.
 *
 * @param {Object} keyPair - The key pair for which the DID is generated.
 * @param {string} keyType - The type of key (e.g., "Ed25519", "EC", "BBS").
 * @returns {Promise<Object>} - The DID and corresponding DID Document.
 * @throws {Error} - Throws error if DID generation fails.
 */
export const generateDID = async (keyPair, keyType) => {
  try {
    logger.info("generateDID | Initializing DID generation.", { keyType });

    const publicKeyMultibase = await keyPair.publicKeyMultibase;

    const didKeyDriver = driver();

    if (keyType == "Ed25519") {
      logger.info("Using Ed25519 multikey driver.");

      didKeyDriver.use({
        multibaseMultikeyHeader: "z6Mk",
        fromMultibase: Ed25519Multikey.from,
      });
    } else if (keyType == "EC") {
      logger.info("Using EC multikey driver.");
      didKeyDriver.use({
        multibaseMultikeyHeader: "zDna",
        fromMultibase: EcdsaMultikey.from,
      });
    } else {
      logger.info("Using BBS multikey driver.");
      didKeyDriver.use({
        multibaseMultikeyHeader: "zUC7",
        fromMultibase: Bls12381Multikey.from,
      });
    }

    const did = `did:key:${publicKeyMultibase}`;
    const didDocument = await didKeyDriver.get({ did });

    //set didDocument into remoteDocuments

    remoteDocuments.set(
      didDocument.verificationMethod[0].id,
      didDocument.verificationMethod[0]
    );

    remoteDocuments.set(didDocument.id, didDocument);

    logger.info("generateDID | DID document successfully generated.");

    return { did, didDocument };
  } catch (error) {
    logger.error("generateDID | DID generation failed.", {
      message: keyType,
    });
    throw error;
  }
};

/**
 * Retrieves the DID Document from the given DID key.
 *
 * @param {string} didKey - The DID key used to fetch the DID document.
 * @returns {Object} The DID document.
 */
export const DocumentFromDid = async (didKey) => {
  let didDoc;

  try {
    logger.info("DocumentFromDid | Retrieving DID Document.");

    if (!didKey) {
      throw new Error("DID key should not be null.");
    }

    logger.info("DocumentFromDid | setting document for DID key:", didKey);

    const didKeyDriver = driver();
    const DIDMethod = didKey.split("#")[0];
    const substringBeforeHash = DIDMethod.split(":")[2];
    const firstFourCharacters = substringBeforeHash.slice(0, 4);

    if (firstFourCharacters == "zUC7") {
      didKeyDriver.use({
        multibaseMultikeyHeader: "zUC7",
        fromMultibase: Bls12381Multikey.from,
      });
    } else if (firstFourCharacters == "z6Mk") {
      didKeyDriver.use({
        multibaseMultikeyHeader: "z6Mk",
        fromMultibase: Ed25519Multikey.from,
      });
    } else if (firstFourCharacters == "zDna") {
      didKeyDriver.use({
        multibaseMultikeyHeader: "zDna",
        fromMultibase: EcdsaMultikey.from,
      });
    } else {
      throw new Error("Unknown Key algorithm ");
    }

    didDoc = await didKeyDriver.get({ did: DIDMethod });

    remoteDocuments.set(
      didDoc.verificationMethod[0].id,
      didDoc.verificationMethod[0]
    );

    logger.info(`DocumentFromDid | Document for DID key: ${JSON.stringify(didDoc.verificationMethod[0].id,null,0)} retrieved.`);
    logger.info(`DocumentFromDid | Document : ${JSON.stringify(didDoc.verificationMethod[0],null,0)} retrieved.`);

    remoteDocuments.set(didDoc.id, didDoc);
    
        logger.info(`DocumentFromDid | Document : ${JSON.stringify(didDoc.id,null,0)} retrieved.`);
    logger.info(`DocumentFromDid | Document : ${JSON.stringify(didDoc,null,0)} retrieved.`);

    return didDoc;
  } catch (error) {
    logger.error("DocumentFromDid | Error in retrieving DID Document.");
    throw error;
  }
};

export const setDIDtoRemoteDocuments = async (credential) => {
  try {
    logger.info(
      "setDIDtoRemoteDocuments | Setting DID key into remoteDocuments"
    );

    let didDocument;

    if (credential.proof.verificationMethod) {
      didDocument = await DocumentFromDid(credential.proof.verificationMethod);
      if (!didDocument) {
        throw new Error(
          "setDIDtoRemoteDocuments | Error fetching DID Document from verification method in credential"
        );
      }
    } else {
      throw new Error("credential should contain verification method");
    }
  } catch (error) {
    logger.error(
      "setDIDtoRemoteDocuments | Error in setting DID key into remoteDocuments"
    );
    throw error;
  }
};
