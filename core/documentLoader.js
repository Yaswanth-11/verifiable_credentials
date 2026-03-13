import {
  CONTEXT_V1 as odrlCtx,
  CONTEXT_URL_V1 as odrlCtxUrl,
} from "@digitalbazaar/odrl-context";
import {
  CONTEXT_V1 as vcExamplesV1Ctx,
  CONTEXT_URL_V1 as vcExamplesV1CtxUrl,
} from "@digitalbazaar/credentials-examples-context";

import { vcV1CtxUrl, vcV1CtxData } from "../contexts/vcV1Ctx.js";

import dataIntegrityContext from "@digitalbazaar/data-integrity-context";
import { invalidContexts } from "../contexts/index.js";
import multikeyContext from "@digitalbazaar/multikey-context";
import {
  Ed25519Signature2020,
  suiteContext,
} from "@digitalbazaar/ed25519-signature-2020";

import { MultiLoader } from "../utils/MultiLoader.js";

import jsigs from "jsonld-signatures";
const {
  purposes: { AssertionProofPurpose },
} = jsigs;
import * as vc from "@digitalbazaar/vc";

import { remoteDocuments } from "../services/initialServices.js";
import logger from "../utils/logger.js";
import jsonld from "jsonld";
import { getData } from "./httpClient.js";
import { urlMap } from "../server.js";

export const remoteDocumentInit = () => {
  const remoteDocuments = new Map();

  try {
    // Adding predefined contexts
    remoteDocuments.set(vcExamplesV1CtxUrl, vcExamplesV1Ctx);
    remoteDocuments.set(odrlCtxUrl, odrlCtx);
    remoteDocuments.set(
      dataIntegrityContext.constants.CONTEXT_URL,
      dataIntegrityContext.contexts.get(
        dataIntegrityContext.constants.CONTEXT_URL
      )
    );
    remoteDocuments.set(
      multikeyContext.constants.CONTEXT_URL,
      multikeyContext.contexts.get(multikeyContext.constants.CONTEXT_URL)
    );
    remoteDocuments.set(
      suiteContext.constants.CONTEXT_URL,
      suiteContext.contexts.get(suiteContext.constants.CONTEXT_URL)
    );

    // Adding invalid contexts, logging issues
    for (const key in invalidContexts) {
      const { url, value } = invalidContexts[key];
      if (url && value) {
        remoteDocuments.set(url, value);
      } else {
        logger.warn(`Skipping invalid context: ${url}`);
      }
    }

    logger.info("Remote documents loaded successfully.");
  } catch (error) {
    logger.error(`remoteDocumentInit | Error initializing remote documents`);
    throw error;
  }

  return remoteDocuments;
};

const { extendContextLoader } = jsigs;
const { defaultDocumentLoader } = vc;

function resolveUrl(inputUrl) {
  return urlMap[inputUrl] || inputUrl;
}

const getDocument = async (url, retries = 3) => {
  let data = "";
  if (!remoteDocuments.get(url)) {
    try {
      url = resolveUrl(url);

      const response = await getData(url);
      if (response.status != 200) {
        logger.info(`Failed to fetch ${url}: ${res.status}`);
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  return data;
};

export const deleteSchemaFromRemoteDocuments = (schemaUrl) => {
  if (remoteDocuments.has(schemaUrl)) {
    logger.info(`Removing ${schemaUrl} from remoteDocuments...`);
    remoteDocuments.delete(schemaUrl);
  } else {
    logger.warn(`Schema URL ${schemaUrl} not found in remoteDocuments.`);
  }
};

const testContextLoader = extendContextLoader(async (url) => {
  try {
    const remoteDocument = remoteDocuments.get(url);
    if (remoteDocument) {
      return {
        contextUrl: null,
        document: jsonld.clone(remoteDocument),
        documentUrl: url,
      };
    } else {
      const data = await getDocument(url);
      if (data) {
        remoteDocuments.set(url, data);
        return {
          contextUrl: null,
          document: jsonld.clone(data),
          documentUrl: url,
        };
      }
    }
  } catch (error) {
    logger.info(`Error: ${JSON.stringify(error, null, 2)}`);
    logger.error(
      `testContextLoader | Error in testContextLoader for URL ${url}: ${error.message}`
    );
    throw error;
  }

  return defaultDocumentLoader(url);
});
// documents are added to this documentLoader incrementally
const testLoader = new MultiLoader({
  documentLoader: [testContextLoader],
});

export const documentLoader = testLoader.documentLoader.bind(testLoader);
