import { INotification, Notification } from "../../entities/Notification";
import { NotificationDTO } from "../../dtos/notification.DTO";
import { withErrorHandling } from "../../shared/utils/CustomException";
import { Types } from "mongoose";

/**
 * Defines the contract for the notification repository, specifying the methods for data access operations related to notifications.
 */
export interface INotificationRepository {
  /**
   * Creates a new notification.
   * @param data - The DTO containing the details for the new notification.
   * @returns A promise that resolves to the created notification document or null.
   */
  create(data: NotificationDTO): Promise<INotification | null>;
  /**
   * Finds a notification by its unique ID.
   * @param id - The ID of the notification to find.
   * @returns A promise that resolves to the notification document or null if not found.
   */
  findById(id: string): Promise<INotification | null>;
  /**
   * Finds all notifications for a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an array of notification documents or null.
   */
  findByUserId(user_id: string): Promise<INotification[] | null>;
  /**
   * Retrieves all notifications from the database.
   * @returns A promise that resolves to an array of all notification documents or null.
   */
  findAll(): Promise<INotification[] | null>;
  /**
   * Marks a notification as read.
   * @param id - The ID of the notification to mark as read.
   * @returns A promise that resolves to true if the operation was successful, otherwise false or null.
   */
  notificationReaded(id: string): Promise<boolean | null>;
  /**
   * Updates an existing notification.
   * @param id - The ID of the notification to update.
   * @param data - The full notification document with updated fields.
   * @returns A promise that resolves to the updated notification document or null.
   */
  update(id: string, data: INotification): Promise<INotification | null>;
  /**
   * Deletes a notification by its unique ID.
   * @param id - The ID of the notification to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  delete(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the INotificationRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const NotificationRepository: INotificationRepository = {
  /** Creates a new Notification document. */
  create: withErrorHandling(async (data) => {
    const notification = new Notification(data);
    return await notification.save();
  }),
  /** Finds a single notification by its document ID. */
  findById: withErrorHandling(async (id) => {
    return await Notification.findOne({ _id: id });
  }),
  /** Finds all notifications for a specific user (can be user, seller, or financial user). */
  findByUserId: withErrorHandling(async (user_id) => {
    const objectId = new Types.ObjectId(user_id); // convert string to ObjectId
    return await Notification.find({
      $or: [
        { user_id: objectId },
        { seller_id: objectId },
        { financial_id: objectId },
      ],
    }).sort({ createdAt: -1 });
  }),
  /** Retrieves all notifications. */
  findAll: withErrorHandling(async () => {
    return await Notification.find();
  }),
  /** Finds a notification by ID and sets its `is_read` status to true. */
  notificationReaded: withErrorHandling(async (id) => {
    const notification = await Notification.findById(id);
    if (notification?.is_read) return true;
    notification!.is_read = true;
    await notification!.save();
    return true;
  }),
  /** Finds a notification by ID and updates it with new data. */
  update: withErrorHandling(async (id, data) => {
    return await Notification.findByIdAndUpdate(id, data);
  }),
  /** Deletes a notification by its document ID. */
  delete: withErrorHandling(async (id) => {
    const deleted = await Notification.findByIdAndDelete(id);
    return deleted !== null;
  }),
};
