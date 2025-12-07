import { Router } from "express";
import { container } from "../../di/container";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import {
  RepairLocationDTO,
  UpdateRepairLocationDTO,
} from "../../dtos/repairLocation.DTO";
import { IRepairLocationController } from "./repairLocation.controller";

/**
 * Factory function that creates and configures the router for repair location endpoints.
 */
export const repairLocationRouter = (): Router => {
  const router = Router();
  const controller = container.resolve<IRepairLocationController>(
    "RepairLocationController"
  );

  /**
   * @route POST /repair-location
   * Creates a new repair location.
   */
  router.post("/", validateDto(RepairLocationDTO), (req, res) =>
    controller.createRepairLocation(req, res)
  );

  /**
   * @route GET /repair-location/seller/:sellerId
   * Gets all repair locations for a specific seller.
   */
  router.get("/seller/:sellerId", (req, res) =>
    controller.getRepairLocationsBySeller(req, res)
  );

  /**
   * @route GET /repair-location/active
   * Gets all active repair locations (for buyers).
   */
  router.get("/active", (req, res) =>
    controller.getAllActiveLocations(req, res)
  );

  /**
   * @route GET /repair-location/:id
   * Gets a repair location by ID.
   */
  router.get("/:id", (req, res) => controller.getRepairLocationById(req, res));

  /**
   * @route PUT /repair-location/:id
   * Updates a repair location.
   * Middleware to remove seller_id from request body before validation
   * (seller_id should not be changed during update)
   */
  router.put(
    "/:id",
    (req, res, next) => {
      // Remove seller_id from request body as it should not be changed during update
      if (req.body && req.body.seller_id) {
        delete req.body.seller_id;
      }
      next();
    },
    validateDto(UpdateRepairLocationDTO),
    (req, res) => controller.updateRepairLocation(req, res)
  );

  /**
   * @route DELETE /repair-location/:id
   * Deletes a repair location.
   */
  router.delete("/:id", (req, res) =>
    controller.deleteRepairLocation(req, res)
  );

  return router;
};
