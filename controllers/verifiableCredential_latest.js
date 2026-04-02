import { access, open } from "fs/promises";
import readline from "readline";

import { ServiceResult } from "../dto/serviceResult.js";
import { ErrorService } from "../dto/errorDto.js";
import logger from "../utils/logger.js";
import { getMessage } from "../utils/i18n.js";
import {
  generateHolderKeyPairHandler,
  generateVpHandler,
  generatePsHandler,
  fetchRequestObjectHandler,
  parsePdHandler,
  submitVpTokenHandler,
  verifyVCDataHandler,
} from "../services/Holder/vpGenerator.js";
import {
  generateECKeyPairHandler,
  issueCredentialHandler,
  issueCredentialCompleteHandler,
  createRlcHandler,
  updateRlcHandler,
  credentialSchemaHandler,
} from "../services/Issuer/vcGenerator.js";
import {
  generateVerifierJWKHandler,
  generatePdHandler,
  generateRequestUriHandler,
  verifyPresentationResponseHandler,
  verifyPresentationResponseVpTokenHandler,
  getDecodedRlcHandler,
  credentialStatusHandler,
  credentialRlcStatusHandler,
  verifyVPDataHandler,
} from "../services/Verifier/vpVerifier.js";

import crypto from "crypto";


/**
 * Controller to handle Holder Ed25519 key pair generation.
 *
 * @param {Object} req - Express request object containing the request payload.
 * @param {Object} res - Express response object for sending the response.
 */

