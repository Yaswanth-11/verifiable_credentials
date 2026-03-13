import { Router } from "express";
import { router as holderRoutes } from "./holderRoutes.js";
import { router as issuerRoutes } from "./issuerRoutes.js";
import { router as verifierRoutes } from "./verifierRoutes.js";
import { router as blockchainRoutes } from "./blockchainRoutes.js";
import { router as commonRoutes } from "./commonRoutes.js";

const router = Router();

// Attach specific routes under their respective paths
router.use("/holder", holderRoutes);
router.use("/issuer", issuerRoutes);
router.use("/verifier", verifierRoutes);
router.use("/blockchain", blockchainRoutes);
router.use("/", commonRoutes);

export { router };
