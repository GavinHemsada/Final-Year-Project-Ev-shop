import { Router } from "express";
import { container } from "../../di/container";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { SellerDTO, UpdateSellerDTO } from "../../dtos/seller.DTO";
import { ISellerController } from "./seller.controller";
import { upload } from "../../shared/utils/imageHandel";

/**
 * Factory function that creates and configures the router for seller-related endpoints.
 * It resolves the seller controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for seller management.
 */
/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Seller profile management
 */
export const sellerRouter = (): Router => {
  const router = Router();
  // Resolve the seller controller from the DI container.
  const controller = container.resolve<ISellerController>("SellerController");

  /**
   * @swagger
   * /seller:
   *   post:
   *     summary: Create a new seller profile
   *     description: Creates a new seller profile for an authenticated user. The user will be assigned the 'SELLER' role.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SellerDTO'
   *     responses:
   *       '201':
   *         description: Seller profile created successfully.
   *       '400':
   *         description: Bad request (validation error or user already has a seller profile).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/", validateDto(SellerDTO), (req, res) =>
    controller.createSeller(req, res)
  );

  /**
   * @swagger
   * /seller:
   *   get:
   *     summary: Get all sellers
   *     description: Retrieves a list of all seller profiles.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all sellers.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/", (req, res) => controller.getAllSellers(req, res));

  /**
   * @swagger
   * /seller/{id}:
   *   get:
   *     summary: Get seller by ID
   *     description: Retrieves a single seller profile by its unique ID.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller profile to retrieve.
   *     responses:
   *       '200':
   *         description: Seller profile details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:id", (req, res) => controller.getSellerById(req, res));

  /**
   * @swagger
   * /seller/user/{userId}:
   *   get:
   *     summary: Get seller by user ID
   *     description: Retrieves a seller profile by the associated user's ID.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user associated with the seller profile.
   *     responses:
   *       '200':
   *         description: Seller profile details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller profile not found for this user.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/user/:userId", (req, res) =>
    controller.getSellerByUserId(req, res)
  );


  /**
   * @swagger
   * /seller/rating/{id}:
   *   put:
   *     summary: Update seller rating and review count
   *     description: Triggers a recalculation of the seller's average rating and review count. This is typically called internally by the review service after a new review is created or deleted.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller profile to update.
   *     responses:
   *       '200':
   *         description: Seller rating updated successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/rating/:id", (req, res) =>
    controller.updateRatingAndReviewCount(req, res)
  );

  /**
   * @swagger
   * /seller/{id}:
   *   put:
   *     summary: Update a seller profile
   *     description: Updates a seller's profile information. Requires ownership or admin privileges.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller profile to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateSellerDTO'
   *     responses:
   *       '200':
   *         description: Seller profile updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/:id",
    upload.single("shop_logo"),
    validateDto(UpdateSellerDTO),
    (req, res) => controller.updateSeller(req, res)
  );

  /**
   * @swagger
   * /seller/{id}:
   *   delete:
   *     summary: Delete a seller profile
   *     description: Deletes a seller by their unique ID. Typically restricted to Admins.
   *     tags: [Sellers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller profile to delete.
   *     responses:
   *       '200':
   *         description: Seller profile deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/:id", (req, res) => controller.deleteSeller(req, res));

  return router;
};
