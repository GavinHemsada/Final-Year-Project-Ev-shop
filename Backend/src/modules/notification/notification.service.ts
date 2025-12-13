import { INotificationRepository } from "./notification.repository";
import { NotificationDTO } from "../../dtos/notification.DTO";
import { IUserRepository } from "../user/user.repository";
import { ISellerRepository } from "../seller/seller.repository";
import { IFinancialRepository } from "../financial/financial.repository";

/**
 * Defines the interface for the notification service, outlining methods for managing user notifications.
 */
export interface INotificationService {
  /**
   * Finds a single notification by its unique ID.
   * @param id - The ID of the notification to find.
   * @returns A promise that resolves to an object containing the notification data or an error.
   */
  findById(
    id: string
  ): Promise<{ success: boolean; notification?: any; error?: string }>;
  /**
   * Finds all notifications for a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's notifications or an error.
   */
  findByUserId(
    user_id: string
  ): Promise<{ success: boolean; notifications?: any[]; error?: string }>;
  /**
   * Retrieves all notifications from the system.
   * @returns A promise that resolves to an object containing an array of all notifications or an error.
   */
  findAll(): Promise<{
    success: boolean;
    notifications?: any[];
    error?: string;
  }>;
  /**
   * Creates a new notification.
   * @param data - The data for the new notification.
   * @returns A promise that resolves to an object containing the created notification or an error.
   */
  create(
    data: NotificationDTO
  ): Promise<{ success: boolean; notification?: any; error?: string }>;
  /**
   * Marks a specific notification as read.
   * @param id - The ID of the notification to mark as read.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  markAsRead(id: string): Promise<{ success: boolean; error?: string }>;
  /**
   * Updates an existing notification.
   * @param id - The ID of the notification to update.
   * @param data - The partial data to update the notification with.
   * @returns A promise that resolves to an object containing the updated notification data or an error.
   */
  update(
    id: string,
    data: Partial<NotificationDTO>
  ): Promise<{ success: boolean; notification?: any; error?: string }>;
  /**
   * Deletes a notification by its unique ID.
   * @param id - The ID of the notification to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;
}
/**
 * Factory function to create an instance of the notification service.
 * It encapsulates the business logic for managing notifications, including caching strategies
 *
 * @param notificationRepo - The repository for notification data access.
 * @param userRepo - The repository for user data access.
 * @returns An implementation of the INotificationService interface.
 */
export function notificationService(
  notificationRepo: INotificationRepository,
  userRepo: IUserRepository,
  sellerRepo: ISellerRepository,
  financialRepo: IFinancialRepository
): INotificationService {
  return {
    findById: async (id) => {
      try {
        const notification = await notificationRepo.findById(id);
        if (!notification)
          return { success: false, error: "Notification not found" };
        return { success: true, notification };
      } catch (err) {
        return { success: false, error: "Failed to fetch notification" };
      }
    },
    findByUserId: async (user_id) => {
      try {
        console.log(user_id);
        const notifications = await notificationRepo.findByUserId(user_id);
        if (!notifications)
          return {
            success: false,
            error: "No notifications found for this user " + user_id,
          };
        return { success: true, notifications };
      } catch (err) {
        return { success: false, error: "Failed to fetch notifications" };
      }
    },
    findAll: async () => {
      try {
        const notifications = await notificationRepo.findAll();
        if (!notifications)
          return { success: false, error: "No notifications found" };
        return { success: true, notifications };
      } catch (err) {
        return { success: false, error: "Failed to fetch notifications" };
      }
    },
    create: async (data) => {
      /**
       * Creates a new notification after validating the user exists.
       */
      try {
        const checks = [
          { id: data.user_id, repo: userRepo, error: "User not found" },
          { id: data.seller_id, repo: sellerRepo, error: "Seller not found" },
          {
            id: data.financial_id,
            repo: financialRepo,
            error: "Financial user not found",
          },
        ];

        for (const item of checks) {
          if (item.id) {
            const exists = await item.repo.findById(item.id);
            if (!exists) return { success: false, error: item.error };
          }
        }

        const notification = await notificationRepo.create(data);

        return { success: true, notification };
      } catch (err) {
        return { success: false, error: "Failed to create notification" };
      }
    },
    markAsRead: async (id) => {
      /**
       * Marks a notification as read.
       */
      try {
        const notification = await notificationRepo.findById(id);
        if (!notification)
          return { success: false, error: "Notification not found" };

        const success = await notificationRepo.notificationReaded(id);
        if (!success)
          return { success: false, error: "Notification not found" };

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: "Failed to mark notification as read",
        };
      }
    },
    update: async (id, data) => {
      /**
       * Updates an existing notification's data.
       */
      try {
        const existingNotification = await notificationRepo.findById(id);
        if (!existingNotification)
          return { success: false, error: "Notification not found" };
        // Apply the partial updates to the existing notification object.
        Object.assign(existingNotification, data);
        const notification = await notificationRepo.update(
          id,
          existingNotification
        );
        if (!notification)
          return { success: false, error: "Notification not found" };

        return { success: true, notification };
      } catch (err) {
        return { success: false, error: "Failed to update notification" };
      }
    },
    delete: async (id) => {
      /**
       * Deletes a notification from the system.
       */
      try {
        const notification = await notificationRepo.findById(id);
        if (!notification)
          return { success: false, error: "Notification not found" };

        const success = await notificationRepo.delete(id);
        if (!success)
          return { success: false, error: "Notification not found" };

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete notification" };
      }
    },
  };
}
