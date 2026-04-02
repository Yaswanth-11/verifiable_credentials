import vault from "node-vault";

import logger from "../utils/logger.js";

let vaultClientInstance;

const getMissingVaultEnv = () => {
  const missing = [];

  if (!process.env.VAULT_ADDR) {
    missing.push("VAULT_ADDR");
  }

  if (!process.env.VAULT_TOKEN) {
    missing.push("VAULT_TOKEN");
  }

  return missing;
};

export const getVaultClient = () => {
  if (vaultClientInstance) {
    return vaultClientInstance;
  }

  const missing = getMissingVaultEnv();
  if (missing.length > 0) {
    throw new Error(`Missing Vault configuration: ${missing.join(", ")}`);
  }

  vaultClientInstance = vault({
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
    apiVersion: "v1",
  });

  logger.info("Vault client initialized");
  return vaultClientInstance;
};
