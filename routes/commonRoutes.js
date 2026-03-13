import express from "express";
import {
  credentialStatusController,
  generateECKeyPairController,
  credentialRlcStatusController,
  lastLogs,
} from "../controllers/verifiableCredential_latest.js";

export const router = express.Router();

// EC: Generate EC Key Pair
router.route("/keys/ec/generate").post(generateECKeyPairController);

router.route("/lastLogs/:lines").get(lastLogs);

// Verifier/Holder: check vc status
router
  .route("/credentials/credential/statusCheck")
  .post(credentialStatusController);

router
  .route("/credentials/credential/rlc/statusCheck")
  .post(credentialRlcStatusController);
/*

// Sample: Alternative endpoint for testing
router.route("/sample").get(sampleCode);


*/
