import { IReviewRepository } from "./review.repository";
import { ReviewDTO } from "../../dtos/review.DTO";
import { IUserRepository } from "../user/user.repository";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the review service, outlining the methods for managing reviews.
 */
export interface IReviewService {
  /**
   * Retrieves all reviews from the system.
   * @returns A promise that resolves to an object containing an array of all reviews or an error.
   */
  getAllReviews(): Promise<{
    success: boolean;
    reviews?: any[];
    error?: string;
  }>;
  /**
   * Retrieves all reviews for a specific target entity (e.g., a product or seller).
   * @param targetId - The ID of the target entity.
   * @returns A promise that resolves to an object containing an array of reviews or an error.
   */
  getReviewByTargetId(
    targetId: string
  ): Promise<{ success: boolean; reviews?: any[]; error?: string }>;
  /**
   * Retrieves all reviews written by a specific user.
   * @param reviewerId - The ID of the user who wrote the reviews.
   * @returns A promise that resolves to an object containing an array of reviews or an error.
   */
  getReviewsByReviewerId(
    reviewerId: string
  ): Promise<{ success: boolean; reviews?: any[]; error?: string }>;
  /**
   * Finds a single review by its unique ID.
   * @param id - The ID of the review to find.
   * @returns A promise that resolves to an object containing the review data or an error.
   */
  getReviewById(
    id: string
  ): Promise<{ success: boolean; review?: any; error?: string }>;
  /**
   * Creates a new review.
   * @param reviewData - The data for the new review.
   * @returns A promise that resolves to an object containing the created review or an error.
   */
  createReview(
    reviewData: ReviewDTO
  ): Promise<{ success: boolean; review?: any; error?: string }>;
  /**
   * Updates an existing review.
   * @param id - The ID of the review to update.
   * @param reviewData - The partial data to update the review with.
   * @returns A promise that resolves to an object containing the updated review data or an error.
   */
  updateReview(
    id: string,
    reviewData: Partial<ReviewDTO>
  ): Promise<{ success: boolean; review?: any; error?: string }>;
  /**
   * Deletes a review by its unique ID.
   * @param id - The ID of the review to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteReview(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the review service.
 * It encapsulates the business logic for managing reviews, including caching strategies
 * to improve performance.
 *
 * @param reviewRepo - The repository for review data access.
 * @param userRepo - The repository for user data access.
 * @returns An implementation of the IReviewService interface.
 */
export function reviewService(
  reviewRepo: IReviewRepository,
  userRepo: IUserRepository
): IReviewService {
  return {
    /**
     * Retrieves all reviews, utilizing a cache-aside pattern.
     * Caches the list of all reviews for one hour.
     */
    getAllReviews: async () => {
      try {
        const cacheKey = "reviews";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const reviews = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const allReviews = await reviewRepo.getAllReviews();
            return allReviews ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!reviews) return { success: false, error: "No reviews found" };
        return { success: true, reviews };
      } catch (err) {
        return { success: false, error: "Failed to fetch reviews" };
      }
    },

    /**
     * Finds all reviews for a specific target (e.g., product, seller), using a cache-aside pattern.
     * Caches the list of reviews for that target for one hour.
     */
    getReviewByTargetId: async (targetId: string) => {
      try {
        const cacheKey = `reviews_target_${targetId}`;
        const reviews = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const targetReviews = await reviewRepo.getReviewByTargetId(
              targetId
            );
            return targetReviews ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!reviews)
          return { success: false, error: "No reviews found for the target" };
        return { success: true, reviews };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch reviews for the target",
        };
      }
    },
    /**
     * Finds all reviews written by a specific user, using a cache-aside pattern.
     * Caches the list of reviews for that user for one hour.
     */
    getReviewsByReviewerId: async (reviewerId: string) => {
      try {
        const cacheKey = `reviews_reviewer_${reviewerId}`;
        const reviews = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const reviewerReviews = await reviewRepo.getReviewsByReviewerId(
              reviewerId
            );
            return reviewerReviews ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!reviews)
          return { success: false, error: "No reviews found by the reviewer" };
        return { success: true, reviews };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch reviews by the reviewer",
        };
      }
    },
    /**
     * Finds a single review by its ID, using a cache-aside pattern.
     * Caches the individual review data for one hour.
     */
    getReviewById: async (id: string) => {
      try {
        const cacheKey = `reviews_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const review = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const singleReview = await reviewRepo.getReviewById(id);
            return singleReview ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!review) return { success: false, error: "Review not found" };
        return { success: true, review };
      } catch (err) {
        return { success: false, error: "Failed to fetch review" };
      }
    },
    /**
     * Creates a new review after validating the reviewer exists.
     * It invalidates all relevant review caches to ensure data consistency.
     */
    createReview: async (reviewData: ReviewDTO) => {
      try {
        const reviewer = await userRepo.findById(reviewData.reviewer_id);
        if (!reviewer) return { success: false, error: "Reviewer not found" };
        const review = await reviewRepo.createReview(reviewData);

        // Invalidate caches for the general list, the target, and the reviewer.
        await Promise.all([
          CacheService.delete("reviews"),
          CacheService.delete(`reviews_target_${reviewData.target_id}`),
          CacheService.delete(`reviews_reviewer_${reviewData.reviewer_id}`),
        ]);

        return { success: true, review };
      } catch (err) {
        return { success: false, error: "Failed to create review" };
      }
    },
    /**
     * Updates an existing review.
     * It invalidates all caches related to this review upon successful update.
     */
    updateReview: async (id: string, reviewData: Partial<ReviewDTO>) => {
      try {
        // Fetch the existing review to get its IDs for cache invalidation.
        const existingReview = await reviewRepo.getReviewById(id);
        if (!existingReview)
          return { success: false, error: "Review not found" };

        const review = await reviewRepo.updateReview(id, reviewData);
        if (!review) return { success: false, error: "Review not found" };

        // Invalidate all caches this review might be a part of.
        await Promise.all([
          CacheService.delete(`reviews_${id}`),
          CacheService.delete("reviews"),
          CacheService.delete(`reviews_target_${existingReview.target_id}`),
          CacheService.delete(`reviews_reviewer_${existingReview.reviewer_id}`),
          CacheService.deletePattern(`reviews_*`),
        ]);

        return { success: true, review };
      } catch (err) {
        return { success: false, error: "Failed to update review" };
      }
    },
    /**
     * Deletes a review from the system.
     * It invalidates all caches related to this review before deletion.
     */
    deleteReview: async (id: string) => {
      try {
        // Fetch the existing review to get its IDs for cache invalidation.
        const existingReview = await reviewRepo.getReviewById(id);
        if (!existingReview)
          return { success: false, error: "Review not found" };

        const success = await reviewRepo.deleteReview(id);
        if (!success) return { success: false, error: "Review not found" };

        // Invalidate all caches this review might be a part of.
        await Promise.all([
          CacheService.delete(`reviews_${id}`),
          CacheService.delete("reviews"),
          CacheService.delete(`reviews_target_${existingReview.target_id}`),
          CacheService.delete(`reviews_reviewer_${existingReview.reviewer_id}`),
          CacheService.deletePattern(`reviews_*`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete review" };
      }
    },
  };
}
