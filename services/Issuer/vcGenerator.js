import logger from "../../utils/logger.js";
import { createECKeyPair } from "../../core/keyPairUtils.js";
import { createBBSKeyPair } from "../../core/keyPairUtils.js";
import {
  prepareCredential,
  prepareCredentialWithoutName,
} from "../../core/credentialPreparation.js";

import { deleteSchemaFromRemoteDocuments } from "../../core/documentLoader.js";
import {
  signDocument,
  signRlcDocument,
} from "../../core/documentSigning.js";
import { generateRlc, updateRlc } from "../../core/manageRLC.js";
import { generateCredentialSchema } from "../../core/schemaCreation.js";


/**
 * Service to handle EC key pair generation.
 *
 * @param {string} seed - The seed to generate the key pair.
 * @returns {Promise<Object>} - The generated EC Key Pair with DID and DID Document.
 * @throws {Error} - Throws error if key pair generation fails.
 */

export const generateECKeyPairHandler = async (seed) => {
  try {
    logger.info(
      "generateECKeyPairHandler | Starting key pair generation process."
    );

    if (!seed) {
      throw new Error("Seed is required to generate the key pair.");
    }

    const algorithm = process.env.IssuerKeyAlgorithm || "EC";

    let keyPair;
    if (algorithm === "BBS") {
      logger.info(
        "generateECKeyPairHandler | Using BBS algorithm for key pair generation."
      );
      keyPair = await createBBSKeyPair(seed);
    } else {
      logger.info(
        "generateECKeyPairHandler | Using EC algorithm for key pair generation."
      );
      keyPair = await createECKeyPair(seed);
    }

    return keyPair;
  } catch (error) {
    logger.error(
      "generateECKeyPairHandler | Key Pair generation process failed.",
      {
        message: "seed : " + (seed ? seed : "undefined"),
      }
    );
    throw error;
  }
};

/**
 * Service to handle the issuance of Verifiable Credentials.
 *
 * @param {string} HolderDID - The DID of the credential holder.
 * @param {Object} Data - Holder-specific data for the credential.
 * @param {string} IssuerSeed - Seed of the issuer used for signing.
 * @param {string} RlcUrl - URL for the revocation list credential.
 * @param {string} counter - Unique index for the revocation list.
 * @param {Object} MetaData - Metadata including name, description, and expiration details.
 * @param {string} ProfileType - Profile type used to specify the schema type.
 * @returns {Promise<Object>} - The generated Verifiable Credential.
 * @throws {Error} - Throws an error if credential issuance fails.
 */
export const issueCredentialHandler = async (
  HolderDID,
  Data,
  IssuerSeed,
  RlcUrl,
  counter,
  MetaData,
  ProfileType
) => {
  try {
    if (!MetaData) {
      throw new Error("MetaData is missing");
    }
    if (!RlcUrl) {
      throw new Error("RlcUrl is missing");
    }
    if (!counter) {
      throw new Error("counter is missing");
    }
    if (!Data) {
      throw new Error("Data is missing");
    }
    if (!HolderDID) {
      throw new Error("HolderDID is needed for credential preparation");
    }
    if (!IssuerSeed) {
      throw new Error("IssuerSeed is missing");
    }

    if (!ProfileType) {
      throw new Error("ProfileType is missing");
    }

    logger.info(
      "issueCredentialHandler | Starting Verifiable Credential issuance process."
    );

    const issuerKeyPair = await generateECKeyPairHandler(IssuerSeed);

    const credentialData = await prepareCredential(
      MetaData,
      Data,
      RlcUrl,
      counter,
      HolderDID,
      issuerKeyPair,
      ProfileType
    );

    logger.info(`issueCredentialHandler | credentialData: ${credentialData}`);

    const mandatoryFields = ["/issuanceDate", "/issuer", "/credentialStatus"];

    const verifiableCredential = await signDocument(
      credentialData,
      mandatoryFields,
      issuerKeyPair.keyPair,
      "issue"
    );

    logger.info(
      "issueCredentialHandler | Verifiable Credential issuance completed successfully."
    );

    if (verifiableCredential) {
      deleteSchemaFromRemoteDocuments(MetaData.schemaURL);
      logger.info(
        "issueCredentialHandler | Schema URL removed from remote documents."
      );
    }

    return verifiableCredential;
  } catch (error) {
    deleteSchemaFromRemoteDocuments(MetaData.schemaURL);
    logger.error(
      "issueCredentialHandler | Error during Verifiable Credential issuance."
    );
    throw error;
  }
};

