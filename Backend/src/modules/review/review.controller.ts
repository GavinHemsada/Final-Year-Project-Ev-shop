import { Request, Response } from "express";
import { IReviewService } from "./review.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the review controller, specifying methods for handling HTTP requests related to reviews.
 */
export interface IReviewController {
  /**
   * Handles the HTTP request to retrieve all reviews.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllReviews(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all reviews for a specific target (e.g., a seller or a product).
   * @param req - The Express request object, containing the target ID in `req.params`.
   * @param res - The Express response object.
   */
  getReviewByTargetId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all reviews for a specific listing.
   * @param req - The Express request object, containing the listing ID in `req.params`.
   * @param res - The Express response object.
   */
  getReviewbyListingId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all reviews written by a specific user.
   * @param req - The Express request object, containing the reviewer's user ID in `req.params`.
   * @param res - The Express response object.
   */
  getReviewsByReviewerId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a review by its unique ID.
   * @param req - The Express request object, containing the review ID in `req.params`.
   * @param res - The Express response object.
   */
  getReviewById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to create a new review.
   * @param req - The Express request object, containing review data in the body.
   * @param res - The Express response object.
   */
  createReview(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing review.
   * @param req - The Express request object, containing the review ID and update data.
   * @param res - The Express response object.
   */
  updateReview(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a review.
   * @param req - The Express request object, containing the review ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteReview(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the review controller.
 * It encapsulates the logic for handling API requests related to reviews.
 *
 * @param reviewService - The review service dependency that contains the business logic.
 * @returns An implementation of the IReviewController interface.
 */
export function reviewController(
  reviewService: IReviewService
): IReviewController {
  return {
    /**
     * Retrieves a list of all reviews.
     */
    getAllReviews: async (_req, res) => {
      try {
        const result = await reviewService.getAllReviews();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getting all reviews");
      }
    },
    /**
     * Retrieves all reviews for a specific target entity (e.g., seller).
     */
    getReviewByTargetId: async (req, res) => {
      try {
        const { targetId } = req.params;
        const result = await reviewService.getReviewByTargetId(targetId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getting reviews by target id");
      }
    },
    getReviewbyListingId: async (req, res) => {
      try {
        const { listingId } = req.params;
        const result = await reviewService.getReviewbyListingId(listingId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getting reviews by listing id");
      }
    },
    /**
     * Retrieves all reviews written by a specific user.
     */
    getReviewsByReviewerId: async (req, res) => {
      try {
        const { reviewerId } = req.params;
        const result = await reviewService.getReviewsByReviewerId(reviewerId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getting reviews by reviewer id");
      }
    },
    /**
     * Retrieves a single review by its unique ID.
     */
    getReviewById: async (req, res) => {
      try {
        const { id } = req.params;
        const result = await reviewService.getReviewById(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getting review by id");
      }
    },
    /**
     * Creates a new review.
     */
    createReview: async (req, res) => {
      try {
        const result = await reviewService.createReview(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating review");
      }
    },
    /**
     * Updates an existing review.
     */
    updateReview: async (req, res) => {
      try {
        const { id } = req.params;
        const result = await reviewService.updateReview(id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating review");
      }
    },
    /**
     * Deletes a review by its ID.
     */
    deleteReview: async (req, res) => {
      try {
        const { id } = req.params;
        const result = await reviewService.deleteReview(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting review");
      }
    },
  };
}
