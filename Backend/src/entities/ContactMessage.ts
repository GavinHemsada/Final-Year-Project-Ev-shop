import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a contact message document in the database.
 */
export interface IContactMessage extends Document {
  /** The unique identifier for the contact message document. */
  _id: Types.ObjectId;
  /** The full name of the person sending the message. */
  name: string;
  /** The email address of the person sending the message. */
  email: string;
  /** The phone number (optional). */
  phone?: string;
  /** The subject/title of the message. */
  subject: string;
  /** The detailed message content. */
  message: string;
  /** Whether the message has been read by admin. */
  isRead: boolean;
  /** Whether the message has been replied to. */
  isReplied: boolean;
}

/**
 * Mongoose schema for the ContactMessage collection.
 */
const ContactMessageSchema = new Schema(
  {
    /** The full name of the person sending the message. */
    name: { type: String, required: true },
    /** The email address of the person sending the message. */
    email: { type: String, required: true },
    /** The phone number (optional). */
    phone: { type: String, required: false },
    /** The subject/title of the message. */
    subject: { type: String, required: true },
    /** The detailed message content. */
    message: { type: String, required: true },
    /** Whether the message has been read by admin. Defaults to false. */
    isRead: { type: Boolean, default: false },
    /** Whether the message has been replied to. Defaults to false. */
    isReplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 */
ContactMessageSchema.index({ email: 1 });
ContactMessageSchema.index({ isRead: 1 });
ContactMessageSchema.index({ createdAt: -1 });

/**
 * Mongoose model for the ContactMessage collection.
 */
export const ContactMessage = model<IContactMessage>("ContactMessage", ContactMessageSchema);
