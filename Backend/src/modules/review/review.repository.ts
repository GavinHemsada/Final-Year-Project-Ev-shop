import { IReview, Review } from "../../entities/Review";
import { ReviewDTO } from "../../dtos/review.DTO";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the review repository, specifying the methods for data access operations related to reviews.
 */
export interface IReviewRepository {
  /**
   * Retrieves all reviews for a specific target entity (e.g., a seller or product).
   * @param targetId - The ID of the target entity.
   * @returns A promise that resolves to an array of review documents or null.
   */
  getReviewByTargetId(targetId: string): Promise<IReview[] | null>;
  /**
   * Retrieves all reviews written by a specific user.
   * @param reviewerId - The ID of the user who wrote the reviews.
   * @returns A promise that resolves to an array of review documents or null.
   */
  getReviewsByReviewerId(reviewerId: string): Promise<IReview[] | null>;
  /**
   * Finds a review by its unique ID.
   * @param id - The ID of the review to find.
   * @returns A promise that resolves to the review document or null if not found.
   */
  getReviewById(id: string): Promise<IReview | null>;
  /**
   * Creates a new review.
   * @param reviewData - The DTO containing the details for the new review.
   * @returns A promise that resolves to the created review document or null.
   */
  createReview(reviewData: ReviewDTO): Promise<IReview | null>;
  /**
   * Retrieves all reviews from the database.
   * @returns A promise that resolves to an array of all review documents or null.
   */
  getAllReviews(): Promise<IReview[] | null>;
  /**
   * Updates an existing review.
   * @param id - The ID of the review to update.
   * @param reviewData - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated review document or null.
   */
  updateReview(
    id: string,
    reviewData: Partial<ReviewDTO>
  ): Promise<IReview | null>;
  /**
   * Deletes a review by its unique ID.
   * @param id - The ID of the review to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteReview(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IReviewRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const ReviewRepository: IReviewRepository = {
  /** Retrieves all reviews, populating associated order and reviewer details. */
  getAllReviews: withErrorHandling(async () => {
    return await Review.find()
      .populate("reviewer_id", "name profile_image")
      .populate("target_id", "business_name shop_logo")
      .populate({
        path: "order_id",
        select: "listing_id",
        populate: {
          path: "listing_id",
          select: "_id model_id",
          populate: {
            path: "model_id",
            select: "model_name",
          },
        },
      });
  }),
  /** Retrieves all reviews for a specific target, populating reviewer details. */
  getReviewByTargetId: withErrorHandling(async (targetId) => {
    return await Review.find({ target_id: targetId })
      .populate("reviewer_id", "name profile_image")
      .populate("target_id", "business_name shop_logo")
      .populate({
        path: "order_id",
        select: "listing_id",
        populate: {
          path: "listing_id",
          select: "_id model_id",
          populate: {
            path: "model_id",
            select: "model_name",
          },
        },
      });
  }),
  /** Retrieves all reviews written by a specific user. */
  getReviewsByReviewerId: withErrorHandling(async (reviewerId) => {
    return await Review.find({ reviewer_id: reviewerId })
      .populate("reviewer_id", "name profile_image")
      .populate("target_id", "business_name shop_logo")
      .populate({
        path: "order_id",
        select: "listing_id",
        populate: {
          path: "listing_id",
          select: "_id model_id",
          populate: {
            path: "model_id",
            select: "model_name",
          },
        },
      });
  }),
  /** Finds a single review by its document ID. */
  getReviewById: withErrorHandling(async (id) => {
    return await Review.findById(id)
      .populate("reviewer_id", "name profile_image")
      .populate("target_id", "business_name shop_logo")
      .populate({
        path: "order_id",
        select: "listing_id",
        populate: {
          path: "listing_id",
          select: "_id model_id",
          populate: {
            path: "model_id",
            select: "model_name",
          },
        },
      });
  }),
  /** Creates a new Review document. */
  createReview: withErrorHandling(async (reviewData) => {
    const review = new Review(reviewData);
    return await review.save();
  }),
  /** Finds a review by ID and updates it with new data. */
  updateReview: withErrorHandling(async (id, reviewData) => {
    return await Review.findByIdAndUpdate(id, reviewData, { new: true });
  }),
  /** Deletes a review by its document ID. */
  deleteReview: withErrorHandling(async (id) => {
    const result = await Review.findByIdAndDelete(id);
    return result !== null;
  }),
};
