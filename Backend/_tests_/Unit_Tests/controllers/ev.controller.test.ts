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
import { evController, IEvController } from "../../../src/modules/ev/ev.controller";
import { IEvService } from "../../../src/modules/ev/ev.service";
import { ListingType, VehicleCondition } from "../../../src/shared/enum/enum";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("EvController", () => {
  let controller: IEvController;
  let mockEvService: jest.Mocked<IEvService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvService = {
      createBrand: jest.fn(),
      getAllBrands: jest.fn(),
      getById: jest.fn(),
      updateBrand: jest.fn(),
      deleteBrand: jest.fn(),
      createCategory: jest.fn(),
      getAllCategories: jest.fn(),
      getCategoryByid: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      createModel: jest.fn(),
      getAllModels: jest.fn(),
      getModelById: jest.fn(),
      updateModel: jest.fn(),
      deleteModel: jest.fn(),
      createListing: jest.fn(),
      getAllListings: jest.fn(),
      getListingById: jest.fn(),
      getListingsBySeller: jest.fn(),
      updateListing: jest.fn(),
      quickUpdateListing: jest.fn(),
      deleteListing: jest.fn(),
    } as jest.Mocked<IEvService>;

    controller = evController(mockEvService);

    mockRequest = { params: {}, body: {}, query: {}, file: undefined, files: undefined };
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

  describe("createBrand", () => {
    it("should call service.createBrand and return result with 201 status", async () => {
      const brandData = { brand_name: "Tesla" };
      const mockFile = { filename: "logo.jpg" } as Express.Multer.File;
      const mockResult = { success: true, brand: {} };

      mockRequest.body = brandData;
      mockRequest.file = mockFile;
      mockEvService.createBrand.mockResolvedValue(mockResult);

      await controller.createBrand(mockRequest as Request, mockResponse as Response);

      expect(mockEvService.createBrand).toHaveBeenCalledWith(brandData, mockFile);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("getAllBrands", () => {
    it("should call service.getAllBrands and return result", async () => {
      const mockResult = { success: true, brands: [] };

      mockEvService.getAllBrands.mockResolvedValue(mockResult);

      await controller.getAllBrands(mockRequest as Request, mockResponse as Response);

      expect(mockEvService.getAllBrands).toHaveBeenCalled();
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getAllListings", () => {
    it("should call service.getAllListings and return result", async () => {
      const mockResult = { success: true, listings: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      mockRequest.query = { page: "1", limit: "10" };
      mockEvService.getAllListings.mockResolvedValue(mockResult);

      await controller.getAllListings(mockRequest as Request, mockResponse as Response);

      expect(mockEvService.getAllListings).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "",
        filter: "",
      });
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getListingById", () => {
    it("should call service.getListingById and return result", async () => {
      const listingId = "listing123";
      const mockResult = { success: true, listing: {} };

      mockRequest.params = { id: listingId };
      mockEvService.getListingById.mockResolvedValue(mockResult);

      await controller.getListingById(mockRequest as Request, mockResponse as Response);

      expect(mockEvService.getListingById).toHaveBeenCalledWith(listingId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createListing", () => {
    it("should call service.createListing and return result with 201 status", async () => {
      const listingData = { seller_id: "seller123", model_id: "model123", listing_type: ListingType.SALE, condition: VehicleCondition.NEW, price: 50000 };
      const mockFiles = [{ filename: "image1.jpg" }] as Express.Multer.File[];
      const mockResult = { success: true, listing: {} };

      mockRequest.body = listingData;
      mockRequest.files = mockFiles;
      mockEvService.createListing.mockResolvedValue(mockResult);

      await controller.createListing(mockRequest as Request, mockResponse as Response);

      expect(mockEvService.createListing).toHaveBeenCalledWith(listingData, mockFiles);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });
});

