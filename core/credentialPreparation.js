import * as vc from "@digitalbazaar/vc";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";

import logger from "../utils/logger.js";
import {
  calculateAge,
  getBirthYear,
  isAgeOverSpecifiedAge,
} from "../utils/AgeCalculations.js";

import Parse from "../SD-JWT/transmute sd-jwt/lib/Parse.js";
import digester from "../SD-JWT/transmute sd-jwt/v2/digester.js";

import { stringify as yamlStringify } from "yaml";

import yaml from "js-yaml";

/**
 * subject Details preparation
 *
 * @param {string} provisioningData - details of holder
 * @param {string} ProfileType - Profile type for the credential
 * @returns {Object} - verifiableCredentialData
 */

const verifiableCredentialPreparation = async (
  inputDocument,
  provisioningData,
  ProfileType
) => {
  try {
    logger.info(
      "verifiableCredentialPreparation| verifiable Credential Preparation process initiated."
    );

    logger.info(`verifiableCredentialPreparation| ProfileType: ${ProfileType}`);

    inputDocument.credentialSubject.Document = {};
    inputDocument.credentialSubject.Document.type = ProfileType;

    Object.entries(provisioningData).forEach(([key, value]) => {
      if (key != "credentialId") {
        inputDocument.credentialSubject.Document[`${key}`] = value;
      }
    });

    return inputDocument;
  } catch (error) {
    logger.info(
      "verifiableCredentialPreparation| failed to prepare provisioning data"
    );
    throw error;
  }
};

/**
 * Prepares the credential format with required fields and metadata.
 *
 * @param {Object} MetaData - Metadata (name, description, schema URL, expiration date, etc.).
 * @param {Object} Data - Holder-specific details for the credential.
 * @param {string} RlcUrl - URL for the revocation list credential.
 * @param {string} counter - Unique index for the revocation list.
 * @param {string} HolderDID - DID of the credential holder.
 * @param {Object} issuerKeyPair - Issuer's key pair for signing.
 * @param {string} ProfileType - Profile type for the credential
 * @returns {Promise<Object>} - Prepared credential data.
 * @throws {Error} - Throws error if credential preparation fails.
 */
export const prepareCredential = async (
  MetaData,
  Data,
  RlcUrl,
  counter,
  HolderDID,
  issuerKeyPair,
  ProfileType
) => {
  try {
    logger.info("prepareCredential | Preparing Verifiable Credential data.");
    logger.info(`prepareCredential | counter: ${counter}`);

    const inputDocument = {};
    inputDocument["@context"] = [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/vc-revocation-list-2020/v1",
    ];

    inputDocument.id = `urn:uuid:${uuidv1()}#10`;

    inputDocument.type = ["VerifiableCredential"];

    inputDocument.credentialSubject = {
      type: "IdDocument",
    };

    inputDocument.credentialStatus = {
      type: "RevocationList2020Status",
    };

    const now = new Date();
    const nowJson = now.toJSON();

    inputDocument.issuanceDate = `${nowJson.slice(0, nowJson.length - 5)}Z`;

    inputDocument["type"].push(`${ProfileType}Credential`);

    //Add metadata values
    inputDocument.expirationDate = MetaData.expirationDate;
    inputDocument["@context"].push(MetaData.schemaURL);
    inputDocument.credentialName = MetaData.name;
    inputDocument.credentialDescription = MetaData.description;

    inputDocument["issuer"] = issuerKeyPair.did;

    if (HolderDID != "consent") {
      inputDocument.credentialSubject.id = HolderDID;
    }

    inputDocument.credentialStatus.id = `urn:uuid:${uuidv1()}#101`;
    inputDocument.credentialStatus.revocationListCredential = RlcUrl;
    inputDocument.credentialStatus.revocationListIndex = counter;

    const verifiableCredentialData = await verifiableCredentialPreparation(
      inputDocument,
      Data,
      ProfileType
    );

    logger.info(
      "prepareCredential | successfully prepared verifiable credential data"
    );

    return verifiableCredentialData;
  } catch (error) {
    logger.error(
      "prepareCredential | Failed to prepare verifiable credential data"
    );
    throw error;
  }
};

