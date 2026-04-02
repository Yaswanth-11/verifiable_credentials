import logger from "../../utils/logger.js";
import { createECKeyPair, createEDKeyPair } from "../../core/keyPairUtils.js";
import {
  prepareDerivedCredentialData,
  prepareverifablePresentationData,
} from "../../core/credentialPreparation.js";
import {
  signDocument,
  verifyverifiableCredential,
} from "../../core/documentSigning.js";
import {
  preparePresentationSubmission,
  parsePresentationDefinition,
} from "../../core/presentationCoreService.js";

import { signPresentationDocument } from "../../core/documentSigning.js";
import { createRequest } from "../../core/httpClient.js";

import { v1 as uuidv1, v4 as uuidv4 } from "uuid";

import { redisObj } from "../initialServices.js";

/**
 * Service to handle Holder key pair generation.
 *
 * @param {string} seed - Seed string used for generating the key pair.
 * @returns {Promise<Object>} - The generated Ed25519 key pair including DID and DID Document.
 * @throws {Error} - Throws error if key pair generation fails.
 */

export const generateHolderKeyPairHandler = async (seed) => {
  try {
    logger.info(
      "generateHolderKeyPairHandler | Holder key pair generation service initiated."
    );

    if (!seed) {
      throw new Error("Seed is missing. Unable to generate the key pair.");
    }

    const holderKeyPair = await createEDKeyPair(seed);

    logger.info(
      "generateHolderKeyPairHandler | Holder key pair generated successfully.",
      {
        message: `DID : ${holderKeyPair.did}`,
      }
    );

    return holderKeyPair;
  } catch (error) {
    logger.error(
      "generateHolderKeyPairHandler | Error during Holder key pair generation service.",
      {
        message:
          "seed : " + (seed ? seed.substring(0, 8) + "..." : "undefined"),
      }
    );
    throw error;
  }
};

/**
 * Service to handle the generation of Verifiable Presentation.
 *
 * @param {string} VerifiableCredential - The Verifiable Credential to derive the VP from.
 * @param {Array<string>} SelectedClaims - The list of claims selected for inclusion in the VP.
 * @param {string} nonce - A nonce used for unique transactions.
 * @param {string} HolderSeed - A seed value to sign the presentation.
 * @returns {Promise<Object>} - The generated Verifiable Presentation.
 */
export const generateVpHandler = async (
  VerifiableCredential,
  SelectedClaims,
  nonce,
  HolderSUID
) => {
  try {
    logger.info("generateVpHandler | Starting key pair generation process.");

    // Validate incoming parameters
    if (!VerifiableCredential) {
      throw new Error("VerifiableCredential is missing.");
    }
    if (!SelectedClaims) {
      throw new Error("SelectedClaims are missing.");
    }
    if (!nonce) {
      throw new Error("Nonce is missing.");
    }
    if (!HolderSUID) {
      throw new Error("HolderSUID is missing.");
    }

    let verifiableCredential = JSON.parse(VerifiableCredential);

    if (!verifiableCredential.type) {
      throw new Error("Verifiable Credential type is missing.");
    }

    const { selectivePointers, unknownClaims } =
      await prepareDerivedCredentialData(VerifiableCredential, SelectedClaims);

    if (!selectivePointers.length) {
      throw new Error(
        "No claims match the selected claims in the Verifiable Credential."
      );
    }

    const derivedVerifiableCredential = await signDocument(
      verifiableCredential,
      selectivePointers,
      "",
      "derive"
    );

    if (!derivedVerifiableCredential) {
      throw new Error("Failed to derive the Verifiable Credential.");
    }

    const presentationData = await prepareverifablePresentationData(
      derivedVerifiableCredential,
      verifiableCredential.credentialSubject.id
    );

    let url = process.env.HOLDERSEEDURL;
    let endpoint = `/MDOCProvisioning/getUserKey/${HolderSUID}`;

    if (!url) {
      logger.info("HOLDERSEEDURL doesn't set in environment variables");
      throw new Error("error in getting url from environment variables");
    }

    const Result = await createRequest(`${url}${endpoint}`, "", "GET");

    //TODO changed

    if (Result == "No user found") {
      logger.info(
        "generateVpHandler | No user found with the provided HolderSUID.",
        {
          message: `HolderSUID : ${HolderSUID}`,
        }
      );
      throw new Error("No user found with the provided HolderSUID.");
    }

    const holderseed = Result; 


    const holderKeyPair = await createECKeyPair(holderseed);

    const signedVerifiablePresentation = await signPresentationDocument(
      presentationData,
      nonce,
      holderKeyPair.keyPair
    );

    // Check if unknownClaims is not empty
    if (Object.keys(unknownClaims).length > 0) {
      return {
        vpToken: signedVerifiablePresentation,
        DataNotFound: unknownClaims,
      };
    }
    else{
       return {
        vpToken: signedVerifiablePresentation,
        DataNotFound: "null",
      };
    }

  } catch (error) {
    logger.error(
      "generateVpHandler | Error during Verifiable Presentation generation."
    );
    throw error;
  }
};


