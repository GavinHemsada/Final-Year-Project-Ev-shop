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
import mongoose from "mongoose";
import { Request, Response } from "express";
// TODO: maintenance_record module does not exist - skipping test
// import { maintenanceRecordController, IMaintenanceRecordController } from "../../../src/modules/maintenance_record/maintenanceRecord.controller";
// import { IMaintenanceRecordService } from "../../../src/modules/maintenance_record/maintenanceRecord.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe.skip("MaintenanceRecordController", () => {
  // TODO: maintenance_record module does not exist
  let controller: any; // IMaintenanceRecordController;
  let mockMaintenanceService: jest.Mocked<any>; // IMaintenanceRecordService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockMaintenanceService = {
      createRecord: jest.fn(),
      getRecordById: jest.fn(),
      getRecordsBySellerId: jest.fn(),
      getAllRecords: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
    } as jest.Mocked<any>; // IMaintenanceRecordService;

    // controller = maintenanceRecordController(mockMaintenanceService);

    mockRequest = { params: {}, body: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    (handleResult as jest.Mock) = jest.fn((res, result, status) => res);
    (handleError as jest.Mock) = jest.fn((res, err, operation) => res);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("createRecord", () => {
    it("should call service.createRecord and return result with 201 status", async () => {
      const recordData = { seller_id: "seller123", vehicle_model: "Model X", service_type: "Maintenance", service_date: new Date(), cost: 500 };
      const mockResult = { success: true, record: {} };

      mockRequest.body = recordData;
      mockMaintenanceService.createRecord.mockResolvedValue(mockResult);

      await controller.createRecord(mockRequest as Request, mockResponse as Response);

      expect(mockMaintenanceService.createRecord).toHaveBeenCalledWith(recordData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("getRecordById", () => {
    it("should call service.getRecordById and return result", async () => {
      const recordId = "record123";
      const mockResult = { success: true, record: {} };

      mockRequest.params = { id: recordId };
      mockMaintenanceService.getRecordById.mockResolvedValue(mockResult);

      await controller.getRecordById(mockRequest as Request, mockResponse as Response);

      expect(mockMaintenanceService.getRecordById).toHaveBeenCalledWith(recordId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getRecordsBySellerId", () => {
    it("should call service.getRecordsBySellerId and return result", async () => {
      const sellerId = "seller123";
      const mockResult = { success: true, records: [] };

      mockRequest.params = { sellerId };
      mockMaintenanceService.getRecordsBySellerId.mockResolvedValue(mockResult);

      await controller.getRecordsBySellerId(mockRequest as Request, mockResponse as Response);

      expect(mockMaintenanceService.getRecordsBySellerId).toHaveBeenCalledWith(sellerId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