/**
 * Service to handle the issuance of Verifiable Credentials.
 *
 * @param {string} HolderDID - The DID of the credential holder.
 * @param {Object} Data - Holder-specific data for the credential.
 * @param {string} IssuerSeed - Seed of the issuer used for signing.
 * @param {string} RlcUrl - URL for the revocation list credential.
 * @param {string} counter - Unique index for the revocation list.
 * @param {Object} MetaData - Metadata including name, description, and expiration details.
 * @param {string} ProfileType - Profile type used to specify the schema type.
 * @returns {Promise<Object>} - The generated Verifiable Credential.
 * @throws {Error} - Throws an error if credential issuance fails.
 */
export const issueCredentialCompleteHandler = async (
  HolderDID,
  Data,
  IssuerSeed,
  RlcUrl,
  counter,
  MetaData,
  ProfileType
) => {
  try {
    if (!MetaData) {
      throw new Error("MetaData is missing");
    }
    if (!RlcUrl) {
      throw new Error("RlcUrl is missing");
    }
    if (!counter) {
      throw new Error("counter is missing");
    }
    if (!Data) {
      throw new Error("Data is missing");
    }
    if (!HolderDID) {
      throw new Error("HolderDID is needed for credential preparation");
    }
    if (!IssuerSeed) {
      throw new Error("IssuerSeed is missing");
    }

    if (!ProfileType) {
      throw new Error("ProfileType is missing");
    }

    logger.info(
      "issueCredentialHandler | Starting Verifiable Credential issuance process."
    );

    const issuerKeyPair = await generateECKeyPairHandler(IssuerSeed);

    logger.info(
      `issueCredentialHandler | credentialData: ${JSON.stringify(Data, null, 0)}`
    );

    const credentialData = await prepareCredentialWithoutName(
      MetaData,
      Data,
      RlcUrl,
      counter,
      HolderDID,
      issuerKeyPair,
      ProfileType
    );

    logger.info(`issueCredentialHandler | credentialData: ${credentialData}`);

    //const mandatoryFields = ["/issuanceDate", "/issuer", "/credentialStatus"];

    // const verifiableCredential = await signDocument(
    //   credentialData,
    //   mandatoryFields,
    //   issuerKeyPair.keyPair,
    //   "issue"v
    // );

    const verifiableCredential = await signRlcDocument(
      credentialData,
      issuerKeyPair.keyPair
    );

    logger.info(
      "issueCredentialHandler | Verifiable Credential issuance completed successfully."
    );

    if (verifiableCredential) {
      deleteSchemaFromRemoteDocuments(MetaData.schemaURL);
      logger.info(
        "issueCredentialHandler | Schema URL removed from remote documents."
      );
    }

    return verifiableCredential;
  } catch (error) {
    deleteSchemaFromRemoteDocuments(MetaData.schemaURL);
    logger.error(
      "issueCredentialHandler | Error during Verifiable Credential issuance."
    );
    throw error;
  }
};


/**
 * Service to handle Revocation List Credential (RLC) creation.
 *
 * @param {string} IDURL - Unique IDURL for locating the Revocation List Credential.
 * @param {string} IssuerSeed - Seed of the issuer used for signing the credential.
 * @returns {Promise<Object>} The generated Revocation List Credential object.
 */
export const createRlcHandler = async (IDURL, IssuerSeed) => {
  try {
    logger.info(
      "createRlcHandler | Starting Revocation List Credential creation process."
    );

    if (!IDURL) {
      throw new Error("IDURL is required.");
    }
    if (!IssuerSeed) {
      throw new Error("IssuerSeed is required.");
    }

    logger.info("createRlcHandler | IDURL: ", JSON.stringify(IDURL, null, 2));

    logger.info(
      "createRlcHandler | IssuerSeed: ",
      JSON.stringify(IssuerSeed, null, 2)
    );

    const issuerKeyPair = await generateECKeyPairHandler(IssuerSeed);

    if (!issuerKeyPair) {
      throw new Error("Key Pair generation failed due to an internal error.");
    }

    const rlcData = await generateRlc(IDURL, issuerKeyPair.did);

    if (!rlcData) {
      throw new Error("Error generating Revocation List Credential data.");
    }

    logger.info(
      "createRlcHandler | Successfully prepared Revocation List Credential data."
    );

    const revocationListCredential = await signRlcDocument(
      rlcData,
      issuerKeyPair.keyPair
    );

    logger.info(
      "createRlcHandler | Revocation List Credential signing completed."
    );

    return revocationListCredential;
  } catch (error) {
    logger.error("createRlcHandler | Error in RLC creation service.");
    throw error;
  }
};

