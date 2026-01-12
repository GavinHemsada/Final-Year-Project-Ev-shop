import { Schema, model, Document, Types } from "mongoose";
import { ApplicationStatus } from "../shared/enum/enum";

/**
 * Represents a user's application for a financial product.
 */
export interface IFinancingApplication extends Document {
  /** The unique identifier for the financing application document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who submitted the application. */
  user_id: Types.ObjectId;
  /** The ID of the `FinancialProduct` being applied for. */
  product_id: Types.ObjectId;
  /** An optional ID of the order this application is for (for lease applications). */
  order_id?: Types.ObjectId;
  /** An optional message from the applicant to the institution. */
  message_text?: string;
  /** A flexible object containing the core data submitted by the applicant (e.g., name, income, requested amount). */
  application_data: Record<string, any>;
  /** The current status of the application (e.g., "Pending", "Approved", "Rejected"). */
  status: ApplicationStatus;
  /** The loan amount approved by the institution. This is typically set when the status is "Approved". This field is optional. */
  approval_amount?: number;
  /** An object containing the final terms of the loan (e.g., interest rate, final term). This field is optional. */
  terms?: Record<string, any>;
  /** The reason for rejection, required if the status is "Rejected". This field is optional. */
  rejection_reason?: string;
  /** The timestamp when the application was processed (e.g., approved or rejected). This field is optional. */
  processed_at?: Date;
}

/**
 * Mongoose schema for the FinancingApplication collection.
 */
const FinancingApplicationSchema = new Schema<IFinancingApplication>(
  {
    /** A reference to the `User` who submitted the application. */
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** A reference to the `FinancialProduct` being applied for. */
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "FinancialProduct",
      required: true,
    },
    /** A reference to the order this application is for, if any. */
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    /** An optional text message from the applicant. */
    message_text: { type: String },
    /** A flexible map to store the applicant's submitted data. */
    application_data: { type: Map, of: Schema.Types.Mixed, required: true },
    /** The current status of the application, controlled by the `ApplicationStatus` enum. */
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      required: true,
    },
    /** The final approved loan amount. */
    approval_amount: { type: Number },
    /** A flexible map to store the final loan terms. */
    terms: { type: Map, of: Schema.Types.Mixed },
    /** A string explaining why the application was rejected. */
    rejection_reason: { type: String },
    /** The date and time the application was processed. */
    processed_at: { type: Date },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `user_id`: To quickly find all applications submitted by a specific user.
 * - `product_id`: To find all applications for a specific financial product.
 * - `status`: To allow for efficient filtering by application status.
 */
FinancingApplicationSchema.index({ user_id: 1 });
FinancingApplicationSchema.index({ product_id: 1 });
FinancingApplicationSchema.index({ status: 1 });

/**
 * The Mongoose model for the FinancingApplication collection.
 */
export const FinancingApplication = model<IFinancingApplication>(
  "FinancingApplication",
  FinancingApplicationSchema
);
