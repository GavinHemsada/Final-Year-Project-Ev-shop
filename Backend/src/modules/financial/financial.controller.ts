import { Request, Response } from "express";
import { IFinancialService } from "./financial.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the financial controller, specifying methods for handling HTTP requests
 * related to financial institutions, products, and applications.
 */
export interface IFinancialController {
  // Institution
  /**
   * Handles the HTTP request to create a new financial institution.
   * @param req - The Express request object, containing institution data in the body.
   * @param res - The Express response object.
   */
  createInstitution(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an institution by its unique ID.
   * @param req - The Express request object, containing the institution ID in `req.params`.
   * @param res - The Express response object.
   */
  getInstitution(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to find an institution by a user's ID.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  findInstitutionByUserId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all financial institutions.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllInstitutions(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing financial institution.
   * @param req - The Express request object, containing the institution ID and update data.
   * @param res - The Express response object.
   */
  updateInstitution(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a financial institution.
   * @param req - The Express request object, containing the institution ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteInstitution(req: Request, res: Response): Promise<Response>;

  // Product
  /**
   * Handles the HTTP request to create a new financial product.
   * @param req - The Express request object, containing product data in the body.
   * @param res - The Express response object.
   */
  createProduct(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a financial product by its unique ID.
   * @param req - The Express request object, containing the product ID in `req.params`.
   * @param res - The Express response object.
   */
  getProduct(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all financial products.
   * @param req - The Express request object, can contain an `activeOnly` query param.
   * @param res - The Express response object.
   */
  getAllProducts(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all products for a specific institution.
   * @param req - The Express request object, containing the institution ID in `req.params`.
   * @param res - The Express response object.
   */
  getProductsByInstitution(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing financial product.
   * @param req - The Express request object, containing the product ID and update data.
   * @param res - The Express response object.
   */
  updateProduct(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a financial product.
   * @param req - The Express request object, containing the product ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteProduct(req: Request, res: Response): Promise<Response>;

  // Application
  /**
   * Handles the HTTP request to create a new finance application.
   * @param req - The Express request object, containing application data and supporting documents.
   * @param res - The Express response object.
   */
  createApplication(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a finance application by its unique ID.
   * @param req - The Express request object, containing the application ID in `req.params`.
   * @param res - The Express response object.
   */
  getApplication(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all applications submitted by a specific user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  getApplicationsByUser(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all applications for a specific financial product.
   * @param req - The Express request object, containing the product ID in `req.params`.
   * @param res - The Express response object.
   */
  getApplicationsByProduct(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update the status of a finance application.
   * @param req - The Express request object, containing the application ID and new status.
   * @param res - The Express response object.
   */
  updateApplicationStatus(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update the details of a finance application.
   * @param req - The Express request object, containing the application ID and update data.
   * @param res - The Express response object.
   */
  updateApplication(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a finance application.
   * @param req - The Express request object, containing the application ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteApplication(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the financial controller.
 * It encapsulates the logic for handling API requests related to financial services.
 *
 * @param service - The financial service dependency that contains the business logic.
 * @returns An implementation of the IFinancialController interface.
 */
export function financialController(
  service: IFinancialService
): IFinancialController {
  return {
    // Institution
    /**
     * Creates a new financial institution.
     */
    createInstitution: async (req, res) => {
      try {
        const result = await service.createInstitution(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createInstitution");
      }
    },
    /**
     * Retrieves a single financial institution by its ID.
     */
    getInstitution: async (req, res) => {
      try {
        const result = await service.getInstitutionById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getInstitution");
      }
    },
    findInstitutionByUserId: async (req, res) => {
      try {
        const result = await service.findInstitutionByUserId(req.params.userId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "findInstitutionByUserId");
      }
    },
    /**
     * Retrieves a list of all financial institutions.
     */
    getAllInstitutions: async (_req, res) => {
      try {
        const result = await service.getAllInstitutions();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllInstitutions");
      }
    },
    /**
     * Updates an existing financial institution.
     */
    updateInstitution: async (req, res) => {
      try {
        const result = await service.updateInstitution(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateInstitution");
      }
    },
    /**
     * Deletes a financial institution by its ID.
     */
    deleteInstitution: async (req, res) => {
      try {
        const result = await service.deleteInstitution(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteInstitution");
      }
    },

    // Product
    /**
     * Creates a new financial product.
     */
    createProduct: async (req, res) => {
      try {
        const result = await service.createProduct(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createProduct");
      }
    },
    /**
     * Retrieves a single financial product by its ID.
     */
    getProduct: async (req, res) => {
      try {
        const result = await service.getProductById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getProduct");
      }
    },
    /**
     * Retrieves a list of all financial products, with an option to filter for active products.
     */
    getAllProducts: async (req, res) => {
      try {
        const activeOnly = req.query.activeOnly !== "false";
        const result = await service.getAllProducts(activeOnly);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllProducts");
      }
    },
    /**
     * Retrieves all financial products offered by a specific institution.
     */
    getProductsByInstitution: async (req, res) => {
      try {
        const result = await service.getProductsByInstitution(
          req.params.institutionId
        );
        console.log("Controller Result:", result);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getProductsByInstitution");
      }
    },
    /**
     * Updates an existing financial product.
     */
    updateProduct: async (req, res) => {
      try {
        const result = await service.updateProduct(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateProduct");
      }
    },
    /**
     * Deletes a financial product by its ID.
     */
    deleteProduct: async (req, res) => {
      try {
        const result = await service.deleteProduct(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteProduct");
      }
    },

    // Application
    /**
     * Creates a new finance application, including handling file uploads.
     */
    createApplication: async (req, res) => {
      try {
        // Handle files - req.files from upload.array() is File[] or undefined
        let files: Express.Multer.File[] = [];
        if (req.files) {
          if (Array.isArray(req.files)) {
            files = req.files;
          } else {
            // This shouldn't happen with upload.array(), but handle it just in case
            files = [];
          }
        }
        console.log("Controller File:", files);
        console.log("Controller File Count:", files.length);
        if (files.length > 0) {
          console.log(
            "Controller File Details:",
            files.map((f) => ({ name: f.originalname, size: f.size }))
          );
        }
        console.log("Controller Body:", req.body);
        const result = await service.createApplication(req.body, files);
        return handleResult(res, result, 201);
      } catch (err) {
        console.error("createApplication controller error:", err);
        return handleError(res, err, "createApplication");
      }
    },
    /**
     * Retrieves a single finance application by its ID.
     */
    getApplication: async (req, res) => {
      try {
        const result = await service.getApplicationById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getApplication");
      }
    },
    /**
     * Retrieves all finance applications submitted by a specific user.
     */
    getApplicationsByUser: async (req, res) => {
      try {
        const result = await service.getApplicationsByUser(req.params.userId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getApplicationsByUser");
      }
    },
    /**
     * Retrieves all finance applications for a specific product.
     */
    getApplicationsByProduct: async (req, res) => {
      try {
        const result = await service.getApplicationsByProduct(
          req.params.productId
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getApplicationsByProduct");
      }
    },
    /**
     * Updates the status of a finance application (e.g., 'approved', 'rejected').
     */
    updateApplicationStatus: async (req, res) => {
      try {
        const result = await service.updateApplicationStatus(
          req.params.id,
          req.body
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateApplicationStatus");
      }
    },
    /**
     * Updates the details of an existing finance application.
     */
    updateApplication: async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        const { user_id, product_id, ...filterData } = req.body;
        const result = await service.updateApplication(
          req.params.id,
          filterData,
          files
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateApplication");
      }
    },
    /**
     * Deletes a finance application by its ID.
     */
    deleteApplication: async (req, res) => {
      try {
        const result = await service.deleteApplication(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteApplication");
      }
    },
  };
}
