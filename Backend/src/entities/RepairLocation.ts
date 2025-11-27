import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a repair/service location for a seller in the database.
 */
export interface IRepairLocation extends Document {
  /** The unique identifier for the repair location document. */
  _id: Types.ObjectId;
  /** The ID of the `Seller` who owns this repair location. */
  seller_id: Types.ObjectId;
  /** The name of the repair location (e.g., "Main Service Center", "Downtown Branch"). */
  name: string;
  /** The full address of the repair location. */
  address: string;
  /** The latitude coordinate of the location. */
  latitude: number;
  /** The longitude coordinate of the location. */
  longitude: number;
  /** Contact phone number for this location. */
  phone?: string;
  /** Contact email for this location. */
  email?: string;
  /** Operating hours (e.g., "Mon-Fri: 9AM-6PM"). */
  operating_hours?: string;
  /** A brief description of services offered at this location. */
  description?: string;
  /** Whether this location is currently active and accepting repairs. */
  is_active: boolean;
}

/**
 * Mongoose schema for the RepairLocation collection.
 */
const RepairLocationSchema = new Schema<IRepairLocation>(
  {
    /** A reference to the `Seller` document who owns this repair location. */
    seller_id: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    /** The name of the repair location, which is required. */
    name: { type: String, required: true },
    /** The full address, which is required. */
    address: { type: String, required: true },
    /** The latitude coordinate, which is required. */
    latitude: { type: Number, required: true },
    /** The longitude coordinate, which is required. */
    longitude: { type: Number, required: true },
    /** Contact phone number. */
    phone: { type: String },
    /** Contact email. */
    email: { type: String },
    /** Operating hours. */
    operating_hours: { type: String },
    /** Description of services. */
    description: { type: String },
    /** Whether the location is active, defaults to true. */
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `seller_id`: To quickly find all repair locations for a specific seller.
 * - `is_active`: To efficiently query for active locations.
 * - `latitude` and `longitude`: For geospatial queries.
 */
RepairLocationSchema.index({ seller_id: 1 });
RepairLocationSchema.index({ is_active: 1 });
RepairLocationSchema.index({ latitude: 1, longitude: 1 });

/**
 * The Mongoose model for the RepairLocation collection.
 */
export const RepairLocation = model<IRepairLocation>(
  "RepairLocation",
  RepairLocationSchema
);

