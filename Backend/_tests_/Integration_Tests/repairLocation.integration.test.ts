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
import { repairLocationService } from "../../src/modules/repairLocation/repairLocation.service";
import { RepairLocationRepository } from "../../src/modules/repairLocation/repairLocation.repository";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
}));

describe("RepairLocation Integration Tests", () => {
  let service: ReturnType<typeof repairLocationService>;
  let repairLocationRepo: typeof RepairLocationRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDB();
    repairLocationRepo = RepairLocationRepository;
    service = repairLocationService(repairLocationRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "repairlocation@example.com",
      password: "hashedPassword",
      name: "Repair Location User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("RepairLocation Operations", () => {
    it("should create a repair location", async () => {
      const locationData = {
        seller_id: new Types.ObjectId().toString(),
        name: "Test Repair Shop",
        address: "123 Test St",
        phone: "1234567890",
        latitude: 40.7128,
        longitude: -74.0060,
      };

      jest.spyOn(repairLocationRepo, "create").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...locationData,
      } as any);

      const result = await service.createRepairLocation(locationData);

      expect(result.success).toBe(true);
      expect(result.location).toBeDefined();
      expect(result.location?.name).toBe(locationData.name);
    });

    it("should get all repair locations", async () => {
      jest.spyOn(repairLocationRepo, "findActiveLocations").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          name: "Location 1",
        },
        {
          _id: new Types.ObjectId(),
          name: "Location 2",
        },
      ] as any);

      const result = await service.getAllActiveLocations();

      expect(result.success).toBe(true);
      expect(result.locations).toBeDefined();
    });
  });
});

