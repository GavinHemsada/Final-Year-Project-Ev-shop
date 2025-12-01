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
import { savedVehicleService, ISavedVehicleService } from "../../../src/modules/savedVehicle/savedVehicle.service";
import { ISavedVehicleRepository } from "../../../src/modules/savedVehicle/savedVehicle.repository";
import { SaveVehicleDTO } from "../../../src/dtos/savedVehicle.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe("SavedVehicleService", () => {
  let service: ISavedVehicleService;
  let mockSavedVehicleRepo: jest.Mocked<ISavedVehicleRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSavedVehicleRepo = {
      findSavedVehiclesByUserId: jest.fn(),
      findSavedVehicleByUserAndListing: jest.fn(),
      saveVehicle: jest.fn(),
      removeSavedVehicle: jest.fn(),
      removeSavedVehicleByUserAndListing: jest.fn(),
      isVehicleSaved: jest.fn(),
    } as jest.Mocked<ISavedVehicleRepository>;

    service = savedVehicleService(mockSavedVehicleRepo);

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

  describe("getSavedVehicles", () => {
    it("should return saved vehicles for a user", async () => {
      const userId = new Types.ObjectId().toString();
      const mockSavedVehicles = [
        { _id: new Types.ObjectId(), user_id: new Types.ObjectId(userId), listing_id: new Types.ObjectId() },
        { _id: new Types.ObjectId(), user_id: new Types.ObjectId(userId), listing_id: new Types.ObjectId() },
      ];

      mockSavedVehicleRepo.findSavedVehiclesByUserId.mockResolvedValue(mockSavedVehicles as any);

      const result = await service.getSavedVehicles(userId);

      expect(result.success).toBe(true);
      expect(result.savedVehicles).toEqual(mockSavedVehicles);
    });

    it("should return empty array if no saved vehicles", async () => {
      const userId = new Types.ObjectId().toString();

      mockSavedVehicleRepo.findSavedVehiclesByUserId.mockResolvedValue(null);

      const result = await service.getSavedVehicles(userId);

      expect(result.success).toBe(true);
      expect(result.savedVehicles).toEqual([]);
    });
  });

  describe("saveVehicle", () => {
    it("should save a vehicle successfully", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();
      const saveData: SaveVehicleDTO = {
        user_id: userId,
        listing_id: listingId,
      };
      const mockSavedVehicle = { _id: new Types.ObjectId(), ...saveData };

      mockSavedVehicleRepo.findSavedVehicleByUserAndListing.mockResolvedValue(null);
      mockSavedVehicleRepo.saveVehicle.mockResolvedValue(mockSavedVehicle as any);

      const result = await service.saveVehicle(saveData);

      expect(result.success).toBe(true);
      expect(result.savedVehicle).toEqual(mockSavedVehicle);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return existing saved vehicle if already saved", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();
      const saveData: SaveVehicleDTO = {
        user_id: userId,
        listing_id: listingId,
      };
      const existingVehicle = { _id: new Types.ObjectId(), ...saveData };

      mockSavedVehicleRepo.findSavedVehicleByUserAndListing.mockResolvedValue(existingVehicle as any);

      const result = await service.saveVehicle(saveData);

      expect(result.success).toBe(true);
      expect(result.savedVehicle).toEqual(existingVehicle);
    });
  });

  describe("removeSavedVehicle", () => {
    it("should remove saved vehicle successfully", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();

      mockSavedVehicleRepo.removeSavedVehicleByUserAndListing.mockResolvedValue(true);

      const result = await service.removeSavedVehicle(userId, listingId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if saved vehicle not found", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();

      mockSavedVehicleRepo.removeSavedVehicleByUserAndListing.mockResolvedValue(false);

      const result = await service.removeSavedVehicle(userId, listingId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Saved vehicle not found");
    });
  });

  describe("isVehicleSaved", () => {
    it("should return true if vehicle is saved", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();

      mockSavedVehicleRepo.isVehicleSaved.mockResolvedValue(true);

      const result = await service.isVehicleSaved(userId, listingId);

      expect(result.success).toBe(true);
      expect(result.isSaved).toBe(true);
    });

    it("should return false if vehicle is not saved", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();

      mockSavedVehicleRepo.isVehicleSaved.mockResolvedValue(false);

      const result = await service.isVehicleSaved(userId, listingId);

      expect(result.success).toBe(true);
      expect(result.isSaved).toBe(false);
    });
  });
});

