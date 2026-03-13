import logger from "../utils/logger.js";

/**
 * Core function to generate a credential schema based on provided data.
 *
 * @param {Object} data - Data object containing attributes and types to be used in the schema.
 * @param {string} profileType - Profile type to be used in the schema.
 * @param {string} url - URL to associate with the schema.
 * @returns {Object} - The generated credential schema.
 */

/*
export const generateCredentialSchema_old = (data, profileType, url) => {
  try {
    logger.info(
      "Generating credential schema with profile type: ",
      profileType
    );

    function getType(value) {
      switch (value) {
        case 1:
          return "http://www.w3.org/2001/XMLSchema#decimal"; // Number type
        case 2:
          return "http://www.w3.org/2001/XMLSchema#decimal"; // Decimal type
        case 3:
          return "http://www.w3.org/2001/XMLSchema#boolean"; // Boolean type
        case 4:
          return "http://www.w3.org/2001/XMLSchema#string"; // String type
        case 5:
          return "@json"; // Use @json for arrays
        case 6:
          return "http://www.w3.org/2001/XMLSchema#dateTime"; // DateTime type
        case 7:
          return "@json"; // Use @json for objects
        default:
          return "http://www.w3.org/2001/XMLSchema#string"; // Default string type
      }
    }

    const schema = {
      "@context": {
        "@protected": true,
        id: "@id",
        type: "@type",
        xsd: "http://www.w3.org/2001/XMLSchema#",
        schemaUrl: `${url}#`,
        credentialName: "schemaUrl:credentialName",
        credentialDescription: "schemaUrl:credentialDescription",
        image: {
          "@id": "https://schema.org/image",
          "@type": "@id",
        },
        url: {
          "@id": "https://schema.org/url",
          "@type": "@id",
        },
        IdDocument: {
          "@id": "schemaUrl:IdDocument",
          "@type": "@id",
          "@context": {
            "@protected": true,
            Document: {
              "@id": "schemaUrl:document",
              "@type": "@id",
            },
          },
        },
      },
    };

    schema["@context"][profileType] = {
      "@id": `schemaUrl:${profileType}`,
      "@context": {
        "@protected": true,
      },
    };

    schema["@context"][`${profileType}Credential`] =
      `schemaUrl:${profileType}Credential`;

    // Process each attribute
    for (const [key, value] of Object.entries(data)) {
      schema["@context"][`${profileType}`]["@context"][key] = {
        "@id": `schemaUrl:${key}`, // Create an ID based on the snake_case key
        "@type": getType(value), // Set the type based on the value
      };
    }

    return schema;
  } catch (error) {
    logger.error("Error in credential schema generation:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

*/

export const generateCredentialSchema = (data, profileType, url) => {
  try {
    logger.info(
      `Generating credential schema with profile type: ${profileType}`
    );
    logger.info(`Data: ${JSON.stringify(data)}`);
    logger.info(`URL: ${url}`);

    function getType(value) {
      switch (value) {
        case 1:
          return "http://www.w3.org/2001/XMLSchema#decimal"; // Number type
        case 2:
          return "http://www.w3.org/2001/XMLSchema#decimal"; // Decimal type
        case 3:
          return "http://www.w3.org/2001/XMLSchema#boolean"; // Boolean type
        case 4:
          return "http://www.w3.org/2001/XMLSchema#string"; // String type
        case 5:
          return "@json"; // Use @json for arrays
        case 6:
          return "http://www.w3.org/2001/XMLSchema#dateTime"; // DateTime type
        case 7:
          return "@json"; // Use @json for objects
        default:
          return "http://www.w3.org/2001/XMLSchema#string"; // Default string type
      }
    }

    const schema = {
      "@context": {
        "@protected": true,
        id: "@id",
        type: "@type",
        xsd: "http://www.w3.org/2001/XMLSchema#",
        schemaUrl: `${url}#`,
        credentialName: "schemaUrl:credentialName",
        credentialDescription: "schemaUrl:credentialDescription",
        image: {
          "@id": "https://schema.org/image",
          "@type": "@id",
        },
        url: {
          "@id": "https://schema.org/url",
          "@type": "@id",
        },
        IdDocument: {
          "@id": "schemaUrl:IdDocument",
          "@type": "@id",
          "@context": {
            "@protected": true,
            Document: {
              "@id": "schemaUrl:document",
              "@type": "@id",
            },
          },
        },
      },
    };

    schema["@context"][profileType] = {
      "@id": `schemaUrl:${profileType}`,
      "@context": {
        "@protected": true,
      },
    };

    schema["@context"][`${profileType}Credential`] =
      `schemaUrl:${profileType}Credential`;

    // Process each attribute and add to schema
    for (const attribute of data) {
      const { AttributeName, DataType } = attribute;

      schema["@context"][`${profileType}`]["@context"][AttributeName] = {
        "@id": `schemaUrl:${AttributeName}`, // Create an ID based on the AttributeName
        "@type": getType(DataType), // Set the type based on DataType
      };
    }

    return schema;
  } catch (error) {
    logger.error("Error in credential schema generation:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
