import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a saved vehicle (wishlist item) in the database.
 * This allows users to save vehicle listings for later viewing.
 */
export interface ISavedVehicle extends Document {
  /** The unique identifier for the saved vehicle document. */
  _id: Types.ObjectId;
  /** The ID of the user who saved this vehicle. */
  user_id: Types.ObjectId;
  /** The ID of the vehicle listing being saved. */
  listing_id: Types.ObjectId;
}

/**
 * Mongoose schema for the SavedVehicle collection.
 */
const SavedVehicleSchema = new Schema<ISavedVehicle>(
  {
    /**
     * A reference to the User who saved the vehicle.
     */
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /**
     * A reference to the VehicleListing being saved.
     */
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: "VehicleListing",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize query performance.
 * - `user_id`: To quickly find all saved vehicles for a specific user.
 * - `listing_id`: To find all users who saved a specific listing.
 * - Compound index: Ensures a user can only save a listing once.
 */
SavedVehicleSchema.index({ user_id: 1 });
SavedVehicleSchema.index({ listing_id: 1 });
SavedVehicleSchema.index({ user_id: 1, listing_id: 1 }, { unique: true });

/**
 * The Mongoose model for the SavedVehicle collection.
 */
export const SavedVehicle = model<ISavedVehicle>(
  "SavedVehicle",
  SavedVehicleSchema
);

