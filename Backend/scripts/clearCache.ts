
import { connectRedis, disconnectRedis, refreshRedis } from "../src/config/redis";

/**
 * Script to clear the Redis cache.
 * Useful for running before tests to ensure a clean state.
 */
async function clearCache() {
  try {
    console.log("Connecting to Redis...");
    await connectRedis();
    
    console.log("Clearing Redis cache...");
    await refreshRedis();
    
    console.log("Disconnecting from Redis...");
    await disconnectRedis();
    
    console.log("Cache cleared successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to clear cache:", error);
    process.exit(1);
  }
}

clearCache();
