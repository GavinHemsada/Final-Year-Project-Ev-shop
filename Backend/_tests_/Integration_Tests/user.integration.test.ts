import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
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

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
}));

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
        email: "findbyemail@example.com",
        password: "hashedPassword",
        name: "Jane Doe",
        phone: "1234567890",
        role: [UserRole.USER],
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await repo.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
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
      if (foundUser) {
        foundUser.name = updateData.name;
        const updatedUser = await repo.update(foundUser);
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.name).toBe("Updated Name");
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

      expect(deleted).toBe(true);

      const foundUser = await repo.findById(user._id.toString());
      expect(foundUser).toBeNull();
    });

    it("should get all users", async () => {
      const users = [
        {
          email: "user1@example.com",
          password: "hashedPassword",
          name: "User One",
          phone: "1234567890",
          role: [UserRole.USER],
        },
        {
          email: "user2@example.com",
          password: "hashedPassword",
          name: "User Two",
          phone: "1234567890",
          role: [UserRole.USER],
        },
      ];

      await User.insertMany(users);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.users?.length).toBeGreaterThanOrEqual(2);
    });
  });
});

