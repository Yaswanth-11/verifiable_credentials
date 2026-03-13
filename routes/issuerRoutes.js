import express from "express";
import {
  issueCredentialController,
  issueCredentialCompleteController,
  createRlcController,
  updateRlcController,
  generateSchemaController,
  issueCredentialConsentController,
} from "../controllers/verifiableCredential_latest.js";

import { issueJWTCredentialController } from "../controllers/JwtVerifiableCredential.js";

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

// Issuer: Issue JWT-Based Verifiable Credential (VC)
router.route("/credentials/jwt/issue").post(issueJWTCredentialController);

/*

// Issuer: Generate Issuer JWK for signing
router.route("/keys/jwk/generate").post(generateJWKController);



// Issuer: Create Presentation Request in JWT format
router.route("/presentation/request").post(createPresentationRequest);


*/
