import dotenv from "dotenv";
import app from "./app.js";
import logger from "./utils/logger.js";
import initServices from "./services/initialServices.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const redirectUrls = process.env.URL_MAP || "{}";

export const urlMap = JSON.parse(redirectUrls);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Start the server
const startServer = async () => {
  try {
    logger.info("Initializing services...");
    await initServices(); // Initialize Redis, Blockchain, and other dependencies
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(2); // Exit with code 2 for initialization failure
  }
};

startServer();
