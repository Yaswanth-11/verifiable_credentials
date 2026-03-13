import { remoteDocumentInit } from "../core/documentLoader.js";
import logger from "../utils/logger.js";
import { contractInitialize } from "../core/blockchainCore.js";
import { nodeRedisDemo } from "../core/redis.js";

// Initialize Redis and Blockchain contract
let redisObj;
let contractObj;
let remoteDocuments;

const initServices = async () => {
  try {
    // Initialize Redis
    logger.info("Initializing Redis...");
    redisObj = await nodeRedisDemo(); //"hello";

    // Initialize Blockchain Contract
    logger.info("Initializing Blockchain Contract...");
    contractObj = "";
    //contractInitialize();

    // Initialize Remote Documents
    logger.info("Loading remote documents...");
    remoteDocuments = remoteDocumentInit();

    logger.info("All services initialized successfully.");
  } catch (error) {
    logger.error(`Error initializing services: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
};

export { redisObj, contractObj, remoteDocuments };
export default initServices;
