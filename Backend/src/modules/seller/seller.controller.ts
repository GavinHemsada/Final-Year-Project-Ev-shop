import { Request, Response } from "express";
import { ISellerService } from "../../modules/seller/seller.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the seller controller, specifying methods for handling HTTP requests related to sellers.
 */
export interface ISellerController {
  /**
   * Handles the HTTP request to create a new seller profile.
   * @param req - The Express request object, containing seller data in the body.
   * @param res - The Express response object.
   */
  createSeller(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a seller by their unique ID.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  getSellerById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a seller profile associated with a user ID.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  getSellerByUserId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all sellers.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllSellers(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update a seller's information.
   * @param req - The Express request object, containing the seller ID and update data.
   * @param res - The Express response object.
   */
  updateSeller(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to recalculate and update a seller's average rating and review count.
   * This is typically called after a new review is added or deleted.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  updateRatingAndReviewCount(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a seller profile.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteSeller(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the seller controller.
 * It encapsulates the logic for handling API requests related to sellers.
 *
 * @param service - The seller service dependency that contains the business logic.
 * @returns An implementation of the ISellerController interface.
 */
export function sellerController(service: ISellerService): ISellerController {
  return {
    /**
     * Creates a new seller profile.
     */
    createSeller: async (req, res) => {
      try {
        const result = await service.createSeller(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createSeller");
      }
    },

    /**
     * Retrieves a single seller by their ID.
     */
    getSellerById: async (req, res) => {
      try {
        const result = await service.getSellerById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getSellerById");
      }
    },

    /**
     * Retrieves a seller profile by the associated user's ID.
     */
    getSellerByUserId: async (req, res) => {
      try {
        const result = await service.getSellerByUserId(req.params.userId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getSellerByUserId");
      }
    },

    /**
     * Retrieves a list of all sellers.
     */
    getAllSellers: async (_req, res) => {
      try {
        const result = await service.getAllSellers();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllSellers");
      }
    },

    /**
     * Updates an existing seller's profile data.
     */
    updateSeller: async (req, res) => {
      try {
        const file = req.file;
        const result = await service.updateSeller(
          req.params.id,
          req.body,
          file
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateSeller");
      }
    },
    /**
     * Triggers a service-side update of the seller's rating and review count.
     */
    updateRatingAndReviewCount: async (req, res) => {
      try {
        const result = await service.updateRatingAndReviewCount(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateRatingAndReviewCount");
      }
    },
    /**
     * Deletes a seller by their ID.
     */
    deleteSeller: async (req, res) => {
      try {
        const result = await service.deleteSeller(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteSeller");
      }
    },
  };
}
