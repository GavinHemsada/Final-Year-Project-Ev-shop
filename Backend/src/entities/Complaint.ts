import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a user complaint document in the database.
 */
export interface IComplaint extends Document {
  /** The unique identifier for the complaint document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who submitted the complaint. */
  user_id: Types.ObjectId;
  /** The type of user who submitted the complaint (buyer, seller, financial). */
  user_type: string;
  /** The subject/title of the complaint. */
  subject: string;
  /** The detailed message/description of the complaint. */
  message: string;
  /** The current status of the complaint (e.g., "Pending", "Resolved"). */
  status: string;
}

/**
 * Mongoose schema for the Complaint collection.
 */
const ComplaintSchema = new Schema(
  {
    /** A reference to the `User` who submitted the complaint. */
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** The type of user who submitted the complaint. */
    user_type: { type: String, required: true, enum: ["buyer", "seller", "financial"], default: "buyer" },
    /** The subject/title of the complaint. */
    subject: { type: String, required: true },
    /** The detailed message/description of the complaint. */
    message: { type: String, required: true },
    /** The current status of the complaint. Defaults to "Pending". */
    status: { type: String, default: "Pending", enum: ["Pending", "Resolved"], required: true },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 */
ComplaintSchema.index({ user_id: 1 });
ComplaintSchema.index({ user_type: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });

/**
 * Mongoose model for the Complaint collection.
 */
export const Complaint = model<IComplaint>("Complaint", ComplaintSchema);
