import { Request, Response } from "express";
import { ISavedVehicleService } from "./savedVehicle.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the saved vehicle controller, specifying methods
 * for handling HTTP requests related to saved vehicles.
 */
export interface ISavedVehicleController {
  /**
   * Handles the HTTP request to get all saved vehicles for a user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  getSavedVehicles(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to save a vehicle.
   * @param req - The Express request object, containing save data in the body.
   * @param res - The Express response object.
   */
  saveVehicle(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to remove a saved vehicle.
   * @param req - The Express request object, containing user ID and listing ID in `req.params`.
   * @param res - The Express response object.
   */
  removeSavedVehicle(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to check if a vehicle is saved.
   * @param req - The Express request object, containing user ID and listing ID in `req.params`.
   * @param res - The Express response object.
   */
  isVehicleSaved(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the saved vehicle controller.
 * It encapsulates the logic for handling API requests related to saved vehicles.
 *
 * @param service - The saved vehicle service dependency that contains the business logic.
 * @returns An implementation of the ISavedVehicleController interface.
 */
export function savedVehicleController(
  service: ISavedVehicleService
): ISavedVehicleController {
  return {
    /**
     * Retrieves all saved vehicles for a specific user.
     */
    getSavedVehicles: async (req, res) => {
      try {
        const { userId } = req.params;
        const result = await service.getSavedVehicles(userId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getSavedVehicles");
      }
    },

    /**
     * Saves a vehicle for a user.
     */
    saveVehicle: async (req, res) => {
      try {
        const result = await service.saveVehicle(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "saveVehicle");
      }
    },

    /**
     * Removes a saved vehicle.
     */
    removeSavedVehicle: async (req, res) => {
      try {
        const { userId, listingId } = req.params;
        const result = await service.removeSavedVehicle(userId, listingId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "removeSavedVehicle");
      }
    },

    /**
     * Checks if a vehicle is saved by a user.
     */
    isVehicleSaved: async (req, res) => {
      try {
        const { userId, listingId } = req.params;
        const result = await service.isVehicleSaved(userId, listingId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "isVehicleSaved");
      }
    },
  };
}

