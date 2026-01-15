import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import {
  userService,
  IUserService,
} from "../../../src/modules/user/user.service";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import CacheService from "../../../src/shared/cache/CacheService";
import { IUser } from "../../../src/entities/User";

// Mock the dependencies
jest.mock("../../../src/shared/cache/CacheService");
jest.mock("../../../src/shared/utils/imageHandel", () => ({
  addImage: jest.fn().mockReturnValue("path/to/new-image.jpg"),
  deleteImage: jest.fn(),
}));

// Helper function to create a partial mock user
const createMockUser = (overrides: Partial<IUser> = {}): Partial<IUser> => ({
  _id: new Types.ObjectId().toHexString() as any,
  name: "Test User",
  role: ["user" as any],
  ...overrides,
});

describe("UserService", () => {
  let service: IUserService;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeAll(async () => {
    // Connect to the in-memory database
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a mock repository with proper typing
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    // Instantiate the service with the mock repository
    service = userService(mockUserRepo);

    // Mock CacheService.getOrSet to simply execute the fetchFunction
    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction(); // <-- Now TS knows it's executable
      }
    );

    // Mock CacheService.delete
    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.connection.close();
    }
  });

  describe("findAll", () => {
    it("should return all users from the repository", async () => {
      const mockUsers = [
        createMockUser({ name: "User 1" }),
        createMockUser({ name: "User 2" }),
      ] as IUser[];

      mockUserRepo.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.users).toEqual(mockUsers);
      expect(mockUserRepo.findAll).toHaveBeenCalledTimes(1);
      expect(CacheService.getOrSet).toHaveBeenCalledWith(
        "users",
        expect.any(Function),
        3600
      );
    });

    it("should return an error if repository fails", async () => {
      mockUserRepo.findAll.mockRejectedValue(new Error("DB Error"));
      const result = await service.findAll();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch users");
    });
  });

  describe("findById", () => {
    it("should return a user when a valid ID is provided", async () => {
      const userId = new Types.ObjectId().toHexString();
      const mockUser = createMockUser({
        _id: userId as any,
        name: "Test User",
      }) as IUser;

      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(CacheService.getOrSet).toHaveBeenCalledWith(
        `user_${userId}`,
        expect.any(Function),
        3600
      );
    });

    it('should return a "not found" error for a non-existent user', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("update", () => {
    it("should update a user successfully", async () => {
      const userId = new Types.ObjectId().toHexString();
      const existingUser = createMockUser({
        _id: userId as any,
        name: "Old Name",
      }) as IUser;

      const updateData = { name: "New Name" };
      const updatedUser = createMockUser({
        _id: userId as any,
        name: "New Name",
      }) as IUser;

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result.success).toBe(true);
      expect(result.user?.name).toBe("New Name");
      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ _id: userId, name: "New Name" })
      );
      expect(CacheService.delete).toHaveBeenCalledWith(`user_${userId}`);
      expect(CacheService.delete).toHaveBeenCalledWith("users");
    });

    it('should return a "not found" error when updating a non-existent user', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.update(userId, { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a user successfully", async () => {
      const userId = new Types.ObjectId().toHexString();
      const mockUser = createMockUser({
        _id: userId as any,
        name: "Test User",
      }) as IUser;

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.delete.mockResolvedValue(true);

      const result = await service.delete(userId);

      expect(result.success).toBe(true);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepo.delete).toHaveBeenCalledWith(userId);
      expect(CacheService.delete).toHaveBeenCalledWith(`user_${userId}`);
      expect(CacheService.delete).toHaveBeenCalledWith("users");
    });

    it('should return a "not found" error when deleting a non-existent user', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.delete(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });
  });
});
