import express from "express";
import {
  issueCredentialController,
  issueCredentialCompleteController,
  createRlcController,
  updateRlcController,
  generateSchemaController,
  issueCredentialConsentController,
} from "../controllers/verifiableCredential_latest.js";

export const router = express.Router();

// Issuer: Issue Verifiable Credential (VC)
router.route("/credentials/issue").post(issueCredentialController);

// Issuer: Issue Verifiable Credential (VC)
router
  .route("/credentials/issue/complete")
  .post(issueCredentialCompleteController);

// Issuer: Issue Verifiable Credential (VC)
router
  .route("/credentials/issue/consent")
  .post(issueCredentialConsentController);

// Issuer: Create Revocation List Credential (RLC)
router.route("/RevocationListCredential/create").post(createRlcController);

// Issuer: Update Credential Status (e.g., revoke or activate)
router.route("/credentials/revoke").post(updateRlcController);

// Issuer: Create Credential Schema
router.route("/credentials/schema").post(generateSchemaController);
