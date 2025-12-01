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
import { evService, IEvService } from "../../../src/modules/ev/ev.service";
import { IEvRepository } from "../../../src/modules/ev/ev.repository";
import { ISellerRepository } from "../../../src/modules/seller/seller.repository";
import { EvBrandDTO, EvModelDTO, VehicleListingDTO } from "../../../src/dtos/ev.DTO";
import { ListingType, VehicleCondition } from "../../../src/shared/enum/enum";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");
jest.mock("../../../src/shared/utils/imageHandel", () => ({
  addImage: jest.fn().mockReturnValue("path/to/brand-logo.jpg"),
  addImages: jest.fn().mockReturnValue(["path/to/image1.jpg", "path/to/image2.jpg"]),
  deleteImage: jest.fn(),
  deleteImages: jest.fn(),
}));

describe("EvService", () => {
  let service: IEvService;
  let mockEvRepo: jest.Mocked<IEvRepository>;
  let mockSellerRepo: jest.Mocked<ISellerRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockSellerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      updateRatingAndReviewCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISellerRepository>;

    service = evService(mockEvRepo, mockSellerRepo);

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

  describe("createBrand", () => {
    it("should create a new brand successfully", async () => {
      const brandData: EvBrandDTO = { brand_name: "Tesla" };
      const mockFile = { filename: "logo.jpg" } as Express.Multer.File;
      const mockBrand = { _id: new Types.ObjectId(), ...brandData, brand_logo: "path/to/brand-logo.jpg" };

      mockEvRepo.createBrand.mockResolvedValue(mockBrand as any);

      const result = await service.createBrand(brandData, mockFile);

      expect(result.success).toBe(true);
      expect(result.brand).toEqual(mockBrand);
      expect(CacheService.delete).toHaveBeenCalledWith("brands");
    });

    it("should handle errors gracefully", async () => {
      const brandData: EvBrandDTO = { brand_name: "Tesla" };
      const mockFile = { filename: "logo.jpg" } as Express.Multer.File;

      mockEvRepo.createBrand.mockResolvedValue(null);

      const result = await service.createBrand(brandData, mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create new brand");
    });
  });

  describe("getAllBrands", () => {
    it("should return all brands", async () => {
      const mockBrands = [
        { _id: new Types.ObjectId(), brand_name: "Tesla" },
        { _id: new Types.ObjectId(), brand_name: "Nissan" },
      ];

      mockEvRepo.findAllBrands.mockResolvedValue(mockBrands as any);

      const result = await service.getAllBrands();

      expect(result.success).toBe(true);
      expect(result.brands).toEqual(mockBrands);
    });
  });

  describe("getById", () => {
    it("should return brand by id", async () => {
      const brandId = new Types.ObjectId().toString();
      const mockBrand = { _id: new Types.ObjectId(brandId), brand_name: "Tesla" };

      mockEvRepo.findBrandById.mockResolvedValue(mockBrand as any);

      const result = await service.getById(brandId);

      expect(result.success).toBe(true);
      expect(result.brand).toEqual(mockBrand);
    });

    it("should return error if brand not found", async () => {
      const brandId = new Types.ObjectId().toString();

      mockEvRepo.findBrandById.mockResolvedValue(null);

      const result = await service.getById(brandId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Brand not found");
    });
  });

  describe("getAllListings", () => {
    it("should return paginated listings", async () => {
      const mockListings = [
        { _id: new Types.ObjectId(), listing_type: "sale", condition: "new" },
        { _id: new Types.ObjectId(), listing_type: "lease", condition: "used" },
      ];

      mockEvRepo.findAllListings.mockResolvedValue(mockListings as any);

      const result = await service.getAllListings({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.listings).toBeDefined();
    });

    it("should return error if no listings found", async () => {
      mockEvRepo.findAllListings.mockResolvedValue([]);

      const result = await service.getAllListings({ page: 1, limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toBe("No listings found");
    });
  });

  describe("getListingById", () => {
    it("should return listing by id", async () => {
      const listingId = new Types.ObjectId().toString();
      const mockListing = { _id: new Types.ObjectId(listingId), listing_type: "sale" };

      mockEvRepo.findListingById.mockResolvedValue(mockListing as any);

      const result = await service.getListingById(listingId);

      expect(result.success).toBe(true);
      expect(result.listing).toEqual(mockListing);
    });
  });

  describe("createListing", () => {
    it("should create a new listing successfully", async () => {
      const listingData: VehicleListingDTO = {
        seller_id: new Types.ObjectId().toString(),
        model_id: new Types.ObjectId().toString(),
        listing_type: ListingType.SALE,
        condition: VehicleCondition.NEW,
        price: 50000,
      };
      const mockFiles = [{ filename: "image1.jpg" }, { filename: "image2.jpg" }] as Express.Multer.File[];
      const mockSeller = { _id: new Types.ObjectId(listingData.seller_id) };
      const mockListing = { _id: new Types.ObjectId(), ...listingData };

      mockSellerRepo.findById.mockResolvedValue(mockSeller as any);
      mockEvRepo.createListing.mockResolvedValue(mockListing as any);

      const result = await service.createListing(listingData, mockFiles);

      expect(result.success).toBe(true);
      expect(result.listing).toEqual(mockListing);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if seller not found", async () => {
      const listingData: VehicleListingDTO = {
        seller_id: new Types.ObjectId().toString(),
        model_id: new Types.ObjectId().toString(),
        listing_type: ListingType.SALE,
        condition: VehicleCondition.NEW,
        price: 50000,
      };

      mockSellerRepo.findById.mockResolvedValue(null);

      const result = await service.createListing(listingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Seller not found");
    });
  });
});

