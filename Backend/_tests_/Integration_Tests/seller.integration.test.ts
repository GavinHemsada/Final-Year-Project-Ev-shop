import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { sellerService } from "../../src/modules/seller/seller.service";
import { SellerRepository } from "../../src/modules/seller/seller.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { ReviewRepository } from "../../src/modules/review/review.repository";
import { Seller } from "../../src/entities/Seller";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

describe("Seller Integration Tests", () => {
  let service: ReturnType<typeof sellerService>;
  let sellerRepo: typeof SellerRepository;
  let userRepo: typeof UserRepository;
  let reviewRepo: typeof ReviewRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDB();
    sellerRepo = SellerRepository;
    userRepo = UserRepository;
    reviewRepo = ReviewRepository;
    service = sellerService(sellerRepo, userRepo, reviewRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "seller@example.com",
      password: "hashedPassword",
      name: "Seller User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Seller Profile Operations", () => {
    it("should create seller profile", async () => {
      const sellerData = {
        user_id: testUserId,
        business_name: "Test Business",
        license_number: "LIC123",
      };

      jest.spyOn(userRepo, "findById").mockResolvedValue({
        _id: new Types.ObjectId(testUserId),
        role: [UserRole.USER],
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(testUserId),
          role: [UserRole.USER, UserRole.SELLER],
        }),
      } as any);
      jest.spyOn(sellerRepo, "findByUserId").mockResolvedValue(null);
      jest.spyOn(sellerRepo, "create").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...sellerData,
      } as any);

      const result = await service.createSeller(sellerData);

      expect(result.success).toBe(true);
      expect(result.seller).toBeDefined();
      expect(result.seller?.business_name).toBe(sellerData.business_name);
    });

    it("should get seller by user ID", async () => {
      const seller = new Seller({
        user_id: new Types.ObjectId(testUserId),
        business_name: "Test Business",
        license_number: "LIC123",
      });
      await seller.save();

      jest.spyOn(sellerRepo, "findByUserId").mockResolvedValue(seller as any);

      const result = await service.getSellerByUserId(testUserId);

      expect(result.success).toBe(true);
      expect(result.seller?._id.toString()).toBe(seller._id.toString());
    });

    it("should get all sellers", async () => {
      const sellers = [
        {
          user_id: new Types.ObjectId(),
          business_name: "Business 1",
          license_number: "LIC1",
        },
        {
          user_id: new Types.ObjectId(),
          business_name: "Business 2",
          license_number: "LIC2",
        },
      ];

      await Seller.insertMany(sellers);

      jest.spyOn(sellerRepo, "findAll").mockResolvedValue(sellers as any);

      const result = await service.getAllSellers();

      expect(result.success).toBe(true);
      expect(result.sellers?.length).toBeGreaterThanOrEqual(2);
    });

    it("should update seller profile", async () => {
      const seller = new Seller({
        user_id: new Types.ObjectId(testUserId),
        business_name: "Original Business",
        license_number: "LIC123",
      });
      await seller.save();

      jest.spyOn(sellerRepo, "findById").mockResolvedValue(seller as any);
      jest.spyOn(sellerRepo, "update").mockResolvedValue({
        ...seller.toObject(),
        business_name: "Updated Business",
      } as any);

      const result = await service.updateSeller(seller._id.toString(), {
        business_name: "Updated Business",
      });

      expect(result.success).toBe(true);
      expect(result.seller?.business_name).toBe("Updated Business");
    });
  });
});

