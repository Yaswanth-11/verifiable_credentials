import logger from "../utils/logger.js";
import { verifyVerifiablePresentation } from "./documentSigning.js";
import { redisObj } from "../services/initialServices.js";
/**
 * Core function to prepare the presentation definition.
 *
 * @param {string} id - The ID for the presentation definition.
 * @param {string} type - The type of the presentation (e.g., ID card type).
 * @param {Object} selectedClaims - The claims selected for the presentation.
 * @returns {Promise<Object>} - The prepared presentation definition.
 */

export const preparePresentationDefinition = async (
  id,
  type,
  selectedClaims
) => {
  logger.info("Preparing presentation definition for type:", type);

  try {
    const inputDescriptors = [];
    // Construct input descriptor for the specified type
    const inputDescriptor = {
      id: `ID card for ${type}`,
      format: {
        ldp_vc: {
          proof_type: ["DataIntegrityProof"],
        },
      },
      constraints: {
        limit_disclosure: "required",
        fields: [
          {
            path: ["$.type"],
            filter: {
              type: "string",
              pattern: type,
            },
          },
        ],
      },
    };

    // Push the input descriptor to the array
    inputDescriptors.push(inputDescriptor);

    // Iterate through selected claims
    for (const [claimCategory, claimFields] of Object.entries(selectedClaims)) {
      claimFields.forEach((claimField) => {
        const fieldDescriptor = {
          path: [`$.credentialSubject.${claimCategory}.${claimField}`],
        };

        // Push the field descriptor to the input descriptor's fields array
        inputDescriptor.constraints.fields.push(fieldDescriptor);
      });
    }

    // Construct the presentation definition object
    const presentationDefinition = {
      id: id,
      input_descriptors: inputDescriptors,
    };

    return presentationDefinition;
  } catch (error) {
    logger.error("Error preparing presentation definition.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Prepares the Presentation Submission data based on the provided Presentation Definition.
 *
 * @param {string} id - The unique ID to assign to the submission.
 * @param {Object} PresentationDefinition - The Presentation Definition containing the descriptors.
 * @returns {Promise<Object>} - The formatted Presentation Submission object.
 */
export const preparePresentationSubmission = async (
  id,
  PresentationDefinition
) => {
  try {
    logger.info("Preparing Presentation Submission data.");

    const { input_descriptors } = PresentationDefinition;

    const presentationSubmission = {
      id: id,
      definition_id: PresentationDefinition.id,
      descriptor_map: input_descriptors.map((descriptor) => {
        return {
          id: descriptor.id,
          format: "ldp_vp",
          path: "$",
          path_nested: { format: "ldp_vc", path: "$.verifiableCredential[0]" },
        };
      }),
    };

    return presentationSubmission;
  } catch (error) {
    logger.error("Error occurred while preparing Presentation Submission.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to prepare the request URI using the presentation definition.
 *
 * @param {Object} pd - The prepared presentation definition object.
 * @returns {Promise<string>} - The generated request URI.
 */
export const prepareRequestUri = async (pd) => {
  logger.info("Preparing request URI for presentation definition.");

  try {
    // Generate a random unique identifier for 'nonce'
    const generateRandomId = () => {
      const result = Math.random().toString(36).substring(2);
      return result;
    };

    const pvturl = process.env.PVTURL;

    const transaction_id = generateRandomId();
    const request_id = generateRandomId();

    const client_id = "";

    const response_uri = `${pvturl}/api/vc/presentation/response/${transaction_id}`;

    const response_type = "vp_token";
    const response_mode = "direct_post";
    const nonce = generateRandomId();
    const state = request_id;
    const presentation_definition = pd;
    const authRequestObj = {
      client_id,
      response_uri,
      response_type,
      response_mode,
      nonce,
      state,
      presentation_definition,
    };

    const JsonAuthRequestObj = JSON.stringify(authRequestObj);

    if (!redisObj) {
      logger.info("error in redis initialization");
      throw new Error("error in redis initialization");
    }

    await redisObj.setKey(transaction_id, JsonAuthRequestObj);

    // Return the generated request URI
    const requestUri = `${pvturl}/api/vc/presentation/requestObject/${transaction_id}`;
    logger.info("Request URI prepared successfully.");

    return requestUri;
  } catch (error) {
    logger.error("Error during request URI preparation.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to extract claims and requested document from the Presentation Definition.
 *
 * @param {Object} PresentationDefinition - The presentation definition object.
 * @returns {Promise<Object>} - Returns an object containing the requested document and extracted claims.
 */
export const parsePresentationDefinition = async (PresentationDefinition) => {
  try {
    logger.info(
      "Parsing Presentation Definition for claims and requested document."
    );
    const { input_descriptors } = PresentationDefinition;

    // Placeholder for extracted claims from input_descriptors
    const extractedClaims = {};
    let RequestedDocument;

    // Iterate through input_descriptors to extract claims
    input_descriptors.forEach((descriptor) => {
      const { constraints } = descriptor;
      if (constraints && constraints.fields) {
        constraints.fields.forEach((field) => {
          if (
            field.path &&
            field.path[0] !== "$.type" &&
            field.path[0].slice(0, 19) === "$.credentialSubject"
          ) {
            // Get the root object name
            const rootObject = field.path[0].slice(20).split(".")[0];
            // Get the claim name
            const claimName = field.path[0].slice(20).split(".")[1];
            // If the root object doesn't exist in extractedClaims, create it as an array
            if (!extractedClaims[rootObject]) {
              extractedClaims[rootObject] = [];
            }
            // Push the claim into the corresponding root object array
            extractedClaims[rootObject].push(claimName);
          }
          if (field.path && field.path[0] === "$.type") {
            RequestedDocument = field.filter.pattern;
          }
        });
      }
    });

    return { RequestedDocument, extractedClaims };
  } catch (error) {
    logger.error(
      "Error occurred during core parsing of Presentation Definition.",
      {
        stack: error.stack,
      }
    );
    throw error;
  }
};

/**
 * Core function to verify the presentation response for a given transaction ID.
 * Fetches the result from Redis and verifies the data, including VP token validation.
 *
 * @param {string} transactionId - The transaction ID for which the verification result is being fetched.
 * @returns {Promise<Object>} - An object containing the verification result and attributes list if verified.
 */
export const verifyPresentationResponse = async (transactionId) => {
  try {
    let verifyResult;
    logger.info(
      `Fetching verification result for transaction ID: ${transactionId}`
    );

    if (!redisObj) {
      logger.info("error in redis initialization");
      throw new Error("error in redis initialization");
    }
    const presentationResponseString = await redisObj.getValue(transactionId);

    if (!presentationResponseString) {
      throw new Error("Invalid Transaction");
    } else {
      const presentationResponse = JSON.parse(presentationResponseString);
      let attributesList = "";

      if (
        !presentationResponse.presentation_submission &&
        presentationResponse.response_type === "vp_token" &&
        presentationResponse.response_mode === "direct_post"
      ) {
        verifyResult = "Data not yet posted";
      } else if (
        presentationResponse.presentation_submission &&
        presentationResponse.vp_token
      ) {
        const { presentation_submission, vp_token } = presentationResponse;
        vp_token = JSON.parse(vp_token);

        if (vp_token.type && vp_token.verifiableCredential && vp_token.proof) {
          verifyResult = await verifyVerifiablePresentation(vp_token);
          if (verifyResult) {
            attributesList = vp_token.verifiableCredential[0].credentialSubject;

            //TODO Changed here
            if (attributesList.Document?.benefit_programs) {
              const ParsedBenefitPrograms = JSON.parse(
                attributesList.Document.benefit_programs
              );
              attributesList.Document.benefit_programs = ParsedBenefitPrograms;
            }
          }

          if (!redisObj) {
            logger.info("error in redis initialization");
            throw new Error("error in redis initialization");
          }
          await redisObj.deleteKey(transactionId);
        }
      }

      return { attributesList, verifyResult };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Core function to verify the presentation response for a given transaction ID.
 * Fetches the result from Redis and verifies the data, including VP token validation.
 *
 * @param {string} transactionId - The transaction ID for which the verification result is being fetched.
 * @returns {Promise<Object>} - An object containing the verification result and attributes list if verified.
 */
export const verifyPresentationResponseVpToken = async (transactionId) => {
  try {
    let verifyResult;
    logger.info(
      `Fetching verification result for transaction ID: ${transactionId}`
    );

    if (!redisObj) {
      logger.info("error in redis initialization");
      throw new Error("error in redis initialization");
    }

    logger.info("getting value from redis");

    const presentationResponseString = await redisObj.getValue(transactionId);
    logger.info("got value from redis");

    if (!presentationResponseString) {
      logger.info("Invalid Transaction");

      throw new Error("Invalid Transaction");
    } else {
      const presentationResponse = JSON.parse(presentationResponseString);
      let attributesList = "";
      let vpToken = "";

      if (
        !presentationResponse.presentation_submission &&
        presentationResponse.response_type === "vp_token" &&
        presentationResponse.response_mode === "direct_post"
      ) {
        logger.info("Data not yet posted");
        verifyResult = "Data not yet posted";
      } else if (
        presentationResponse.presentation_submission &&
        presentationResponse.vp_token
      ) {
        let { presentation_submission, vp_token } = presentationResponse;

        logger.info(`vp_token : ${JSON.stringify(vp_token, null, 2)}`);

        vp_token = JSON.parse(vp_token);

        if (
          vp_token.verifiablePresentation.type &&
          vp_token.verifiablePresentation.verifiableCredential &&
          vp_token.verifiablePresentation.proof
        ) {
          verifyResult = await verifyVerifiablePresentation(
            vp_token.verifiablePresentation
          );

          logger.info(
            `verifyResult : ${JSON.stringify(verifyResult, null, 2)}`
          );

          if (verifyResult) {
            attributesList =
              vp_token.verifiablePresentation.verifiableCredential[0]
                .credentialSubject;

            //TODO Changed here
            if (attributesList.Document?.benefit_programs) {
              const ParsedBenefitPrograms = JSON.parse(
                attributesList.Document.benefit_programs
              );
              attributesList.Document.benefit_programs = ParsedBenefitPrograms;
            }
            const jsonvpToken = JSON.stringify(vp_token);
            vpToken = Buffer.from(jsonvpToken).toString("base64");
          }

          if (!redisObj) {
            logger.info("error in redis initialization");
            throw new Error("error in redis initialization");
          }
          await redisObj.deleteKey(transactionId);
        }
      }

      logger.info(
        `attributesList : ${JSON.stringify(attributesList, null, 2)}`
      );

      return { attributesList, verifyResult, vpToken };
    }
  } catch (error) {
    throw error;
  }
};
