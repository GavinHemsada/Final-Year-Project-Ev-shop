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
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { userService } from "../../src/modules/user/user.service";
import { UserRepository } from "../../src/modules/user/user.repository";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => {
  const mockGetOrSet = jest.fn() as jest.MockedFunction<any>;
  mockGetOrSet.mockImplementation(async (key: string, fetchFunction: any) => {
    if (typeof fetchFunction === "function") {
      return await fetchFunction();
    }
    return null;
  });
  return {
    default: {
      getOrSet: mockGetOrSet,
      delete: jest.fn(),
    },
    getOrSet: mockGetOrSet,
    delete: jest.fn(),
  };
});

describe("User Integration Tests", () => {
  let service: ReturnType<typeof userService>;
  let repo: typeof UserRepository;

  beforeAll(async () => {
    await setupTestDB();
    repo = UserRepository;
    service = userService(repo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("User CRUD Operations", () => {
    it("should create a new user", async () => {
      const userData = {
        email: "newuser@example.com",
        password: "hashedPassword",
        name: "John Doe",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it("should find user by email", async () => {
      const userData = {
        email: `findbyemail${Date.now()}@example.com`,
        password: "hashedPassword",
        name: "Jane Doe",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      // Verify user was saved correctly
      expect(user.email).toBe(userData.email);

      const foundUser = await repo.findByEmail(userData.email);

      if (!foundUser) {
        console.error("User not found by email:", userData.email);
        // Try to find directly
        const directFind = await User.findOne({ email: userData.email });
        console.error("Direct find result:", directFind ? "Found" : "Not found");
        if (directFind) {
          console.error("Direct find email:", directFind.email);
          console.error("Direct find object keys:", Object.keys(directFind.toObject()));
        }
      } else {
        // Check if email exists on the found user
        console.log("Found user keys:", Object.keys(foundUser.toObject ? foundUser.toObject() : foundUser));
        console.log("Found user email property:", (foundUser as any).email);
        console.log("Found user email getter:", foundUser.email);
      }

      expect(foundUser).toBeDefined();
      // The email should be directly accessible on the document
      expect(foundUser?.email).toBe(userData.email);
    });

    it("should find user by ID", async () => {
      const userData = {
        email: "findbyid@example.com",
        password: "hashedPassword",
        name: "Bob Smith",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await repo.findById(user._id.toString());

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
    });

    it("should update user", async () => {
      const userData = {
        email: "update@example.com",
        password: "hashedPassword",
        name: "Original Name",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      const updateData = { name: "Updated Name" };
      const foundUser = await repo.findById(user._id.toString());
      expect(foundUser).toBeDefined();
      if (foundUser) {
        foundUser.name = updateData.name;
        const updatedUser = await repo.update(foundUser);
        expect(updatedUser).toBeDefined();
        // Reload the document to ensure we have the latest data
        const reloadedUser = await repo.findById(user._id.toString());
        expect(reloadedUser).toBeDefined();
        expect(reloadedUser?.name).toBe("Updated Name");
      }
    });

    it("should delete user", async () => {
      const userData = {
        email: "delete@example.com",
        password: "hashedPassword",
        name: "Delete Me",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      const deleted = await repo.delete(user._id.toString());

      expect(deleted).toBeTruthy();

      const foundUser = await repo.findById(user._id.toString());
      expect(foundUser).toBeNull();
    });

    it("should get all users", async () => {
      const users = [
        {
          email: `user1${Date.now()}@example.com`,
          password: "hashedPassword",
          name: "User One",
          phone: "1234567890",
          role: [UserRole.USER],
        },
        {
          email: `user2${Date.now()}@example.com`,
          password: "hashedPassword",
          name: "User Two",
          phone: "1234567890",
          role: [UserRole.USER],
        },
      ];

      await User.insertMany(users);

      // Verify users were inserted
      const directFind = await User.find();
      expect(directFind.length).toBeGreaterThanOrEqual(2);

      const result = await service.findAll();

      if (!result.success) {
        console.error("FindAll failed:", result.error);
        // Check what the repository returns directly
        const repoResult = await repo.findAll();
        console.error("Repository findAll result:", repoResult ? repoResult.length : "null");
      }

      expect(result.success).toBe(true);
      expect(result.users).toBeDefined();
      expect(result.users?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
