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
import { savedVehicleController, ISavedVehicleController } from "../../../src/modules/savedVehicle/savedVehicle.controller";
import { ISavedVehicleService } from "../../../src/modules/savedVehicle/savedVehicle.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("SavedVehicleController", () => {
  let controller: ISavedVehicleController;
  let mockSavedVehicleService: jest.Mocked<ISavedVehicleService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSavedVehicleService = {
      getSavedVehicles: jest.fn(),
      saveVehicle: jest.fn(),
      removeSavedVehicle: jest.fn(),
      isVehicleSaved: jest.fn(),
    } as jest.Mocked<ISavedVehicleService>;

    controller = savedVehicleController(mockSavedVehicleService);

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

  describe("getSavedVehicles", () => {
    it("should call service.getSavedVehicles and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true, savedVehicles: [] };

      mockRequest.params = { userId };
      mockSavedVehicleService.getSavedVehicles.mockResolvedValue(mockResult);

      await controller.getSavedVehicles(mockRequest as Request, mockResponse as Response);

      expect(mockSavedVehicleService.getSavedVehicles).toHaveBeenCalledWith(userId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("saveVehicle", () => {
    it("should call service.saveVehicle and return result with 201 status", async () => {
      const saveData = { user_id: "user123", listing_id: "listing123" };
      const mockResult = { success: true, savedVehicle: {} };

      mockRequest.body = saveData;
      mockSavedVehicleService.saveVehicle.mockResolvedValue(mockResult);

      await controller.saveVehicle(mockRequest as Request, mockResponse as Response);

      expect(mockSavedVehicleService.saveVehicle).toHaveBeenCalledWith(saveData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("removeSavedVehicle", () => {
    it("should call service.removeSavedVehicle and return result", async () => {
      const userId = "user123";
      const listingId = "listing123";
      const mockResult = { success: true };

      mockRequest.params = { userId, listingId };
      mockSavedVehicleService.removeSavedVehicle.mockResolvedValue(mockResult);

      await controller.removeSavedVehicle(mockRequest as Request, mockResponse as Response);

      expect(mockSavedVehicleService.removeSavedVehicle).toHaveBeenCalledWith(userId, listingId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("isVehicleSaved", () => {
    it("should call service.isVehicleSaved and return result", async () => {
      const userId = "user123";
      const listingId = "listing123";
      const mockResult = { success: true, isSaved: true };

      mockRequest.params = { userId, listingId };
      mockSavedVehicleService.isVehicleSaved.mockResolvedValue(mockResult);

      await controller.isVehicleSaved(mockRequest as Request, mockResponse as Response);

      expect(mockSavedVehicleService.isVehicleSaved).toHaveBeenCalledWith(userId, listingId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

