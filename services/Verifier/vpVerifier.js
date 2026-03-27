import logger from "../../utils/logger.js";
import { createJWK } from "../../core/keyPairUtils.js";
import {
  preparePresentationDefinition,
  prepareRequestUri,
  verifyPresentationResponse,
  verifyPresentationResponseVpToken,
} from "../../core/presentationCoreService.js";

import { getDecodedRlc, credentialStatus,credentialRlcStatus } from "../../core/manageRLC.js";

import { v1 as uuidv1, v4 as uuidv4 } from "uuid";
import {
  verifyJwtVerifiablePresentationCore,
  verifyVerifiablePresentation,
} from "../../core/documentSigning.js";
import { N } from "ethers";

/**
 * Service to handle Verifier EC key pair generation.
 *
 * @returns {Promise<Object>} - The generated EC key pair in JWK format.
 * @throws {Error} - Throws an error if key pair generation fails.
 */

export const generateVerifierJWKHandler = async () => {
  try {
    logger.info(
      "generateVerifierJWKHandler | Starting key pair generation process."
    );

    let keyPair = await createJWK();
    logger.info(
      "generateVerifierJWKHandler | verifier key pair successfully generated."
    );

    return keyPair;
  } catch (error) {
    logger.error(
      "generateVerifierJWKHandler | Error occurred during key pair generation."
    );
    throw error;
  }
};

/**
 * Service to handle generation of a presentation definition.
 *
 * @param {string} type - The type of the presentation (e.g., ID card type).
 * @param {Object} selectedClaims - The claims selected for the presentation.
 * @returns {Promise<Object>} - The generated presentation definition object.
 */
export const generatePdHandler = async (type, selectedClaims) => {
  try {
    logger.info(
      "generatePdHandler | Starting presentation definition generation."
    );

    if (!type) {
      throw new Error("type parameter is missing");
    }
    if (!selectedClaims) {
      throw new Error("selectedClaims parameter is missing");
    }

    let id = uuidv4();

    let presentationDefinition = await preparePresentationDefinition(
      id,
      type,
      selectedClaims
    );
    logger.info(
      "generatePdHandler | Presentation definition generation successful."
    );

    return presentationDefinition;
  } catch (error) {
    logger.error(
      "generatePdHandler | Error during presentation definition generation."
    );
    throw error;
  }
};

/**
 * Service to handle the generation of the request URI.
 *
 * @param {Object} presentationDefinition - The prepared presentation definition.
 * @returns {Promise<string>} - The generated request URI.
 */
export const generateRequestUriHandler = async (presentationDefinition) => {
  try {
    logger.info(
      "generateRequestUriHandler | Starting request URI generation process."
    );

    let requestUri = await prepareRequestUri(presentationDefinition);
    logger.info(
      "generateRequestUriHandler | Request URI generated successfully."
    );

    return requestUri;
  } catch (error) {
    logger.error(
      "generateRequestUriHandler | Error during request URI generation."
    );
    throw error;
  }
};

/**
 * Service to handle fetching and verifying the presentation response for a given transaction ID.
 *
 * @param {string} transactionId - The transaction ID for which the verification result is being fetched.
 * @returns {Promise<Object>} - The verification result containing attributes and the verification status.
 */
export const verifyPresentationResponseHandler = async (transactionId) => {
  try {
    logger.info(
      `verifyPresentationResponseHandler | Initiating verification process for transaction ID: ${transactionId}`
    );

    let verificationResult = await verifyPresentationResponse(transactionId);
    logger.info(
      `verifyPresentationResponseHandler | Verification process completed for transaction ID: ${transactionId}`
    );

    return verificationResult;
  } catch (error) {
    logger.error(
      `verifyPresentationResponseHandler | Error during verification process for transaction ID ${transactionId}`
    );
    throw error;
  }
};


/**
 * Service to handle fetching and verifying the presentation response for a given transaction ID.
 *
 * @param {string} transactionId - The transaction ID for which the verification result is being fetched.
 * @returns {Promise<Object>} - The verification result containing attributes and the verification status.
 */
export const verifyPresentationResponseVpTokenHandler = async (transactionId) => {
  try {
    logger.info(
      `verifyPresentationResponseHandler | Initiating verification process for transaction ID: ${transactionId}`
    );

    let verificationResult = await verifyPresentationResponseVpToken(transactionId);
    logger.info(
      `verifyPresentationResponseHandler | Verification process completed for transaction ID: ${transactionId}`
    );

    return verificationResult;
  } catch (error) {
    logger.error(
      `verifyPresentationResponseHandler | Error during verification process for transaction ID ${transactionId}`
    );
    throw error;
  }
};

/**
 * Service to handle the decoding of Revocation List Credential (RLC).
 * This function manages the process of decoding the RLC and extracting the relevant details.
 *
 * @param {Object} data - The input data containing Revocation List Credentials to decode.
 * @returns {Promise<Object>} - The decoded RLC, containing the issuer and the revoked indexes.
 */
export const getDecodedRlcHandler = async (Data) => {
  try {
    logger.info(
      "getDecodedRlcHandler | Initiating decoding process for the provided Revocation List Credentials."
    );

    // Decode the RLC by calling the core function
    const decodedRlc = await getDecodedRlc(Data);

    logger.info(
      "getDecodedRlcHandler | Successfully decoded the Revocation List Credential."
    );

    return decodedRlc;
  } catch (error) {
    logger.error(
      "getDecodedRlcHandler | Error occurred during the decoding process."
    );
    throw error;
  }
};