/**
 * Service to handle Revocation List Credential (RLC) update.
 *
 * @param {string} counter - Index to be updated in the revocation list.
 * @param {string} RlcUrl - Unique IDURL for locating the Revocation List Credential.
 * @param {string} RevokeListCredentialArray - List of RLC objects (as JSON string).
 * @param {string} IssuerSeed - Issuer's seed to sign the updated credential.
 * @returns {Promise<Object>} - The updated Revocation List Credential.
 */
export const updateRlcHandler = async (
  counter,
  RlcUrl,
  RevokeListCredentialArray,
  IssuerSeed
) => {
  try {
    logger.info(
      "updateRlcHandler | Initiating Revocation List Credential update process."
    );

    if (!counter) {
      throw new Error("Counter is required.");
    }
    if (!RlcUrl) {
      throw new Error("RlcUrl is required.");
    }
    if (!RevokeListCredentialArray) {
      throw new Error("RevokeListCredentialArray is required.");
    }
    if (!IssuerSeed) {
      throw new Error("IssuerSeed is required.");
    }

    const issuerKeyPair = await generateECKeyPairHandler(IssuerSeed);

    if (!issuerKeyPair) {
      throw new Error("Key Pair generation failed due to an internal error.");
    }

    let RevokeListCredential;
    let currentRlcIndex;

    RevokeListCredentialArray = JSON.parse(RevokeListCredentialArray);
    const parsedURL = RlcUrl.split("/");
    currentRlcIndex = parsedURL[parsedURL.length - 1];

    if (currentRlcIndex >= RevokeListCredentialArray.length) {
      throw new Error("No corresponding Revocation List Credential found.");
    }
    RevokeListCredential = JSON.parse(
      RevokeListCredentialArray[currentRlcIndex]
    );

    let updatedRlcData;

    let updateRlcObject = await updateRlc(
      counter,
      RevokeListCredential,
      issuerKeyPair.did
    );

    updatedRlcData = updateRlcObject.RlcData;

    if (!updatedRlcData) {
      throw new Error("Failed to update Revocation List Credential.");
    }

    if (updateRlcObject && updateRlcObject.isRevoked) {
      const updatedRlcString = JSON.stringify(updatedRlcData);
      RevokeListCredentialArray[currentRlcIndex] = updatedRlcString;

      return RevokeListCredentialArray;
    }

    logger.info(
      "updateRlcHandler | Successfully updated the Revocation List Credential data."
    );

    const revocationListCredential = await signRlcDocument(
      updatedRlcData,
      issuerKeyPair.keyPair
    );

    const updatedRlcString = JSON.stringify(revocationListCredential);
    RevokeListCredentialArray[currentRlcIndex] = updatedRlcString;

    return RevokeListCredentialArray;
  } catch (error) {
    logger.error(
      "updateRlcHandler | Error in Revocation List Credential update handler."
    );
    throw error;
  }
};

/**
 * Service to handle the generation of credential schema.
 *
 * @param {Object} Data - Object containing the data attributes and their data types.
 * @param {string} profileType - Profile type used to specify the schema type.
 * @param {string} schemaURL - URL to associate with the schema.
 * @returns {Promise<Object>} - The generated credential schema.
 */
export const credentialSchemaHandler = async (Data, profileType, schemaURL) => {
  try {
    logger.info(
      "credentialSchemaHandler | Starting credential schema creation service."
    );

    if (!Data) {
      throw new Error("Data is  required.");
    }
    if (!profileType) {
      throw new Error("profileType is  required.");
    }
    if (!schemaURL) {
      throw new Error("schemaURL is  required.");
    }

    const credentialSchema = await generateCredentialSchema(
      Data,
      profileType,
      schemaURL
    );

    if (!credentialSchema) {
      throw new Error(
        "Credential schema generation failed due to an internal error."
      );
    }

    return credentialSchema;
  } catch (error) {
    logger.error(
      "credentialSchemaHandler | Error occurred during schema creation"
    );
    throw error;
  }
};
