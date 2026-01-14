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
import { reviewService } from "../../src/modules/review/review.service";
import { ReviewRepository } from "../../src/modules/review/review.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { User } from "../../src/entities/User";
import { Seller } from "../../src/entities/Seller";
import { UserRole, ReviewType } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
}));

describe("Review Integration Tests", () => {
  let service: ReturnType<typeof reviewService>;
  let reviewRepo: typeof ReviewRepository;
  let testUserId: string;
  let testTargetId: string;

  beforeAll(async () => {
    await setupTestDB();
    reviewRepo = ReviewRepository;
    service = reviewService(reviewRepo, UserRepository);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "reviewuser@example.com",
      password: "hashedPassword",
      name: "Review User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
    
    // Create a test seller for the review target
    const seller = new Seller({
      user_id: user._id,
      business_name: "Test Seller Business",
      street_address: "123 Test St",
      city: "Test City",
      state: "Test State",
      postal_code: "12345",
      country: "Test Country",
    });
    await seller.save();
    testTargetId = seller._id.toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Review Operations", () => {
    it("should create a new review", async () => {
      const reviewData = {
        reviewer_id: testUserId,
        target_id: testTargetId,
        target_type: ReviewType.SERVICE,
        rating: 5,
        title: "Great Service",
        comment: "Excellent experience",
      };

      // Don't mock - let it use the real repository to find the user
      // The user was created in beforeEach, so it should be found
      const result = await service.createReview(reviewData);

      if (!result.success) {
        console.log("Review creation failed:", result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      if (result.review) {
        expect(result.review.rating).toBe(reviewData.rating);
      }
    });

    it("should get reviews by target ID", async () => {
      jest.spyOn(reviewRepo, "getReviewByTargetId").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          rating: 5,
          title: "Great",
        },
        {
          _id: new Types.ObjectId(),
          rating: 4,
          title: "Good",
        },
      ] as any);

      const result = await service.getReviewByTargetId(testTargetId);

      expect(result.success).toBe(true);
      expect(result.reviews).toBeDefined();
    });
  });
});

