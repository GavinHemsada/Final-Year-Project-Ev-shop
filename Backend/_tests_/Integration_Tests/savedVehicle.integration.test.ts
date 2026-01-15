import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  jest,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { savedVehicleService } from "../../src/modules/savedVehicle/savedVehicle.service";
import { SavedVehicleRepository } from "../../src/modules/savedVehicle/savedVehicle.repository";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

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
  };
});

describe("SavedVehicle Integration Tests", () => {
  let service: ReturnType<typeof savedVehicleService>;
  let savedVehicleRepo: typeof SavedVehicleRepository;
  let testUserId: string;
  let testListingId: string;

  beforeAll(async () => {
    await setupTestDB();
    savedVehicleRepo = SavedVehicleRepository;
    service = savedVehicleService(savedVehicleRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "savedvehicle@example.com",
      password: "hashedPassword",
      name: "Saved Vehicle User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
    testListingId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("SavedVehicle Operations", () => {
    it("should save a vehicle", async () => {
      const savedVehicleData = {
        user_id: testUserId,
        listing_id: testListingId,
      };

      jest.spyOn(savedVehicleRepo, "saveVehicle").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...savedVehicleData,
      } as any);

      const result = await service.saveVehicle(savedVehicleData);

      expect(result.success).toBe(true);
      expect(result.savedVehicle).toBeDefined();
    });

    it("should get saved vehicles by user ID", async () => {
      jest
        .spyOn(savedVehicleRepo, "findSavedVehiclesByUserId")
        .mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            listing_id: new Types.ObjectId(),
          },
        ] as any);

      const result = await service.getSavedVehicles(testUserId);

      expect(result.success).toBe(true);
      expect(result.savedVehicles).toBeDefined();
    });
  });
});
