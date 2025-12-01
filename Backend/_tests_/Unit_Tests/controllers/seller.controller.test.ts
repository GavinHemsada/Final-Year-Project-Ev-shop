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
import { sellerController, ISellerController } from "../../../src/modules/seller/seller.controller";
import { ISellerService } from "../../../src/modules/seller/seller.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("SellerController", () => {
  let controller: ISellerController;
  let mockSellerService: jest.Mocked<ISellerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSellerService = {
      createSeller: jest.fn(),
      getSellerById: jest.fn(),
      getSellerByUserId: jest.fn(),
      getAllSellers: jest.fn(),
      updateRatingAndReviewCount: jest.fn(),
      updateSeller: jest.fn(),
      deleteSeller: jest.fn(),
    } as jest.Mocked<ISellerService>;

    controller = sellerController(mockSellerService);

    mockRequest = { params: {}, body: {}, file: undefined };
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

  describe("getSellerById", () => {
    it("should call service.getSellerById and return result", async () => {
      const sellerId = "seller123";
      const mockResult = { success: true, seller: {} };

      mockRequest.params = { id: sellerId };
      mockSellerService.getSellerById.mockResolvedValue(mockResult);

      await controller.getSellerById(mockRequest as Request, mockResponse as Response);

      expect(mockSellerService.getSellerById).toHaveBeenCalledWith(sellerId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getSellerByUserId", () => {
    it("should call service.getSellerByUserId and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true, seller: {} };

      mockRequest.params = { userId };
      mockSellerService.getSellerByUserId.mockResolvedValue(mockResult);

      await controller.getSellerByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockSellerService.getSellerByUserId).toHaveBeenCalledWith(userId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createSeller", () => {
    it("should call service.createSeller and return result with 201 status", async () => {
      const sellerData = { user_id: "user123", business_name: "Test Business", business_address: "123 St" };
      const mockResult = { success: true, seller: {} };

      mockRequest.body = sellerData;
      mockSellerService.createSeller.mockResolvedValue(mockResult);

      await controller.createSeller(mockRequest as Request, mockResponse as Response);

      expect(mockSellerService.createSeller).toHaveBeenCalledWith(sellerData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("updateSeller", () => {
    it("should call service.updateSeller and return result", async () => {
      const sellerId = "seller123";
      const updateData = { business_name: "Updated Business" };
      const mockResult = { success: true, seller: {} };

      mockRequest.params = { id: sellerId };
      mockRequest.body = updateData;
      mockSellerService.updateSeller.mockResolvedValue(mockResult);

      await controller.updateSeller(mockRequest as Request, mockResponse as Response);

      expect(mockSellerService.updateSeller).toHaveBeenCalledWith(sellerId, updateData, undefined);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

