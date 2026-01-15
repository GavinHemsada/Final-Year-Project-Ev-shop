import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import {
  EvBrandDTO,
  EvCategoryDTO,
  EvModelDTO,
  VehicleListingDTO,
  UpdateVehicleListingDTO,
  QuickUpdateListingDTO,
} from "../../dtos/ev.DTO";
import { IEvController } from "./ev.controller";
import { container } from "../../di/container";
import { upload } from "../../shared/utils/imageHandel";
import { protectJWT } from "../../shared/middlewares/Jwt.middleware";

/**
 * Factory function that creates and configures the router for EV-related endpoints.
 * It resolves the EV controller from the dependency injection container and maps
 * controller methods to specific API routes for brands, categories, models, and listings.
 *
 * @returns The configured Express Router for the EV catalog.
 */
/**
 * @swagger
 * tags:
 *   - name: EV Brands
 *     description: Operations related to EV brands
 *   - name: EV Categories
 *     description: Operations related to EV categories
 *   - name: EV Models
 *     description: Operations related to EV models
 *   - name: EV Listings
 *     description: Operations related to vehicle listings for sale
 */
export const evRouter = (): Router => {
  const router = Router();
  // Resolve the EV controller from the DI container.
  const controller = container.resolve<IEvController>("EvController");

  // --- Brand Routes ---
  /**
   * @swagger
   * /ev/brands:
   *   post:
   *     summary: Create a new EV brand
   *     description: Creates a new EV brand with a logo. Requires admin privileges.
   *     tags: [EV Brands]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               brand_name:
   *                 type: string
   *                 example: "Tesla"
   *               brand_logo:
   *                 type: string
   *                 format: binary
   *                 description: The logo image file for the brand.
   *     responses:
   *       '201':
   *         description: Brand created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 brand: { type: object } # Ideally $ref to a Brand schema
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/brands",
    protectJWT,
    upload.single("brand_logo"),
    validateDto(EvBrandDTO),
    (req, res) => controller.createBrand(req, res)
  );

  /**
   * @swagger
   * /ev/brands:
   *   get:
   *     summary: Get all EV brands
   *     description: Retrieves a list of all available EV brands.
   *     tags: [EV Brands]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of brands.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 brands: { type: array, items: { type: object } }
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/brands", (req, res) => controller.getAllBrands(req, res));

  /**
   * @swagger
   * /ev/brands/{id}:
   *   get:
   *     summary: Get an EV brand by ID
   *     description: Retrieves a single EV brand by its unique ID.
   *     tags: [EV Brands]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the brand to retrieve.
   *     responses:
   *       '200':
   *         description: Brand details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Brand not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/brands/:id", (req, res) => controller.getById(req, res));

  /**
   * @swagger
   * /ev/brands/{id}:
   *   put:
   *     summary: Update an EV brand
   *     description: Updates an existing EV brand's details and/or logo. Requires admin privileges.
   *     tags: [EV Brands]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the brand to update.
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               brand_name:
   *                 type: string
   *               brand_logo:
   *                 type: string
   *                 format: binary
   *     responses:
   *       '200':
   *         description: Brand updated successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Brand not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/brands/:id",
    protectJWT,
    upload.single("brand_logo"),
    validateDto(EvBrandDTO),
    (req, res) => controller.updateBrand(req, res)
  );

  /**
   * @swagger
   * /ev/brands/{id}:
   *   delete:
   *     summary: Delete an EV brand
   *     description: Deletes an EV brand by its unique ID. Requires admin privileges.
   *     tags: [EV Brands]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the brand to delete.
   *     responses:
   *       '200':
   *         description: Brand deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Brand not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete(
    "/brands/:id",
    protectJWT,
    (req, res) => controller.deleteBrand(req, res)
  );

  // --- Category Routes ---

  /**
   * @swagger
   * /ev/categories:
   *   post:
   *     summary: Create a new EV category
   *     description: Creates a new EV category (e.g., SUV, Sedan). Requires admin privileges.
   *     tags: [EV Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EvCategoryDTO'
   *     responses:
   *       '201':
   *         description: Category created successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/categories",
    protectJWT,
    validateDto(EvCategoryDTO),
    (req, res) => controller.createCategory(req, res)
  );

  /**
   * @swagger
   * /ev/categories:
   *   get:
   *     summary: Get all EV categories
   *     description: Retrieves a list of all available EV categories.
   *     tags: [EV Categories]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of categories.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/categories", (req, res) =>
    controller.getAllCategories(req, res)
  );

  /**
   * @swagger
   * /ev/categories/{id}:
   *   get:
   *     summary: Get an EV category by ID
   *     description: Retrieves a single EV category by its unique ID.
   *     tags: [EV Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the category to retrieve.
   *     responses:
   *       '200':
   *         description: Category details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Category not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/categories/:id", (req, res) =>
    controller.getCategoryByid(req, res)
  );

  /**
   * @swagger
   * /ev/categories/{id}:
   *   put:
   *     summary: Update an EV category
   *     description: Updates an existing EV category. Requires admin privileges.
   *     tags: [EV Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the category to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EvCategoryDTO'
   *     responses:
   *       '200':
   *         description: Category updated successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Category not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/categories/:id",
    protectJWT,
    validateDto(EvCategoryDTO),
    (req, res) => controller.updateCategory(req, res)
  );

  /**
   * @swagger
   * /ev/categories/{id}:
   *   delete:
   *     summary: Delete an EV category
   *     description: Deletes an EV category by its unique ID. Requires admin privileges.
   *     tags: [EV Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the category to delete.
   *     responses:
   *       '200':
   *         description: Category deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Category not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete(
    "/categories/:id",
    protectJWT,
    (req, res) => controller.deleteCategory(req, res)
  );

  // --- Model Routes ---

  /**
   * @swagger
   * /ev/models:
   *   post:
   *     summary: Create a new EV model
   *     description: Creates a new EV model with images. Requires admin privileges.
   *     tags: [EV Models]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/EvModelDTO'
   *     responses:
   *       '201':
   *         description: Model created successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/models", validateDto(EvModelDTO), (req, res) =>
    controller.createModel(req, res)
  );

  /**
   * @swagger
   * /ev/models:
   *   get:
   *     summary: Get all EV models
   *     description: Retrieves a list of all available EV models.
   *     tags: [EV Models]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of models.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/models", (req, res) => controller.getAllModels(req, res));

  /**
   * @swagger
   * /ev/models/{id}:
   *   get:
   *     summary: Get an EV model by ID
   *     description: Retrieves a single EV model by its unique ID.
   *     tags: [EV Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the model to retrieve.
   *     responses:
   *       '200':
   *         description: Model details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Model not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/models/:id", (req, res) => controller.getModelById(req, res));

  /**
   * @swagger
   * /ev/models/{id}:
   *   put:
   *     summary: Update an EV model
   *     description: Updates an existing EV model's details and/or images. Requires admin privileges.
   *     tags: [EV Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the model to update.
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/EvModelDTO'
   *     responses:
   *       '200':
   *         description: Model updated successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Model not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/models/:id", validateDto(EvModelDTO), (req, res) =>
    controller.updateModel(req, res)
  );

  /**
   * @swagger
   * /ev/models/{id}:
   *   delete:
   *     summary: Delete an EV model
   *     description: Deletes an EV model by its unique ID. Requires admin privileges.
   *     tags: [EV Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the model to delete.
   *     responses:
   *       '200':
   *         description: Model deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Model not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/models/:id", (req, res) => controller.deleteModel(req, res));

  // --- Listing Routes ---

  /**
   * @swagger
   * /ev/listings:
   *   post:
   *     summary: Create a new vehicle listing
   *     description: Creates a new vehicle listing for sale. Requires seller or admin privileges.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/VehicleListingDTO'
   *     responses:
   *       '201':
   *         description: Listing created successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/listings",
    upload.array("images", 5),
    validateDto(VehicleListingDTO),
    (req, res) => controller.createListing(req, res)
  );

  /**
   * @swagger
   * /ev/listings:
   *   get:
   *     summary: Get all vehicle listings
   *     description: Retrieves a list of all vehicle listings, with optional filtering and pagination.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *         description: Page number for pagination.
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *         description: Number of items per page.
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *         description: Search term to filter listings.
   *       - in: query
   *         name: filter
   *         schema: { type: string }
   *         description: Filter criteria (e.g., by condition, color).
   *     responses:
   *       '200':
   *         description: A paginated list of listings.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/listings", (req, res) => controller.getAllListings(req, res));

  /**
   * @swagger
   * /ev/listings/seller/{sellerId}:
   *   get:
   *     summary: Get listings by seller
   *     description: Retrieves all listings for a specific seller.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sellerId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller.
   *     responses:
   *       '200':
   *         description: A list of the seller's listings.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/listings/seller/:sellerId", (req, res) =>
    controller.getListingsBySeller(req, res)
  );

  /**
   * @swagger
   * /ev/listings/{id}:
   *   get:
   *     summary: Get a vehicle listing by ID
   *     description: Retrieves a single vehicle listing by its unique ID.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the listing to retrieve.
   *     responses:
   *       '200':
   *         description: Listing details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Listing not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/listings/:id", (req, res) =>
    controller.getListingById(req, res)
  );

  /**
   * @swagger
   * /ev/listings/{id}:
   *   put:
   *     summary: Update a vehicle listing
   *     description: Updates an existing vehicle listing. Requires ownership or admin privileges.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the listing to update.
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/UpdateVehicleListingDTO'
   *     responses:
   *       '200':
   *         description: Listing updated successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Listing not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/listings/:id",
    upload.array("images", 5),
    validateDto(UpdateVehicleListingDTO),
    (req, res) => controller.updateListing(req, res)
  );

  /**
   * @swagger
   * /ev/listings/{id}/quick-update:
   *   patch:
   *     summary: Quick update listing status and quantity
   *     description: Updates only the status and/or quantity of a listing. Used for inline editing in the listings table.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the listing to update.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [active, inactive, sold]
   *                 example: "active"
   *               number_of_ev:
   *                 type: number
   *                 minimum: 1
   *                 example: 5
   *     responses:
   *       '200':
   *         description: Listing updated successfully.
   *       '400':
   *         description: Bad request.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Listing not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch(
    "/listings/:id/quick-update",
    validateDto(QuickUpdateListingDTO),
    (req, res) => controller.quickUpdateListing(req, res)
  );

  /**
   * @swagger
   * /ev/listings/{id}:
   *   delete:
   *     summary: Delete a vehicle listing
   *     description: Deletes a vehicle listing by its unique ID. Requires ownership or admin privileges.
   *     tags: [EV Listings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the listing to delete.
   *     responses:
   *       '200':
   *         description: Listing deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Listing not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/listings/:id", (req, res) =>
    controller.deleteListing(req, res)
  );

  return router;
};
