import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { evService } from "../../src/modules/ev/ev.service";
import { EvRepository } from "../../src/modules/ev/ev.repository";
import { SellerRepository } from "../../src/modules/seller/seller.repository";
import { EvBrand } from "../../src/entities/EvBrand";
import { ListingType, VehicleCondition } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => {
  const mockGetOrSet = jest.fn() as jest.MockedFunction<any>;
  mockGetOrSet.mockImplementation(async (key: string, fetchFunction: any) => {
    if (typeof fetchFunction === "function") {
      return fetchFunction();
    }
    return null;
  });

  const mockDeletePattern = jest.fn() as jest.MockedFunction<any>;
  mockDeletePattern.mockResolvedValue(0);

  return {
    getOrSet: mockGetOrSet,
    delete: jest.fn(),
    deletePattern: mockDeletePattern,
  };
});

jest.mock("../../src/shared/utils/imageHandel", () => ({
  addImage: jest.fn().mockReturnValue("path/to/image.jpg"),
  addImages: jest.fn().mockReturnValue(["path/to/image1.jpg"]),
  deleteImage: jest.fn(),
  deleteImages: jest.fn(),
}));

describe("EV Integration Tests", () => {
  let service: ReturnType<typeof evService>;
  let evRepo: typeof EvRepository;
  let sellerRepo: typeof SellerRepository;

  beforeAll(async () => {
    await setupTestDB();
    evRepo = EvRepository;
    sellerRepo = SellerRepository;
    service = evService(evRepo, sellerRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Brand Operations", () => {
    it("should create a new brand", async () => {
      const brandData = {
        brand_name: "Tesla",
      };
      const mockFile = { filename: "logo.jpg" } as Express.Multer.File;

      jest.spyOn(evRepo, "createBrand").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...brandData,
        brand_logo: "path/to/image.jpg",
      } as any);

      const result = await service.createBrand(brandData, mockFile);

      expect(result.success).toBe(true);
      expect(result.brand).toBeDefined();
      expect(result.brand?.brand_name).toBe(brandData.brand_name);
    });

    it("should get all brands", async () => {
      const brands = [
        { brand_name: "Tesla", brand_logo: "path/to/tesla.jpg" },
        { brand_name: "Nissan", brand_logo: "path/to/nissan.jpg" },
      ];

      await EvBrand.insertMany(brands);

      jest.spyOn(evRepo, "findAllBrands").mockResolvedValue(brands as any);

      const result = await service.getAllBrands();

      expect(result.success).toBe(true);
      expect(result.brands?.length).toBeGreaterThanOrEqual(2);
    });

    it("should get brand by ID", async () => {
      const brand = new EvBrand({
        brand_name: "Tesla",
        brand_logo: "path/to/logo.jpg",
      });
      await brand.save();

      jest.spyOn(evRepo, "findBrandById").mockResolvedValue(brand as any);

      const result = await service.getById(brand._id.toString());

      expect(result.success).toBe(true);
      expect(result.brand?._id.toString()).toBe(brand._id.toString());
    });
  });

  describe("Listing Operations", () => {
    it("should get all listings with pagination", async () => {
      jest.spyOn(evRepo, "findAllListings").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          listing_type: ListingType.SALE,
          condition: VehicleCondition.NEW,
          price: 50000,
        },
        {
          _id: new Types.ObjectId(),
          listing_type: ListingType.LEASE,
          condition: VehicleCondition.USED,
          price: 30000,
        },
      ] as any);

      const result = await service.getAllListings({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.listings).toBeDefined();
    });
  });
});
