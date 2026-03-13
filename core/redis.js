import { createClient } from "redis";

//import Redis from "ioredis";

import logger from "../utils/logger.js";

import decryptSecret from "./decrypt.js";

export async function nodeRedisDemo() {
  try {
    //const redisurl = decryptSecret(process.env.redisURL);
    //const redispassword = decryptSecret(process.env.redisPassword);

    const redisurl = process.env.redisURL;
    const redispassword = process.env.redisPassword;
    const isCluster = process.env.REDIS_CLUSTER === "true";

    if (!redisurl) {
      throw new Error("redisURL is not defined in environment variables");
    }
    let client;
    let isConnected = false;

    /**
     * ================================
     *  STANDALONE MODE (node-redis)
     * ================================
     */
    if (!isCluster) {
      client = createClient({
        url: redisurl,
        password: redispassword,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error("Retry attempts exhausted");
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      client.on("error", (err) => {
        logger.error("Redis Client Error:", err);
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

      const nodes = redisurl.split(",").map((node) => {
        const [host, port] = node.split(":");
        return { host, port: parseInt(port, 10) };
      });

      client = new Redis.Cluster(nodes, {
        redisOptions: {
          password: redispassword,
          connectTimeout: 10000,
          enableReadyCheck: true,
        },
        scaleReads: "slave",
      });

      client.on("error", (err) => {
        logger.error("Redis Cluster Error:", err);
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
        logger.error("Error during Redis shutdown:", err);
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
    logger.info(`Error: ${JSON.stringify(error, null, 2)}`);
    throw new Error(`Failed to connect to Redis: ${error.message}`);
  }
}
