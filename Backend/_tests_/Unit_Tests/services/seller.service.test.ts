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
import { sellerService, ISellerService } from "../../../src/modules/seller/seller.service";
import { ISellerRepository } from "../../../src/modules/seller/seller.repository";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import { IReviewRepository } from "../../../src/modules/review/review.repository";
import { SellerDTO, UpdateSellerDTO } from "../../../src/dtos/seller.DTO";
import { UserRole } from "../../../src/shared/enum/enum";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");
jest.mock("../../../src/shared/utils/imageHandel", () => ({
  addImage: jest.fn().mockReturnValue("path/to/image.jpg"),
  deleteImage: jest.fn(),
}));

describe("SellerService", () => {
  let service: ISellerService;
  let mockSellerRepo: jest.Mocked<ISellerRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockReviewRepo: jest.Mocked<IReviewRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSellerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      updateRatingAndReviewCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISellerRepository>;

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockReviewRepo = {
      getReviewByTargetId: jest.fn(),
      getReviewsByReviewerId: jest.fn(),
      getReviewById: jest.fn(),
      createReview: jest.fn(),
      getAllReviews: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
    } as jest.Mocked<IReviewRepository>;

    service = sellerService(mockSellerRepo, mockUserRepo, mockReviewRepo);

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

  describe("getSellerById", () => {
    it("should return seller by id", async () => {
      const sellerId = new Types.ObjectId().toString();
      const mockSeller = { _id: new Types.ObjectId(sellerId), business_name: "Test Seller" };

      mockSellerRepo.findById.mockResolvedValue(mockSeller as any);

      const result = await service.getSellerById(sellerId);

      expect(result.success).toBe(true);
      expect(result.seller).toEqual(mockSeller);
    });

    it("should return error if seller not found", async () => {
      const sellerId = new Types.ObjectId().toString();

      mockSellerRepo.findById.mockResolvedValue(null);

      const result = await service.getSellerById(sellerId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Seller not found");
    });
  });

  describe("getSellerByUserId", () => {
    it("should return seller by user id", async () => {
      const userId = new Types.ObjectId().toString();
      const mockSeller = { _id: new Types.ObjectId(), user_id: new Types.ObjectId(userId) };

      mockSellerRepo.findByUserId.mockResolvedValue(mockSeller as any);

      const result = await service.getSellerByUserId(userId);

      expect(result.success).toBe(true);
      expect(result.seller).toEqual(mockSeller);
    });
  });

  describe("getAllSellers", () => {
    it("should return all sellers", async () => {
      const mockSellers = [
        { _id: new Types.ObjectId(), business_name: "Seller 1" },
        { _id: new Types.ObjectId(), business_name: "Seller 2" },
      ];

      mockSellerRepo.findAll.mockResolvedValue(mockSellers as any);

      const result = await service.getAllSellers();

      expect(result.success).toBe(true);
      expect(result.sellers).toEqual(mockSellers);
    });
  });

  describe("createSeller", () => {
    it("should create a new seller", async () => {
      const userId = new Types.ObjectId().toString();
      const sellerData: SellerDTO = {
        user_id: userId,
        business_name: "Test Business",
      };
      const mockUser: any = { _id: new Types.ObjectId(userId), role: [] };
      const updatedMockUser = { ...mockUser, role: [UserRole.SELLER] };
      mockUser.save = jest.fn<() => Promise<any>>().mockResolvedValue(updatedMockUser);
      const mockSeller = { _id: new Types.ObjectId(), ...sellerData };

      mockSellerRepo.findByUserId.mockResolvedValue(null);
      mockSellerRepo.create.mockResolvedValue(mockSeller as any);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      const result = await service.createSeller(sellerData);

      expect(result.success).toBe(true);
      expect(result.seller).toEqual(mockSeller);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if user not found", async () => {
      const sellerData: SellerDTO = {
        user_id: new Types.ObjectId().toString(),
        business_name: "Test Business",
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createSeller(sellerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("updateSeller", () => {
    it("should update seller successfully", async () => {
      const sellerId = new Types.ObjectId().toString();
      const updateData: UpdateSellerDTO = { business_name: "Updated Business" };
      const mockSeller = { _id: new Types.ObjectId(sellerId), ...updateData };

      mockSellerRepo.findById.mockResolvedValue(mockSeller as any);
      mockSellerRepo.update.mockResolvedValue(mockSeller as any);

      const result = await service.updateSeller(sellerId, updateData);

      expect(result.success).toBe(true);
      expect(result.seller).toEqual(mockSeller);
    });
  });
});

