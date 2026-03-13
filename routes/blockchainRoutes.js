import express from "express";

export const router = express.Router();

import {
  insertRecordController,
  fetchRecordController,
  fetchRecordByDateController,
  fetchIdentifiersController,
  fetchReceiptController,
  insertDIDController,
  fetchDIDController,
} from "../controllers/contractController.js";

// Insert Record
router.route("/insert/record").post(insertRecordController);

// Fetch all records for an identifier
router.route("/fetch/records").post(fetchRecordController);

// Fetch records in a date range
router.route("/fetch/records-range").post(fetchRecordByDateController);

// Fetch all identifiers
router.route("/fetch/identifiers").post(fetchIdentifiersController);

// Fetch Block details
router.route("/fetch/receipt").post(fetchReceiptController);

// Insert DID
router.route("/insertDid").post(insertDIDController);

// Fetch DID by identifier (only if exists)
router.route("/fetchDid").get(fetchDIDController);
