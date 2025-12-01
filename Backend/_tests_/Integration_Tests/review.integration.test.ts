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
import { UserRole } from "../../src/shared/enum/enum";

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
    testTargetId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Review Operations", () => {
    it("should create a new review", async () => {
      const reviewData = {
        reviewer_id: testUserId,
        target_id: testTargetId,
        target_type: "seller",
        rating: 5,
        title: "Great Service",
        comment: "Excellent experience",
        order_id: new Types.ObjectId().toString(),
      };

      jest.spyOn(reviewRepo, "createReview").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...reviewData,
      } as any);

      const result = await service.createReview(reviewData);

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review?.rating).toBe(reviewData.rating);
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

