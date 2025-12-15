import { Schema, model, Document, Types } from "mongoose";
import { TestDriveBookingStatus } from "../shared/enum/enum";

/**
 * Represents a customer's booking for a test drive in the database.
 */
export interface ITestDriveBooking extends Document {
  /** The unique identifier for the test drive booking document. */
  _id: Types.ObjectId;
  /** The ID of the `User` (customer) who made the booking. */
  customer_id: Types.ObjectId;
  /** The ID of the `TestDriveSlot` that was booked. */
  slot_id: Types.ObjectId;
  /** The specific date of the booking. */
  booking_date: Date;
  /** The specific time of the booking (e.g., "14:00"). */
  booking_time: string;
  /** The current status of the booking (e.g., "Confirmed", "Cancelled", "Completed"). */
  status: TestDriveBookingStatus;
  /** An optional numerical rating (1-5) provided by the customer after the test drive. */
  feedback_rating?: number;
  /** An optional text comment provided by the customer as feedback. */
  feedback_comment?: string;
  /** The expected duration of the test drive in minutes. */
  duration_minutes: number;
  /** Indicates whether a reminder has been sent to the customer. */
  reminder_sent: boolean;
}

/**
 * Mongoose schema for the TestDriveBooking collection.
 */
const TestDriveBookingSchema = new Schema<ITestDriveBooking>(
  {
    /** A reference to the `User` document for the customer. */
    customer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** A reference to the `TestDriveSlot` document being booked. */
    slot_id: {
      type: Schema.Types.ObjectId,
      ref: "TestDriveSlot",
      required: true,
    },
    /** The date of the booking, which is required. */
    booking_date: { type: Date, required: true },
    /** The time of the booking, which is required. */
    booking_time: { type: String, required: true },
    /** The status of the booking, controlled by the `TestDriveBookingStatus` enum. */
    status: {
      type: String,
      enum: Object.values(TestDriveBookingStatus),
      required: true,
    },
    /** An optional rating for the test drive experience, between 1 and 5. */
    feedback_rating: { type: Number, min: 1, max: 5 },
    /** An optional text comment for feedback. */
    feedback_comment: { type: String },
    /** The duration of the test drive in minutes, which is required. */
    duration_minutes: { type: Number, required: true },
    /** A flag indicating if a reminder has been sent to the customer. */
    reminder_sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `customer_id`: To quickly find all bookings for a specific customer.
 * - `slot_id`: To find all bookings for a specific slot.
 * - `booking_date`: To sort bookings chronologically.
 * - `status`: To efficiently filter bookings by their status.
 */
TestDriveBookingSchema.index({ customer_id: 1 });
TestDriveBookingSchema.index({ slot_id: 1 });
TestDriveBookingSchema.index({ booking_date: 1 });
TestDriveBookingSchema.index({ status: 1 });

/**
 * The Mongoose model for the TestDriveBooking collection.
 */
export const TestDriveBooking = model<ITestDriveBooking>(
  "TestDriveBooking",
  TestDriveBookingSchema
);
