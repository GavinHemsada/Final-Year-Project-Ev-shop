import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import {
  FinancialInstitutionDTO,
  FinancialProductDTO,
  FinancingApplicationDTO,
  UpdateFinancingApplicationDTO,
} from "../../dtos/financial.DTO";
import { IFinancialController } from "./financial.controller";
import { container } from "../../di/container";
import { upload } from "../../shared/utils/fileHandel";

/**
 * Factory function that creates and configures the router for financial services endpoints.
 * It resolves the financial controller from the dependency injection container and maps
 * controller methods to specific API routes for institutions, products, and applications.
 *
 * @returns The configured Express Router for financial services.
 */
/**
 * @swagger
 * tags:
 *   - name: Financial Institutions
 *     description: Operations related to financial institutions
 *   - name: Financial Products
 *     description: Operations related to financial products (loans, etc.)
 *   - name: Financing Applications
 *     description: Operations related to user financing applications
 */
export const financialRouter = (): Router => {
  const router = Router();
  // Resolve the financial controller from the DI container.
  const controller = container.resolve<IFinancialController>(
    "FinancialController"
  );

  // --- Financial Institution Routes ---

  /**
   * @swagger
   * /financial/institutions:
   *   post:
   *     summary: Create a new financial institution
   *     description: Creates a new financial institution. Requires admin privileges.
   *     tags: [Financial Institutions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FinancialInstitutionDTO'
   *     responses:
   *       '201':
   *         description: Institution created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 institution: { type: object } # Ideally $ref to a FinancialInstitution schema
   *       '400':
   *         description: Bad request (validation error, user already has institution).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       '401':
   *         description: Unauthorized.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/institutions",
    validateDto(FinancialInstitutionDTO),
    (req, res) => controller.createInstitution(req, res)
  );

  /**
   * @swagger
   * /financial/institutions:
   *   get:
   *     summary: Get all financial institutions
   *     description: Retrieves a list of all financial institutions.
   *     tags: [Financial Institutions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of financial institutions.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 institutions: { type: array, items: { type: object } } # Ideally $ref to a FinancialInstitution schema
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  // TODO: Add authorization middleware to restrict access if needed (e.g., only admins or specific roles).
  router.get("/institutions", (req, res) =>
    controller.getAllInstitutions(req, res)
  );

  router.get("/institutions/user/:userId", (req, res) =>
    controller.findInstitutionByUserId(req, res)
  );
  /**
   * @swagger
   * /financial/institutions/{id}:
   *   get:
   *     summary: Get financial institution by ID
   *     description: Retrieves a single financial institution by its unique ID.
   *     tags: [Financial Institutions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the institution to retrieve.
   *     responses:
   *       '200':
   *         description: Financial institution details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Institution not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/institutions/:id", (req, res) =>
    controller.getInstitution(req, res)
  );

  /**
   * @swagger
   * /financial/institutions/{id}:
   *   put:
   *     summary: Update a financial institution
   *     description: Updates an existing financial institution. Requires finance role or admin privileges.
   *     tags: [Financial Institutions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the institution to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FinancialInstitutionDTO'
   *     responses:
   *       '200':
   *         description: Institution updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not owner or admin).
   *       '404':
   *         description: Institution not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/institutions/:id",
    validateDto(FinancialInstitutionDTO),
    (req, res) => controller.updateInstitution(req, res)
  );

  /**
   * @swagger
   * /financial/institutions/{id}:
   *   delete:
   *     summary: Delete a financial institution
   *     description: Deletes a financial institution by its unique ID. Requires admin privileges.
   *     tags: [Financial Institutions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the institution to delete.
   *     responses:
   *       '200':
   *         description: Institution deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: "Institution deleted successfully" }
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not admin).
   *       '404':
   *         description: Institution not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/institutions/:id", (req, res) =>
    controller.deleteInstitution(req, res)
  );

  // --- Financial Product Routes ---

  /**
   * @swagger
   * /financial/products:
   *   post:
   *     summary: Create a new financial product
   *     description: Creates a new financial product. Requires finance role or admin privileges.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FinancialProductDTO'
   *     responses:
   *       '201':
   *         description: Product created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 product: { type: object } # Ideally $ref to a FinancialProduct schema
   *       '400':
   *         description: Bad request (validation error, institution not found).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not finance role or admin).
   *       '500':
   *         description: Internal server error.
   */
  router.post("/products", validateDto(FinancialProductDTO), (req, res) =>
    controller.createProduct(req, res)
  );

  /**
   * @swagger
   * /financial/products:
   *   get:
   *     summary: Get all financial products
   *     description: Retrieves a list of all financial products. Can be filtered by `activeOnly` query parameter.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: activeOnly
   *         schema:
   *           type: boolean
   *           default: true
   *         description: If true, returns only active products.
   *     responses:
   *       '200':
   *         description: A list of financial products.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 products: { type: array, items: { type: object } } # Ideally $ref to a FinancialProduct schema
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/products", (req, res) => controller.getAllProducts(req, res));

  /**
   * @swagger
   * /financial/products/institution/{institutionId}:
   *   get:
   *     summary: Get products by institution
   *     description: Retrieves all financial products offered by a specific institution.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: institutionId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the institution.
   *     responses:
   *       '200':
   *         description: A list of products for the specified institution.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Institution not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/products/institution/:institutionId", (req, res) =>
    controller.getProductsByInstitution(req, res)
  );

  /**
   * @swagger
   * /financial/products/{id}:
   *   get:
   *     summary: Get financial product by ID
   *     description: Retrieves a single financial product by its unique ID.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the product to retrieve.
   *     responses:
   *       '200':
   *         description: Financial product details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Product not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/products/:id", (req, res) => controller.getProduct(req, res));

  /**
   * @swagger
   * /financial/products/{id}:
   *   put:
   *     summary: Update a financial product
   *     description: Updates an existing financial product. Requires finance role or admin privileges.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the product to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FinancialProductDTO'
   *     responses:
   *       '200':
   *         description: Product updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not finance role or admin).
   *       '404':
   *         description: Product not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/products/:id", validateDto(FinancialProductDTO), (req, res) =>
    controller.updateProduct(req, res)
  );

  /**
   * @swagger
   * /financial/products/{id}:
   *   delete:
   *     summary: Delete a financial product
   *     description: Deletes a financial product by its unique ID. Requires finance role or admin privileges.
   *     tags: [Financial Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the product to delete.
   *     responses:
   *       '200':
   *         description: Product deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: "Product deleted successfully" }
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not finance role or admin).
   *       '404':
   *         description: Product not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/products/:id", (req, res) =>
    controller.deleteProduct(req, res)
  );

  // --- Financing Application Routes ---

  /**
   * @swagger
   * /financial/applications:
   *   post:
   *     summary: Create a new financing application
   *     description: Creates a new financing application, including supporting documents.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               user_id:
   *                 type: string
   *                 description: ID of the user submitting the application.
   *                 example: "60d0fe4f5e3e3e0015a8b456"
   *               product_id:
   *                 type: string
   *                 description: ID of the financial product being applied for.
   *                 example: "60d0fe4f5e3e3e0015a8b457"
   *               application_data:
   *                 type: string
   *                 format: json
   *                 description: JSON string of additional application data (e.g., income, employment).
   *                 example: '{"income": 50000, "employment_status": "employed"}'
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 maxItems: 2
   *                 description: Supporting documents for the application (e.g., bank statements, ID).
   *     responses:
   *       '201':
   *         description: Application created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 application: { type: object } # Ideally $ref to a FinancingApplication schema
   *       '400':
   *         description: Bad request (validation error, product not active, user already has application).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post(
    "/applications",
    upload.array("files", 2),
    validateDto(FinancingApplicationDTO),
    (req, res) => controller.createApplication(req, res)
  );

  /**
   * @swagger
   * /financial/applications/user/{userId}:
   *   get:
   *     summary: Get user's financing applications
   *     description: Retrieves all financing applications submitted by a specific user.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose applications are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the user's financing applications.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not owner or admin).
   *       '404':
   *         description: User not found or no applications.
   *       '500':
   *         description: Internal server error.
   */
  // TODO: Add authorization middleware to ensure user can only get their own applications or admin can get any.
  router.get("/applications/user/:userId", (req, res) =>
    controller.getApplicationsByUser(req, res)
  );

  /**
   * @swagger
   * /financial/applications/product/{productId}:
   *   get:
   *     summary: Get applications by product
   *     description: Retrieves all financing applications for a specific financial product.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the financial product.
   *     responses:
   *       '200':
   *         description: A list of applications for the specified product.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not finance role or admin).
   *       '404':
   *         description: Product not found or no applications.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/applications/product/:productId", (req, res) =>
    controller.getApplicationsByProduct(req, res)
  );

  /**
   * @swagger
   * /financial/applications/{id}:
   *   get:
   *     summary: Get financing application by ID
   *     description: Retrieves a single financing application by its unique ID.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the application to retrieve.
   *     responses:
   *       '200':
   *         description: Financing application details.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not owner, finance role, or admin).
   *       '404':
   *         description: Application not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/applications/:id", (req, res) =>
    controller.getApplication(req, res)
  );

  /**
   * @swagger
   * /financial/applications/{id}:
   *   put:
   *     summary: Update a financing application
   *     description: Updates an existing financing application, including its data and optional documents.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the application to update.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               user_id:
   *                 type: string
   *                 description: ID of the user submitting the application.
   *                 example: "60d0fe4f5e3e3e0015a8b456"
   *               product_id:
   *                 type: string
   *                 description: ID of the financial product being applied for.
   *                 example: "60d0fe4f5e3e3e0015a8b457"
   *               application_data:
   *                 type: string
   *                 format: json
   *                 description: JSON string of additional application data to update.
   *                 example: '{"income": 60000, "credit_score": 750}'
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 maxItems: 2
   *                 description: New supporting documents to replace existing ones.
   *     responses:
   *       '200':
   *         description: Application updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not owner or admin).
   *       '404':
   *         description: Application not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/applications/:id",
    upload.array("files", 2),
    validateDto(FinancingApplicationDTO),
    (req, res) => controller.updateApplication(req, res)
  ),
    /**
     * @swagger
     * /financial/applications/{id}/status:
     *   patch:
     *     summary: Update financing application status
     *     description: Updates the status of a financing application (e.g., 'PENDING', 'APPROVED', 'REJECTED').
     *     tags: [Financing Applications]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the application to update.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateFinancingApplicationDTO'
     *     responses:
     *       '200':
     *         description: Application status updated successfully.
     *       '400':
     *         description: Bad request (validation error).
     *       '401':
     *         description: Unauthorized.
     *       '403':
     *         description: Forbidden (if user is not finance role or admin).
     *       '404':
     *         description: Application not found.
     *       '500':
     *         description: Internal server error.
     */
    router.patch(
      "/applications/:id/status",
      validateDto(UpdateFinancingApplicationDTO),
      (req, res) => controller.updateApplicationStatus(req, res)
    );

  /**
   * @swagger
   * /financial/applications/{id}:
   *   delete:
   *     summary: Delete a financing application
   *     description: Deletes a financing application by its unique ID, including associated documents.
   *     tags: [Financing Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the application to delete.
   *     responses:
   *       '200':
   *         description: Application deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: "Application deleted successfully" }
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not owner or admin).
   *       '404':
   *         description: Application not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/applications/:id", (req, res) =>
    controller.deleteApplication(req, res)
  );

  return router;
};
