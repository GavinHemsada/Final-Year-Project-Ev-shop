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
import { reviewController, IReviewController } from "../../../src/modules/review/review.controller";
import { IReviewService } from "../../../src/modules/review/review.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("ReviewController", () => {
  let controller: IReviewController;
  let mockReviewService: jest.Mocked<IReviewService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReviewService = {
      getAllReviews: jest.fn(),
      getReviewByTargetId: jest.fn(),
      getReviewsByReviewerId: jest.fn(),
      getReviewById: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
    } as jest.Mocked<IReviewService>;

    controller = reviewController(mockReviewService);

    mockRequest = { params: {}, body: {} };
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

  describe("getAllReviews", () => {
    it("should call service.getAllReviews and return result", async () => {
      const mockResult = { success: true, reviews: [] };

      mockReviewService.getAllReviews.mockResolvedValue(mockResult);

      await controller.getAllReviews(mockRequest as Request, mockResponse as Response);

      expect(mockReviewService.getAllReviews).toHaveBeenCalled();
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getReviewByTargetId", () => {
    it("should call service.getReviewByTargetId and return result", async () => {
      const targetId = "target123";
      const mockResult = { success: true, reviews: [] };

      mockRequest.params = { targetId };
      mockReviewService.getReviewByTargetId.mockResolvedValue(mockResult);

      await controller.getReviewByTargetId(mockRequest as Request, mockResponse as Response);

      expect(mockReviewService.getReviewByTargetId).toHaveBeenCalledWith(targetId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createReview", () => {
    it("should call service.createReview and return result with 201 status", async () => {
      const reviewData = { reviewer_id: "user123", target_id: "target123", target_type: "product", order_id: "order123", rating: 5, title: "Great Product", comment: "Great!" };
      const mockResult = { success: true, review: {} };

      mockRequest.body = reviewData;
      mockReviewService.createReview.mockResolvedValue(mockResult);

      await controller.createReview(mockRequest as Request, mockResponse as Response);

      expect(mockReviewService.createReview).toHaveBeenCalledWith(reviewData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("updateReview", () => {
    it("should call service.updateReview and return result", async () => {
      const reviewId = "review123";
      const updateData = { rating: 4, comment: "Updated" };
      const mockResult = { success: true, review: {} };

      mockRequest.params = { id: reviewId };
      mockRequest.body = updateData;
      mockReviewService.updateReview.mockResolvedValue(mockResult);

      await controller.updateReview(mockRequest as Request, mockResponse as Response);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(reviewId, updateData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

