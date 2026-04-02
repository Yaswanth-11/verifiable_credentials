import express from "express";
import {
  generateVerifierKeyPairController,
  generateRequestUriController,
  verifypresentationResponseController,
  verifypresentationResponseVpTokenController,
  getDecodedRlcController,
  parseVpToken,
  parseVpTokenResult
} from "../controllers/verifiableCredential_latest.js";

export const router = express.Router();

// Verifier: Generate Verifier Key Pair
router.route("/keys/generate").post(generateVerifierKeyPairController);

// Verifier: Create Request URI for OpenID4VP
router.route("/presentation/request/uri").post(generateRequestUriController);

// Verifier: Fetch Verification Result by Transaction ID
router
  .route("/presentation/verify/result/:transaction_id")
  .get(verifypresentationResponseController);


// Verifier: Fetch Verification Result by Transaction ID
router
  .route("/presentation/verify/result/vpToken/:transaction_id")
  .get(verifypresentationResponseVpTokenController);

// Verifier/Holder: Get Decoded RLC (Revocation List Credential)
router.route("/credentials/rlc/decode").post(getDecodedRlcController);

// Verifier : parse vp_token and return attributes and verification result
router.route("/presentation/verify/result").post(parseVpToken);

// Verifier : parse vp_token and return attributes and verification result
router.route("/presentation/verify/result/vpToken").post(parseVpTokenResult);


