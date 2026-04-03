import { createClient } from "redis";

import logger from "../utils/logger.js";
import { getRedisSecretsFromVault } from "./vaultService.js";

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const getRedisConfigFromEnvironment = () => {
  const url = process.env.redisURL || process.env.REDIS_URL;
  const username = process.env.redisUsername || process.env.REDIS_USERNAME || null;
  const password = process.env.redisPassword || process.env.REDIS_PASSWORD || null;

  if (!url) {
    throw new Error("redisURL is not defined in environment variables");
  }

  return {
    url,
    username,
    password,
  };
};

const parseClusterNodes = (redisUrl) => {
  const nodes = redisUrl
    .split(",")
    .map((node) => node.trim())
    .filter(Boolean)
    .map((node) => {
      if (node.includes("://")) {
        const parsed = new URL(node);
        return {
          host: parsed.hostname,
          port: Number.parseInt(parsed.port, 10) || 6379,
        };
      }

      const [host, port] = node.split(":");
      if (!host) {
        return null;
      }

      return {
        host,
        port: Number.parseInt(port, 10) || 6379,
      };
    })
    .filter(Boolean);

  if (nodes.length === 0) {
    throw new Error("No valid Redis cluster nodes provided");
  }

  return nodes;
};

const normalizeStandaloneRedisUrl = (redisUrl) => {
  if (!redisUrl) {
    throw new Error("Redis URL is required");
  }

  const trimmedUrl = redisUrl.trim();

  if (trimmedUrl.includes("://")) {
    return trimmedUrl;
  }

  return `redis://${trimmedUrl}`;
};

const isClusterRedisUrl = (redisUrl) => {
  if (!redisUrl) {
    return false;
  }

  return redisUrl
    .split(",")
    .map((node) => node.trim())
    .filter(Boolean).length > 1;
};

const getRedisConnectionConfig = async () => {
  const useVault = parseBoolean(process.env.USE_VAULT, false);

  if (useVault) {
    logger.info("Using Vault for Redis credentials");
    return getRedisSecretsFromVault();
  }

  logger.info("Using environment variables for Redis credentials");
  return getRedisConfigFromEnvironment();
};

export async function nodeRedisDemo() {
  try {
    const {
      url: redisurl,
      username: redisusername,
      password: redispassword,
    } = await getRedisConnectionConfig();

    const isCluster = isClusterRedisUrl(redisurl);

    if (isCluster) {
      logger.info(`Redis cluster nodes: ${redisurl}`);
    } else {
      logger.info(`Redis URL: ${normalizeStandaloneRedisUrl(redisurl)}`);
    }

    let client;
    let isConnected = false;

    /**
     * ================================
     *  STANDALONE MODE (node-redis)
     * ================================
     */
    if (!isCluster) {
      const redisOptions = {
        url: normalizeStandaloneRedisUrl(redisurl),
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error("Retry attempts exhausted");
            }
            return Math.min(retries * 100, 3000);
          },
        },
      };

      if (redispassword) {
        redisOptions.password = redispassword;
      }

      client = createClient(redisOptions);

      client.on("error", (err) => {
        logger.error(`Redis Client Error: ${err.message}`);
      });

      await client.connect();
      isConnected = true;
      logger.info("Connected to Redis (Standalone)");
    } /**
     * ================================
     *  CLUSTER MODE (ioredis)
     * ================================
     */ else {
      const Redis = (await import("ioredis")).default;

      const nodes = parseClusterNodes(redisurl);

      // Cluster URL format:
      // redis://host1:6379,redis://host2:6379,redis://host3:6379
      // or host1:6379,host2:6379,host3:6379

      const redisClusterOptions = {
        connectTimeout: 10000,
        enableReadyCheck: true,
      };

      if (redisusername) {
        redisClusterOptions.username = redisusername;
      }

      if (redispassword) {
        redisClusterOptions.password = redispassword;
      }

      client = new Redis.Cluster(nodes, {
        redisOptions: redisClusterOptions,
        scaleReads: "slave",
      });

      client.on("error", (err) => {
        logger.error(`Redis Cluster Error: ${err.message}`);
      });

      // Wait until cluster is ready
      await new Promise((resolve, reject) => {
        client.on("ready", resolve);
        client.on("error", reject);
      });

      isConnected = true;
      logger.info("Connected to Redis (Cluster)");
    }

    const shutdown = async () => {
      if (!isConnected) return;

      try {
        if (isCluster) {
          await client.quit();
        } else {
          await client.quit();
        }
        logger.info("Redis connection closed");
      } catch (err) {
        logger.error(`Error during Redis shutdown: ${err.message}`);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    const clientObj = {
      async setKey(key, value) {
        try {
          await client.set(key, value);
        } catch (error) {
          throw new Error(`Failed to set key ${key}: ${error.message}`);
        }
      },
      async getValue(key) {
        try {
          return await client.get(key);
        } catch (error) {
          throw new Error(
            `Failed to get value for key ${key}: ${error.message}`,
          );
        }
      },
      async deleteKey(key) {
        try {
          await client.del(key);
        } catch (error) {
          throw new Error(`Failed to delete key ${key}: ${error.message}`);
        }
      },
      async modifyKey(key, newValue) {
        try {
          await client.set(key, newValue);
        } catch (error) {
          throw new Error(`Failed to modify key ${key}: ${error.message}`);
        }
      },
    };

    return clientObj;
  } catch (error) {
    logger.error(`Redis initialization failed: ${error.message}`);
    throw new Error(`Failed to connect to Redis: ${error.message}`);
  }
}
