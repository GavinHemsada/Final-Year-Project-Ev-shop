import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a seller profile in the database.
 * This extends a standard `User` with business-specific information.
 */
export interface ISeller extends Document {
  /** The unique identifier for the seller document. */
  _id: Types.ObjectId;
  /** The ID of the `User` account this seller profile is linked to. */
  user_id: Types.ObjectId;
  /** The legal or trading name of the seller's business. This field is optional. */
  business_name?: string;
  /** The seller's business license or registration number. This field is optional. */
  license_number?: string;
  /** A brief description of the seller's business. This field is optional. */
  description?: string;
  /** The URL of the seller's business website. This field is optional. */
  website?: string;
  /** The path to the seller's shop logo image. This field is optional. */
  shop_logo?: string;
  /** The seller's average rating, calculated from all reviews. This field is optional. */
  rating?: number;
  /** The total number of reviews the seller has received. */
  total_reviews: number;
  /** The physical address of the seller's business. */
  street_address: string;
   /** City where the business is located. */
  city: string;

  /** State / province / district. */
  state: string;

  /** Postal or ZIP code. */
  postal_code: string;

  /** Country name. */
  country: string;
}

/**
 * Mongoose schema for the Seller collection.
 */
const SellerSchema = new Schema<ISeller>(
  {
    /** A reference to the `User` document, creating a one-to-one link. */
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** The name of the seller's business. */
    business_name: String,
    /** The seller's business license number. */
    license_number: String,
    /** A text description of the seller's business. */
    description: String,
    /** The URL for the seller's website. */
    website: String,
    /** The path to the seller's shop logo image. */
    shop_logo: String,
    /** The calculated average rating for the seller, with a range of 0 to 5. */
    rating: { type: Number, min: 0, max: 5 },
    /** The total count of reviews received by the seller, defaulting to 0. */
    total_reviews: { type: Number, default: 0 },
    /** The physical address of the seller's business. */
    street_address: { type: String},
    /** City where the business is located. */
    city: { type: String },
    /** State / province / district. */
    state: { type: String },
    /** Postal or ZIP code. */
    postal_code: { type: String },
    /** Country name. */
    country: { type: String },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `user_id`: To quickly find the seller profile for a specific user.
 * - `rating`: To allow for efficient filtering and sorting of sellers by their rating.
 */
SellerSchema.index({ user_id: 1 });
SellerSchema.index({ rating: 1 });

/**
 * The Mongoose model for the Seller collection.
 */
export const Seller = model<ISeller>("Seller", SellerSchema);
