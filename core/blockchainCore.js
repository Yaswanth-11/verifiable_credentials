import fs from "fs";
import { ethers } from "ethers";
import logger from "../utils/logger.js";
import { contractObj } from "../services/initialServices.js";

export const contractInitialize = () => {
  try {
    const RpcProvider = process.env.PROVIDER;
    if (!RpcProvider) {
      console.error("Missing PROVIDER environment variable.");
      process.exit(1);
    }

    let provider;
    try {
      provider = new ethers.JsonRpcProvider(RpcProvider);
    } catch (error) {
      console.error(`Invalid RPC Provider: ${error.message}`, {
        stack: error.stack,
      });
      process.exit(1);
    }

    const contractAddress = process.env.CONTRACTADD;
    if (!contractAddress) {
      console.error("Missing CONTRACTADD environment variable.");
      process.exit(1);
    }

    const contractABIPath = "./storageabi.json";
    if (!fs.existsSync(contractABIPath)) {
      console.error(`ABI file not found at ${contractABIPath}`);
      process.exit(1);
    }

    const contractABI = fs.readFileSync(contractABIPath, "utf8");

    const clientObj = {
      getContract() {
        try {
          const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            provider
          );
          return contract;
        } catch (error) {
          console.error(`Failed to initialize contract: ${error.message}`, {
            stack: error.stack,
          });
          throw error;
        }
      },
      provider,
    };

    return clientObj;
  } catch (error) {
    console.error(`Blockchain initialization failed: ${error.message}`, {
      stack: error.stack,
    });
    throw new Error("Failed to initialize contract");
  }
};

// Function to insert log record

export const insertRecord = async (LogRecord) => {
  try {
    if (!LogRecord.identifier) {
      logger.error("identifier should be present in the record");
      throw new Error("identifier should be present in the record");
    }

    if (!LogRecord.serviceName) {
      logger.error("serviceName should be present in the record");
      throw new Error("serviceName should be present in the record");
    }

    if (!LogRecord.timestamp?.$date) {
      logger.error("timestamp should be present in the record");
      throw new Error("timestamp should be present in the record");
    }

    const { identifier, serviceName } = LogRecord;

    const suid = `${identifier}_${serviceName}`;

    const timestamp = LogRecord.timestamp?.$date;

    // Create a Date object from the timestamp
    const date = new Date(timestamp);

    // Get the Unix timestamp (in seconds)
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    let stringifiedItem = JSON.stringify(LogRecord);

    // Fetch private key from environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      logger.error("Private key is missing in environment variables.");
      throw new Error("Blockchain private key is not configured.");
    }

    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    const wallet = new ethers.Wallet(privateKey, contractObj.provider);
    const contract = contractObj.getContract();
    const contractWithSigner = contract.connect(wallet);

    const tx = await contractWithSigner.insertRecord(
      suid,
      stringifiedItem,
      unixTimestamp
    );

    logger.info("Transaction Happened", { txHash: tx.hash });
    await tx.wait();
    logger.info("Record inserted successfully");
    return { txhash: tx.hash, suid };
  } catch (error) {
    logger.error("Error in insertRecord during blockchain transaction.", {
      stack: error.stack,
    });
    throw error;
  }
};

// Function to fetch log record

export const fetchRecord = async (identifier) => {
  try {
    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Fetch the blockchain contract instance
    const contract = contractObj.getContract();

    if (!contract) {
      logger.error("Failed to retrieve blockchain contract instance.");
      throw new Error("Unable to connect to the blockchain contract.");
    }

    let records = await contract.getRecords(identifier);

    if (!records || records.length === 0) {
      logger.warn(`No records found for identifier: ${identifier}`);
      throw new Error("No records found");
    }

    logger.info("Records fetched successfully", { identifier });

    // Transform the records, parsing only the `data` field
    const parsedRecords = records.map((record) => {
      try {
        return {
          timestamp: record.timestamp.toString(), // Keep the existing fields like `timestamp`
          data: JSON.parse(record.data), // Parse only the `data` field
        };
      } catch (error) {
        logger.error("Failed to parse record data", {
          record,
          error: error.message,
        });
        throw new Error("Data parsing error");
      }
    });
    return parsedRecords;
  } catch (error) {
    logger.error("Error fetching records", {
      stack: error.stack,
    });
    throw error;
  }
};

