import { Types } from "mongoose";
import {
  SavedVehicle,
  ISavedVehicle,
} from "../../entities/SavedVehicle";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the saved vehicle repository, specifying the methods
 * for data access operations related to saved vehicles.
 */
export interface ISavedVehicleRepository {
  /**
   * Finds all saved vehicles for a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of saved vehicle documents or null.
   */
  findSavedVehiclesByUserId(userId: string): Promise<ISavedVehicle[] | null>;
  /**
   * Finds a specific saved vehicle by user ID and listing ID.
   * @param userId - The ID of the user.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to the saved vehicle document or null if not found.
   */
  findSavedVehicleByUserAndListing(
    userId: string,
    listingId: string
  ): Promise<ISavedVehicle | null>;
  /**
   * Creates a new saved vehicle entry.
   * @param userId - The ID of the user saving the vehicle.
   * @param listingId - The ID of the vehicle listing being saved.
   * @returns A promise that resolves to the newly created saved vehicle document or null.
   */
  saveVehicle(
    userId: string,
    listingId: string
  ): Promise<ISavedVehicle | null>;
  /**
   * Removes a saved vehicle entry.
   * @param savedVehicleId - The ID of the saved vehicle document to remove.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  removeSavedVehicle(savedVehicleId: string): Promise<boolean | null>;
  /**
   * Removes a saved vehicle by user ID and listing ID.
   * @param userId - The ID of the user.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  removeSavedVehicleByUserAndListing(
    userId: string,
    listingId: string
  ): Promise<boolean | null>;
  /**
   * Checks if a vehicle is saved by a user.
   * @param userId - The ID of the user.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to true if saved, false if not saved, or null on error.
   */
  isVehicleSaved(userId: string, listingId: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the ISavedVehicleRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const SavedVehicleRepository: ISavedVehicleRepository = {
  /** Finds all saved vehicles for a specific user, populating listing details. */
  findSavedVehiclesByUserId: withErrorHandling(async (userId: string) => {
    return await SavedVehicle.find({
      user_id: new Types.ObjectId(userId),
    })
      .populate({
        path: "listing_id",
        populate: [
          {
            path: "model_id",
            populate: [
              { path: "brand_id", select: "brand_name brand_logo description" },
              { path: "category_id", select: "category_name description" },
            ],
          },
          {
            path: "seller_id",
            select: "business_name user_id shop_logo",
            populate: {
              path: "user_id",
              select: "profile_image name",
            },
          },
        ],
      })
      .sort({ createdAt: -1 });
  }),

  /** Finds a specific saved vehicle by user ID and listing ID. */
  findSavedVehicleByUserAndListing: withErrorHandling(
    async (userId: string, listingId: string) => {
      return await SavedVehicle.findOne({
        user_id: new Types.ObjectId(userId),
        listing_id: new Types.ObjectId(listingId),
      });
    }
  ),

  /** Creates a new saved vehicle entry. */
  saveVehicle: withErrorHandling(
    async (userId: string, listingId: string) => {
      const savedVehicle = new SavedVehicle({
        user_id: new Types.ObjectId(userId),
        listing_id: new Types.ObjectId(listingId),
      });
      return await savedVehicle.save();
    }
  ),

  /** Removes a saved vehicle by its document ID. */
  removeSavedVehicle: withErrorHandling(async (savedVehicleId: string) => {
    const result = await SavedVehicle.findByIdAndDelete(savedVehicleId);
    return result !== null;
  }),

  /** Removes a saved vehicle by user ID and listing ID. */
  removeSavedVehicleByUserAndListing: withErrorHandling(
    async (userId: string, listingId: string) => {
      const result = await SavedVehicle.findOneAndDelete({
        user_id: new Types.ObjectId(userId),
        listing_id: new Types.ObjectId(listingId),
      });
      return result !== null;
    }
  ),

  /** Checks if a vehicle is saved by a user. */
  isVehicleSaved: withErrorHandling(async (userId: string, listingId: string) => {
    const saved = await SavedVehicle.findOne({
      user_id: new Types.ObjectId(userId),
      listing_id: new Types.ObjectId(listingId),
    });
    return saved !== null;
  }),
};

