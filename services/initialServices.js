import { remoteDocumentInit } from "../core/documentLoader.js";
import logger from "../utils/logger.js";

import { nodeRedisDemo } from "../core/redis.js";

// Initialize Redis 
let redisObj;

let remoteDocuments;

const initServices = async () => {
  try {
    // Initialize Redis
    logger.info("Initializing Redis...");
    redisObj = await nodeRedisDemo(); 

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

export { redisObj, remoteDocuments };
export default initServices;
