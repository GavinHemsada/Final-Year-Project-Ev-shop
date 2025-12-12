import { Request, Response } from "express";
import { IEvService } from "./ev.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the EV controller, specifying methods for handling HTTP requests
 * related to EV Brands, Categories, Models, and Listings.
 */
export interface IEvController {
  // Brand
  /**
   * Handles the HTTP request to create a new EV brand.
   * @param req - The Express request object, containing brand data and an image file.
   * @param res - The Express response object.
   */
  createBrand(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all EV brands.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllBrands(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an EV brand by its unique ID.
   * @param req - The Express request object, containing the brand ID in `req.params`.
   * @param res - The Express response object.
   */
  getById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing EV brand.
   * @param req - The Express request object, containing the brand ID, update data, and an optional new image file.
   * @param res - The Express response object.
   */
  updateBrand(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete an EV brand.
   * @param req - The Express request object, containing the brand ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteBrand(req: Request, res: Response): Promise<Response>;

  // Category
  /**
   * Handles the HTTP request to create a new EV category.
   * @param req - The Express request object, containing category data in the body.
   * @param res - The Express response object.
   */
  createCategory(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all EV categories.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllCategories(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an EV category by its unique ID.
   * @param req - The Express request object, containing the category ID in `req.params`.
   * @param res - The Express response object.
   */
  getCategoryByid(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing EV category.
   * @param req - The Express request object, containing the category ID and update data.
   * @param res - The Express response object.
   */
  updateCategory(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete an EV category.
   * @param req - The Express request object, containing the category ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteCategory(req: Request, res: Response): Promise<Response>;

  // Model
  /**
   * Handles the HTTP request to create a new EV model.
   * @param req - The Express request object, containing model data and image files.
   * @param res - The Express response object.
   */
  createModel(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all EV models.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllModels(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an EV model by its unique ID.
   * @param req - The Express request object, containing the model ID in `req.params`.
   * @param res - The Express response object.
   */
  getModelById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing EV model.
   * @param req - The Express request object, containing the model ID, update data, and optional new image files.
   * @param res - The Express response object.
   */
  updateModel(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete an EV model.
   * @param req - The Express request object, containing the model ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteModel(req: Request, res: Response): Promise<Response>;

  // Listing
  /**
   * Handles the HTTP request to create a new EV listing for sale.
   * @param req - The Express request object, containing listing data and image files.
   * @param res - The Express response object.
   */
  createListing(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all EV listings, with optional filtering.
   * @param req - The Express request object, which can contain query parameters for filtering.
   * @param res - The Express response object.
   */
  getAllListings(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an EV listing by its unique ID.
   * @param req - The Express request object, containing the listing ID in `req.params`.
   * @param res - The Express response object.
   */
  getListingById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all listings for a specific seller.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  getListingsBySeller(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing EV listing.
   * @param req - The Express request object, containing the listing ID, update data, and optional new image files.
   * @param res - The Express response object.
   */
  updateListing(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to quickly update listing status and/or quantity.
   * @param req - The Express request object, containing the listing ID and update data.
   * @param res - The Express response object.
   */
  quickUpdateListing(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete an EV listing.
   * @param req - The Express request object, containing the listing ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteListing(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the EV controller.
 * It encapsulates the logic for handling API requests related to EV brands, categories, models, and listings.
 *
 * @param service - The EV service dependency that contains the business logic.
 * @returns An implementation of the IEvController interface.
 */
export function evController(service: IEvService): IEvController {
  return {
    // Brand
    /**
     * Creates a new EV brand, including handling the brand logo upload.
     */
    createBrand: async (req, res) => {
      try {
        const file = req.file;
        const r = await service.createBrand(req.body, file!);
        return handleResult(res, r, 201);
      } catch (e) {
        return handleError(res, e, "createBrand");
      }
    },
    /**
     * Retrieves a list of all EV brands.
     */
    getAllBrands: async (req, res) => {
      try {
        const r = await service.getAllBrands();
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getAllBrands");
      }
    },
    /**
     * Retrieves a single EV brand by its ID.
     */
    getById: async (req, res) => {
      try {
        const r = await service.getById(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getById");
      }
    },
    /**
     * Updates an existing EV brand's data and/or logo.
     */
    updateBrand: async (req, res) => {
      try {
        const file = req.file;
        const r = await service.updateBrand(req.params.id, req.body, file!);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "updateBrand");
      }
    },
    /**
     * Deletes an EV brand by its ID.
     */
    deleteBrand: async (req, res) => {
      try {
        const r = await service.deleteBrand(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "deleteBrand");
      }
    },

    // Category
    /**
     * Creates a new EV category.
     */
    createCategory: async (req, res) => {
      try {
        const r = await service.createCategory(req.body);
        return handleResult(res, r, 201);
      } catch (e) {
        return handleError(res, e, "createCategory");
      }
    },
    /**
     * Retrieves a list of all EV categories.
     */
    getAllCategories: async (req, res) => {
      try {
        const r = await service.getAllCategories();
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getAllCategories");
      }
    },
    /**
     * Retrieves a single EV category by its ID.
     */
    getCategoryByid: async (req, res) => {
      try {
        const r = await service.getCategoryByid(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getCategoryByid");
      }
    },
    /**
     * Updates an existing EV category.
     */
    updateCategory: async (req, res) => {
      try {
        const r = await service.updateCategory(req.params.id, req.body);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "updateCategory");
      }
    },
    /**
     * Deletes an EV category by its ID.
     */
    deleteCategory: async (req, res) => {
      try {
        const r = await service.deleteCategory(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "deleteCategory");
      }
    },

    // Model
    /**
     * Creates a new EV model, including handling image uploads.
     */
    createModel: async (req, res) => {
      try {
        const r = await service.createModel(req.body);
        return handleResult(res, r, 201);
      } catch (e) {
        return handleError(res, e, "createModel");
      }
    },
    /**
     * Retrieves a list of all EV models.
     */
    getAllModels: async (req, res) => {
      try {
        const r = await service.getAllModels();
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getAllModels");
      }
    },
    /**
     * Retrieves a single EV model by its ID.
     */
    getModelById: async (req, res) => {
      try {
        const r = await service.getModelById(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "getModelById");
      }
    },
    /**
     * Updates an existing EV model's data and/or images.
     */
    updateModel: async (req, res) => {
      try {
        const r = await service.updateModel(req.params.id, req.body);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "updateModel");
      }
    },
    /**
     * Deletes an EV model by its ID.
     */
    deleteModel: async (req, res) => {
      try {
        const r = await service.deleteModel(req.params.id);
        return handleResult(res, r);
      } catch (e) {
        return handleError(res, e, "deleteModel");
      }
    },

    // Listing
    /**
     * Creates a new EV listing for sale, including handling image uploads.
     */
    createListing: async (req, res) => {
      try {
        const file = req.files as Express.Multer.File[];
        const result = await service.createListing(req.body, file);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createListing");
      }
    },
    /**
     * Retrieves a list of all EV listings, with support for query-based filtering.
     */
    getAllListings: async (req, res) => {
      try {
        const { page, limit, search, filter } = req.query;

        const result = await service.getAllListings({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          search: typeof search === "string" ? search : "",
          filter: typeof filter === "string" ? filter : "",
        });

        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllListings");
      }
    },
    /**
     * Retrieves a single EV listing by its ID.
     */
    getListingById: async (req, res) => {
      try {
        const result = await service.getListingById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getListingById");
      }
    },
    /**
     * Retrieves all EV listings created by a specific seller.
     */
    getListingsBySeller: async (req, res) => {
      try {
        const result = await service.getListingsBySeller(req.params.sellerId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getListingsBySeller");
      }
    },
    /**
     * Updates an existing EV listing's data and/or images.
     */
    updateListing: async (req, res) => {
      try {
        const file = req.files as Express.Multer.File[];
        const result = await service.updateListing(
          req.params.id,
          req.body,
          file
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateListing");
      }
    },
    /**
     * Quickly updates listing status and/or quantity.
     */
    quickUpdateListing: async (req, res) => {
      try {
        const result = await service.quickUpdateListing(
          req.params.id,
          req.body
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "quickUpdateListing");
      }
    },
    /**
     * Deletes an EV listing by its ID.
     */
    deleteListing: async (req, res) => {
      try {
        const result = await service.deleteListing(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteListing");
      }
    },
  };
}
