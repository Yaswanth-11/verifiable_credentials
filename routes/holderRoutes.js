import express from "express";
import {
  generateHolderKeyPairController,
  generateVerifiablePresentation,
  generatePresentationSubmission,
  fetchRequestObjectController,
  parsePresentationDefinition,
  submitVpTokenController,
  verifyVerifiableCredential
} from "../controllers/verifiableCredential_latest.js";

export const router = express.Router();

// Holder: Generate ED key pair
router.route("/keys/ed/generate").post(generateHolderKeyPairController);

// Holder: Issue Verifiable Presentation (VP)
router
  .route("/credentials/presentation/issue")
  .post(generateVerifiablePresentation);

// Holder: Create Presentation Submission (PS)
router.route("/presentation/submission").post(generatePresentationSubmission);

// Holder: Get Request Object by Transaction ID
router
  .route("/presentation/requestObject/:transaction_id")
  .get(fetchRequestObjectController);

// Holder: Set VP Token and Presentation submission in Response URI
router
  .route("/presentation/response/:transaction_id")
  .post(submitVpTokenController);

// Holder: Get type and claims from Presentation Definition
router
  .route("/presentation/definition/claims")
  .post(parsePresentationDefinition);


//Holder: verify verifiable Credential 

router.route("/credential/verify").post(verifyVerifiableCredential);
