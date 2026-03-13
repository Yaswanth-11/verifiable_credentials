import logger from "../utils/logger.js";
import {
  insertRecord,
  fetchRecord,
  fetchRecordByDateRange,
  fetchAllIdentifiers,
  fetchTransactionDetails,
} from "../core/blockchainCore.js";
import { ServiceResult } from "../dto/serviceResult.js";
import { ErrorService } from "../dto/errorDto.js";
import { getMessage } from "../utils/i18n.js";

// Insert Record
export const insertRecordController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const result = await insertRecord(req.body);

    if (!result) {
      throw new Error("Failed to insert record to the blockchain.");
    }

    logger.info(
      `insertRecordController | Successfully inserted record to the blockchain. ${result.txhash} ${result.suid}`,
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("RECORD_ADDED", lang),
      0,
      "",
      result,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "insertRecordController",
      "Error inserting log record into blockchain",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("RECORD_ADD_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Fetch Record
export const fetchRecordController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const { Identifier } = req.body;
    if (!Identifier) {
      throw new Error("missing Identifier Parameter in request body");
    }

    const result = await fetchRecord(Identifier);

    if (!result) {
      throw new Error("Failed to fetch record to the blockchain.");
    }

    logger.info(
      "fetchRecordController | Successfully fetched record from the blockchain.",
      {
        Identifier,
      },
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("RECORD_FETCHED", lang),
      0,
      "",
      result,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchRecordController",
      "Error Fetching log record from blockchain",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("RECORD_FETCH_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Fetch Record by Date Range
export const fetchRecordByDateController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const { Identifier, startDate, endDate } = req.body;
    if (!Identifier) {
      throw new Error("missing Identifier Parameter in request body");
    }

    if (!startDate) {
      throw new Error("missing startDate Parameter in request body");
    }

    if (!endDate) {
      throw new Error("missing endDate Parameter in request body");
    }

    const result = await fetchRecordByDateRange(Identifier, startDate, endDate);

    if (!result) {
      throw new Error("Failed to fetch record to the blockchain.");
    }

    logger.info(
      "fetchRecordByDateController | Successfully fetched record from the blockchain.",
      {
        message: Identifier,
      },
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("RECORD_FETCHED", lang),
      0,
      "",
      result,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchRecordByDateController",
      "Error Fetching log record from blockchain",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("RECORD_RANGE_FETCH_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Fetch All Identifiers
export const fetchIdentifiersController = async (req, res) => {
  const lang = req.lang;
  try {
    const result = await fetchAllIdentifiers();

    if (!result) {
      throw new Error("Failed to fetch Identifiers from the blockchain.");
    }

    logger.info(
      "fetchIdentifiersController | Identifiers fetched successfully from the blockchain.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("IDENTIFIERS_FETCHED", lang),
      0,
      "",
      result,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchIdentifiersController",
      "Error fetching identifiers from blockchain",
      error,
    ).logError();
    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("IDENTIFIERS_FETCH_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Fetch receipt by transaction hash
export const fetchReceiptController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const { txHash } = req.body;
    if (!txHash) {
      throw new Error("missing txHash Parameter in request body");
    }

    const receipt = await fetchTransactionDetails(txHash);

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    logger.info(
      `fetchReceiptController | Receipt fetched for transaction: ${txHash}`,
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("RECEIPT_FETCHED", lang),
      0,
      "",
      receipt,
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchReceiptController",
      "Error fetching receipt",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("RECEIPT_FETCH_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Insert DID
export const insertDIDController = async (req, res) => {
  const lang = req.lang;
  try {
    // Validate request body
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const { identifier, data } = req.body;

    //validate identifier and data

    if (!identifier) {
      throw new Error("missing identifier Parameter in request body");
    }

    if (!data) {
      throw new Error("missing data Parameter in request body");
    }

    const result = await insertDID(identifier, data);

    if (!result) {
      throw new Error("Failed to insert DID to the blockchain.");
    }

    logger.info(
      "insertDIDController | Successfully inserted DID to the blockchain.",
    );

    const responseDTO = new ServiceResult(
      true,
      getMessage("DID_STORED", lang),
      0,
      "",
      { txHash: response.txHash, identifier: response.identifier },
    );
    res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "insertDIDController",
      "Error storing DID",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("DID_STORE_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};

// Fetch DID by Identifier
export const fetchDIDController = async (req, res) => {
  const lang = req.lang;
  try {
    if (!req.body) {
      throw new Error("Invalid request body.");
    }

    const { identifier } = req.body;

    const result = await fetchDID(identifier);

    if (!result) {
      throw new Error("Failed to fetch DID from the blockchain.");
    }

    logger.info(
      "fetchDIDController | Successfully fetched DID from the blockchain.",
    );

    // Fetch the DID and timestamp from the blockchain

    const responseDTO = new ServiceResult(
      true,
      getMessage("DID_FETCHED", lang),
      0,
      "",
      { data: result.data, timestamp: result.timestamp },
    );
    return res.status(200).json(responseDTO);
  } catch (error) {
    new ErrorService(
      "fetchDIDController",
      "Error fetching DID",
      error,
    ).logError();

    const errorResponseDTO = new ServiceResult(
      false,
      getMessage("DID_FETCH_FAILED", lang),
      0,
      error.message,
      null,
    );
    res.status(200).json(errorResponseDTO);
  }
};
