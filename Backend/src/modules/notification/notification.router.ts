import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { Router } from "express";
import { INotificationController } from "./notification.controller";
import { NotificationDTO } from "../../dtos/notification.DTO";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for notification-related endpoints.
 * It resolves the notification controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for notification management.
 */
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management for users
 */
export const notificationRouter = (): Router => {
  const router = Router();
  // Resolve the notification controller from the DI container.
  const notificationController = container.resolve<INotificationController>(
    "NotificationController"
  );
  /**
   * @swagger
   * /notification:
   *   get:
   *     summary: Get all notifications
   *     description: Retrieves a list of all notifications. (Typically restricted to Admins)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all notifications.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 notifications: { type: array, items: { $ref: '#/components/schemas/Notification' } }
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not an admin).
   *       '500':
   *         description: Internal server error.
   */
  router.get("/", (req, res) =>
    notificationController.getAllNotifications(req, res)
  );

  /**
   * @swagger
   * /notification:
   *   post:
   *     summary: Create a new notification
   *     description: Creates a new notification. (Typically called internally by other services or by an admin)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NotificationDTO'
   *     responses:
   *       '201':
   *         description: Notification created successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/", validateDto(NotificationDTO), (req, res) =>
    notificationController.createNotification(req, res)
  );

  /**
   * @swagger
   * /notification/user/{userId}:
   *   get:
   *     summary: Get notifications by user ID
   *     description: Retrieves all notifications for a specific user.
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose notifications are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of notifications for the user.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not the owner or an admin).
   *       '404':
   *         description: User not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/user/:userId", (req, res) =>
    notificationController.getNotificationsByUserID(req, res)
  );

  router.get("/seller/:userId", (req, res) =>
    notificationController.getNotificationsByUserID(req, res)
  );
  /**
   * @swagger
   * /notification/{id}:
   *   get:
   *     summary: Get notification by ID
   *     description: Retrieves a single notification by its unique ID.
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the notification to retrieve.
   *     responses:
   *       '200':
   *         description: Notification details.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user does not own the notification and is not an admin).
   *       '404':
   *         description: Notification not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:id", (req, res) =>
    notificationController.getNotificationByID(req, res)
  );

  /**
   * @swagger
   * /notification/{id}:
   *   put:
   *     summary: Update a notification
   *     description: Updates an existing notification. (Typically restricted to Admins)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the notification to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NotificationDTO'
   *     responses:
   *       '200':
   *         description: Notification updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Notification not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/:id", validateDto(NotificationDTO), (req, res) =>
    notificationController.updateNotification(req, res)
  );

  /**
   * @swagger
   * /notification/{id}/read:
   *   patch:
   *     summary: Mark a notification as read
   *     description: Marks a specific notification as read.
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the notification to mark as read.
   *     responses:
   *       '200':
   *         description: Notification marked as read successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user does not own the notification).
   *       '404':
   *         description: Notification not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/:id/read", (req, res) =>
    notificationController.markNotificationAsRead(req, res)
  );

  /**
   * @swagger
   * /notification/{id}:
   *   delete:
   *     summary: Delete a notification
   *     description: Deletes a notification by its unique ID.
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the notification to delete.
   *     responses:
   *       '200':
   *         description: Notification deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user does not own the notification and is not an admin).
   *       '404':
   *         description: Notification not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/:id", (req, res) =>
    notificationController.deleteNotification(req, res)
  );
  return router;
};
