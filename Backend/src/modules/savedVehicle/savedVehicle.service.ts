import { SaveVehicleDTO } from "../../dtos/savedVehicle.DTO";
import { ISavedVehicleRepository } from "./savedVehicle.repository";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the saved vehicle service, outlining methods
 * for managing saved vehicles (wishlist).
 */
export interface ISavedVehicleService {
  /**
   * Retrieves all saved vehicles for a user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing saved vehicles or an error.
   */
  getSavedVehicles(
    userId: string
  ): Promise<{ success: boolean; savedVehicles?: any[]; error?: string }>;
  /**
   * Saves a vehicle for a user.
   * @param data - The data containing user ID and listing ID.
   * @returns A promise that resolves to an object containing the saved vehicle or an error.
   */
  saveVehicle(
    data: SaveVehicleDTO
  ): Promise<{ success: boolean; savedVehicle?: any; error?: string }>;
  /**
   * Removes a saved vehicle.
   * @param userId - The ID of the user.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  removeSavedVehicle(
    userId: string,
    listingId: string
  ): Promise<{ success: boolean; error?: string }>;
  /**
   * Checks if a vehicle is saved by a user.
   * @param userId - The ID of the user.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to an object indicating if the vehicle is saved.
   */
  isVehicleSaved(
    userId: string,
    listingId: string
  ): Promise<{ success: boolean; isSaved?: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the saved vehicle service.
 * It encapsulates the business logic for managing saved vehicles, including caching strategies.
 *
 * @param savedVehicleRepo - The repository for saved vehicle data access.
 * @returns An implementation of the ISavedVehicleService interface.
 */
export function savedVehicleService(
  savedVehicleRepo: ISavedVehicleRepository
): ISavedVehicleService {
  return {
    /**
     * Retrieves all saved vehicles for a user, using a cache-aside pattern.
     * The saved vehicles are cached for 30 minutes.
     */
    getSavedVehicles: async (userId) => {
      try {
        const cacheKey = `saved_vehicles_${userId}`;
        const savedVehicles = await CacheService.getOrSet(
          cacheKey,
          async () => {
            return await savedVehicleRepo.findSavedVehiclesByUserId(userId);
          },
          1800 // Cache for 30 minutes
        );
        // Handle null case (error occurred) by defaulting to empty array
        return { success: true, savedVehicles: savedVehicles ?? [] };
      } catch (err) {
        return { success: false, error: "Failed to retrieve saved vehicles" };
      }
    },

    /**
     * Saves a vehicle for a user. If already saved, returns success.
     * Invalidates the user's saved vehicles cache after saving.
     */
    saveVehicle: async (data) => {
      try {
        const cacheKey = `saved_vehicles_${data.user_id}`;
        
        // Check if already saved
        const existing = await savedVehicleRepo.findSavedVehicleByUserAndListing(
          data.user_id,
          data.listing_id
        );
        
        if (existing) {
          return { success: true, savedVehicle: existing };
        }

        const savedVehicle = await savedVehicleRepo.saveVehicle(
          data.user_id,
          data.listing_id
        );

        // Invalidate cache
        await CacheService.delete(cacheKey);
        return { success: true, savedVehicle };
      } catch (err: any) {
        // Handle duplicate key error (unique constraint)
        if (err.code === 11000) {
          return { success: true, error: "Vehicle already saved" };
        }
        return { success: false, error: "Failed to save vehicle" };
      }
    },

    /**
     * Removes a saved vehicle and invalidates the user's cache.
     */
    removeSavedVehicle: async (userId, listingId) => {
      try {
        const cacheKey = `saved_vehicles_${userId}`;
        const success = await savedVehicleRepo.removeSavedVehicleByUserAndListing(
          userId,
          listingId
        );
        
        // Handle null case (error occurred)
        if (success === null || success === false) {
          return { success: false, error: "Saved vehicle not found" };
        }

        // Invalidate cache
        await CacheService.delete(cacheKey);
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to remove saved vehicle" };
      }
    },

    /**
     * Checks if a vehicle is saved by a user.
     */
    isVehicleSaved: async (userId, listingId) => {
      try {
        const isSaved = await savedVehicleRepo.isVehicleSaved(userId, listingId);
        // Handle null case (error occurred) by defaulting to false
        return { success: true, isSaved: isSaved ?? false };
      } catch (err) {
        return { success: false, error: "Failed to check saved status" };
      }
    },
  };
}

