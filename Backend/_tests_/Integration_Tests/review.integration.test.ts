import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
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
  getOrSet: async (key: any, fetchFunction: any) => fetchFunction(),
  delete: () => {},
  deletePattern: () => {},
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
      // Verify user exists before creating review - retry if needed
      let foundUser = await UserRepository.findById(testUserId);
      if (!foundUser) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        foundUser = await UserRepository.findById(testUserId);
        if (!foundUser) {
          console.error("User not found:", testUserId);
          // Try to find directly
          const directFind = await User.findById(testUserId);
          console.error("Direct find result:", directFind ? "Found" : "Not found");
        }
      }
      expect(foundUser).toBeDefined();

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
        console.error("Review creation failed:", result.error);
        // Check if reviewer was found
        const reviewerCheck = await UserRepository.findById(testUserId);
        console.error("Reviewer check:", reviewerCheck ? "Found" : "Not found");
        if (reviewerCheck) {
          console.error("Reviewer ID:", reviewerCheck._id.toString());
        }
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

