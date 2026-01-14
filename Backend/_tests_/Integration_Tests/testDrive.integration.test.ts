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
import { testDriveService } from "../../src/modules/testDrive/testDrive.service";
import { TestDriveRepository } from "../../src/modules/testDrive/testDrive.repository";
import { SellerRepository } from "../../src/modules/seller/seller.repository";
import { EvRepository } from "../../src/modules/ev/ev.repository";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  default: {
    getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
    delete: jest.fn(),
    deletePattern: jest.fn().mockResolvedValue(0),
  },
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

describe("TestDrive Integration Tests", () => {
  let service: ReturnType<typeof testDriveService>;
  let testDriveRepo: typeof TestDriveRepository;
  let sellerRepo: typeof SellerRepository;
  let evRepo: typeof EvRepository;
  let testUserId: string;
  let testSellerId: string;

  beforeAll(async () => {
    await setupTestDB();
    testDriveRepo = TestDriveRepository;
    sellerRepo = SellerRepository;
    evRepo = EvRepository;
    const mockNotificationService = {} as any;
    service = testDriveService(testDriveRepo, sellerRepo, evRepo, mockNotificationService);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "testdrive@example.com",
      password: "hashedPassword",
      name: "Test Drive User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
    testSellerId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("TestDrive Slot Operations", () => {
    it("should create a test drive slot", async () => {
      const slotData = {
        seller_id: testSellerId,
        model_id: new Types.ObjectId().toString(),
        available_date: new Date(),
        location: "Test Location",
        max_bookings: 5,
      };

      jest.spyOn(sellerRepo, "findById").mockResolvedValue({
        _id: new Types.ObjectId(testSellerId),
      } as any);
      jest.spyOn(evRepo, "findModelById").mockResolvedValue({
        _id: new Types.ObjectId(slotData.model_id),
      } as any);
      jest.spyOn(testDriveRepo, "createSlot").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...slotData,
      } as any);

      const result = await service.createSlot(slotData);

      expect(result.success).toBe(true);
      expect(result.slot).toBeDefined();
    });
  });
});

