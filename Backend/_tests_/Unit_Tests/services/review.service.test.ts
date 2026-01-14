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
import { reviewService, IReviewService } from "../../../src/modules/review/review.service";
import { IReviewRepository } from "../../../src/modules/review/review.repository";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import { ReviewDTO } from "../../../src/dtos/review.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe("ReviewService", () => {
  let service: IReviewService;
  let mockReviewRepo: jest.Mocked<IReviewRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReviewRepo = {
      getAllReviews: jest.fn(),
      getReviewbyListingId: jest.fn(),
      getReviewByTargetId: jest.fn(),
      getReviewsByReviewerId: jest.fn(),
      getReviewById: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
    } as jest.Mocked<IReviewRepository>;

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    service = reviewService(mockReviewRepo, mockUserRepo);

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

  describe("getAllReviews", () => {
    it("should return all reviews", async () => {
      const mockReviews = [
        { _id: new Types.ObjectId(), rating: 5, comment: "Great!" },
        { _id: new Types.ObjectId(), rating: 4, comment: "Good" },
      ];

      mockReviewRepo.getAllReviews.mockResolvedValue(mockReviews as any);

      const result = await service.getAllReviews();

      expect(result.success).toBe(true);
      expect(result.reviews).toEqual(mockReviews);
    });
  });

  describe("getReviewByTargetId", () => {
    it("should return reviews for a target", async () => {
      const targetId = new Types.ObjectId().toString();
      const mockReviews = [
        { _id: new Types.ObjectId(), target_id: new Types.ObjectId(targetId), rating: 5 },
      ];

      mockReviewRepo.getReviewByTargetId.mockResolvedValue(mockReviews as any);

      const result = await service.getReviewByTargetId(targetId);

      expect(result.success).toBe(true);
      expect(result.reviews).toEqual(mockReviews);
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const userId = new Types.ObjectId().toString();
      const reviewData: ReviewDTO = {
        reviewer_id: userId,
        target_id: new Types.ObjectId().toString(),
        target_type: "product",
        order_id: new Types.ObjectId().toString(),
        rating: 5,
        title: "Great Product",
        comment: "Excellent product",
      };
      const mockUser = { _id: new Types.ObjectId(userId) };
      const mockReview = { _id: new Types.ObjectId(), ...reviewData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockReviewRepo.createReview.mockResolvedValue(mockReview as any);

      const result = await service.createReview(reviewData);

      expect(result.success).toBe(true);
      expect(result.review).toEqual(mockReview);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if reviewer not found", async () => {
      const reviewData: ReviewDTO = {
        reviewer_id: new Types.ObjectId().toString(),
        target_id: new Types.ObjectId().toString(),
        target_type: "product",
        order_id: new Types.ObjectId().toString(),
        rating: 5,
        title: "Excellent Product",
        comment: "Excellent",
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createReview(reviewData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Reviewer not found");
    });
  });

  describe("updateReview", () => {
    it("should update review successfully", async () => {
      const reviewId = new Types.ObjectId().toString();
      const updateData: Partial<ReviewDTO> = { rating: 4, comment: "Updated comment" };
      const mockReview = { _id: new Types.ObjectId(reviewId), ...updateData };

      mockReviewRepo.getReviewById.mockResolvedValue(mockReview as any);
      mockReviewRepo.updateReview.mockResolvedValue(mockReview as any);

      const result = await service.updateReview(reviewId, updateData);

      expect(result.success).toBe(true);
      expect(result.review).toEqual(mockReview);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });

  describe("deleteReview", () => {
    it("should delete review successfully", async () => {
      const reviewId = new Types.ObjectId().toString();
      const targetId = new Types.ObjectId().toString();
      const reviewerId = new Types.ObjectId().toString();
      const mockReview = {
        _id: new Types.ObjectId(reviewId),
        target_id: new Types.ObjectId(targetId),
        reviewer_id: new Types.ObjectId(reviewerId),
      };

      mockReviewRepo.getReviewById.mockResolvedValue(mockReview as any);
      mockReviewRepo.deleteReview.mockResolvedValue(true);

      const result = await service.deleteReview(reviewId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });
});

