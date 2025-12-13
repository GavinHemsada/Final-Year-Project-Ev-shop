import { Schema, model, Document, Types } from "mongoose";
import { NotificationType } from "../shared/enum/enum";

/**
 * Represents a user notification in the database.
 * Notifications are used to inform users about important events.
 */
export interface INotification extends Document {
  /** The unique identifier for the notification document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who will receive the notification. */
  user_id?: Types.ObjectId;
  /** The ID of the `Seller` associated with the notification, if applicable. */
  seller_id?: Types.ObjectId;
  /** The ID of the `Financial` entity associated with the notification, if applicable. */
  financial_id?: Types.ObjectId;
  /** The type of the notification (e.g., 'NewOrder', 'PasswordReset'). */
  type: NotificationType;
  /** The title of the notification. */
  title: string;
  /** The detailed message content of the notification. */
  message: string;
  /** A boolean flag indicating whether the user has read the notification. */
  is_read: boolean;
}

/**
 * Mongoose schema for the Notification collection.
 */
const NotificationSchema = new Schema<INotification>(
  {
    /** A reference to the `User` who owns this notification. */
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    /** A reference to the `Seller` associated with the notification, if applicable. */
    seller_id: { type: Schema.Types.ObjectId, ref: "Seller" },
    /** A reference to the `Financial` entity associated with the notification, if applicable. */
    financial_id: { type: Schema.Types.ObjectId, ref: "FinancialInstitution" },
    /** The type of notification, controlled by the `NotificationType` enum. */
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    /** The title of the notification, which is required. */
    title: { type: String, required: true },
    /** The message body of the notification, which is required. */
    message: { type: String, required: true },
    /** A flag to track the read status of the notification. Defaults to false. */
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `user_id`: To quickly find all notifications for a specific user.
 * - `type`: To allow for filtering notifications by type.
 * - `is_read`: To efficiently query for read or unread notifications.
 */
NotificationSchema.index({ user_id: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ is_read: 1 });

/**
 * The Mongoose model for the Notification collection.
 */
export const Notification = model<INotification>(
  "Notification",
  NotificationSchema
);
