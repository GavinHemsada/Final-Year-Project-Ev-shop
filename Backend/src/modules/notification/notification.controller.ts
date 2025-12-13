import { Request, Response } from "express";
import { INotificationService } from "./notification.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the notification controller, specifying methods for handling HTTP requests related to notifications.
 */
export interface INotificationController {
  /**
   * Handles the HTTP request to get a notification by its unique ID.
   * @param req - The Express request object, containing the notification ID in `req.params`.
   * @param res - The Express response object.
   */
  getNotificationByID(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all notifications for a specific user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  getNotificationsByUserID(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all notifications.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllNotifications(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to mark a notification as read.
   * @param req - The Express request object, containing the notification ID in `req.params`.
   * @param res - The Express response object.
   */
  markNotificationAsRead(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to create a new notification.
   * @param req - The Express request object, containing notification data in the body.
   * @param res - The Express response object.
   */
  createNotification(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing notification.
   * @param req - The Express request object, containing the notification ID and update data.
   * @param res - The Express response object.
   */
  updateNotification(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a notification.
   * @param req - The Express request object, containing the notification ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteNotification(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the notification controller.
 * It encapsulates the logic for handling API requests related to notifications.
 *
 * @param notificationService - The notification service dependency that contains the business logic.
 * @returns An implementation of the INotificationController interface.
 */
export function notificationController(
  notificationService: INotificationService
): INotificationController {
  return {
    /**
     * Retrieves a single notification by its ID.
     */
    getNotificationByID: async (req, res) => {
      try {
        const result = await notificationService.findById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getNotificationByID");
      }
    },
    /**
     * Retrieves all notifications for a specific user.
     */
    getNotificationsByUserID: async (req, res) => {
      try {
        const result = await notificationService.findByUserId(
          req.params.userId
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getNotificationsByUserID");
      }
    },
    /**
     * Retrieves a list of all notifications.
     */
    getAllNotifications: async (_req, res) => {
      try {
        const result = await notificationService.findAll();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllNotifications");
      }
    },
    /**
     * Marks a specific notification as read.
     */
    markNotificationAsRead: async (req, res) => {
      try {
        const result = await notificationService.markAsRead(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "markNotificationAsRead");
      }
    },
    /**
     * Creates a new notification.
     */
    createNotification: async (req, res) => {
      try {
        const data = req.body;
        const result = await notificationService.create(data);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createNotification");
      }
    },
    /**
     * Updates an existing notification.
     */
    updateNotification: async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;
        const result = await notificationService.update(id, data);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateNotification");
      }
    },
    /**
     * Deletes a notification by its ID.
     */
    deleteNotification: async (req, res) => {
      try {
        const id = req.params.id;
        const result = await notificationService.delete(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleteNotification");
      }
    },
  };
}
