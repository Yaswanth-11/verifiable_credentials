import { prepareRlcData } from "./credentialPreparation.js";
import { DocumentFromDid } from "./DID.js";
import { verifyRlcDocument } from "./documentSigning.js";

import * as rlc from "@digitalbazaar/vc-revocation-list";

import logger from "../utils/logger.js";

/**
 * Generates the base Revocation List Credential data.
 *
 * @param {string} id - Unique identifier for the Revocation List Credential.
 * @param {string} IssuerDID - Decentralized Identifier (DID) of the issuer.
 * @returns {Promise<Object>} Prepared RLC data.
 */
export const generateRlc = async (id, IssuerDID) => {
  try {
    logger.info(
      "generateRlc | Generating initial Revocation List Credential data."
    );

    let length = 100000;

    const list = await rlc.createList({ length });

    logger.info(`generating rlc with length: ${length}`);
    logger.info(`issuer did: ${IssuerDID}`);

    const credential = await rlc.createCredential({ id, list });

    const RlcData = await prepareRlcData(credential, IssuerDID);

    logger.info(
      "generateRlc | Revocation List Credential data successfully generated."
    );

    return RlcData;
  } catch (error) {
    logger.error(
      "generateRlc | Error generating Revocation List Credential data."
    );
    throw error;
  }
};

/**
 * Updates the Revocation List Credential by revoking or activating a credential.
 *
 * @param {number} credentialIndex - Index of the credential to be updated.
 * @param {Object} RevokeListCredential - The RLC to be updated.
 * @param {string} IssuerDID - Decentralized Identifier (DID) of the issuer.
 * @returns {Promise<Object>} - The updated Revocation List Credential data.
 */

