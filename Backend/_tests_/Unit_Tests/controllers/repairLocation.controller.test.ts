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
import { repairLocationController, IRepairLocationController } from "../../../src/modules/repairLocation/repairLocation.controller";
import { IRepairLocationService } from "../../../src/modules/repairLocation/repairLocation.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("RepairLocationController", () => {
  let controller: IRepairLocationController;
  let mockRepairLocationService: jest.Mocked<IRepairLocationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepairLocationService = {
      createRepairLocation: jest.fn(),
      getRepairLocationsBySeller: jest.fn(),
      getAllActiveLocations: jest.fn(),
      getRepairLocationById: jest.fn(),
      updateRepairLocation: jest.fn(),
      deleteRepairLocation: jest.fn(),
    } as jest.Mocked<IRepairLocationService>;

    controller = repairLocationController(mockRepairLocationService);

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

  describe("createRepairLocation", () => {
    it("should call service.createRepairLocation and return result with 201 status", async () => {
      const locationData = { seller_id: "seller123", name: "Test Location", address: "123 St", latitude: 6.9271, longitude: 79.8612, is_active: true };
      const mockResult = { success: true, location: {} };

      mockRequest.body = locationData;
      mockRepairLocationService.createRepairLocation.mockResolvedValue(mockResult);

      await controller.createRepairLocation(mockRequest as Request, mockResponse as Response);

      expect(mockRepairLocationService.createRepairLocation).toHaveBeenCalledWith(locationData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("getRepairLocationsBySeller", () => {
    it("should call service.getRepairLocationsBySeller and return result", async () => {
      const sellerId = "seller123";
      const mockResult = { success: true, locations: [] };

      mockRequest.params = { sellerId };
      mockRepairLocationService.getRepairLocationsBySeller.mockResolvedValue(mockResult);

      await controller.getRepairLocationsBySeller(mockRequest as Request, mockResponse as Response);

      expect(mockRepairLocationService.getRepairLocationsBySeller).toHaveBeenCalledWith(sellerId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getRepairLocationById", () => {
    it("should call service.getRepairLocationById and return result", async () => {
      const locationId = "location123";
      const mockResult = { success: true, location: {} };

      mockRequest.params = { id: locationId };
      mockRepairLocationService.getRepairLocationById.mockResolvedValue(mockResult);

      await controller.getRepairLocationById(mockRequest as Request, mockResponse as Response);

      expect(mockRepairLocationService.getRepairLocationById).toHaveBeenCalledWith(locationId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

