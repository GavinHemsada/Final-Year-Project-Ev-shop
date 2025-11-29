import { Request, Response } from "express";
import { IRepairLocationService } from "./repairLocation.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the repair location controller.
 */
export interface IRepairLocationController {
  createRepairLocation(req: Request, res: Response): Promise<Response>;
  getRepairLocationsBySeller(req: Request, res: Response): Promise<Response>;
  getAllActiveLocations(req: Request, res: Response): Promise<Response>;
  getRepairLocationById(req: Request, res: Response): Promise<Response>;
  updateRepairLocation(req: Request, res: Response): Promise<Response>;
  deleteRepairLocation(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the repair location controller.
 */
export function repairLocationController(
  service: IRepairLocationService
): IRepairLocationController {
  return {
    createRepairLocation: async (req, res) => {
      try {
        const result = await service.createRepairLocation(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createRepairLocation");
      }
    },

    getRepairLocationsBySeller: async (req, res) => {
      try {
        const result = await service.getRepairLocationsBySeller(
          req.params.sellerId
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getRepairLocationsBySeller");
      }
    },

    getAllActiveLocations: async (req, res) => {
      try {
        const result = await service.getAllActiveLocations();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllActiveLocations");
      }
    },

    getRepairLocationById: async (req, res) => {
      try {
        const result = await service.getRepairLocationById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getRepairLocationById");
      }
    },

    updateRepairLocation: async (req, res) => {
      try {
        const result = await service.updateRepairLocation(
          req.params.id,
          req.body
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateRepairLocation");
      }
    },

    deleteRepairLocation: async (req, res) => {
      try {
        const result = await service.deleteRepairLocation(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteRepairLocation");
      }
    },
  };
}

