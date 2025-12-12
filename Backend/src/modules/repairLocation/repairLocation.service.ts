import { IRepairLocationRepository } from "./repairLocation.repository";
import {
  RepairLocationDTO,
  UpdateRepairLocationDTO,
} from "../../dtos/repairLocation.DTO";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the repair location service.
 */
export interface IRepairLocationService {
  /**
   * Creates a new repair location.
   */
  createRepairLocation(
    data: RepairLocationDTO
  ): Promise<{ success: boolean; location?: any; error?: string }>;
  /**
   * Retrieves all repair locations for a specific seller.
   */
  getRepairLocationsBySeller(
    sellerId: string
  ): Promise<{ success: boolean; locations?: any[]; error?: string }>;
  /**
   * Retrieves all active repair locations (for buyers to view).
   */
  getAllActiveLocations(): Promise<{
    success: boolean;
    locations?: any[];
    error?: string;
  }>;
  /**
   * Retrieves a repair location by its ID.
   */
  getRepairLocationById(
    id: string
  ): Promise<{ success: boolean; location?: any; error?: string }>;
  /**
   * Updates an existing repair location.
   */
  updateRepairLocation(
    id: string,
    data: UpdateRepairLocationDTO
  ): Promise<{ success: boolean; location?: any; error?: string }>;
  /**
   * Deletes a repair location.
   */
  deleteRepairLocation(
    id: string
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the repair location service.
 */
export function repairLocationService(
  repo: IRepairLocationRepository
): IRepairLocationService {
  return {
    getRepairLocationsBySeller: async (sellerId) => {
      const cacheKey = `repair_locations_${sellerId}`;
      const locations = await CacheService.getOrSet(
        cacheKey,
        async () => {
          const data = await repo.findBySellerId(sellerId);
          return data ?? [];
        },
        3600 // Cache for 1 hour
      );
      
      console.log("Fetched locations from service:", locations);
      return { success: true, locations };
    },

    getAllActiveLocations: async () => {
      const cacheKey = "repair_locations_active";
      const locations = await CacheService.getOrSet(
        cacheKey,
        async () => {
          const data = await repo.findActiveLocations();
          return data ?? [];
        },
        3600 // Cache for 1 hour
      );

      return { success: true, locations };
    },

    getRepairLocationById: async (id) => {
      const cacheKey = `repair_location_${id}`;
      const location = await CacheService.getOrSet(
        cacheKey,
        async () => {
          const data = await repo.findById(id);
          return data ?? null;
        },
        3600
      );

      if (!location)
        return { success: false, error: "Repair location not found" };
      return { success: true, location };
    },

    createRepairLocation: async (data) => {
      // Check if location with same coordinates already exists for this seller
      const existingLocation = await repo.findByCoordinates?.(
        data.latitude,
        data.longitude,
        data.seller_id
      );

      if (existingLocation) {
        return {
          success: false,
          error:
            "A repair location with these coordinates already exists. Please use different coordinates.",
        };
      }

      const location = await repo.create(data);
      if (!location) {
        // Or throw a custom error
        throw new Error("Failed to create repair location");
      }

      // Invalidate caches
      await CacheService.delete(`repair_locations_${data.seller_id}`);
      await CacheService.delete("repair_locations_active");

      return { success: true, location };
    },

    updateRepairLocation: async (id, data) => {
      const existingLocation = await repo.findById(id);
      if (!existingLocation) {
        return { success: false, error: "Repair location not found" };
      }

      // Check if coordinates are being updated
      if (data.latitude !== undefined && data.longitude !== undefined) {
        // Check if another location with same coordinates exists (excluding current location)
        const duplicateLocation = await repo.findByCoordinates?.(
          data.latitude,
          data.longitude,
          existingLocation.seller_id._id.toString()
        );

        if (duplicateLocation && duplicateLocation._id.toString() !== id) {
          return {
            success: false,
            error:
              "A repair location with these coordinates already exists. Please use different coordinates.",
          };
        }
      }

      const location = await repo.update(id, data);
      if (!location) {
        // Or throw a custom error
        throw new Error("Failed to update repair location");
      }
      // Invalidate caches
      await CacheService.delete(`repair_location_${id}`);
      await CacheService.delete(`repair_locations_${existingLocation.seller_id._id}`);
      await CacheService.delete("repair_locations_active");

      return { success: true, location };
    },

    deleteRepairLocation: async (id) => {
      const existingLocation = await repo.findById(id);
      if (!existingLocation) {
        return { success: false, error: "Repair location not found" };
      }

      const deleted = await repo.delete(id);
      if (!deleted) {
        // Or throw a custom error
        throw new Error("Failed to delete repair location");
      }

      // Invalidate caches
      await CacheService.delete(`repair_location_${id}`);
      await CacheService.delete(`repair_locations_${existingLocation.seller_id._id}`);
      await CacheService.delete("repair_locations_active");

      return { success: true };
    },
  };
}
