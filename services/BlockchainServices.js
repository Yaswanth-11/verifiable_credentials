import {
  addTransaction,
  fetchTransaction,
  fetchTransactionDetails,
} from "../core/blockchainCore.js";

/**
 * Service to handle adding logs into the blockchain.
 * Validates input parameters and interacts with the blockchain core function to perform the transaction.
 *
 * @param {string} Identifier - The unique DID identifier.
 * @param {string} Transaction - The transaction data to be added to the blockchain.
 * @returns {Promise<Object>} - The transaction result object returned by the blockchain.
 */
export const addLogsHandler = async (Identifier, Transaction) => {
  try {
    logger.info("Starting the log addition process into the blockchain.", {
      Identifier,
    });

    // Validate inputs
    if (!Identifier) {
      logger.error("Missing 'Identifier' in addLogsHandler.");
      throw new Error("'Identifier' is required to add logs.");
    }

    if (!Transaction) {
      logger.error("Missing 'Transaction' in addLogsHandler.");
      throw new Error("'Transaction' is required to add logs.");
    }

    const result = await addTransaction(Identifier, Transaction);

    if (!result) {
      logger.error("No result received from the blockchain core.");
      throw new Error(
        "Failed to add logs to the blockchain due to an internal error."
      );
    }

    logger.info("Log addition process completed successfully.", {
      Identifier,
      result,
    });

    return result;
  } catch (error) {
    logger.error("Error in addLogsHandler during blockchain transaction.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Service to fetch logs for a given DID from the blockchain.
 *
 * @param {string} Identifier - The unique DID identifier for which logs are to be fetched.
 * @returns {Promise<Object>} - The logs fetched from the blockchain or an error.
 */
export const fetchLogsHandler = async (Identifier) => {
  try {
    logger.info("Initiating the process to fetch logs for the Identifier.", {
      Identifier,
    });

    // Validate the Identifier
    if (!Identifier) {
      logger.error("Missing Identifier in fetchLogsHandler.");
      throw new Error("'Identifier' is required to fetch logs.");
    }

    // Call the core function to fetch the logs
    const logs = await fetchTransaction(Identifier);

    if (!logs) {
      logger.error("Failed to fetch logs from blockchain core.", {
        Identifier,
      });
      throw new Error("No logs found for the provided Identifier.");
    }

    logger.info("Successfully fetched logs from the blockchain core.", {
      Identifier,
    });

    return logs;
  } catch (error) {
    logger.error("Error in fetchLogsHandler during log retrieval.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Service to fetch transaction details by transaction hash.
 *
 * @param {string} TransactionHash - The hash ID of the transaction to fetch details for.
 * @returns {Promise<Object>} - The transaction details from the blockchain.
 */
export const getTxnDetailsHandler = async (TransactionHash) => {
  try {
    logger.info("Initiating transaction detail fetch for hash ID.", {
      TransactionHash,
    });

    // Validate the TransactionHash
    if (!TransactionHash) {
      logger.error("Missing 'TransactionHash' in getTxnDetailsHandler.");
      throw new Error(
        "'TransactionHash' is required to fetch transaction details."
      );
    }

    // Call the core function to fetch the transaction details
    const transactionDetails = await fetchTransactionDetails(TransactionHash);

    if (!transactionDetails) {
      logger.error("No details found for the provided transaction hash ID.", {
        TransactionHash,
      });
      throw new Error(
        "No transaction details available for the given hash ID."
      );
    }

    logger.info(
      "Successfully fetched transaction details from the blockchain core.",
      {
        TransactionHash,
      }
    );

    return transactionDetails;
  } catch (error) {
    logger.error(
      "Error in getTxnDetailsHandler while fetching transaction details.",
      { stack: error.stack }
    );
    throw error;
  }
};
