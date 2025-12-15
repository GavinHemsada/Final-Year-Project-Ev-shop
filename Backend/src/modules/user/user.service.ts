import { IUserRepository } from "./user.repository";
import { UserDTO } from "../../dtos/user.DTO";
import { addImage, deleteImage } from "../../shared/utils/imageHandel";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the user service, outlining the methods for user-related business logic.
 */
export interface IUserService {
  /**
   * Finds a user by their unique ID.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to an object containing the user data or an error.
   */
  findById(
    id: string
  ): Promise<{ success: boolean; user?: any; error?: string }>;
  /**
   * Updates a user's information.
   * @param id - The ID of the user to update.
   * @param data - The partial user data to update.
   * @param file - An optional file for the user's profile image.
   * @returns A promise that resolves to an object containing the updated user data or an error.
   */
  update(
    id: string,
    data: Partial<UserDTO>,
    file?: Express.Multer.File
  ): Promise<{ success: boolean; user?: any; error?: string }>;

  /**
   * Deletes a user by their unique ID.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Retrieves all users.
   * @returns A promise that resolves to an object containing an array of all users or an error.
   */
  findAll(): Promise<{ success: boolean; users?: any[]; error?: string }>;
}

/**
 * Factory function to create an instance of the user service.
 * It encapsulates the business logic for user management, including caching strategies.
 *
 * @param userRepo - The user repository for data access.
 * @returns An implementation of the IUserService interface.
 */
export function userService(userRepo: IUserRepository): IUserService {
  const folderName = "UserProfile";
  return {
    /**
     * Retrieves all users, utilizing a cache-aside pattern to improve performance.
     * Caches the list of users for one hour.
     */
    findAll: async () => {
      try {
        const cachekey = "users";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const cachedUsers = await CacheService.getOrSet(
          cachekey,
          async () => {
            const users = await userRepo.findAll();
            return users ?? [];
          },
          3600
        );
        if (!cachedUsers) {
          return { success: false, error: "No users found" };
        }
        return { success: true, users: cachedUsers };
      } catch (err) {
        return { success: false, error: "Failed to fetch users" };
      }
    },

    /**
     * Finds a single user by their ID, using a cache-aside pattern.
     * Caches the individual user data for one hour.
     */
    findById: async (id) => {
      try {
        const cachekey = `user_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const cachedUser = await CacheService.getOrSet<any | null>(
          cachekey,
          async () => {
            const user = await userRepo.findById(id);
            if (!user) return null;
            return user;
          },
          3600
        );
        if (!cachedUser) {
          return { success: false, error: "User not found" };
        }
        return { success: true, user: cachedUser };
      } catch (err) {
        return { success: false, error: "Failed to fetch user" };
      }
    },

    /**
     * Updates a user's profile information and/or profile image.
     * It invalidates the user's cache entry upon a successful update.
     */
    update: async (id, data, file) => {
      try {
        const existingUser = await userRepo.findById(id);
        if (!existingUser) return { success: false, error: "User not found" };

        if (file) {
          if (existingUser.profile_image) {
            // If an old image exists, delete it.
            deleteImage(existingUser.profile_image);
          }
          const imagePath = addImage(file, folderName);
          existingUser.profile_image = imagePath;
        }
        Object.assign(existingUser, data);

        const user = await userRepo.update(existingUser);
        if (!user) return { success: false, error: "User not found" };

        // Invalidate caches after a successful update.
        // The next read will automatically repopulate the cache.
        await CacheService.delete(`user_${id}`);
        await CacheService.delete("users");

        return { success: true, user };
      } catch (err) {
        return { success: false, error: "Failed to update user" };
      }
    },

    /**
     * Deletes a user from the system, including their profile image.
     * It invalidates the user's cache entry upon deletion.
     */
    delete: async (id) => {
      try {
        const user = await userRepo.findById(id);
        if (!user) return { success: false, error: "User not found" };

        if (user.profile_image) deleteImage(user.profile_image);
        await userRepo.delete(id);

        // Invalidate caches after a successful deletion.
        await CacheService.delete(`user_${id}`);
        await CacheService.delete("users");

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete user" };
      }
    },
  };
}
