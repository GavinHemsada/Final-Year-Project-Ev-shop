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
import { testDriveService, ITestDriveService } from "../../../src/modules/testDrive/testDrive.service";
import { ITestDriveRepository } from "../../../src/modules/testDrive/testDrive.repository";
import { ISellerRepository } from "../../../src/modules/seller/seller.repository";
import { IEvRepository } from "../../../src/modules/ev/ev.repository";
import { TestDriveSlotDTO, TestDriveBookingDTO, FeedbackDTO } from "../../../src/dtos/testDrive.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe("TestDriveService", () => {
  let service: ITestDriveService;
  let mockTestDriveRepo: jest.Mocked<ITestDriveRepository>;
  let mockSellerRepo: jest.Mocked<ISellerRepository>;
  let mockEvRepo: jest.Mocked<IEvRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTestDriveRepo = {
      createSlot: jest.fn(),
      findSlotById: jest.fn(),
      findAllSlots: jest.fn(),
      findSlotsBySeller: jest.fn(),
      findActiveSlots: jest.fn(),
      updateSlot: jest.fn(),
      deleteSlot: jest.fn(),
      createBooking: jest.fn(),
      findBookingById: jest.fn(),
      findBookingsByCustomerId: jest.fn(),
      findBookingsBySlotId: jest.fn(),
      updateBooking: jest.fn(),
      deleteBooking: jest.fn(),
      createFeedback: jest.fn(),
      findFeedbackById: jest.fn(),
      findFeedbacksByBookingId: jest.fn(),
      updateFeedback: jest.fn(),
      deleteFeedback: jest.fn(),
      createRating: jest.fn(),
      updateRating: jest.fn(),
      deleteRating: jest.fn(),
    } as jest.Mocked<ITestDriveRepository>;

    mockSellerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      updateRatingAndReviewCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISellerRepository>;

    mockEvRepo = {
      createBrand: jest.fn(),
      findAllBrands: jest.fn(),
      findBrandById: jest.fn(),
      updateBrand: jest.fn(),
      deleteBrand: jest.fn(),
      createCategory: jest.fn(),
      findAllCategories: jest.fn(),
      findCategoryById: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      createModel: jest.fn(),
      findAllModels: jest.fn(),
      findModelById: jest.fn(),
      findModelsByBrand: jest.fn(),
      updateModel: jest.fn(),
      deleteModel: jest.fn(),
      createListing: jest.fn(),
      findAllListings: jest.fn(),
      findListingById: jest.fn(),
      findListingsBySeller: jest.fn(),
      updateListing: jest.fn(),
      deleteListing: jest.fn(),
    } as jest.Mocked<IEvRepository>;

    service = testDriveService(mockTestDriveRepo, mockSellerRepo, mockEvRepo);

    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction();
      }
    );

    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("findSlotById", () => {
    it("should return slot by id", async () => {
      const slotId = new Types.ObjectId().toString();
      const mockSlot = { _id: new Types.ObjectId(slotId), seller_id: new Types.ObjectId() };

      mockTestDriveRepo.findSlotById.mockResolvedValue(mockSlot as any);

      const result = await service.findSlotById(slotId);

      expect(result.success).toBe(true);
      expect(result.slot).toEqual(mockSlot);
    });

    it("should return error if slot not found", async () => {
      const slotId = new Types.ObjectId().toString();

      mockTestDriveRepo.findSlotById.mockResolvedValue(null);

      const result = await service.findSlotById(slotId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Slot not found");
    });
  });

  describe("createSlot", () => {
    it("should create a new slot", async () => {
      const slotData: TestDriveSlotDTO = {
        seller_id: new Types.ObjectId().toString(),
        location: "Test Location",
        model_id: new Types.ObjectId().toString(),
        available_date: new Date(),
        max_bookings: 5,
        is_active: true,
      };
      const mockSeller = { _id: new Types.ObjectId(slotData.seller_id) };
      const mockModel = { _id: new Types.ObjectId(slotData.model_id) };
      const mockSlot = { _id: new Types.ObjectId(), ...slotData };

      mockSellerRepo.findById.mockResolvedValue(mockSeller as any);
      mockEvRepo.findModelById.mockResolvedValue(mockModel as any);
      mockTestDriveRepo.createSlot.mockResolvedValue(mockSlot as any);

      const result = await service.createSlot(slotData);

      expect(result.success).toBe(true);
      expect(result.slot).toEqual(mockSlot);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if seller not found", async () => {
      const slotData: TestDriveSlotDTO = {
        seller_id: new Types.ObjectId().toString(),
        location: "Test Location",
        model_id: new Types.ObjectId().toString(),
        available_date: new Date(),
        max_bookings: 5,
        is_active: true,
      };

      mockSellerRepo.findById.mockResolvedValue(null);

      const result = await service.createSlot(slotData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Seller not found");
    });
  });

  describe("createBooking", () => {
    it("should create a new booking", async () => {
      const bookingData: TestDriveBookingDTO = {
        customer_id: new Types.ObjectId().toString(),
        slot_id: new Types.ObjectId().toString(),
        booking_date: new Date(),
        booking_time: "09:00",
        duration_minutes: 30,
      };
      const mockSlot = { _id: new Types.ObjectId(bookingData.slot_id), max_bookings: 5 };
      const mockBooking = { _id: new Types.ObjectId(), ...bookingData };

      mockTestDriveRepo.findSlotById.mockResolvedValue(mockSlot as any);
      mockTestDriveRepo.findBookingsBySlotId.mockResolvedValue([]);
      mockTestDriveRepo.findBookingsByCustomerId.mockResolvedValue([]);
      mockTestDriveRepo.createBooking.mockResolvedValue(mockBooking as any);

      const result = await service.createBooking(bookingData);

      expect(result.success).toBe(true);
      expect(result.booking).toEqual(mockBooking);
    });

    it("should return error if slot not found", async () => {
      const bookingData: TestDriveBookingDTO = {
        customer_id: new Types.ObjectId().toString(),
        slot_id: new Types.ObjectId().toString(),
        booking_date: new Date(),
        booking_time: "09:00",
        duration_minutes: 30,
      };

      mockTestDriveRepo.findSlotById.mockResolvedValue(null);

      const result = await service.createBooking(bookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Slot not found");
    });
  });

  describe("findBookingsByCustomerId", () => {
    it("should return bookings for a customer", async () => {
      const customerId = new Types.ObjectId().toString();
      const mockBookings = [
        { _id: new Types.ObjectId(), customer_id: new Types.ObjectId(customerId) },
        { _id: new Types.ObjectId(), customer_id: new Types.ObjectId(customerId) },
      ];

      mockTestDriveRepo.findBookingsByCustomerId.mockResolvedValue(mockBookings as any);

      const result = await service.findBookingsByCustomerId(customerId);

      expect(result.success).toBe(true);
      expect(result.bookings).toEqual(mockBookings);
    });
  });
});