/**
 * Prepares the credential format with required fields and metadata.
 *
 * @param {Object} MetaData - Metadata (name, description, schema URL, expiration date, etc.).
 * @param {Object} Data - Holder-specific details for the credential.
 * @param {string} RlcUrl - URL for the revocation list credential.
 * @param {string} counter - Unique index for the revocation list.
 * @param {string} HolderDID - DID of the credential holder.
 * @param {Object} issuerKeyPair - Issuer's key pair for signing.
 * @param {string} ProfileType - Profile type for the credential
 * @returns {Promise<Object>} - Prepared credential data.
 * @throws {Error} - Throws error if credential preparation fails.
 */
export const prepareCredentialWithoutName = async (
  MetaData,
  Data,
  RlcUrl,
  counter,
  HolderDID,
  issuerKeyPair,
  ProfileType
) => {
  try {
    logger.info("prepareCredential | Preparing Verifiable Credential data.");
    logger.info(`prepareCredential | counter: ${counter}`);

    const inputDocument = {};
    inputDocument["@context"] = [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/vc-revocation-list-2020/v1",
    ];

    if (!Data?.credentialId) {
      throw new Error("credentialId is missing in the request");
    }
    inputDocument.id = `urn:uuid:${Data.credentialId}`;

    inputDocument.type = ["VerifiableCredential"];

    inputDocument.credentialSubject = {
      type: "IdDocument",
    };

    inputDocument.credentialStatus = {
      type: "RevocationList2020Status",
    };

    const now = new Date();
    const nowJson = now.toJSON();

    inputDocument.issuanceDate = `${nowJson.slice(0, nowJson.length - 5)}Z`;

    inputDocument["type"].push(`${ProfileType}Credential`);

    //Add metadata values
    inputDocument.expirationDate = MetaData.expirationDate;
    inputDocument["@context"].push(MetaData.schemaURL);
    //inputDocument.credentialName = MetaData.name;
    //inputDocument.credentialDescription = MetaData.description;

    inputDocument["issuer"] = issuerKeyPair.did;

    inputDocument.credentialSubject.id = HolderDID;

    inputDocument.credentialStatus.id = `urn:uuid:${uuidv1().slice(0, 8)}#101`;
    inputDocument.credentialStatus.revocationListCredential = RlcUrl;
    inputDocument.credentialStatus.revocationListIndex = counter;

    const verifiableCredentialData = await verifiableCredentialPreparation(
      inputDocument,
      Data,
      ProfileType
    );

    logger.info(
      "prepareCredential | successfully prepared verifiable credential data"
    );

    return verifiableCredentialData;
  } catch (error) {
    logger.error(
      "prepareCredential | Failed to prepare verifiable credential data"
    );
    throw error;
  }
};

/**
 * Prepares the Revocation List Credential data.
 *
 * @param {Object} credential - Initial RLC credential data.
 * @param {string} IssuerDID - Decentralized Identifier (DID) of the issuer.
 * @returns {Object} Prepared RLC data.
 */
export const prepareRlcData = async (credential, IssuerDID) => {
  try {
    logger.info("prepareRlcData | Preparing Revocation List Credential data.");

    const rlcData = { ...credential, issuer: IssuerDID };
    const now = new Date().toISOString();
    rlcData.issuanceDate = now;

    return rlcData;
  } catch (error) {
    logger.error(
      "prepareRlcData | Error preparing Revocation List Credential data."
    );
    throw error;
  }
};

/**
 * Prepares the derived credential data from the Verifiable Credential.
 *
 * @param {string} VerifiableCredential - The original Verifiable Credential.
 * @param {Array<string>} disclosedClaims - The list of claims to be disclosed.
 * @returns {Promise<{selectivePointers: Array<string>, unknownClaims: Object}>} - The selective pointers for valid claims and unknown claims.
 */
