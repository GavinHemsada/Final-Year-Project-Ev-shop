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
import { repairLocationService, IRepairLocationService } from "../../../src/modules/repairLocation/repairLocation.service";
import { IRepairLocationRepository } from "../../../src/modules/repairLocation/repairLocation.repository";
import { RepairLocationDTO, UpdateRepairLocationDTO } from "../../../src/dtos/repairLocation.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe("RepairLocationService", () => {
  let service: IRepairLocationService;
  let mockRepairLocationRepo: jest.Mocked<IRepairLocationRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepairLocationRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySellerId: jest.fn(),
      findActiveLocations: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IRepairLocationRepository>;

    service = repairLocationService(mockRepairLocationRepo);

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

  describe("createRepairLocation", () => {
    it("should create a new repair location", async () => {
      const locationData: RepairLocationDTO = {
        seller_id: new Types.ObjectId().toString(),
        name: "Test Location",
        address: "123 Test St",
        latitude: 6.9271,
        longitude: 79.8612,
        is_active: true,
      };
      const mockLocation = { _id: new Types.ObjectId(), ...locationData };

      mockRepairLocationRepo.create.mockResolvedValue(mockLocation as any);

      const result = await service.createRepairLocation(locationData);

      expect(result.success).toBe(true);
      expect(result.location).toEqual(mockLocation);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const locationData: RepairLocationDTO = {
        seller_id: new Types.ObjectId().toString(),
        name: "Test Location",
        address: "123 Test St",
        latitude: 6.9271,
        longitude: 79.8612,
        is_active: true,
      };

      mockRepairLocationRepo.create.mockResolvedValue(null);

      const result = await service.createRepairLocation(locationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create repair location");
    });
  });

  describe("getRepairLocationsBySeller", () => {
    it("should return repair locations for a seller", async () => {
      const sellerId = new Types.ObjectId().toString();
      const mockLocations = [
        { _id: new Types.ObjectId(), seller_id: new Types.ObjectId(sellerId) },
        { _id: new Types.ObjectId(), seller_id: new Types.ObjectId(sellerId) },
      ];

      mockRepairLocationRepo.findBySellerId.mockResolvedValue(mockLocations as any);

      const result = await service.getRepairLocationsBySeller(sellerId);

      expect(result.success).toBe(true);
      expect(result.locations).toEqual(mockLocations);
    });
  });

  describe("getAllActiveLocations", () => {
    it("should return all active repair locations", async () => {
      const mockLocations = [
        { _id: new Types.ObjectId(), is_active: true },
        { _id: new Types.ObjectId(), is_active: true },
      ];

      mockRepairLocationRepo.findActiveLocations.mockResolvedValue(mockLocations as any);

      const result = await service.getAllActiveLocations();

      expect(result.success).toBe(true);
      expect(result.locations).toEqual(mockLocations);
    });
  });

  describe("getRepairLocationById", () => {
    it("should return repair location by id", async () => {
      const locationId = new Types.ObjectId().toString();
      const mockLocation = { _id: new Types.ObjectId(locationId), name: "Test Location" };

      mockRepairLocationRepo.findById.mockResolvedValue(mockLocation as any);

      const result = await service.getRepairLocationById(locationId);

      expect(result.success).toBe(true);
      expect(result.location).toEqual(mockLocation);
    });

    it("should return error if location not found", async () => {
      const locationId = new Types.ObjectId().toString();

      mockRepairLocationRepo.findById.mockResolvedValue(null);

      const result = await service.getRepairLocationById(locationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Repair location not found");
    });
  });

  describe("updateRepairLocation", () => {
    it("should update repair location successfully", async () => {
      const locationId = new Types.ObjectId().toString();
      const sellerId = new Types.ObjectId().toString();
      const updateData: UpdateRepairLocationDTO = { name: "Updated Location" };
      const existingLocation = { _id: new Types.ObjectId(locationId), seller_id: new Types.ObjectId(sellerId) };
      const updatedLocation = { ...existingLocation, ...updateData };

      mockRepairLocationRepo.findById.mockResolvedValue(existingLocation as any);
      mockRepairLocationRepo.update.mockResolvedValue(updatedLocation as any);

      const result = await service.updateRepairLocation(locationId, updateData);

      expect(result.success).toBe(true);
      expect(result.location).toEqual(updatedLocation);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });

  describe("deleteRepairLocation", () => {
    it("should delete repair location successfully", async () => {
      const locationId = new Types.ObjectId().toString();
      const sellerId = new Types.ObjectId().toString();
      const mockLocation = {
        _id: new Types.ObjectId(locationId),
        seller_id: new Types.ObjectId(sellerId),
      };

      mockRepairLocationRepo.findById.mockResolvedValue(mockLocation as any);
      mockRepairLocationRepo.delete.mockResolvedValue(true);

      const result = await service.deleteRepairLocation(locationId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });
});

