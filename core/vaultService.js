import logger from "../utils/logger.js";

import { getVaultClient } from "./vaultClient.js";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedRedisSecrets;
let cachedRedisSecretsExpiryMs = 0;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getVaultRedisMappingConfig = () => {
  const missing = [];

  const path = process.env.VAULT_REDIS_PATH;
  const urlKey = process.env.VAULT_REDIS_URL_KEY;
  const usernameKey = process.env.VAULT_REDIS_USERNAME_KEY;
  const passwordKey = process.env.VAULT_REDIS_PASSWORD_KEY;

  if (!path) {
    missing.push("VAULT_REDIS_PATH");
  }

  if (!urlKey) {
    missing.push("VAULT_REDIS_URL_KEY");
  }

  if (!usernameKey) {
    missing.push("VAULT_REDIS_USERNAME_KEY");
  }

  if (!passwordKey) {
    missing.push("VAULT_REDIS_PASSWORD_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Vault Redis mapping configuration: ${missing.join(", ")}`,
    );
  }

  return {
    path,
    urlKey,
    usernameKey,
    passwordKey,
  };
};

const getCacheConfig = () => {
  return {
    enabled: parseBoolean(process.env.VAULT_REDIS_CACHE_ENABLED, true),
    ttlMs: parsePositiveInt(
      process.env.VAULT_REDIS_CACHE_TTL_MS,
      DEFAULT_CACHE_TTL_MS,
    ),
  };
};

const getCachedRedisSecrets = () => {
  const { enabled } = getCacheConfig();
  if (!enabled) {
    return null;
  }

  if (!cachedRedisSecrets || Date.now() >= cachedRedisSecretsExpiryMs) {
    cachedRedisSecrets = undefined;
    cachedRedisSecretsExpiryMs = 0;
    return null;
  }

  return cachedRedisSecrets;
};

const setCachedRedisSecrets = (secrets) => {
  const { enabled, ttlMs } = getCacheConfig();
  if (!enabled) {
    return;
  }

  cachedRedisSecrets = secrets;
  cachedRedisSecretsExpiryMs = Date.now() + ttlMs;
};

const getVaultSecretData = (vaultResponse) => {
  const secretData = vaultResponse?.data?.data || vaultResponse?.data;

  if (!secretData || typeof secretData !== "object") {
    throw new Error("Vault response is missing KV v2 data payload");
  }

  return secretData;
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const mapRedisSecrets = (secretData, mappingConfig) => {
  const missingMappedKeys = [];

  if (!hasOwn(secretData, mappingConfig.urlKey)) {
    missingMappedKeys.push(mappingConfig.urlKey);
  }
  if (!hasOwn(secretData, mappingConfig.usernameKey)) {
    missingMappedKeys.push(mappingConfig.usernameKey);
  }
  if (!hasOwn(secretData, mappingConfig.passwordKey)) {
    missingMappedKeys.push(mappingConfig.passwordKey);
  }

  if (missingMappedKeys.length > 0) {
    throw new Error(
      `Mapped Vault keys not found in secret response: ${missingMappedKeys.join(", ")}`,
    );
  }

  const url = secretData[mappingConfig.urlKey];
  const username = secretData[mappingConfig.usernameKey];
  const password = secretData[mappingConfig.passwordKey];

  if (!url) {
    throw new Error(
      `Mapped Vault key ${mappingConfig.urlKey} does not contain a valid Redis URL`,
    );
  }

  return {
    url,
    username,
    password,
  };
};

export const clearVaultRedisCache = () => {
  cachedRedisSecrets = undefined;
  cachedRedisSecretsExpiryMs = 0;
};

export const getRedisSecretsFromVault = async ({ forceRefresh = false } = {}) => {
  try {
    if (!forceRefresh) {
      const cached = getCachedRedisSecrets();
      if (cached) {
        logger.info("Redis Vault secrets loaded from cache");
        return cached;
      }
    }

    const mappingConfig = getVaultRedisMappingConfig();
    const client = getVaultClient();

    const vaultResponse = await client.read(mappingConfig.path);
    const secretData = getVaultSecretData(vaultResponse);
    const redisSecrets = mapRedisSecrets(secretData, mappingConfig);

    setCachedRedisSecrets(redisSecrets);
    logger.info("Redis credentials fetched from Vault");

    return redisSecrets;
  } catch (error) {
    logger.error(`Failed to fetch Redis credentials from Vault: ${error.message}`);
    throw new Error(`Vault Redis secret fetch failed: ${error.message}`);
  }
};