export const prepareDerivedCredentialData = async (
  VerifiableCredential,
  disclosedClaims
) => {
  try {
    logger.info(
      "prepareDerivedCredentialData | Generating derived Credential Data"
    );

    let selectivePointers = [];
    let unknownClaims = {};

    let verifiableCredential = JSON.parse(VerifiableCredential);

    if (!verifiableCredential.type) {
      throw new Error("Verifiable Credential type is missing.");
    }

    // Iterate over the disclosedClaims object
    Object.entries(disclosedClaims).forEach(([rootObject, claims]) => {
      // Iterate over the claims array for each root object
      claims.forEach((claim) => {
        // Check if the claim exists in credentialSubject
        if (
          !verifiableCredential.credentialSubject[rootObject]?.hasOwnProperty(
            claim
          )
        ) {
          // If claim doesn't exist, add it to unknownClaims
          if (!unknownClaims[rootObject]) {
            unknownClaims[rootObject] = [claim];
          } else {
            unknownClaims[rootObject].push(claim);
          }
        } else {
          selectivePointers.push(`/credentialSubject/${rootObject}/${claim}`);
        }
      });
    });

    if (!selectivePointers.length) {
      throw new Error("No valid claims found in the Verifiable Credential.");
    }

    logger.info(
      `prepareDerivedCredentialData | Selective Pointers: ${selectivePointers}`
    );
    logger.info(
      `prepareDerivedCredentialData | Unknown Claims: ${JSON.stringify(unknownClaims)}`
    );

    return { selectivePointers, unknownClaims };
  } catch (error) {
    logger.error(
      "prepareDerivedCredentialData | Error while preparing derived credential data."
    );
    throw error;
  }
};

/**
 * Prepares the data for the Verifiable Presentation.
 *
 * @param {Object} derivedCredential - The derived Verifiable Credential.
 * @param {string} HolderDID - The DID of the holder.
 * @returns {Promise<Object>} - The Verifiable Presentation data.
 */
export const prepareverifablePresentationData = async (
  derivedCredential,
  HolderDID
) => {
  try {
    logger.info(
      "prepareverifablePresentationData | Preparing Verifiable Presentation Data."
    );

    const id = `urn:uuid:${uuidv1()}`;

    if (!derivedCredential || !HolderDID || !id) {
      throw new Error(
        "Missing required fields to prepare the Verifiable Presentation data."
      );
    }
    const presentation = vc.createPresentation({
      verifiableCredential: derivedCredential,
      id,
      HolderDID,
    });

    return presentation;
  } catch (error) {
    logger.error(
      "prepareverifablePresentationData | Error in preparing Verifiable Presentation data."
    );
    throw error;
  }
};

/**
 * Prepares the data for the Verifiable Presentation.
 *
 * @param {string} derivedCredential - The SD-JWT token (derived Verifiable Credential).
 * @param {string} HolderDID - The DID of the holder.
 * @returns {Promise<Object>} - The Verifiable Presentation data.
 */
export const prepareJwtVerifablePresentationData = async (
  derivedCredential,
  HolderDID
) => {
  try {
    logger.info(
      "prepareJwtVerifablePresentationData | Preparing Verifiable Presentation Data."
    );

    // Validate inputs
    if (!derivedCredential) {
      throw new Error("Missing derivedCredential (SD-JWT token).");
    }
    if (!HolderDID) {
      throw new Error("Missing HolderDID.");
    }

    // Generate a unique presentation ID
    const presentationId = `urn:uuid:${uuidv1()}`;

    // Construct the Verifiable Presentation
    const presentation = {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://www.w3.org/ns/credentials/examples/v2",
      ],
      id: presentationId,
      type: "VerifiablePresentation",
      holder: HolderDID,
      verifiableCredential: [
        {
          "@context": "https://www.w3.org/ns/credentials/v2",
          type: "EnvelopedVerifiableCredential",
          id: `data:application/vc+sd-jwt,${derivedCredential}`,
        },
      ],
    };

    logger.info(
      "prepareJwtVerifablePresentationData | Verifiable Presentation Data prepared successfully.",
      {
        presentation,
      }
    );

    return presentation;
  } catch (error) {
    logger.error(
      "prepareJwtVerifablePresentationData | Error in preparing Verifiable Presentation data."
    );
    throw error;
  }
};

/**
 * Serializes an object to YAML, ensuring `!sd` fields are unquoted.
 * @param {Object} data - The object to serialize.
 * @returns {string} - The YAML string.
 */
function convertToYamlWithCustomTags(data) {
  // Define custom YAML type for `!sd`
  const sdType = new yaml.Type("!sd", {
    kind: "scalar",
    resolve: () => true,
    construct: (data) => data,
    represent: (data) => data,
  });

  // Create a schema with the custom type
  const schema = yaml.DEFAULT_SCHEMA.extend([sdType]);

  // Serialize the data using the custom schema
  let yamlString = yaml.dump(data, { schema, lineWidth: 0 });

  // Remove single quotes around `!sd` fields
  yamlString = yamlString.replace(/'(!sd.*?)'/g, "$1");

  return yamlString;
}