const validateDates = (startDate, endDate) => {
  try {
    if (!startDate || !endDate) {
      logger.error(
        "Validation failed: Both startDate and endDate are required."
      );
      throw new Error("Both startDate and endDate are required.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime())) {
      logger.error("Validation failed: Invalid startDate provided.");
      throw new Error("Invalid startDate provided.");
    }
    if (isNaN(end.getTime())) {
      logger.error("Validation failed: Invalid endDate provided.");
      throw new Error("Invalid endDate provided.");
    }

    // Check if startDate is before endDate
    if (start > end) {
      logger.error(
        "Validation failed: startDate cannot be later than endDate."
      );
      throw new Error("startDate cannot be later than endDate.");
    }

    const startDateUnix = Math.floor(start.getTime() / 1000);
    const endDateUnix = Math.floor(end.getTime() / 1000);

    logger.info(
      `Dates validated successfully. startDate: ${startDate} (${startDateUnix}), endDate: ${endDate} (${endDateUnix})`
    );

    return { startDateUnix, endDateUnix };
  } catch (error) {
    logger.error(`Date validation error: ${error.message}`);
    throw error; // Rethrow the error for handling upstream
  }
};

// Function to fetch log record by Date Range

export const fetchRecordByDateRange = async (
  identifier,
  startDate,
  endDate
) => {
  try {
    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Fetch the blockchain contract instance
    const contract = contractObj.getContract();

    if (!contract) {
      logger.error("Failed to retrieve blockchain contract instance.");
      throw new Error("Unable to connect to the blockchain contract.");
    }

    // Validate the dates
    const { startDateUnix, endDateUnix } = validateDates(startDate, endDate);

    const records = await contract.getRecordsByDateRange(
      identifier,
      startDateUnix,
      endDateUnix
    );

    if (!records || records.length === 0) {
      logger.warn(
        `No records found for identifier: ${identifier} in the given range`
      );
      throw new Error("No records found");
    }

    logger.info("Records fetched in range successfully", {
      identifier,
      startDate,
      endDate,
    });
    // Transform the records, parsing only the `data` field
    const parsedRecords = records.map((record) => {
      try {
        return {
          timestamp: record.timestamp.toString(), // Keep the existing fields like `timestamp`
          data: JSON.parse(record.data), // Parse only the `data` field
        };
      } catch (error) {
        logger.error("Failed to parse record data", {
          record,
          error: error.message,
        });
        throw new Error("Data parsing error");
      }
    });
    return parsedRecords;
  } catch (error) {
    logger.error("Error fetching records by range", {
      stack: error.stack,
    });
    throw error;
  }
};

// Function to fetch log record

export const fetchAllIdentifiers = async () => {
  try {
    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Fetch the blockchain contract instance
    const contract = contractObj.getContract();

    if (!contract) {
      logger.error("Failed to retrieve blockchain contract instance.");
      throw new Error("Unable to connect to the blockchain contract.");
    }

    const identifiers = await contract.getAllIdentifiers();

    if (!identifiers || identifiers.length === 0) {
      logger.warn("No identifiers found");
      throw new Error("No identifiers found");
    }

    // Transform the records, parsing only the `data` field
    const parsedIdentifiers = identifiers.map((identifier) => {
      try {
        return {
          Identifier: identifier.identifierValue, // Keep the existing fields like `timestamp`
          NumberOfRecords: identifier.countValue.toString(), // Parse only the `data` field
        };
      } catch (error) {
        logger.error("Failed to parse record data", {
          record,
          error: error.message,
        });
        throw new Error("Data parsing error");
      }
    });

    logger.info("Identifiers fetched successfully");
    return parsedIdentifiers;
  } catch (error) {
    logger.error("Error fetching identifiers", {
      stack: error.stack,
    });
    throw error;
  }
};

// Function to get transaction details

export const fetchTransactionDetails = async (txHash) => {
  try {
    let receipt;

    if (!contractObj) {
      logger.error("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Get transaction receipt
    receipt = await contractObj.provider.getTransactionReceipt(txHash);

    if (receipt) {
      logger.info("Block Number:", receipt.blockNumber);
      logger.info("Gas Used:", receipt.gasUsed.toString());

      // For EIP-1559 transactions
      const transaction = await contractObj.provider.getTransaction(txHash);
      logger.info(
        "Max Fee Per Gas:",
        transaction.maxFeePerGas ? transaction.maxFeePerGas.toString() : "N/A"
      );
      logger.info(
        "Max Priority Fee Per Gas:",
        transaction.maxPriorityFeePerGas
          ? transaction.maxPriorityFeePerGas.toString()
          : "N/A"
      );
    } else {
      logger.info("Transaction receipt not found");
      throw new Error("Transaction receipt not found");
    }
    return receipt;
  } catch (error) {
    logger.error("Error fetching receipt from transaction hash", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to add a transaction to the blockchain.
 * It connects to the blockchain contract and inserts the DID logs.
 *
 * @param {string} Identifier - The unique DID identifier.
 * @param {string} Transaction - The transaction data to be added to the blockchain.
 * @returns {Promise<Object>} - The transaction result from the blockchain.
 */
export const addTransaction = async (Identifier, Transaction) => {
  logger.info("Initiating blockchain transaction.", { Identifier });
  try {
    // Validate required parameters
    if (!Identifier || !Transaction) {
      logger.error("Transaction parameters are missing.");
      throw new Error(
        "Both 'Identifier' and 'Transaction' are required to perform a blockchain transaction."
      );
    }

    // Fetch private key from environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      logger.error("Private key is missing in environment variables.");
      throw new Error("Blockchain private key is not configured.");
    }

    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Connect to blockchain using ethers.js
    const wallet = new ethers.Wallet(privateKey, contractObj.provider);
    const contract = contractObj.getContract();
    const contractWithSigner = contract.connect(wallet);

    // Perform the blockchain transaction
    const result = await contractWithSigner.insertDID(Identifier, Transaction);

    if (!result) {
      logger.error("Failed to perform blockchain transaction.");
      throw new Error("Blockchain transaction failed.");
    }

    logger.info("Blockchain transaction successful.", {
      Identifier,
      transactionHash: result.hash,
    });

    return result;
  } catch (error) {
    logger.error("Error occurred during blockchain transaction.", {
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Core function to fetch transaction details by Identifier from the blockchain.
 * Interacts with the blockchain smart contract to retrieve transaction logs associated with a specific Identifier.
 *
 * @param {string} Identifier - The unique DID Identifier for which transaction logs are fetched.
 * @returns {Promise<Object>} - The transaction logs retrieved from the blockchain contract.
 * @throws {Error} - Throws an error if the Identifier is invalid or if the blockchain interaction fails.
 */
export const fetchTransaction = async (Identifier) => {
  try {
    logger.info(" Function fetchTransaction");

    if (!Identifier) {
      logger.error("fetchTransaction failed due to missing Identifier.");
      throw new Error("'Identifier' is required to fetch transaction details.");
    }

    if (!contractObj) {
      logger.info("Error in Blockchain initialization");
      throw new Error("Error in Blockchain initialization");
    }

    // Fetch the blockchain contract instance
    const contract = contractObj.getContract();

    if (!contract) {
      logger.error("Failed to retrieve blockchain contract instance.");
      throw new Error("Unable to connect to the blockchain contract.");
    }

    // Call the blockchain contract function to fetch transaction logs
    const transactionLogs = await contract.fetchDID(Identifier);

    if (!transactionLogs || transactionLogs.length === 0) {
      logger.warn("No transaction logs found for the provided Identifier.", {
        Identifier,
      });
      throw new Error("No transaction logs found for the given Identifier.");
    }

    logger.info("Successfully fetched transaction logs from the blockchain.", {
      Identifier,
    });

    return transactionLogs;
  } catch (error) {
    logger.error("Error occurred in fetchTransaction.", {
      Identifier,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

//DID
// Function to insert a DID and its associated data with a timestamp
export const insertDID = async (identifier, data) => {
  try {
    const formattedIdentifier = identifier.trim().toLowerCase();
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      logger.error("Private key is missing in environment variables.");
      throw new Error("Blockchain private key is not configured.");
    }

    if (!contractObj) {
      logger.error("Error in Blockchain initialization");
      throw new Error("Blockchain initialization failed.");
    }

    const wallet = new ethers.Wallet(privateKey, contractObj.provider);
    const contract = contractObj.getContract("DIDStoring").connect(wallet);
    logger.info("Submitting transaction to store DID.");
    // Call the contract's insertDID function without timestamp
    const tx = await contract.storeDID(formattedIdentifier, data);
    logger.info("Transaction submitted", { txHash: tx.hash });

    await tx.wait();
    logger.info("Transaction mined");

    return { txHash: tx.hash, identifier: formattedIdentifier, data };
  } catch (error) {
    logger.error("Error inserting DID", { error: error.message });
    throw error;
  }
};

// Function to fetch a DID by identifier
export const fetchDID = async (identifier) => {
  try {
    if (!contractObj || !contractObj.getContract) {
      logger.error("Blockchain contract object is not initialized.");
      throw new Error("Blockchain contract object is not configured properly.");
    }
    const formattedIdentifier = identifier.trim().toLowerCase();
    const contract = contractObj.getContract("DIDStoring");

    if (!contract) {
      logger.error("Failed to retrieve blockchain contract instance.");
      throw new Error("Unable to connect to the blockchain contract.");
    }

    const result = await contract.fetchDID(formattedIdentifier);

    if (!result || !result[0]) {
      logger.warn(`No DID record found for identifier: ${formattedIdentifier}`);
      throw new Error("DID record not found.");
    }

    // Convert BigInt timestamp to number or string
    const timestamp = Number(result[1]); // or result[1].toString()
    return {
      data: result[0],
      timestamp: new Date(timestamp * 1000).toISOString(), // Convert to ISO format
    };
  } catch (error) {
    logger.error("Error fetching DID", { error: error.message });
    throw error;
  }
};
