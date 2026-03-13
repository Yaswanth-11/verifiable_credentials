import morgan from "morgan";
import logger from "../utils/logger.js"; // Import your Winston logger

// Custom token to capture client IP
morgan.token(
  "client-ip",
  (req) => req.headers["x-forwarded-for"] || req.connection.remoteAddress
);

// Morgan Middleware for HTTP Request Logging
const morganMiddleware = morgan(
  (tokens, req, res) => {
    const logData = {
      method: tokens.method(req, res), // HTTP method (GET, POST, etc.)
      url: tokens.url(req, res), // Request URL
      status: tokens.status(req, res), // Response status code
      response_time: `${tokens["response-time"](req, res)} ms`, // Response time
      client_ip: tokens["client-ip"](req), // Client's IP address
    };

    // Use plain text to avoid parsing overhead
    return `[HTTP Log] Method: ${logData.method}, URL: ${logData.url}, Status: ${logData.status}, Response Time: ${logData.response_time}, Client IP: ${logData.client_ip}`;
  },
  {
    stream: {
      write: (message) => {
        // Log message directly with Winston at 'info' level
        logger.info(message);
      },
    },
  }
);

export default morganMiddleware;
