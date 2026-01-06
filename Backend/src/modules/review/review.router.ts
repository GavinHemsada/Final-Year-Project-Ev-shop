import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { Router } from "express";
import { IReviewController } from "./review.controller";
import { ReviewDTO } from "../../dtos/review.DTO";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for review-related endpoints.
 * It resolves the review controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for review management.
 */
/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review and rating management
 */
export const reviewRouter = (): Router => {
  const router = Router();
  // Resolve the review controller from the DI container.
  const reviewController =
    container.resolve<IReviewController>("ReviewController");

  /**
   * @swagger
   * /review/reviews:
   *   get:
   *     summary: Get all reviews
   *     description: Retrieves a list of all reviews. (Typically restricted to Admins)
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all reviews.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.get(
    "/reviews",
    (
      req,
      res // Note: Path is /review/reviews due to app.ts prefix
    ) => reviewController.getAllReviews(req, res)
  );

  /**
   * @swagger
   * /review/reviews/target/{targetId}:
   *   get:
   *     summary: Get reviews by target ID
   *     description: Retrieves all reviews for a specific target entity (e.g., a seller or product).
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: targetId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the target entity (e.g., seller ID, product ID).
   *     responses:
   *       '200':
   *         description: A list of reviews for the specified target.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Target not found or no reviews found.
   *       '500':
   *         description: Internal server error.
   */
  router.get(
    "/reviews/target/:targetId",
    (
      req,
      res // Note: Path is /review/reviews/target/:targetId
    ) => reviewController.getReviewByTargetId(req, res)
  );
  router.get(
    "/reviews/listing/:listingId",
    (
      req,
      res // Note: Path is /review/reviews/listing/:listingId
    ) => reviewController.getReviewbyListingId(req, res)
  );
  /**
   * @swagger
   * /review/reviews/reviewer/{reviewerId}:
   *   get:
   *     summary: Get reviews by reviewer ID
   *     description: Retrieves all reviews written by a specific user.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reviewerId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user who wrote the reviews.
   *     responses:
   *       '200':
   *         description: A list of reviews written by the user.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Reviewer not found or no reviews found.
   *       '500':
   *         description: Internal server error.
   */
  router.get(
    "/reviews/reviewer/:reviewerId",
    (
      req,
      res // Note: Path is /review/reviews/reviewer/:reviewerId
    ) => reviewController.getReviewsByReviewerId(req, res)
  );

  /**
   * @swagger
   * /review/review/{id}:
   *   get:
   *     summary: Get review by ID
   *     description: Retrieves a single review by its unique ID.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the review to retrieve.
   *     responses:
   *       '200':
   *         description: Review details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Review not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get(
    "/review/:id",
    (
      req,
      res // Note: Path is /review/review/:id
    ) => reviewController.getReviewById(req, res)
  );

  /**
   * @swagger
   * /review/review:
   *   post:
   *     summary: Create a new review
   *     description: Creates a new review. Requires user authentication.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReviewDTO'
   *     responses:
   *       '201':
   *         description: Review created successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/review",
    validateDto(ReviewDTO),
    (
      req,
      res // Note: Path is /review/review
    ) => reviewController.createReview(req, res)
  );

  /**
   * @swagger
   * /review/review/{id}:
   *   put:
   *     summary: Update a review
   *     description: Updates an existing review. Requires ownership or admin privileges.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the review to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReviewDTO'
   *     responses:
   *       '200':
   *         description: Review updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Review not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/review/:id",
    validateDto(ReviewDTO),
    (
      req,
      res // Note: Path is /review/review/:id
    ) => reviewController.updateReview(req, res)
  );

  /**
   * @swagger
   * /review/review/{id}:
   *   delete:
   *     summary: Delete a review
   *     description: Deletes a review by its unique ID. Requires ownership or admin privileges.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the review to delete.
   *     responses:
   *       '200':
   *         description: Review deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Review not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete(
    "/review/:id",
    (
      req,
      res // Note: Path is /review/review/:id
    ) => reviewController.deleteReview(req, res)
  );
  return router;
};
