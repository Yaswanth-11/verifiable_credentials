import logger from "../utils/logger.js";

export class ErrorService {
  constructor(functionName, message, error = false) {
    this.functionName = functionName;
    this.message = message;
    this.error = error;
  }

  // Method to log the error
  logError() {
    // Build the log object dynamically
    const logData = {
      ...(this.error?.message && { message: this.error.message }),
      ...(this.error?.details && { cause: this.error.details }),
      ...(this.error?.stack && { stack: this.error.stack }),
    };

    // Log the error using the logger
    logger.error(this.functionName + " | " + this.message, logData);
  }
}
