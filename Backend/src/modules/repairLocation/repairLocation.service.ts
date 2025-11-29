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
  getAllActiveLocations(): Promise<{ success: boolean; locations?: any[]; error?: string }>;
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
    createRepairLocation: async (data) => {
      try {
        const location = await repo.create(data);
        if (!location)
          return { success: false, error: "Failed to create repair location" };

        // Invalidate cache
        await CacheService.delete(`repair_locations_${data.seller_id}`);
        await CacheService.delete("repair_locations");

        return { success: true, location };
      } catch (err) {
        return { success: false, error: "Failed to create repair location" };
      }
    },

    getRepairLocationsBySeller: async (sellerId) => {
      try {
        const cacheKey = `repair_locations_${sellerId}`;
        const locations = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findBySellerId(sellerId);
            return data ?? [];
          },
          3600
        );

        return { success: true, locations };
      } catch (err) {
        return { success: false, error: "Failed to fetch repair locations" };
      }
    },

    getAllActiveLocations: async () => {
      try {
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
      } catch (err) {
        return { success: false, error: "Failed to fetch active repair locations" };
      }
    },

    getRepairLocationById: async (id) => {
      try {
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
      } catch (err) {
        return { success: false, error: "Failed to fetch repair location" };
      }
    },

    updateRepairLocation: async (id, data) => {
      try {
        const existingLocation = await repo.findById(id);
        if (!existingLocation) {
          return { success: false, error: "Repair location not found" };
        }

        const location = await repo.update(id, data);
        if (!location)
          return { success: false, error: "Failed to update repair location" };

        // Invalidate caches
        await CacheService.delete(`repair_location_${id}`);
        await CacheService.delete(
          `repair_locations_${existingLocation.seller_id}`
        );
        await CacheService.delete("repair_locations");

        return { success: true, location };
      } catch (err) {
        return { success: false, error: "Failed to update repair location" };
      }
    },

    deleteRepairLocation: async (id) => {
      try {
        const existingLocation = await repo.findById(id);
        if (!existingLocation) {
          return { success: false, error: "Repair location not found" };
        }

        const deleted = await repo.delete(id);
        if (!deleted)
          return { success: false, error: "Failed to delete repair location" };

        // Invalidate caches
        await CacheService.delete(`repair_location_${id}`);
        await CacheService.delete(
          `repair_locations_${existingLocation.seller_id}`
        );
        await CacheService.delete("repair_locations");

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete repair location" };
      }
    },
  };
}