export const updateRlc = async (
  credentialIndex,
  RevokeListCredential,
  IssuerDID
) => {
  try {
    logger.info("Updating Revocation List Credential.");

    let isRevoked = false;

    let encodedList;
    //TODO changed here
    // if (RevokeListCredential.proof) {
    //   if (Array.isArray(RevokeListCredential.proof)) {
    //     let proof = RevokeListCredential.proof[0];
    //     if (proof.verificationMethod) {
    //       RevokeListCredential.proof = proof;
    //       await verifyRlcDocument(RevokeListCredential);
    //     } else {
    //       throw new Error("Proof verification method is missing.");
    //     }
    //   } else if (RevokeListCredential.proof.verificationMethod) {
    //     await verifyRlcDocument(RevokeListCredential);
    //   } else {
    //     throw new Error("Proof verification method is missing.");
    //   }
    // }

    if (
      RevokeListCredential.proof &&
      RevokeListCredential.proof.verificationMethod
    ) {
      await verifyRlcDocument(RevokeListCredential);
    } else {
      throw new Error("Proof is missing in the Revocation List Credential.");
    }

    if (
      RevokeListCredential.credentialSubject &&
      RevokeListCredential.credentialSubject.encodedList
    ) {
      encodedList = RevokeListCredential.credentialSubject.encodedList;
    } else {
      throw new Error("Invalid Revocation List Credential format.");
    }

    const list = await rlc.decodeList({ encodedList: encodedList });
    if (typeof credentialIndex == "string") {
      credentialIndex = Number(credentialIndex);
    }
    if (list.isRevoked(credentialIndex) === true) {
      isRevoked = true;
      logger.info("Credential is already revoked.");
      return RevokeListCredential;
    } else {
      logger.info("Revoking the credential at index: " + credentialIndex);
      list.setRevoked(credentialIndex, true);
      const updatedCredential = await rlc.createCredential({
        id: RevokeListCredential.id,
        list,
      });

      const RlcData = await prepareRlcData(updatedCredential, IssuerDID);

      return { RlcData: RlcData, isRevoked: isRevoked };
    }
  } catch (error) {
    logger.error("Error in updating Revocation List Credential.", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to decode the Revocation List Credential (RLC).
 * It parses the provided RLC data, decodes the encoded list, and returns the revoked indexes.
 *
 * @param {Object} data - The input data containing issuer IDs and encoded RLC arrays.
 * @returns {Promise<Object>} - An object with issuer IDs as keys and an array of revoked indexes as values.
 */
export const getDecodedRlc = async (Data) => {
  logger.info(
    "Starting the decoding process of the Revocation List Credentials."
  );

  let decodedList = {};
  try {
    for (const [issuerID, { rlcList, counter }] of Object.entries(Data)) {
      let rlcArrayObject = JSON.parse(rlcList);
      let newList = [];

      for (let i = 0; i < counter; i++) {
        let rlcIndex = Math.floor(i / 100000);
        let credentialIndex = i % 100000;

        let rlcItem = rlcArrayObject[rlcIndex];

        if (typeof rlcItem === "string") {
          rlcItem = JSON.parse(rlcItem); // Parse if it's still a string
        }

        if (
          rlcItem &&
          rlcItem.credentialSubject &&
          rlcItem.credentialSubject.encodedList
        ) {
          const encodedList = rlcItem.credentialSubject.encodedList;
          const decodedListResult = await rlc.decodeList({ encodedList });

          let isRevoked = decodedListResult.isRevoked(Number(credentialIndex));
          if (isRevoked) {
            logger.info(
              `Credential at index ${credentialIndex} for issuer ${issuerID} for rlcIndex ${rlcIndex} is revoked.`
            );
            newList.push(i); // Add revoked credential index
          }
        } else {
          logger.error("Invalid Revocation List Credential structure.");
          throw new Error("Not a valid Revocation List Credential.");
        }
      }
      decodedList[issuerID] = newList; // Store revoked indexes for this issuer

      logger.info(`Decoding completed for issuer ${issuerID}.`);
    }

    logger.info(
      "Decoding of all Revocation List Credentials completed successfully."
    );
    return decodedList;
  } catch (error) {
    logger.error("Error occurred during the RLC decoding process.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to check the status of a verifiable credential.
 * It fetches the revocation list credential and checks if the credential is revoked or active.
 *
 * @param {Object} verifiableCredential - The verifiable credential object that contains the credential status details.
 * @returns {Promise<string>} - Returns the credential status ("Revoked" or "Active").
 */
export const credentialStatus = async (verifiableCredential) => {
  logger.info(
    "Starting the credential status check for the given verifiable credential."
  );

  try {
    // Check if the credential contains a valid credentialStatus
    if (!verifiableCredential.credentialStatus) {
      throw new Error(
        "Credential Status should be present in the verifiable credential."
      );
    }

    const { revocationListIndex, revocationListCredential } =
      verifiableCredential.credentialStatus;

    // Ensure revocationListCredential URL is provided
    if (!revocationListCredential) {
      logger.error("Revocation List Credential URL is missing.");
      throw new Error("revocationListCredential URL should not be empty.");
    }

    logger.info(
      `Fetching revocation list credential from: ${revocationListCredential}`
    );
    logger.info(`Revocation list index: ${revocationListIndex}`);

    // Fetch the revocation list credential (RLC) data
    const res = await fetch(revocationListCredential);
    const data = await res.json();

    if (!data) {
      logger.error("Failed to fetch revocation list credential data.");
      throw new Error("Unable to fetch revocation list credential.");
    }

    // Validate the fetched revocation list credential
    const rlCredential = data;
    // if (
    //   rlCredential.id !== revocationListCredential ||
    //   verifiableCredential.issuer !== rlCredential.issuer
    // ) {
    //   logger.error(
    //     "Mismatch between the provided revocation list credential and fetched data."
    //   );
    //   throw new Error("Invalid revocation list credential.");
    // }

    // Check if the RLC has a valid encoded list
    if (!rlCredential.credentialSubject?.encodedList) {
      throw new Error(
        "Invalid Revocation List Credential structure. Missing encoded list."
      );
    }
    // Decode the encoded list and check if the credential is revoked
    const encodedList = rlCredential.credentialSubject.encodedList;
    const list = await rlc.decodeList({ encodedList });

    let isRevoked = list.isRevoked(Number(revocationListIndex));

    return isRevoked ? "Revoked" : "Active";
  } catch (error) {
    logger.error(
      "Error in credential status check function: credentialStatus",
      {
        stack: error.stack,
      }
    );
    throw error;
  }
};

/**
 * Core function to check the status of a verifiable credential.
 * It fetches the revocation list credential and checks if the credential is revoked or active.
 *
 * @param {Object} verifiableCredential - The verifiable credential object that contains the credential status details.
 * @returns {Promise<string>} - Returns the credential status ("Revoked" or "Active").
 */
export const credentialRlcStatus = async (
  revocationListCredential,
  revocationListIndex
) => {
  logger.info(
    "Starting the credential status check for the given verifiable credential."
  );

  try {
    // Ensure revocationListCredential URL is provided
    if (!revocationListCredential) {
      logger.error("Revocation List Credential URL is missing.");
      throw new Error("revocationListCredential URL should not be empty.");
    }

    logger.info(
      `Fetching revocation list credential from: ${revocationListCredential}`
    );
    logger.info(`Revocation list index: ${revocationListIndex}`);

    // Fetch the revocation list credential (RLC) data
    const res = await fetch(revocationListCredential);
    const data = await res.json();

    if (!data) {
      logger.error("Failed to fetch revocation list credential data.");
      throw new Error("Unable to fetch revocation list credential.");
    }

    // Validate the fetched revocation list credential
    const rlCredential = data;
    if (rlCredential.id !== revocationListCredential) {
      logger.error(
        "Mismatch between the provided revocation list credential and fetched data."
      );
      throw new Error("Invalid revocation list credential.");
    }

    // Check if the RLC has a valid encoded list
    if (!rlCredential.credentialSubject?.encodedList) {
      throw new Error(
        "Invalid Revocation List Credential structure. Missing encoded list."
      );
    }
    // Decode the encoded list and check if the credential is revoked
    const encodedList = rlCredential.credentialSubject.encodedList;
    const list = await rlc.decodeList({ encodedList });

    let isRevoked = list.isRevoked(Number(revocationListIndex));

    return isRevoked ? "Revoked" : "Active";
  } catch (error) {
    logger.error(
      "Error in credential status check function: credentialStatus",
      {
        stack: error.stack,
      }
    );
    throw error;
  }
};