/**
 * Converts credential or presentation data into a YAML claim set.
 * Handles both issuance and derivation based on the mode.
 * @param {Object} data - The credential or presentation data.
 * @param {string} mode - The mode of operation ("issuance" or "derivation").
 * @param {string[]} sdFields - Fields to be tagged for selective disclosure (used only for issuance).
 * @returns {string} - The YAML representation of the claim set.
 */
function convertToClaimSet(data, mode /*, sdFields = []*/) {
  const claimSet = {};

  if (mode === "issuance") {
    // Handle issuance logic
    Object.assign(claimSet, {
      "@context": data["@context"],
      id: data.id || null,
      type: data.type,
      issuer: {
        id: data.issuer,
      },
      issuanceDate: data.issuanceDate,
      expirationDate: data.expirationDate,
      credentialStatus: {
        id: data.credentialStatus.id,
        type: data.credentialStatus.type,
        revocationListCredential:
          data.credentialStatus.revocationListCredential,
        revocationListIndex: data.credentialStatus.revocationListIndex,
      },
      credentialSubject: {
        id: data.credentialSubject.id,
        type: data.credentialSubject.type,
        Document: {
          ...data.credentialSubject.Document,
        },
      },
    });

    // Add selective disclosure fields to credentialSubject.Document
    for (const [key, value] of Object.entries(
      data.credentialSubject.Document
    )) {
      //if (sdFields.includes(`credentialSubject.${key}`)) {
      claimSet.credentialSubject.Document[`!sd ${key}`] = value;
      delete claimSet.credentialSubject.Document[key];
      //}
    }
  } else if (mode === "derivation") {
    // Handle derivation logic
    Object.assign(claimSet, {
      "@context": data["@context"],
      id: data.id || null,
      type: data.type,
      holder: data.holder,
      verifiableCredential: data.verifiableCredential.map((vc) => ({
        "@context": vc["@context"],
        type: vc.type,
        id: `${vc.id}`,
      })),
    });
  } else {
    throw new Error(`Invalid mode: ${mode}. Use "issuance" or "derivation".`);
  }

  // Serialize claimSet into YAML with custom handling for !sd
  return convertToYamlWithCustomTags(claimSet);
}

/**
 * Converts credential or presentation data into YAML format.
 * @param {Object} data - The credential or presentation data.
 * @param {string} mode - The mode of operation ("issuance" or "derivation").
 * @param {string[]} [sdFields] - Fields to be tagged for selective disclosure (only for issuance).
 * @returns {Promise<string>} - The YAML representation of the claim set.
 */
export const convertToYamlFormat = async (data, mode /*, sdFields = []*/) => {
  try {
    logger.info(
      `convertToYamlFormat | Preparing Verifiable ${mode === "issuance" ? "Credential" : "Presentation"} Data.`
    );

    const yamlClaimSet = convertToClaimSet(data, mode /*, sdFields*/);
    return yamlClaimSet;
  } catch (error) {
    logger.error(
      `convertToYamlFormat | Error in preparing Verifiable ${
        mode === "issuance" ? "Credential" : "Presentation"
      } Data.`
    );
    throw error;
  }
};

export const prepareDisclosureCredential = async (
  credential,
  selectedClaims
) => {
  try {
    logger.info(
      "prepareDisclosureCredential |  Preparing disclosure credential from selected claims"
    );
    const { disclosureMap, hashToEncodedDisclosureMap } = await Parse.expload(
      credential,
      { digester: digester() }
    );

    // Initialize disclosure structure dynamically using root fields of selectedClaims
    let disclosure = `
      credentialSubject:
  `;

    // Iterate over the root fields of selectedClaims
    for (const [key, fields] of Object.entries(selectedClaims)) {
      disclosure += `      ${key}:\n`;

      // Iterate over the specific fields under the root key (e.g., Document fields)
      (fields || []).forEach((field) => {
        // Search for the field in disclosureMap
        for (const [mapKey, mapValue] of Object.entries(disclosureMap)) {
          if (mapValue[1] === field) {
            // Append field and value to the corresponding section in the disclosure structure
            disclosure += `           ${field}: ${JSON.stringify(mapValue[2])}\n`;
            break; // Move to the next field
          }
        }
      });
    }

    return disclosure;
  } catch (error) {
    logger.info(
      "prepareDisclosureCredential | Error Preparing disclosure credential from selected claims"
    );
    throw error;
  }
};