/**
 * Service to handle Presentation Submission generation.
 *
 * @param {Object} PresentationDefinition - The Presentation Definition containing the input descriptors.
 * @returns {Promise<Object>} - The generated Presentation Submission.
 */
export const generatePsHandler = async (PresentationDefinition) => {
  try {
    logger.info(
      "generatePsHandler | Starting the Presentation Submission generation process."
    );

    const id = uuidv4(); // Generate a unique ID for the submission

    const presentationSubmission = await preparePresentationSubmission(
      id,
      PresentationDefinition
    );

    logger.info(
      "generatePsHandler | Presentation Submission successfully generated."
    );

    return presentationSubmission;
  } catch (error) {
    logger.error(
      "generatePsHandler | Error occurred during Presentation Submission generation."
    );
    throw error;
  }
};

/**
 * Service to handle fetching the Request Object using the Transaction ID.
 *
 * @param {string} transaction_id - The transaction ID used to retrieve the associated request object.
 * @returns {Promise<Object>} - The fetched request object, or null if not found.
 */
export const fetchRequestObjectHandler = async (transaction_id) => {
  try {
    logger.info(
      `fetchRequestObjectHandler | Starting process to fetch request object for transaction ID: ${transaction_id}`
    );

    if (!redisObj) {
      throw new Error("error in redis initialization");
    }

    const value = await redisObj.getValue(transaction_id);

    if (!value) {
      throw new Error("Request object not found in the system.");
    }

    const requestObject = JSON.parse(value);
    logger.info(
      `fetchRequestObjectHandler | Successfully fetched request object for transaction ID: ${transaction_id}`
    );

    return requestObject;
  } catch (error) {
    logger.error(
      `fetchRequestObjectHandler | Error occurred while fetching request object for transaction ID: ${transaction_id}`
    );
    throw error;
  }
};

/**
 * Service to handle the parsing of Presentation Definition and extraction of claims and requested documents.
 *
 * @param {Object} PresentationDefinition - The presentation definition object to be parsed.
 * @returns {Promise<Object>} - Returns an object containing the requested document type and extracted claims.
 */
export const parsePdHandler = async (PresentationDefinition) => {
  try {
    logger.info(
      "parsePdHandler | Starting Presentation Definition parsing process."
    );

    if (!PresentationDefinition) {
      throw new Error("PresentationDefinition parameter is missing");
    }

    // Call the core parsing function
    const parsedData = await parsePresentationDefinition(
      PresentationDefinition
    );

    logger.info(
      "parsePdHandler | Presentation Definition parsing completed successfully."
    );

    return parsedData;
  } catch (error) {
    logger.error(
      "parsePdHandler | Error occurred during Presentation Definition parsing."
    );
    throw error;
  }
};

