import dotenv from "dotenv";
dotenv.config({ quiet: true });
import mongoose from "mongoose";

/**
 * Setup test database before all tests
 */
export const setupTestDB = async () => {
  try {
    // Use TEST_MONGO_URI from environment
    const mongoUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("TEST_MONGO_URI or MONGO_URI must be set in environment");
    }
    
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("Test database connected");
    }
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    throw error;
  }
};

/**
 * Clean up test database after all tests
 */
export const teardownTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // Drop test database with error handling for concurrent drops
      if (mongoose.connection.db) {
        try {
          await mongoose.connection.db.dropDatabase();
        } catch (dropError: any) {
          // Ignore "database is currently being dropped" errors
          if (dropError?.code !== 215 && dropError?.codeName !== "DatabaseDropPending") {
            throw dropError;
          }
        }
      }
      await mongoose.connection.close();
      console.log("Test database disconnected");
    }
  } catch (error) {
    // Log but don't throw - allow tests to complete even if teardown fails
    console.error("Failed to disconnect from test database:", error);
  }
};

/**
 * Clear all collections between tests
 */
export const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
};

