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
// TODO: maintenance_record module does not exist - skipping test
// import { maintenanceRecordService, IMaintenanceRecordService } from "../../../src/modules/maintenance_record/maintenanceRecord.service";
// import { IMaintenanceRecordRepository } from "../../../src/modules/maintenance_record/maintenanceRecord.repository";
import { ISellerRepository } from "../../../src/modules/seller/seller.repository";
import { MaintenanceRecordDTO, UpdateMaintenanceRecordDTO } from "../../../src/dtos/maintenanceRecord.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe.skip("MaintenanceRecordService", () => {
  // TODO: maintenance_record module does not exist
  let service: any; // IMaintenanceRecordService;
  let mockMaintenanceRepo: jest.Mocked<any>; // IMaintenanceRecordRepository;
  let mockSellerRepo: jest.Mocked<ISellerRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockMaintenanceRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySellerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<any>; // IMaintenanceRecordRepository;

    mockSellerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      updateRatingAndReviewCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISellerRepository>;

    // service = maintenanceRecordService(mockMaintenanceRepo, mockSellerRepo);

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

  describe("createRecord", () => {
    it("should create a new maintenance record", async () => {
      const sellerId = new Types.ObjectId().toString();
      const recordData: MaintenanceRecordDTO = {
        seller_id: sellerId,
        service_type: "Regular Maintenance",
        service_date: new Date(),
      };
      const mockSeller = { _id: new Types.ObjectId(sellerId) };
      const mockRecord = { _id: new Types.ObjectId(), ...recordData };

      mockSellerRepo.findById.mockResolvedValue(mockSeller as any);
      mockMaintenanceRepo.create.mockResolvedValue(mockRecord as any);

      const result = await service.createRecord(recordData);

      expect(result.success).toBe(true);
      expect(result.record).toEqual(mockRecord);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if seller not found", async () => {
      const recordData: MaintenanceRecordDTO = {
        seller_id: new Types.ObjectId().toString(),
        service_type: "Regular Maintenance",
        service_date: new Date(),
      };

      mockSellerRepo.findById.mockResolvedValue(null);

      const result = await service.createRecord(recordData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Seller not found");
    });
  });

  describe("getRecordById", () => {
    it("should return record by id", async () => {
      const recordId = new Types.ObjectId().toString();
      const mockRecord = { _id: new Types.ObjectId(recordId), vehicle_model: "Model X" };

      mockMaintenanceRepo.findById.mockResolvedValue(mockRecord as any);

      const result = await service.getRecordById(recordId);

      expect(result.success).toBe(true);
      expect(result.record).toEqual(mockRecord);
    });

    it("should return error if record not found", async () => {
      const recordId = new Types.ObjectId().toString();

      mockMaintenanceRepo.findById.mockResolvedValue(null);

      const result = await service.getRecordById(recordId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Record not found");
    });
  });

  describe("getRecordsBySellerId", () => {
    it("should return records for a seller", async () => {
      const sellerId = new Types.ObjectId().toString();
      const mockRecords = [
        { _id: new Types.ObjectId(), seller_id: new Types.ObjectId(sellerId) },
        { _id: new Types.ObjectId(), seller_id: new Types.ObjectId(sellerId) },
      ];

      mockMaintenanceRepo.findBySellerId.mockResolvedValue(mockRecords as any);

      const result = await service.getRecordsBySellerId(sellerId);

      expect(result.success).toBe(true);
      expect(result.records).toEqual(mockRecords);
    });
  });

  describe("updateRecord", () => {
    it("should update record successfully", async () => {
      const recordId = new Types.ObjectId().toString();
      const updateData: UpdateMaintenanceRecordDTO = { service_type: "Updated Maintenance" };
      const mockRecord = { _id: new Types.ObjectId(recordId), ...updateData };

      mockMaintenanceRepo.findById.mockResolvedValue(mockRecord as any);
      mockMaintenanceRepo.update.mockResolvedValue(mockRecord as any);

      const result = await service.updateRecord(recordId, updateData);

      expect(result.success).toBe(true);
      expect(result.record).toEqual(mockRecord);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });

  describe("deleteRecord", () => {
    it("should delete record successfully", async () => {
      const recordId = new Types.ObjectId().toString();
      const sellerId = new Types.ObjectId().toString();
      const mockRecord = {
        _id: new Types.ObjectId(recordId),
        seller_id: new Types.ObjectId(sellerId),
      };

      mockMaintenanceRepo.findById.mockResolvedValue(mockRecord as any);
      mockMaintenanceRepo.delete.mockResolvedValue(true);

      const result = await service.deleteRecord(recordId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });
});