export const generateHolderKeyPairController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }
    const { seed } = req.body;

    logger.info(
      "generateHolderKeyPairController | Holder ED Key Pair generation initiated.",
    );

    const holderKeyPair = await generateHolderKeyPairHandler(seed);

    const responseDTO = new ServiceResult(
      true,
      getMessage("HOLDER_KEYS_CREATED", lang),
      0,
      "",
      holderKeyPair,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "generateHolderKeyPairController",
      " Error during Holder ED Key Pair generation.",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("HOLDER_KEYS_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to generate an Issuer EC Key Pair.
 *
 * @param {Object} req - Express request object containing the `seed` in the body.
 * @param {Object} res - Express response object to send the result.
 * @returns {void}
 */
export const generateECKeyPairController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }
    const { seed } = req.body;

    logger.info(
      "generateECKeyPairController | Generating EC Key Pair initiated.",
    );

    const IssuerKeyPair = await generateECKeyPairHandler(seed);

    if (!IssuerKeyPair) {
      throw new Error("Key Pair generation failed due to an internal error.");
    }

    logger.info(
      "generateECKeyPairController | EC Key Pair generation successful.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("EC_KEYPAIR_CREATED", lang),
      0,
      "",
      IssuerKeyPair,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "generateECKeyPairController",
      "Error in EC Key Pair generation.",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("EC_KEYPAIR_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle Verifier EC key pair generation.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object for sending the response.
 */
export const generateVerifierKeyPairController = async (req, res) => {
  const lang = req.lang;
  try {
    logger.info(
      "generateVerifierKeyPairController | Verifier key pair generation request received.",
    );

    const VerifierKeyPair = await generateVerifierJWKHandler();

    logger.info(
      "generateVerifierKeyPairController | Verifier key pair successfully generated.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("VERIFIER_KEYS_CREATED", lang),
      0,
      "",
      VerifierKeyPair,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "generateVerifierKeyPairController",
      " Error in verifier Key Pair generation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VERIFIER_KEYS_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle the issuance of Verifiable Credentials (VC).
 *
 * @param {Object} req - Express request object containing request body with the required parameters.
 * @param {Object} res - Express response object for sending the response.
 * @returns {void} - Sends a JSON response with the generated credential or an error message.
 */
export const issueCredentialController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }
    logger.info(
      "issueCredentialController | Verifiable Credential issuance request received.",
    );

    const {
      MetaData,
      HolderSeed,
      IssuerSeed,
      RlcUrl,
      counter,
      Data,
      flag,
      ProfileType,
    } = req.body;

    let holderKeyPair;
    let holderDID;

    if (!flag) {
      throw new Error("The 'flag' parameter is missing in the request.");
    }

    logger.info(
      `issueCredentialController | Flag: ${flag} | IssuerSeed: ${IssuerSeed} | RlcUrl: ${RlcUrl} | counter: ${counter} | ProfileType: ${ProfileType} | HolderSeed: ${HolderSeed}`,
    );

    logger.info(
      "issueCredentialController | Initiating Verifiable Credential issuance process.",
    );

    if (HolderSeed == "consent") {
      holderDID = "consent";
      logger.info(
        "issueCredentialController | Using consent mode for Holder DID.",
      );
    } else {
      holderKeyPair = await generateECKeyPairHandler(HolderSeed);

      if (!holderKeyPair) {
        throw new Error("Key Pair generation failed due to an internal error.");
      }

      holderDID = holderKeyPair.did;

      logger.info(
        "issueCredentialController | Successfully generated Holder ED Key Pair.",
      );
    }

    const verifiableCredential = await issueCredentialHandler(
      holderDID,
      Data,
      IssuerSeed,
      RlcUrl,
      counter,
      MetaData,
      ProfileType,
    );

    if (!verifiableCredential) {
      throw new Error("Failed to generate Verifiable Credential");
    }

    logger.info(
      "issueCredentialController | Verifiable Credential successfully generated.",
    );

    const vcJsonString = JSON.stringify(verifiableCredential);

    logger.info(
      "issueCredentialController | Successfully stringified Verifiable Credential",
    );

    if (flag == "true") {
      logger.info(
        "Flag set to 'true'. Generating Revocation List Credential (RLC).",
      );

      const revocationListCredential = await createRlcHandler(
        RlcUrl,
        IssuerSeed,
      );

      if (!revocationListCredential) {
        throw new Error("RLC generation failed due to an internal error.");
      }

      logger.info(
        "issueCredentialController | Successfully generated Revocation List Credential",
      );

      const rlcJsonString = JSON.stringify(revocationListCredential);

      logger.info(
        "issueCredentialController | Successfully stringified Verifiable Credential",
      );

      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_RLC_ISSUED", lang),
        0,
        "",
        {
          RevocationListCredential: rlcJsonString,
          VerifiableCredential: vcJsonString,
        },
      );
      res.status(200).json(responseDTO);
    } else {
      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_ISSUED", lang),
        0,
        "",
        vcJsonString,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "issueCredentialController",
      "Error during Verifiable Credential issuance.",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VC_ISSUE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

export const issueCredentialConsentController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }
    logger.info(
      "issueCredentialController | Verifiable Credential issuance request received.",
    );

    const { MetaData, IssuerSeed, RlcUrl, counter, Data, flag, ProfileType } =
      req.body;

    if (!flag) {
      throw new Error("The 'flag' parameter is missing in the request.");
    }

    logger.info(
      `issueCredentialController | Flag: ${flag} | IssuerSeed: ${IssuerSeed} | RlcUrl: ${RlcUrl} | counter: ${counter} | ProfileType: ${ProfileType} `,
    );

    logger.info(
      "issueCredentialController | Initiating Verifiable Credential issuance process.",
    );

    logger.info(
      "issueCredentialController | Successfully generated Holder ED Key Pair.",
    );

    const verifiableCredential = await issueCredentialHandler(
      "123",
      Data,
      IssuerSeed,
      RlcUrl,
      counter,
      MetaData,
      ProfileType,
    );

    if (!verifiableCredential) {
      throw new Error("Failed to generate Verifiable Credential");
    }

    logger.info(
      "issueCredentialController | Verifiable Credential successfully generated.",
    );

    const vcJsonString = JSON.stringify(verifiableCredential);

    logger.info(
      "issueCredentialController | Successfully stringified Verifiable Credential",
    );

    if (flag == "true") {
      logger.info(
        "Flag set to 'true'. Generating Revocation List Credential (RLC).",
      );

      const revocationListCredential = await createRlcHandler(
        RlcUrl,
        IssuerSeed,
      );

      if (!revocationListCredential) {
        throw new Error("RLC generation failed due to an internal error.");
      }

      logger.info(
        "issueCredentialController | Successfully generated Revocation List Credential",
      );

      const rlcJsonString = JSON.stringify(revocationListCredential);

      logger.info(
        "issueCredentialController | Successfully stringified Verifiable Credential",
      );

      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_RLC_ISSUED", lang),
        0,
        "",
        {
          RevocationListCredential: rlcJsonString,
          VerifiableCredential: vcJsonString,
        },
      );
      res.status(200).json(responseDTO);
    } else {
      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_ISSUED", lang),
        0,
        "",
        vcJsonString,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "issueCredentialController",
      "Error during Verifiable Credential issuance.",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VC_ISSUE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle the issuance of Verifiable Credentials (VC).
 *
 * @param {Object} req - Express request object containing request body with the required parameters.
 * @param {Object} res - Express response object for sending the response.
 * @returns {void} - Sends a JSON response with the generated credential or an error message.
 */
export const issueCredentialCompleteController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }
    logger.info(
      "issueCredentialController | Verifiable Credential issuance request received.",
    );

    const {
      MetaData,
      HolderSeed,
      IssuerSeed,
      RlcUrl,
      counter,
      Data,
      flag,
      ProfileType,
    } = req.body;

    if (!flag) {
      throw new Error("The 'flag' parameter is missing in the request.");
    }

    logger.info(
      `issueCredentialController | Flag: ${flag} | IssuerSeed: ${IssuerSeed} | RlcUrl: ${RlcUrl} | counter: ${counter} | ProfileType: ${ProfileType} | HolderSeed: ${HolderSeed}`,
    );

    logger.info(
      "issueCredentialController | Initiating Verifiable Credential issuance process.",
    );

    const holderKeyPair = await generateECKeyPairHandler(HolderSeed);

    if (!holderKeyPair) {
      throw new Error("Key Pair generation failed due to an internal error.");
    }

    logger.info(
      "issueCredentialController | Successfully generated Holder ED Key Pair.",
    );

    const verifiableCredential = await issueCredentialCompleteHandler(
      holderKeyPair.did,
      Data,
      IssuerSeed,
      RlcUrl,
      counter,
      MetaData,
      ProfileType,
    );

    if (!verifiableCredential) {
      throw new Error("Failed to generate Verifiable Credential");
    }

    logger.info(
      "issueCredentialController | Verifiable Credential successfully generated.",
    );

    const vcJsonString = JSON.stringify(verifiableCredential);

    logger.info(
      "issueCredentialController | Successfully stringified Verifiable Credential",
    );

    if (flag == "true") {
      logger.info(
        "Flag set to 'true'. Generating Revocation List Credential (RLC).",
      );

      const revocationListCredential = await createRlcHandler(
        RlcUrl,
        IssuerSeed,
      );

      if (!revocationListCredential) {
        throw new Error("RLC generation failed due to an internal error.");
      }

      logger.info(
        "issueCredentialController | Successfully generated Revocation List Credential",
      );

      const rlcJsonString = JSON.stringify(revocationListCredential);

      logger.info(
        "issueCredentialController | Successfully stringified Verifiable Credential",
      );

      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_RLC_ISSUED", lang),
        0,
        "",
        {
          RevocationListCredential: rlcJsonString,
          VerifiableCredential: vcJsonString,
        },
      );
      res.status(200).json(responseDTO);
    } else {
      const responseDTO = new ServiceResult(
        true,
        getMessage("VC_ISSUED", lang),
        0,
        "",
        vcJsonString,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "issueCredentialController",
      "Error during Verifiable Credential issuance.",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VC_ISSUE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle Revocation List Credential (RLC) creation.
 *
 * @param {Object} req - Express request object containing request data.
 * @param {Object} res - Express response object for sending responses.
 * @returns {Object} JSON response containing the status and result of the operation.
 */
export const createRlcController = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.warn("Empty request body received.");
      throw new Error("Request body is required.");
    }

    const { IDURL, IssuerSeed } = req.body;

    logger.info("Generating Revocation List Credential initiated.");

    const revocationListCredential = await createRlcHandler(IDURL, IssuerSeed);

    if (!revocationListCredential) {
      logger.error("Revocation List Credential creation failed.");
      throw new Error("Failed to create Revocation List Credential.");
    }

    logger.info("Successfully generated Revocation List Credential");

    const rlcJsonString = JSON.stringify(revocationListCredential);

    const responseDTO = new ServiceResult(
      true,
      getMessage("RLC_CREATED", lang),
      0,
      "",
      rlcJsonString,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "createRlcController",
      "Error in revocation list credential generation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("UNKNOWN_ERROR", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle updating a Revocation List Credential (RLC).
 *
 * @param {Object} req - Express request object containing request data.
 * @param {Object} res - Express response object for sending responses.
 * @returns {Object} JSON response with the result of the operation.
 */
export const updateRlcController = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.warn("Empty request body received.");
      throw new Error("Request body is required.");
    }

    const { counter, RlcUrl, RevokeListCredentialArray, IssuerSeed } = req.body;

    logger.info("Updating Revocation List Credential initiated.");

    const updatedRevocationListCredential = await updateRlcHandler(
      counter,
      RlcUrl,
      RevokeListCredentialArray,
      IssuerSeed,
    );

    if (!updatedRevocationListCredential) {
      logger.error("Failed to update Revocation List Credential");
      throw new Error("RLC Updation failed due to an internal error.");
    }

    logger.info("Successfully updated Revocation List Credential");

    const responseDTO = new ServiceResult(
      true,
      getMessage("RLC_UPDATED", lang),
      0,
      "",
      updatedRevocationListCredential,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "updateRlcController",
      "Error in revocation list credential updation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("UNKNOWN_ERROR", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle the creation of a credential schema.
 *
 * @param {Object} req - Express request object containing request data.
 * @param {Object} res - Express response object to send the response.
 * @returns {Object} JSON response with the result of the credential schema creation.
 */
export const generateSchemaController = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.warn("Empty request body received.");
      throw new Error("Request body is required.");
    }

    const { Data, profileType, schemaURL } = req.body;

    logger.info("Initiating credential schema creation.");

    const credentialSchema = await credentialSchemaHandler(
      Data,
      profileType,
      schemaURL,
    );

    if (!credentialSchema) {
      logger.error("Failed to generate credential schema.");
      throw new Error(
        "Credential schema generation failed due to internal error.",
      );
    }

    logger.info("Credential schema successfully generated.");

    const responseDTO = new ServiceResult(
      true,
      getMessage("SCHEMA_GENERATED", lang),
      0,
      "",
      credentialSchema,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "generateSchemaController",
      "Error in credential schema generation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("SCHEMA_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to generate a Verifiable Presentation (VP).
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - The response is sent directly from within the controller.
 */
export const generateVerifiablePresentation = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate incoming request body
    if (!req.body) {
      logger.error("Invalid request: Missing request body.");
      throw new Error("Invalid request body.");
    }

    const { VerifiableCredential, SelectedClaims, nonce, HolderSUID } =
      req.body;

    logger.info("Verifiable presentation generation initiated.");

    const verifiablePresentation = await generateVpHandler(
      VerifiableCredential,
      SelectedClaims,
      nonce,
      HolderSUID,
    );

    if (!verifiablePresentation) {
      logger.error("Failed to generate Verifiable Presentation.");
      throw new Error(
        "Internal error: Verifiable Presentation creation failed.",
      );
    }

    logger.info("Successfully generated Verifiable Presenation");

    // Construct the response based on the generated presentation
    if (verifiablePresentation.vpToken && verifiablePresentation.DataNotFound) {
      const { vpToken, DataNotFound } = verifiablePresentation;

      const responseDTO = new ServiceResult(
        true,
        getMessage("VP_GENERATED", lang),
        0,
        "",
        {
          verifiablePresentation: vpToken,
          DataNotFound,
        },
      );

      res.status(200).json(responseDTO);
    }else{
      throw new Error("Failed to generate Verifiable Presentation due to missing fields in the response.");
    }
    // } else {
    //   const responseDTO = new ServiceResult(
    //     true,
    //     getMessage("VP_GENERATED", lang),
    //     0,
    //     "",
    //     {
    //       verifiablePresentation: verifiablePresentation,
    //     },
    //   );

    //   res.status(200).json(responseDTO);
    // }
  } catch (error) {
    new ErrorService(
      "generateVerifiablePresentation",
      "Error in Verifiable Presenation generation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VP_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to generate a request URI for OpenID4VP by preparing a presentation definition and generating the URI.
 *
 * @param {Object} req - Express request object containing `type` and `selectedClaims` in the body.
 * @param {Object} res - Express response object used to send the response back.
 * @returns {Promise<void>} - Sends a response containing the generated request URI.
 */
export const generateRequestUriController = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.error("Invalid request: Missing request body.");
      throw new Error("Invalid request body.");
    }

    const { type, selectedClaims } = req.body;

    logger.info("Initiating request URI generation process.");

    const presentationDefinition = await generatePdHandler(
      type,
      selectedClaims,
    );

    if (!presentationDefinition) {
      logger.error("Failed to generate Presentation Definition.");
      throw new Error(
        "Presentation Definition generation failed due to an internal error.",
      );
    }

    logger.info("Successfully Generated Presentation Definition");

    const requestUri = await generateRequestUriHandler(presentationDefinition);

    if (!requestUri) {
      logger.error("Failed to generate request URI.");
      throw new Error(
        "Request URI generation failed due to an internal error.",
      );
    }

    const responseDTO = new ServiceResult(
      true,
      getMessage("REQUEST_URI_GENERATED", lang),
      0,
      "",
      requestUri,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "generateRequestUriController",
      "Error in request URI generation",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("REQUEST_URI_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to generate a Presentation Submission (PS).
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - The response is sent directly from within the controller.
 */
export const generatePresentationSubmission = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate the request body
    if (!req.body) {
      logger.error("Invalid request: Missing request body.");
      throw new Error("Invalid request body.");
    }

    const {
      PresentationDefinition,
      VerifiableCredential,
      SelectedClaims,
      nonce,
      HolderSUID,
    } = req.body;

    logger.info("Presentation submission generation initiated.");

    const presentationSubmission = await generatePsHandler(
      PresentationDefinition,
    );

    if (!presentationSubmission) {
      logger.error("Failed to generate Presentation Submission.");
      throw new Error(
        "Internal error: Presentation Submission creation failed.",
      );
    }

    const verifiablePresentation = await generateVpHandler(
      VerifiableCredential,
      SelectedClaims,
      nonce,
      HolderSUID,
    );

    if (!verifiablePresentation) {
      logger.error("Failed to generate Verifiable Presentation.");
      throw new Error(
        "Internal error: Verifiable Presentation creation failed.",
      );
    }

    logger.info("Verifiable Presentation successfully generated.");

    if (verifiablePresentation.vpToken && verifiablePresentation.DataNotFound) {
      const { vpToken, DataNotFound } = verifiablePresentation;

      const responseDTO = new ServiceResult(
        true,
        getMessage("PS_GENERATED", lang),
        0,
        "",
        {
          presentationSubmission,
          verifiablePresentation: vpToken,
          DataNotFound,
        },
      );

      res.status(200).json(responseDTO);
    } else {
      const responseDTO = new ServiceResult(
        true,
        getMessage("PS_GENERATED", lang),
        0,
        "",
        { presentationSubmission, verifiablePresentation },
      );

      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "generatePresentationSubmission",
      "Error in Presentation Submission generation",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("PS_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to fetch the Request Object by Transaction ID.
 *
 * @param {Object} req - Express request object containing the `transaction_id` parameter.
 * @param {Object} res - Express response object to send the response.
 * @returns {Promise<void>} - Sends a response with the fetched request object or error.
 */
export const fetchRequestObjectController = async (req, res) => {
  const lang = req.lang;
  try {
    const { transaction_id } = req.params;

    // Log the initiation of the request object fetch
    logger.info(
      `Fetching request object for transaction ID: ${transaction_id}`,
    );

    const requestObject = await fetchRequestObjectHandler(transaction_id);

    if (!requestObject) {
      // Log and throw error if the request object is not found
      logger.error(
        `Request object not found for transaction ID: ${transaction_id}`,
      );
      throw new Error(
        "Request object fetching failed due to an internal error.",
      );
    }

    logger.info("Successfully fetched request object.");

    const responseDTO = new ServiceResult(
      true,
      getMessage("REQUEST_OBJ_FETCHED", lang),
      0,
      "",
      requestObject,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchRequestObjectController",
      `Error in fetching request object for transaction ID: ${req.params.transaction_id}`,
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("REQUEST_OBJ_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to parse the Presentation Definition and extract claims and requested documents.
 *
 * @param {Object} req - Express request object containing the `PresentationDefinition` in the body.
 * @param {Object} res - Express response object to send the response back to the client.
 * @returns {Promise<void>} - Sends a response with the requested document type and extracted claims.
 */
export const parsePresentationDefinition = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body || !req.body.PresentationDefinition) {
      logger.error("Invalid request body or missing PresentationDefinition.");
      throw new Error(
        "Invalid request body. 'PresentationDefinition' is required.",
      );
    }
    const { PresentationDefinition } = req.body;

    logger.info("Initiating parsing of Presentation Definition.");

    const parsedPresentationDefinition = await parsePdHandler(
      PresentationDefinition,
    );

    const { RequestedDocument, extractedClaims } = parsedPresentationDefinition;

    if (!RequestedDocument || !extractedClaims) {
      logger.error(
        "Failed to parse required fields from the Presentation Definition.",
      );
      throw new Error(
        "Failed to parse required fields from the Presentation Definition.",
      );
    }

    logger.info("Successfully parsed Presentation Definition.");

    const responseDTO = new ServiceResult(
      true,
      getMessage("PD_PARSED", lang),
      0,
      "",
      { RequestedDocument, extractedClaims },
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "parsePresentationDefinition",
      "Error occurred while parsing Presentation Definition",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("PD_PARSE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to submit the Verifiable Presentation (VP) token and presentation submission.
 *
 * @param {Object} req - Express request object containing the body with `presentationSubmission`, `verifiablePresentation`, and `state`, as well as the `transaction_id` parameter.
 * @param {Object} res - Express response object to send the response back to the client.
 * @returns {Promise<void>} - Sends a response indicating success or failure of VP token submission.
 */
export const submitVpTokenController = async (req, res) => {
  const lang = req.lang;
  try {
    const { transaction_id } = req.params;

    // Validate the request body
    if (!req.body) {
      logger.error("Invalid request body received.");
      throw new Error("Invalid request body.");
    }

    const { presentationSubmission, verifiablePresentation, state } = req.body;

    logger.info(
      `Initiating VP token submission for transaction ID: ${transaction_id}`,
    );

    await submitVpTokenHandler(
      presentationSubmission,
      verifiablePresentation,
      state,
      transaction_id,
    );

    logger.info(
      `Successfully submitted VP token for transaction ID: ${transaction_id}`,
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("VP_TOKEN_SUBMITTED", lang),
      0,
      "",
      "200 OK",
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "submitVpTokenController",
      `Error occurred while submitting VP token for transaction ID ${req.params.transaction_id}`,
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VP_TOKEN_SUBMIT_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to submit the Verifiable Presentation (VP) token and presentation submission.
 *
 * @param {Object} req - Express request object containing the body with `presentationSubmission`, `verifiablePresentation`, and `state`, as well as the `transaction_id` parameter.
 * @param {Object} res - Express response object to send the response back to the client.
 * @returns {Promise<void>} - Sends a response indicating success or failure of VP token submission.
 */
export const submitVpTokenControllerV2 = async (req, res) => {
  const lang = req.lang;
  try {
    const { transaction_id } = req.params;

    // Validate the request body
    if (!req.body) {
      logger.error("Invalid request body received.");
      throw new Error("Invalid request body.");
    }

    const { presentationSubmission, verifiablePresentation, state } = req.body;

    logger.info(
      `Initiating VP token submission for transaction ID: ${transaction_id}`,
    );

    await submitVpTokenHandler(
      presentationSubmission,
      verifiablePresentation,
      state,
      transaction_id,
    );

    logger.info(
      `Successfully submitted VP token for transaction ID: ${transaction_id}`,
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("VP_TOKEN_SUBMITTED", lang),
      0,
      "",
      "200 OK",
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "submitVpTokenController",
      `Error occurred while submitting VP token for transaction ID ${req.params.transaction_id}`,
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VP_TOKEN_SUBMIT_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to fetch and return the verification result for a given transaction ID.
 * This verifies the presentation response and returns the verification result.
 *
 * @param {Object} req - Express request object containing `transaction_id` in the URL parameters.
 * @param {Object} res - Express response object used to send the result back to the client.
 * @returns {Promise<void>} - Sends a response containing the verification result or an error message.
 */
export const verifypresentationResponseController = async (req, res) => {
  const lang = req.lang;
  try {
    const transactionId = req.params.transaction_id;

    const verificationResult =
      await verifyPresentationResponseHandler(transactionId);

    if (!verificationResult) {
      logger.error(
        `Verification result not found for transaction ID: ${transactionId}`,
      );
      throw new Error("Fetching Result Failed.");
    }

    const { verifyResult } = verificationResult;

    if (verifyResult === "Data not yet posted") {
      logger.info(`Data for transaction ID ${transactionId} not yet posted.`);

      const errorResponseDTO = new ServiceResult(
        false,
        getMessage("VERIFICATION_NOT_AVAILABLE", lang),
        0,
        verifyResult,
        null,
      );

      res.status(200).json(errorResponseDTO);
    } else {
      logger.info(
        `Successfully fetched verification result for transaction ID ${transactionId}.`,
      );

      const responseDTO = new ServiceResult(
        true,
        getMessage("VERIFICATION_RESULT_FETCHED", lang),
        0,
        "",
        verificationResult,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "verifypresentationResponseController",
      `Error in fetching verification result for transaction ID ${req.params.transaction_id}`,
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VERIFICATION_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to fetch and return the verification result for a given transaction ID.
 * This verifies the presentation response and returns the verification result.
 *
 * @param {Object} req - Express request object containing `transaction_id` in the URL parameters.
 * @param {Object} res - Express response object used to send the result back to the client.
 * @returns {Promise<void>} - Sends a response containing the verification result or an error message.
 */
export const verifypresentationResponseVpTokenController = async (req, res) => {
  const lang = req.lang;
  try {
    const transactionId = req.params.transaction_id;

    const verificationResult =
      await verifyPresentationResponseVpTokenHandler(transactionId);

    if (!verificationResult) {
      logger.error(
        `Verification result not found for transaction ID: ${transactionId}`,
      );
      throw new Error("Fetching Result Failed.");
    }

    const { verifyResult } = verificationResult;

    if(verifyResult === "Presentation submission is rejected by the holder."){
      logger.info(`Presentation submission is rejected by the holder for transaction ID ${transactionId}.`);

      const errorResponseDTO = new ServiceResult(
        false,
        getMessage("PRESENTATION_REJECTED", lang),
        0,
        verifyResult,
        null,
      );
      res.status(200).json(errorResponseDTO);
    }

    if (verifyResult === "Data not yet posted") {
      logger.info(`Data for transaction ID ${transactionId} not yet posted.`);

      const errorResponseDTO = new ServiceResult(
        false,
        getMessage("VERIFICATION_NOT_AVAILABLE", lang),
        0,
        verifyResult,
        null,
      );

      res.status(200).json(errorResponseDTO);
    } else {
      logger.info(
        `Successfully fetched verification result for transaction ID ${transactionId}.`,
      );

      const responseDTO = new ServiceResult(
        true,
        getMessage("VERIFICATION_RESULT_FETCHED", lang),
        0,
        "",
        verificationResult,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "verifypresentationResponseController",
      `Error in fetching verification result for transaction ID ${req.params.transaction_id}`,
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VERIFICATION_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};


/**
 * Controller to decode the Revocation List Credential (RLC) from the provided input data.
 * This decodes the encoded list present in the Revocation List Credential.
 *
 * @param {Object} req - Express request object containing the request body with RLC data.
 * @param {Object} res - Express response object to send the result back to the client.
 * @returns {Promise<void>} - Sends a response containing the decoded RLC or an error message.
 */
export const getDecodedRlcController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }
    const decodedRlc = await getDecodedRlcHandler(req.body);

    if (!decodedRlc) {
      logger.error("Failed to decode the Revocation List Credential.");
      throw new Error("Failed to decode Revocation List Credential.");
    }

    logger.info("Successfully decoded Revocation List Credential.");

    const responseDTO = new ServiceResult(
      true,
      getMessage("RLC_DECODED", lang),
      0,
      "",
      decodedRlc,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "getDecodedRlcController",
      "Error in revocation list credential decoding",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("RLC_DECODE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to check the status of a Verifiable Credential (VC).
 * This function processes the incoming request, validates the body, and calls the service to fetch the status.
 *
 * @param {Object} req - Express request object containing the body with the verifiable credential.
 * @param {Object} res - Express response object to send the result or error message back to the client.
 * @returns {Promise<void>} - Sends a response with the VC status or an error message.
 */
export const credentialStatusController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }

    let { verifiableCredential } = req.body;

    const status = await credentialStatusHandler(verifiableCredential);

    if (!status) {
      logger.error("Failed to fetch the status of the verifiable credential.");
      throw new Error(
        "Failed to check the status of the verifiable credential.",
      );
    }
    logger.info(
      "Successfully retrieved the status of the verifiable credential.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("STATUS_CHECK_OK", lang),
      0,
      "",
      status,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "credentialStatusController",
      "Error in checking status of the verifiable credential",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("STATUS_CHECK_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to check the status of a Verifiable Credential (VC).
 * This function processes the incoming request, validates the body, and calls the service to fetch the status.
 *
 * @param {Object} req - Express request object containing the body with the verifiable credential.
 * @param {Object} res - Express response object to send the result or error message back to the client.
 * @returns {Promise<void>} - Sends a response with the VC status or an error message.
 */
export const credentialRlcStatusController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }

    let { rlcUrl, credentialIndex } = req.body;

    const status = await credentialRlcStatusHandler(rlcUrl, credentialIndex);

    if (!status) {
      logger.error("Failed to fetch the status of the verifiable credential.");
      throw new Error(
        "Failed to check the status of the verifiable credential.",
      );
    }
    logger.info(
      "Successfully retrieved the status of the verifiable credential.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("STATUS_CHECK_OK", lang),
      0,
      "",
      status,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "credentialRlcStatusController",
      "Error in checking status of the verifiable credential",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("STATUS_CHECK_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

export const lastLogs = async (req, res) => {
  try {
    logger.info(" Function lastLogs");

    const linesNumber = req.params.lines;
    const password = req.params.password;
    const adminKey =  process.env.ADMIN_KEY;

    if (!password) {
      return res.status(400).send("Password mandatory.");
    }

    if (!adminKey) {
      logger.error("lastLogs | ADMIN_KEY is not configured.");
      return res
        .status(500)
        .send("adminKey/ADMIN_KEY is not configured.");
    }


    const isValid =
  password.length === adminKey.length &&
  crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(adminKey)
  );

  if (!isValid) {
    return res.status(401).send("Password mismatch.");
  }

    const getLastLines = async (filePath, numLines = 200) => {
      const lines = [];

      try {
        const fileHandle = await open(filePath, "r"); // Open file in read mode

        // Create a readable stream from the file handle
        const readStream = fileHandle.createReadStream();

        // Use readline to process the stream
        const rl = readline.createInterface({
          input: readStream,
          terminal: false, // Not a TTY terminal
        });

        // Process lines
        rl.on("line", (line) => {
          lines.push(line);
          if (lines.length > numLines) {
            lines.shift(); // Keep only the last `numLines` lines
          }
        });

        return new Promise((resolve, reject) => {
          rl.on("close", () => resolve(lines.join("\n")));
          rl.on("error", reject);
        });
      } catch (error) {
        throw new Error(`Error reading log file: ${error.message}`);
      }
    };

    // Get current date in the format "vc-logs-YYYY-MM-DD.log"
    const getLogFileName = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const day = String(now.getDate()).padStart(2, "0");
      return `application-${year}-${month}-${day}.log`;
    };

    const logFileName = getLogFileName();

    const numLines = parseInt(linesNumber, 10) || 200;

    const logFilePath = `./logs/${logFileName}`;

    try {
      // Check if the log file exists
      await access(logFilePath);

      // Fetch the last `numLines` lines
      const lastLines = await getLastLines(logFilePath, numLines);

      // Send the log content as plain text
      res.type("text/plain").send(lastLines);
    } catch (error) {
      if (error.code === "ENOENT") {
        res.status(404).send("Log file not found.");
      } else {
        res.status(500).send("Error reading the log file.");
      }
    }
  } catch (error) {
    new ErrorService(
      "lastLogs",
      "Error in fetching last logs",
      error,
    ).logError();
  }
};

/**
 * Controller to check the status of a Verifiable Credential (VC).
 * This function processes the incoming request, validates the body, and calls the service to fetch the status.
 *
 * @param {Object} req - Express request object containing the body with the verifiable credential.
 * @param {Object} res - Express response object to send the result or error message back to the client.
 * @returns {Promise<void>} - Sends a response with the VC status or an error message.
 */
export const parseVpToken = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }

    let { verifiablePresentation } = req.body;

    const verifyVPResponse = await verifyVPDataHandler(verifiablePresentation);

    if (!verifyVPResponse) {
      logger.error("Failed to verify the verifiable presentation.");
      throw new Error("Failed to verify the verifiable presentation.");
    }

    logger.info(
      "Successfully Generated Verification Result of verifiable Presentation",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("VP_TOKEN_VERIFIED", lang),
      0,
      "",
      verifyVPResponse,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "parseVpToken",
      "Error in verifying the verifiable presentation",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VP_TOKEN_VERIFY_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to check the status of a Verifiable Credential (VC).
 * This function processes the incoming request, validates the body, and calls the service to fetch the status.
 *
 * @param {Object} req - Express request object containing the body with the verifiable credential.
 * @param {Object} res - Express response object to send the result or error message back to the client.
 * @returns {Promise<void>} - Sends a response with the VC status or an error message.
 */
export const parseVpTokenResult = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }

    let { verifiablePresentation } = req.body;

    const verifyVPResponse = await verifyVPDataHandler(verifiablePresentation);

    if (!verifyVPResponse) {
      logger.error("Failed to verify the verifiable presentation.");
      throw new Error("Failed to verify the verifiable presentation.");
    }

    logger.info(
      "Successfully Generated Verification Result of verifiable Presentation",
    );

    const { attributesList, verifyResult } = verifyVPResponse;

    const responseDTO = new ServiceResult(
      true,
      getMessage("VP_TOKEN_VERIFIED", lang),
      0,
      "",
      verifyVPResponse,
    );
    res.status(200).json(verifyVPResponse);
  } catch (error) {
    new ErrorService(
      "parseVpToken",
      "Error in verifying the verifiable presentation",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VP_TOKEN_VERIFY_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json({ attributesList: {}, verifyResult: {} });
  }
};

/**
 * Controller to verify Verifiable Credential (VC).
 * This function verifies the issuer sign and credential attributes.
 *
 * @param {Object} req - Express request object containing the body with the verifiable credential.
 * @param {Object} res - Express response object to send the result or error message back to the client.
 * @returns {Promise<void>} - Sends a response with the VC status or an error message.
 */
export const verifyVerifiableCredential = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }

    let { verifiableCredential } = req.body;

    const verifyVCResponse = await verifyVCDataHandler(verifiableCredential);

    if (!verifyVCResponse) {
      logger.error("Failed to verify the verifiable Credential.");
      throw new Error("Failed to verify the verifiable Credential.");
    }

    logger.info(
      "Successfully Generated Verification Result of verifiable Credential",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("VC_VERIFIED", lang),
      0,
      "",
      verifyVCResponse,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "parseVpToken",
      "Error in verifying the verifiable Credential",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("VC_VERIFY_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};
