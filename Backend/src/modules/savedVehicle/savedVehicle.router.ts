import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { SaveVehicleDTO } from "../../dtos/savedVehicle.DTO";
import { ISavedVehicleController } from "./savedVehicle.controller";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for saved vehicle-related endpoints.
 * It resolves the saved vehicle controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for saved vehicles.
 */
/**
 * @swagger
 * tags:
 *   name: SavedVehicles
 *   description: Saved vehicles (wishlist) management
 */
export const savedVehicleRouter = (): Router => {
  const router = Router();
  // Resolve the saved vehicle controller from the DI container.
  const controller =
    container.resolve<ISavedVehicleController>("SavedVehicleController");

  /**
   * @swagger
   * /saved-vehicle/{userId}:
   *   get:
   *     summary: Get user's saved vehicles
   *     description: Retrieves all saved vehicles for a specific user.
   *     tags: [SavedVehicles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose saved vehicles are to be retrieved.
   *     responses:
   *       '200':
   *         description: An array of saved vehicles.
   *       '401':
   *         description: Unauthorized
   *       '500':
   *         description: Internal server error
   */
  router.get("/:userId", (req, res) =>
    controller.getSavedVehicles(req, res)
  );

  /**
   * @swagger
   * /saved-vehicle:
   *   post:
   *     summary: Save a vehicle
   *     description: Saves a vehicle listing for a user (adds to wishlist).
   *     tags: [SavedVehicles]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SaveVehicleDTO'
   *     responses:
   *       '201':
   *         description: Vehicle saved successfully.
   *       '400':
   *         description: Bad request (validation error)
   *       '401':
   *         description: Unauthorized
   *       '500':
   *         description: Internal server error
   */
  router.post("/", validateDto(SaveVehicleDTO), (req, res) =>
    controller.saveVehicle(req, res)
  );

  /**
   * @swagger
   * /saved-vehicle/{userId}/{listingId}:
   *   delete:
   *     summary: Remove saved vehicle
   *     description: Removes a vehicle from the user's saved vehicles list.
   *     tags: [SavedVehicles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user.
   *       - in: path
   *         name: listingId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the vehicle listing to remove.
   *     responses:
   *       '200':
   *         description: Vehicle removed successfully.
   *       '401':
   *         description: Unauthorized
   *       '404':
   *         description: Saved vehicle not found
   *       '500':
   *         description: Internal server error
   */
  router.delete("/:userId/:listingId", (req, res) =>
    controller.removeSavedVehicle(req, res)
  );

  /**
   * @swagger
   * /saved-vehicle/{userId}/{listingId}/check:
   *   get:
   *     summary: Check if vehicle is saved
   *     description: Checks if a specific vehicle is saved by a user.
   *     tags: [SavedVehicles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user.
   *       - in: path
   *         name: listingId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the vehicle listing to check.
   *     responses:
   *       '200':
   *         description: Check result indicating if the vehicle is saved.
   *       '401':
   *         description: Unauthorized
   *       '500':
   *         description: Internal server error
   */
  router.get("/:userId/:listingId/check", (req, res) =>
    controller.isVehicleSaved(req, res)
  );

  return router;
};