/**
 * Service to handle the process of submitting the VP token and ensuring it matches the expected presentation definition.
 *
 * @param {Object} presentation_submission - The presentation submission object containing the submission data.
 * @param {Object} vp_token - The verifiable presentation (VP) token to be submitted.
 * @param {string} presentState - The expected state to validate against the state in the transaction request object.
 * @param {string} transactionId - The transaction ID used to fetch the associated request object from the Redis cache.
 * @returns {Promise<void>} - Modifies the Redis key with the VP token and presentation submission data if valid.
 */
export const submitVpTokenHandler = async (
  presentation_submission,
  vp_token,
  presentState,
  transactionId
) => {
  try {
    if (!presentation_submission) {
      throw new Error("presentation_submission parameter is missing");
    }
    if (!vp_token) {
      throw new Error("vp_token parameter is missing");
    }
    if (!presentState) {
      throw new Error("presentState parameter is missing");
    }

    logger.info(
      `submitVpTokenHandler | Starting the VP token submission process for transaction ID: ${transactionId}`
    );

    if (!redisObj) {
      throw new Error("error in redis initialization");
    }
    const requestObject = await redisObj.getValue(transactionId);

    if (!requestObject) {
      throw new Error("Invalid Transaction ID.");
    }

    const parsedRequestObject = JSON.parse(requestObject);

    const { presentation_definition, state } = parsedRequestObject;

    if (state !== presentState) {
      throw new Error(
        "State does not match with the corresponding transaction."
      );
    }

    if (presentation_definition.id !== presentation_submission.definition_id) {
      throw new Error(
        "Presentation submission does not match the corresponding presentation definition."
      );
    }
    if (
      presentation_definition.input_descriptors[0].id !==
      presentation_submission.descriptor_map[0].id
    ) {
      throw new Error(
        "Presentation submission does not match the corresponding presentation definition descriptor."
      );
    }

    //TODO

    const completeData = {
      presentation_submission,
      vp_token,
    };

    const JsonVpToken = JSON.stringify(completeData);

    if (!redisObj) {
      throw new Error("error in redis initialization");
    }
    await redisObj.modifyKey(transactionId, JsonVpToken);

    logger.info(
      `submitVpTokenHandler | Successfully submitted VP token and updated Redis for transaction ID: ${transactionId}`
    );
  } catch (error) {
    logger.error(
      `submitVpTokenHandler | Error occurred during the VP token submission for transaction ID: ${transactionId}: ${error.message}`
    );
    throw error;
  }
};

/**
 * Service to verify the data of a verifiable credential.
 *
 * @param {string} verifiableCredential - The verifiable credential ( Base64 ).
 * @returns {Promise<string>} - Verification result of verifiable credential.
 */
export const verifyVCDataHandler = async (verifiableCredential) => {
  try {
    let verifyVPResponse;
    logger.info(
      "verifyVCDataHandler | Starting the verification process of verifiable credential."
    );

    if (!verifiableCredential) {
      throw new Error("verifiableCredential parameter is missing");
    }

    // verifiableCredential = Buffer.from(
    //   verifiableCredential,
    //   "base64"
    // ).toString("utf8");

    // Parse the verifiable presentation if it's in string format

    verifiableCredential = JSON.parse(verifiableCredential);

    let verifyResult = await verifyverifiableCredential(verifiableCredential);

    // let attributesList = "";

    // if (verifyResult) {
    //   attributesList =
    //     verifiablePresentation.verifiableCredential[0].credentialSubject;

    //   //TODO Changed here
    //   if (attributesList.Document?.benefit_programs) {
    //     const ParsedBenefitPrograms = JSON.parse(
    //       attributesList.Document.benefit_programs
    //     );
    //     attributesList.Document.benefit_programs = ParsedBenefitPrograms;
    //   }
    // }
    // verifyVPResponse = { attributesList, verifyResult };

    logger.info(
      "verifyVCDataHandler | Successfully retrieved the status of the verifiable credential."
    );

    //return verifyVPResponse;
  } catch (error) {
    logger.error(
      "verifyVPDataHandler | Error occurred during credential verification"
    );
    throw error;
  }
};
