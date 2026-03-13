import { ServiceResult } from "../dto/serviceResult.js";
import { ErrorService } from "../dto/errorDto.js";
import logger from "../utils/logger.js";
import { getMessage } from "../utils/i18n.js";

import {
  issueJWTCredentialHandler,
  createRlcHandler,
  generateECKeyPairHandler,
} from "../services/Issuer/vcGenerator.js";
import {
  generateHolderKeyPairHandler,
  generateJwtVpHandler,
} from "../services/Holder/vpGenerator.js";

import { verifyJWTCredentialHandler } from "../services/Verifier/vpVerifier.js";

/**
 * Controller to handle the issuance of jWT Verifiable Credentials (VC).
 *
 * @param {Object} req - Express request object containing request body with the required parameters.
 * @param {Object} res - Express response object for sending the response.
 * @returns {void} - Sends a JSON response with the generated credential or an error message.
 */
export const issueJWTCredentialController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }
    logger.info("JWT Verifiable Credential issuance request received.");

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

    logger.info("Initiating Verifiable Credential issuance process.");

    const holderKeyPair = await generateECKeyPairHandler(HolderSeed);

    if (!holderKeyPair) {
      throw new Error("Key Pair generation failed due to an internal error.");
    }

    logger.info(
      "issueJWTCredentialController | Successfully generated Holder ED Key Pair.",
    );

    const verifiableCredential = await issueJWTCredentialHandler(
      holderKeyPair.did,
      Data,
      IssuerSeed,
      RlcUrl,
      counter,
      MetaData,
      ProfileType,
    );

    if (!verifiableCredential) {
      throw new Error("Failed to generate JWT Verifiable Credential");
    }

    logger.info("JWT Verifiable Credential successfully generated.");

    const vcJsonString = JSON.stringify(verifiableCredential);

    logger.info("Successfully stringified JWT  Verifiable Credential");

    if (flag == "true") {
      logger.info(
        "Flag set to 'true'. Generating Revocation List Credential (RLC).",
      );

      const revocationListCredential = await createRlcHandler(
        RlcUrl,
        IssuerSeed,
      );

      if (!revocationListCredential) {
        logger.error("Failed to generate Revocation List Credential");
        throw new Error("RLC generation failed due to an internal error.");
      }

      logger.info("Successfully generated Revocation List Credential");

      const rlcJsonString = JSON.stringify(revocationListCredential);

      logger.info("Successfully stringified Verifiable Credential");

      const responseDTO = new ServiceResult(
        true,
        getMessage("JWT_VC_RLC_ISSUED", lang),
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
        getMessage("JWT_VC_ISSUED", lang),
        0,
        "",
        vcJsonString,
      );
      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "issueJWTCredentialController",
      "Error during JWT Verifiable Credential issuance.",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("JWT_VC_ISSUE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to generate a JWT Verifiable Presentation (VP).
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - The response is sent directly from within the controller.
 */
export const generateJWTVerifiablePresentation = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate incoming request body
    if (!req.body) {
      logger.error("Invalid request: Missing request body.");
      throw new Error("Invalid request body.");
    }

    const { VerifiableCredential, SelectedClaims, nonce, HolderSUID } =
      req.body;

    logger.info("JWT Verifiable presentation generation initiated.");

    const verifiablePresentation = await generateJwtVpHandler(
      VerifiableCredential,
      SelectedClaims,
      nonce,
      HolderSUID,
    );

    if (!verifiablePresentation) {
      logger.error("Failed to generate JWT Verifiable Presentation.");
      throw new Error(
        "Internal error: JWT Verifiable Presentation creation failed.",
      );
    }

    logger.info("Successfully generated JWT Verifiable Presenation");

    // Construct the response based on the generated presentation
    if (verifiablePresentation.vpToken && verifiablePresentation.DataNotFound) {
      const { vpToken, DataNotFound } = verifiablePresentation;

      const responseDTO = new ServiceResult(
        true,
        getMessage("JWT_VP_GENERATED", lang),
        0,
        "",
        {
          verifiablePresentation: vpToken,
          DataNotFound,
        },
      );

      res.status(200).json(responseDTO);
    } else {
      const responseDTO = new ServiceResult(
        true,
        getMessage("JWT_VP_GENERATED", lang),
        0,
        "",
        verifiablePresentation,
      );

      res.status(200).json(responseDTO);
    }
  } catch (error) {
    new ErrorService(
      "generateJWTVerifiablePresentation",
      "Error in JWT Verifiable Presenation generation",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("JWT_VP_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

/**
 * Controller to handle the verificatin  of jWT Verifiable Presentation (VP).
 *
 * @param {Object} req - Express request object containing request body with the required parameters.
 * @param {Object} res - Express response object for sending the response.
 * @returns {void} - Sends a JSON response with the generated credential or an error message.
 */
export const verifyJwtVerifiablePresentation = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      logger.error("Received an invalid request, missing body.");
      throw new Error("Invalid request body.");
    }
    logger.debug("JWT Verifiable Presentation verification request received.");

    const { JwtVerifiablePresentation } = req.body;

    const verificationResult = await verifyJWTCredentialHandler(
      JwtVerifiablePresentation,
    );

    if (!verificationResult) {
      throw new Error("Failed to verify JWT Verifiable Presentation");
    }

    logger.info("JWT Verifiable Presentation successfully verified.");

    const responseDTO = new ServiceResult(
      true,
      getMessage("JWT_VP_VERIFIED", lang),
      0,
      "",
      verificationResult,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "verifyJwtVerifiablePresentation",
      "Error during JWT Verifiable Presenation verification.",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("JWT_VP_VERIFY_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};
