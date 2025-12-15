import { Request, Response } from "express";
import { IUserService } from "./user.service";
import { UserDTO } from "../../dtos/user.DTO";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the user controller, specifying the methods for handling user-related HTTP requests.
 */
export interface IUserController {
  /**
   * Handles the HTTP request to retrieve all users.
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @returns A promise that resolves to an Express response.
   */
  findAllUsers(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a user by their unique ID.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   * @returns A promise that resolves to an Express response.
   */
  getUserByID(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update a user's information.
   * @param req - The Express request object, containing the user ID, update data, and an optional file.
   * @param res - The Express response object.
   * @returns A promise that resolves to an Express response.
   */
  updateUser(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   * @returns A promise that resolves to an Express response.
   */
  deleteUser(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the user controller.
 * It encapsulates the logic for handling API requests related to users.
 *
 * @param userService - The user service dependency that contains the business logic.
 * @returns An implementation of the IUserController interface.
 */
export function userController(userService: IUserService): IUserController {
  return {
    /**
     * Retrieves a list of all users.
     */
    findAllUsers: async (_req, res) => {
      try {
        const result = await userService.findAll();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting all users");
      }
    },
    /**
     * Retrieves a single user by their ID.
     */
    getUserByID: async (req, res) => {
      try {
        const result = await userService.findById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting user by ID");
      }
    },
    /**
     * Updates an existing user's data, including their profile image if provided.
     */
    updateUser: async (req, res) => {
      try {
        const data = <UserDTO>req.body;
        const id = req.params.id;
        const file = req.file;
        const result = await userService.update(id, data, file);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error updating user");
      }
    },
    /**
     * Deletes a user by their ID.
     */
    deleteUser: async (req, res) => {
      try {
        const id = req.params.id;
        const result = await userService.delete(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error deleting user");
      }
    },
  };
}
