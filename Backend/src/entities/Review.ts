import { Schema, model, Document, Types } from "mongoose";
import { ReviewType } from "../shared/enum/enum";

/**
 * Represents a user-submitted review in the database.
 * Reviews can be for different types of targets, such as products or sellers.
 */
export interface IReview extends Document {
  /** The unique identifier for the review document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who wrote the review. */
  reviewer_id: Types.ObjectId;
  /**
   * The ID of the `Order` associated with this review.
   * This is optional but helps verify that the reviewer made a purchase.
   */
  order_id?: Types.ObjectId;
  /** The ID of the `TestDrive` associated with this review, if applicable. */
  testDrive_id?: Types.ObjectId;
  /** The type of entity being reviewed (e.g., 'Product', 'Service'). */
  target_type: ReviewType;
  /** The ID of the specific entity being reviewed (e.g., a seller's ID or a product's ID). */
  target_id: Types.ObjectId;
  /** The numerical rating given by the reviewer, on a scale of 1 to 5. */
  rating: number;
  /** A short, descriptive title for the review. This field is optional. */
  title?: string;
  /** The detailed text content of the review. This field is optional. */
  comment?: string;
}

/**
 * Mongoose schema for the Review collection.
 */
const ReviewSchema = new Schema<IReview>(
  {
    /** A reference to the `User` who wrote the review. */
    reviewer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** The type of entity being reviewed, controlled by the `ReviewType` enum. */
    target_type: {
      type: String,
      enum: Object.values(ReviewType),
      required: true,
    },
    /** An optional reference to the `Order` to link the review to a specific transaction. */
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    /** An optional reference to the `TestDrive` to link the review to a specific test drive experience. */
    testDrive_id: { type: Schema.Types.ObjectId, ref: "TestDriveBooking" },
    /** The ID of the reviewed entity. Note: This field does not have a `ref` because it can refer to different collections (e.g., 'Seller', 'VehicleListing') based on `target_type`. */
    target_id: { type: Schema.Types.ObjectId, required: true },
    /** The numerical rating, required to be between 1 and 5. */
    rating: { type: Number, min: 1, max: 5, required: true },
    /** An optional title for the review. */
    title: String,
    /** An optional detailed comment for the review. */
    comment: String,
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `reviewer_id`: To quickly find all reviews by a specific user.
 * - `target_id`: To quickly find all reviews for a specific product or seller.
 * - `rating`: To allow for efficient filtering and sorting by rating.
 */
ReviewSchema.index({ reviewer_id: 1 });
ReviewSchema.index({ target_id: 1 });
ReviewSchema.index({ rating: 1 });

/**
 * The Mongoose model for the Review collection.
 */
export const Review = model<IReview>("Review", ReviewSchema);
