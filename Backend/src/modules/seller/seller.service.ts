import { SellerDTO, UpdateSellerDTO } from "../../dtos/seller.DTO";
import { ISellerRepository } from "./seller.repository";
import { IUserRepository } from "../user/user.repository";
import { IReviewRepository } from "../review/review.repository";
import CacheService from "../../shared/cache/CacheService";
import { UserRole } from "../../shared/enum/enum";
import { addImage, deleteImage } from "../../shared/utils/imageHandel";

/**
 * Defines the interface for the seller service, outlining the methods for managing seller profiles.
 */
export interface ISellerService {
  /**
   * Creates a new seller profile.
   * @param data - The data for the new seller profile.
   * @returns A promise that resolves to an object containing the created seller or an error.
   */
  createSeller(
    data: SellerDTO
  ): Promise<{ success: boolean; seller?: any; error?: string }>;
  /**
   * Finds a seller by their unique ID.
   * @param id - The ID of the seller to find.
   * @returns A promise that resolves to an object containing the seller data or an error.
   */
  getSellerById(
    id: string
  ): Promise<{ success: boolean; seller?: any; error?: string }>;
  /**
   * Finds a seller profile by the associated user's ID.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing the seller data or an error.
   */
  getSellerByUserId(
    userId: string
  ): Promise<{ success: boolean; seller?: any; error?: string }>;
  /**
   * Retrieves all seller profiles.
   * @returns A promise that resolves to an object containing an array of all sellers or an error.
   */
  getAllSellers(): Promise<{
    success: boolean;
    sellers?: any[];
    error?: string;
  }>;
  /**
   * Updates a seller's average rating and total review count based on all reviews.
   * @param id - The ID of the seller to update.
   * @returns A promise that resolves to an object containing the updated seller data or an error.
   */
  updateRatingAndReviewCount(
    id: string
  ): Promise<{ success: boolean; seller?: any; error?: string }>;
  /**
   * Updates an existing seller's profile information.
   * @param id - The ID of the seller to update.
   * @param data - The partial data to update the seller with.
   * @returns A promise that resolves to an object containing the updated seller data or an error.
   */
  updateSeller(
    id: string,
    data: UpdateSellerDTO,
    file?: Express.Multer.File
  ): Promise<{ success: boolean; seller?: any; error?: string }>;
  /**
   * Deletes a seller profile by its unique ID.
   * @param id - The ID of the seller to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteSeller(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the seller service.
 * It encapsulates the business logic for managing seller profiles, including caching strategies
 * to improve performance.
 *
 * @param repo - The repository for seller data access.
 * @param userRepo - The repository for user data access.
 * @param reviwRepo - The repository for review data access.
 * @returns An implementation of the ISellerService interface.
 */
export function sellerService(
  repo: ISellerRepository,
  userRepo: IUserRepository,
  reviwRepo: IReviewRepository
): ISellerService {
  return {
    /**
     * Finds a single seller by their ID, using a cache-aside pattern.
     * Caches the individual seller data for one hour.
     */
    getSellerById: async (id) => {
      try {
        const cacheKey = `seller_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const cachedSeller = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const seller = await repo.findById(id);
            return seller ?? null;
          },
          3600 // Cache TTL: 1 hour
        );
        if (!cachedSeller) return { success: false, error: "Seller not found" };
        return { success: true, seller: cachedSeller };
      } catch (err) {
        return { success: false, error: "Failed to retrieve seller" };
      }
    },
    /**
     * Finds a seller profile by the associated user's ID, using a cache-aside pattern.
     * Caches the seller data for one hour.
     */
    getSellerByUserId: async (userId) => {
      try {
        const cacheKey = `seller_user_${userId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const cachedSeller = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const seller = await repo.findByUserId(userId);
            return seller ?? null;
          },
          3600 // Cache TTL: 1 hour
        );
        if (!cachedSeller)
          return {
            success: false,
            error: "Seller profile not found for this user",
          };
        return { success: true, seller: cachedSeller };
      } catch (err) {
        return { success: false, error: "Failed to retrieve seller" };
      }
    },
    /**
     * Retrieves all sellers, utilizing a cache-aside pattern.
     * Caches the list of all sellers for one hour.
     */
    getAllSellers: async () => {
      try {
        const cacheKey = "sellers";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const sellers = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const allSellers = await repo.findAll();
            return allSellers ?? [];
          },
          3600 // Cache TTL: 1 hour
        );
        if (!sellers) return { success: false, error: "No sellers found" };
        return { success: true, sellers };
      } catch (err) {
        return { success: false, error: "Failed to retrieve sellers" };
      }
    },
    /**
     * Creates a new seller profile, assigns the 'SELLER' role to the user,
     * and invalidates the cache for the list of all sellers.
     */
    createSeller: async (data) => {
      try {
        // Ensure a user doesn't already have a seller profile.
        console.log("data.user_id", data);
        const existingSeller = await repo.findByUserId(data.user_id);
        if (existingSeller) {
          return { success: false, error: "User already has a seller profile" };
        }
        const sellers = await repo.findAll();
        if (sellers && sellers.length > 0 && sellers.some(s => s.business_name === data.business_name)) {
          return { success: false, error: "name already exists" };
        }
        const seller = await repo.create(data);
        const user = await userRepo.findById(data.user_id);
        if (!user) return { success: false, error: "User not found" };
        // Add SELLER role to the user.
        user.role.push(UserRole.SELLER);

        const updatedUser = await user.save();
        if (!updatedUser)
          return { success: false, error: "Failed to update user role" };

        // Invalidate the cache for the list of all sellers.
        await CacheService.delete("sellers");
        await CacheService.deletePattern(`seller_*`);

        return { success: true, seller };
      } catch (err) {
        return { success: false, error: "Failed to create seller profile" };
      }
    },
    /**
     * Calculates and updates a seller's average rating and review count.
     * This method iterates through all reviews to find those related to the seller and then updates the seller's record.
     * Invalidates all caches related to this seller upon successful update.
     */
    updateRatingAndReviewCount: async (id) => {
      try {
        console.log(`Service: Updating rating for seller ${id}`);
        const existingSeller = await repo.findById(id);
        if (!existingSeller) {
          console.error(`Service: Seller ${id} not found`);
          return { success: false, error: "Seller not found" };
        }
        const reviews = await reviwRepo.getAllReviews();
        if (!reviews) {
             console.error("Service: Failed to retrieve reviews");
             return { success: false, error: "Failed to retrieve reviews" };
        }
           
        console.log(`Service: Found ${reviews.length} reviews`);
        let rating = 0;
        let reviewCount = 0;
        // Aggregate rating and count from reviews associated with the seller.
        reviews.forEach((element) => {
          const order: any = element.order_id;
           // Check if order exists and has a seller_id before accessing toString()
          if (order && order.seller_id && order.seller_id.toString() === id) {
            reviewCount++;
            rating += element.rating;
          }
        });

        console.log(`Service: Calculated rating: ${rating}, reviewCount: ${reviewCount}`);

        const avgRating = reviewCount > 0 ? rating / reviewCount : 0;

        const seller = await repo.updateRatingAndReviewCount(
          id,
          avgRating,
          reviewCount
        );
        if (!seller)
          return {
            success: false,
            error: "Failed to retrieve reviewscount and rating",
          };

        // Invalidate relevant caches after update.
        await Promise.all([
          CacheService.delete("sellers"),
          CacheService.delete(`seller_${id}`),
          CacheService.delete(`seller_user_${existingSeller.user_id}`),
          CacheService.deletePattern(`seller_*`),
        ]);

        return { success: true, seller };
      } catch (err) {
        console.error("Service: Error updating ratings:", err);
        return { success: false, error: "Failed to retrieve sellers" };
      }
    },
    /**
     * Updates a seller's profile information.
     * Invalidates all caches related to this seller to ensure data consistency.
     */
    updateSeller: async (id, data, file) => {
      try {
        const existingSeller = await repo.findById(id);
        if (!existingSeller) {
          return { success: false, error: "Seller not found" };
        }

        // Handle shop logo upload
        const updateData: any = { ...data };
        if (file) {
          const sellerFolder = "Seller";
          const logoPath = addImage(file, sellerFolder);
          // Delete old logo if it exists
          if (existingSeller.shop_logo) {
            deleteImage(existingSeller.shop_logo);
          }
          updateData.shop_logo = logoPath;
        }

        const seller = await repo.update(id, updateData);
        if (!seller) return { success: false, error: "Seller not found" };

        // Invalidate caches to ensure data consistency on next read.
        await Promise.all([
          CacheService.delete("sellers"),
          CacheService.delete(`seller_${id}`),
          CacheService.delete(`seller_user_${existingSeller.user_id}`),
          CacheService.deletePattern(`seller_*`),
        ]);

        return { success: true, seller };
      } catch (err) {
        return { success: false, error: "Failed to update seller profile" };
      }
    },

    /**
     * Deletes a seller's profile.
     * Invalidates all caches related to this seller before performing the deletion.
     */
    deleteSeller: async (id) => {
      try {
        const existingSeller = await repo.findById(id);
        if (existingSeller) {
          // Invalidate caches before deletion.
          await Promise.all([
            CacheService.delete("sellers"),
            CacheService.delete(`seller_${id}`),
            CacheService.delete(`seller_user_${existingSeller.user_id}`),
            CacheService.deletePattern(`seller_*`),
          ]);
        }
        const success = await repo.delete(id);
        if (!success) return { success: false, error: "Seller not found" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete seller profile" };
      }
    },
  };
}
