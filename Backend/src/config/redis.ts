import { createClient } from "redis";

/**
 * @fileoverview
 * This module sets up and exports a Redis client instance using the `redis` library.
 * It provides utility functions to connect and disconnect from Redis,
 * and logs connection and error events for easier debugging.
 */

/**
 * @constant {RedisClientType}
 * @description Creates a Redis client instance with the configured URL and socket timeout.
 * Defaults to `redis://localhost:6379` if `REDIS_URL` is not set in environment variables.
 */
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,
  },
});

/**
 * @event redisClient#error
 * @description Logs any errors that occur with the Redis client connection.
 * @param {Error} err - The error object from Redis.
 */
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

/**
 * @event redisClient#connect
 * @description Logs a message when the Redis client successfully connects.
 */
redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

/**
 * @function connectRedis
 * @async
 * @description Connects the Redis client to the Redis server.
 * Should be called during application startup.
 * @throws {Error} Throws an error if the connection fails.
 */
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
};

/**
 * @function disconnectRedis
 * @async
 * @description Gracefully closes the connection to the Redis server.
 * Should be called during application shutdown to prevent resource leaks.
 */
export const disconnectRedis = async () => {
  await redisClient.quit();
};

/**
 * @function refreshRedis
 * @async
 * @description Flushes all data from the Redis cache.
 * Useful for clearing stale data during development or maintenance.
 */
export const refreshRedis = async () => {
  try {
    await redisClient.flushAll();
    console.log("Redis cache refreshed (FLUSH ALL)");
  } catch (err) {
    console.error("Error refreshing Redis:", err);
  }
};

/**
 * @exports redisClient
 * @description The default Redis client instance for performing cache operations.
 */
export default redisClient;