/**
 * Service to handle checking the status of a verifiable credential.
 * It parses the verifiable credential and interacts with the core function to determine its status.
 *
 * @param {Object|string} verifiableCredential - The verifiable credential (either in object or JSON string format).
 * @returns {Promise<string>} - The status of the credential ("Revoked" or "Active").
 */
export const credentialStatusHandler = async (verifiableCredential) => {
  try {
    logger.info(
      "credentialStatusHandler | Starting the credential status checking process."
    );

    if (!verifiableCredential) {
      throw new Error("verifiableCredential parameter is missing");
    }

    // Parse the verifiable credential if it's in string format
    if (typeof verifiableCredential === "string") {
      verifiableCredential = JSON.parse(verifiableCredential);
    }

    // Get the credential status by calling the core function
    const status = await credentialStatus(verifiableCredential);

    logger.info(
      "credentialStatusHandler | Successfully retrieved the status of the verifiable credential."
    );

    return status;
  } catch (error) {
    logger.error(
      "credentialStatusHandler | Error occurred during credential status checking process."
    );
    throw error;
  }
};


/**
 * Service to handle checking the status of a verifiable credential.
 * It parses the verifiable credential and interacts with the core function to determine its status.
 *
 * @param {Object|string} verifiableCredential - The verifiable credential (either in object or JSON string format).
 * @returns {Promise<string>} - The status of the credential ("Revoked" or "Active").
 */
export const credentialRlcStatusHandler = async (rlcUrl, counter) => {
  try {
    logger.info(
      "credentialStatusHandler | Starting the credential status checking process."
    );

    if (!rlcUrl) {
      throw new Error("rlcUrl parameter is missing");
    }

    if (!counter) {
      throw new Error("counter parameter is missing");
    }

    
    // Get the credential status by calling the core function
    const status = await credentialRlcStatus(rlcUrl, counter);

    logger.info(
      "credentialStatusHandler | Successfully retrieved the status of the verifiable credential."
    );

    return status;
  } catch (error) {
    logger.error(
      "credentialStatusHandler | Error occurred during credential status checking process."
    );
    throw error;
  }
};

/**
 * Service to handle generating the verification result of verifiable presenatation.
 *
 * @param {Object|string} jwt verifiable presentation - The verifiable presentation ( in JSON web token format).
 * @returns {Promise<string>} - Verification result of jwt verifiable presentation ("true" or "false").
 */
export const verifyJWTCredentialHandler = async (JwtVerifiablePresentation) => {
  try {
    logger.info(
      "verifyJWTCredentialHandler | Starting the credential verification process."
    );

    if (!JwtVerifiablePresentation) {
      throw new Error("JwtVerifiablePresentation parameter is missing");
    }

    // Get the credential result by calling the core function
    const result = await verifyJwtVerifiablePresentationCore(
      JwtVerifiablePresentation
    );

    logger.info(
      "verifyJWTCredentialHandler | Successfully retrieved the verification result of verifiable presentation"
    );

    return result;
  } catch (error) {
    logger.error(
      "verifyJWTCredentialHandler | Error occurred during credential verification process."
    );
    throw error;
  }
};

/**
 * Service to verify the data of a verifiable presentation.
 *
 * @param {string} VerifiablePresentation - The verifiable presentation ( Base64 ).
 * @returns {Promise<string>} - Verification result of verifiable presentation.
 */
export const verifyVPDataHandler = async (verifiablePresentationData) => {
  try {
    let verifyVPResponse;
    logger.info(
      "verifyVPDataHandler | Starting the verification process of verifiable presentation."
    );

    if (!verifiablePresentationData) {
      throw new Error("verifiablePresentation parameter is missing");
    }

    logger.info(`Json Web Token: ${JSON.stringify(verifiablePresentationData)}`);

    verifiablePresentationData = Buffer.from(
      verifiablePresentationData,
      "base64"
    ).toString("utf8");

    // Parse the verifiable presentation if it's in string format

    verifiablePresentationData = JSON.parse(verifiablePresentationData);

    const {verifiablePresentation, DataNotFound} = verifiablePresentationData;

    // logger.info(
    //   `Parsed verifiable presentation data: ${JSON.stringify(
    //     verifiablePresentation,
    //     null,
    //     2
    //   )}`
    // );

    logger.info(`DataNotFound: ${JSON.stringify(DataNotFound, null, 2)}`);
    
    let newDataNotFound={};

    if (DataNotFound) {
      newDataNotFound = DataNotFound;
      logger.info(`DataNotFound: ${JSON.stringify(newDataNotFound, null, 2)}`);
    } else {
      logger.info("DataNotFound is not found in the verifiable presentation.");
    }

    let verifyResult = await verifyVerifiablePresentation(
      verifiablePresentation
    );

    let attributesList = "";

    if (verifyResult) {
      attributesList =
        verifiablePresentation.verifiableCredential[0].credentialSubject;

      //TODO Changed here
      if (attributesList.Document?.benefit_programs) {
        const ParsedBenefitPrograms = JSON.parse(
          attributesList.Document.benefit_programs
        );
        attributesList.Document.benefit_programs = ParsedBenefitPrograms;
      }
    }
    verifyVPResponse = { attributesList, verifyResult, DataNotFound: newDataNotFound };

    logger.info(
      "credentialStatusHandler | Successfully retrieved the status of the verifiable credential."
    );

    return verifyVPResponse;
  } catch (error) {
    logger.error(
      "verifyVPDataHandler | Error occurred during credential verification"
    );
    throw error;
  }
};
