import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { Router } from "express";
import { IUserController } from "./user.controller";
import { UserDTO } from "../../dtos/user.DTO";
import { container } from "../../di/container";
import { upload } from "../../shared/utils/imageHandel";

/**
 * Factory function that creates and configures the router for user-related endpoints.
 * It resolves the user controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for user management.
 */
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and operations
 */
export const userRouter = (): Router => {
  const router = Router();
  // Resolve the user controller from the DI container.
  const userController = container.resolve<IUserController>("UserController");

  /**
   * @swagger
   * /user:
   *   get:
   *     summary: Get all users
   *     description: Retrieves a list of all users. (Typically restricted to Admins)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of users.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/", (req, res) => userController.findAllUsers(req, res));
  /**
   * @swagger
   * /user/{id}:
   *   get:
   *     summary: Get user by ID
   *     description: Retrieves a single user by their unique ID.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user to retrieve.
   *     responses:
   *       '200':
   *         description: User details.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: User not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:id", (req, res) => userController.getUserByID(req, res));

  /**
   * @swagger
   * /user/{id}:
   *   put:
   *     summary: Update a user
   *     description: Updates a user's profile information. Can also handle a profile image upload. Requires ownership or admin privileges.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user to update.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "John Doe Updated"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "john.updated@example.com"
   *               profile_image:
   *                 type: string
   *                 format: binary
   *                 description: The user's profile image file.
   *     responses:
   *       '200':
   *         description: User updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: User not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put(
    "/:id",
    upload.single("profile_image"),
    validateDto(UserDTO),
    (req, res) => userController.updateUser(req, res)
  );

  /**
   * @swagger
   * /user/{id}:
   *   delete:
   *     summary: Delete a user
   *     description: Deletes a user by their unique ID. (Typically restricted to Admins)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user to delete.
   *     responses:
   *       '200':
   *         description: User deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: User not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/:id", (req, res) => userController.deleteUser(req, res));

  return router;
};
