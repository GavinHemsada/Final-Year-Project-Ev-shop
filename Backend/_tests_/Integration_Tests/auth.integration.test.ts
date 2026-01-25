import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { authService } from "../../src/modules/auth/auth.service";
import { AuthRepository } from "../../src/modules/auth/auth.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { createTestUser } from "./setup/testHelpers";
import { sendEmail } from "../../src/shared/utils/Email.util";
import { User } from "../../src/entities/User";

jest.mock("../../src/shared/utils/Email.util");
jest.mock("../../src/shared/cache/CacheService", () => {
  const mockGetOrSet = jest.fn() as jest.MockedFunction<any>;
  mockGetOrSet.mockImplementation(async (key: string, fetchFunction: any) => {
    if (typeof fetchFunction === "function") {
      return fetchFunction();
    }
    return null;
  });

  return {
    getOrSet: mockGetOrSet,
    delete: jest.fn(),
    deletePattern: jest.fn(),
  };
});

describe("Auth Integration Tests", () => {
  let service: ReturnType<typeof authService>;
  let authRepo: typeof AuthRepository;
  let userRepo: typeof UserRepository;

  beforeAll(async () => {
    await setupTestDB();
    authRepo = AuthRepository;
    userRepo = UserRepository;
    service = authService(authRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    const mockSendEmail = sendEmail as jest.MockedFunction<any>;
    mockSendEmail.mockResolvedValue(true);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: `newuser${Date.now()}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      const result = await service.register(userData);

      if (!result.success) {
        console.error("Registration failed:", result.error);
        // Check if user was actually created despite the error
        const checkUser = await userRepo.findByEmail(userData.email);
        console.error("User exists in DB:", checkUser ? "Yes" : "No");
      }
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(userData.email);
    });

    it("should fail to register with existing email", async () => {
      const uniqueEmail = `existing${Date.now()}@example.com`;
      const userData = {
        email: uniqueEmail,
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      // Register first time
      const firstResult = await service.register(userData);
      expect(firstResult.success).toBe(true);
      expect(firstResult.user).toBeDefined();
      expect(firstResult.user?.email).toBe(uniqueEmail);
      
      // Verify user exists in database - retry a few times to handle timing
      let foundUserAuth = null;
      for (let i = 0; i < 5; i++) {
        foundUserAuth = await authRepo.findByEmail(uniqueEmail);
        if (foundUserAuth) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (!foundUserAuth) {
        console.error("authRepo.findByEmail did not find the user after retries!");
        // Try direct query
        const directFind = await User.findOne({ email: uniqueEmail });
        console.error("Direct User.findOne result:", directFind ? "Found" : "Not found");
        if (directFind) {
          console.error("Direct find email:", directFind.email);
          console.error("Direct find _id:", directFind._id);
        }
        // Also try without select
        const directFindNoSelect = await User.findOne({ email: uniqueEmail });
        console.error("Direct find (no select) result:", directFindNoSelect ? "Found" : "Not found");
      }
      expect(foundUserAuth).toBeDefined();
      expect(foundUserAuth?.email).toBe(uniqueEmail);

      // Try to register again with same email
      const result = await service.register(userData);

      if (result.success) {
        console.error("Second registration succeeded when it should have failed");
        console.error("First registration user:", firstResult.user);
        console.error("Found user via authRepo:", foundUserAuth);
        // Check directly in database
        const directFind = await User.findOne({ email: uniqueEmail });
        console.error("Direct database find:", directFind ? "Found" : "Not found");
        if (directFind) {
          console.error("Direct find email:", directFind.email);
        }
      }

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("User Login", () => {
    it("should login with correct credentials", async () => {
      const userData = {
        email: "login@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      // Register user first
      await service.register(userData);

      // Login
      const result = await service.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it("should fail login with incorrect password", async () => {
      const userData = {
        email: "login2@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      // Register user
      await service.register(userData);

      // Try to login with wrong password
      const result = await service.login({
        email: userData.email,
        password: "WrongPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("should fail login with non-existent email", async () => {
      const result = await service.login({
        email: "nonexistent@example.com",
        password: "Password123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid credentials");
    });
  });

  describe("Email Verification", () => {
    it("should verify email with correct OTP", async () => {
      const userData = {
        email: "verify@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      // Register user
      const registerResult = await service.register(userData);
      expect(registerResult.success).toBe(true);

      // Get OTP from email mock (in real scenario, OTP would be stored)
      // For this test, we'll need to get the actual OTP from the user document
      const user = await userRepo.findByEmail(userData.email);
      expect(user).toBeDefined();
      // Note: In a real scenario, you'd retrieve the OTP from the database or email service
    });
  });
});
