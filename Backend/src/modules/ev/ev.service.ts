import {
  EvBrandDTO,
  EvCategoryDTO,
  EvModelDTO,
  VehicleListingDTO,
  UpdateVehicleListingDTO,
  QuickUpdateListingDTO,
} from "../../dtos/ev.DTO";
import { IEvRepository } from "./ev.repository";
import {
  addImage,
  addImages,
  deleteImage,
  deleteImages,
} from "../../shared/utils/imageHandel";
import { ISellerRepository } from "../seller/seller.repository";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the EV service, outlining methods for managing EV brands, categories, models, and listings.
 */
export interface IEvService {
  // Brand
  /**
   * Creates a new EV brand.
   * @param data - The data for the new brand.
   * @param file - The brand's logo image file.
   * @returns A promise that resolves to an object containing the created brand or an error.
   */
  createBrand(
    data: EvBrandDTO,
    file: Express.Multer.File
  ): Promise<{ success: boolean; brand?: any; error?: string }>;
  /**
   * Retrieves all EV brands.
   * @returns A promise that resolves to an object containing an array of all brands or an error.
   */
  getAllBrands(): Promise<{ success: boolean; brands?: any[]; error?: string }>;
  /**
   * Retrieves an EV brand by its unique ID.
   * @param id - The ID of the brand to find.
   * @returns A promise that resolves to an object containing the brand data or an error.
   */
  getById(
    id: string
  ): Promise<{ success: boolean; brand?: any; error?: string }>;
  /**
   * Updates an existing EV brand.
   * @param id - The ID of the brand to update.
   * @param data - The partial data to update the brand with.
   * @param file - An optional new logo image file to replace the old one.
   * @returns A promise that resolves to an object containing the updated brand data or an error.
   */
  updateBrand(
    id: string,
    data: Partial<EvBrandDTO>,
    file: Express.Multer.File
  ): Promise<{ success: boolean; brand?: any; error?: string }>;
  /**
   * Deletes an EV brand by its unique ID.
   * @param id - The ID of the brand to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteBrand(id: string): Promise<{ success: boolean; error?: string }>;

  // Category
  /**
   * Creates a new EV category.
   * @param data - The data for the new category.
   * @returns A promise that resolves to an object containing the created category or an error.
   */
  createCategory(
    data: EvCategoryDTO
  ): Promise<{ success: boolean; category?: any; error?: string }>;
  /**
   * Retrieves all EV categories.
   * @returns A promise that resolves to an object containing an array of all categories or an error.
   */
  getAllCategories(): Promise<{
    success: boolean;
    categories?: any[];
    error?: string;
  }>;
  /**
   * Retrieves an EV category by its unique ID.
   * @param id - The ID of the category to find.
   * @returns A promise that resolves to an object containing the category data or an error.
   */
  getCategoryByid(
    id: string
  ): Promise<{ success: boolean; category?: any; error?: string }>;
  /**
   * Updates an existing EV category.
   * @param id - The ID of the category to update.
   * @param data - The partial data to update the category with.
   * @returns A promise that resolves to an object containing the updated category data or an error.
   */
  updateCategory(
    id: string,
    data: Partial<EvCategoryDTO>
  ): Promise<{ success: boolean; category?: any; error?: string }>;
  /**
   * Deletes an EV category by its unique ID.
   * @param id - The ID of the category to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteCategory(id: string): Promise<{ success: boolean; error?: string }>;

  // Model
  /**
   * Creates a new EV model.
   * @param data - The data for the new model.
   * @param file - An array of image files for the model.
   * @returns A promise that resolves to an object containing the created model or an error.
   */
  createModel(
    data: EvModelDTO
  ): Promise<{ success: boolean; model?: any; error?: string }>;
  /**
   * Retrieves all EV models.
   * @returns A promise that resolves to an object containing an array of all models or an error.
   */
  getAllModels(): Promise<{ success: boolean; models?: any[]; error?: string }>;
  /**
   * Retrieves an EV model by its unique ID.
   * @param id - The ID of the model to find.
   * @returns A promise that resolves to an object containing the model data or an error.
   */
  getModelById(
    id: string
  ): Promise<{ success: boolean; model?: any; error?: string }>;
  /**
   * Updates an existing EV model.
   * @param id - The ID of the model to update.
   * @param data - The partial data to update the model with.
   * @param file - An optional array of new image files to replace the old ones.
   * @returns A promise that resolves to an object containing the updated model data or an error.
   */
  updateModel(
    id: string,
    data: Partial<EvModelDTO>
  ): Promise<{ success: boolean; model?: any; error?: string }>;
  /**
   * Deletes an EV model by its unique ID.
   * @param id - The ID of the model to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteModel(id: string): Promise<{ success: boolean; error?: string }>;

  // Listing
  /**
   * Creates a new vehicle listing.
   * @param data - The data for the new listing.
   * @param file - An optional array of image files for the listing.
   * @returns A promise that resolves to an object containing the created listing or an error.
   */
  createListing(
    data: VehicleListingDTO,
    file?: Express.Multer.File[]
  ): Promise<{ success: boolean; listing?: any; error?: string }>;
  /**
   * Retrieves all vehicle listings with pagination, filtering, and search.
   *
   * @param {Object} options - Query parameters.
   * @param {number} [options.page=1] - Current page number.
   * @param {number} [options.limit=10] - Number of listings per page.
   * @param {string} [options.search=""] - Search term for vehicle title, make, or model.
   * @param {string} [options.filter=""] - Optional filter (e.g., fuelType, brand, status).
   * @returns {Promise<{ success: boolean; listings?: any[]; total?: number; page?: number; limit?: number; totalPages?: number; error?: string }>}
   */
  getAllListings(options?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  }): Promise<{
    success: boolean;
    listings?: any[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    error?: string;
  }>;
  /**
   * Retrieves a vehicle listing by its unique ID.
   * @param id - The ID of the listing to find.
   * @returns A promise that resolves to an object containing the listing data or an error.
   */
  getListingById(
    id: string
  ): Promise<{ success: boolean; listing?: any; error?: string }>;
  /**
   * Retrieves all vehicle listings for a specific seller.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's listings or an error.
   */
  getListingsBySeller(
    sellerId: string
  ): Promise<{ success: boolean; listings?: any[]; error?: string }>;
  /**
   * Updates an existing vehicle listing.
   * @param id - The ID of the listing to update.
   * @param data - The data to update the listing with.
   * @param file - An optional array of new image files to replace the old ones.
   * @returns A promise that resolves to an object containing the updated listing data or an error.
   */
  updateListing(
    id: string,
    data: UpdateVehicleListingDTO,
    file?: Express.Multer.File[]
  ): Promise<{ success: boolean; listing?: any; error?: string }>;
  /**
   * Quickly updates listing status and/or quantity.
   * @param id - The ID of the listing to update.
   * @param data - The quick update data (status and/or number_of_ev).
   * @returns A promise that resolves to an object containing the updated listing data or an error.
   */
  quickUpdateListing(
    id: string,
    data: QuickUpdateListingDTO
  ): Promise<{ success: boolean; listing?: any; error?: string }>;
  /**
   * Deletes a vehicle listing by its unique ID.
   * @param id - The ID of the listing to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteListing(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the EV service.
 * It encapsulates the business logic for managing EV-related data, including caching strategies
 * to improve performance.
 *
 * @param repo - The repository for EV data access.
 * @param sellerRepo - The repository for seller data access.
 * @returns An implementation of the IEvService interface.
 */
export function evService(
  repo: IEvRepository,
  sellerRepo: ISellerRepository
): IEvService {
  const bandFolder = "EvBrand";
  const modelFolder = "EvModel";
  const listingFolder = "EvListing";
  return {
    // Brand
    /**
     * Creates a new EV brand, uploads its logo, and invalidates the brands list cache.
     */
    createBrand: async (data, file) => {
      try {
        // Handle image upload.
        let url = "";
        if (file) url = addImage(file, bandFolder);
        const barndata = {
          ...data,
          brand_logo: url,
        };
        const brand = await repo.createBrand(barndata);
        if (!brand)
          return { success: false, error: "Failed to create new brand" };

        // Invalidate the cache for the list of all brands
        await CacheService.delete("brands");

        return { success: true, brand };
      } catch (err) {
        return { success: false, error: "Failed to create brand" };
      }
    },
    /**
     * Retrieves all EV brands, utilizing a cache-aside pattern.
     * Caches the list of all brands for one hour.
     */
    getAllBrands: async () => {
      try {
        const cacheKey = "brands";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const brands = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findAllBrands();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!brands) return { success: false, error: "No brands found" };
        return { success: true, brands };
      } catch (err) {
        return { success: false, error: "Failed to fetch brands" };
      }
    },
    /**
     * Finds a single EV brand by its ID, using a cache-aside pattern.
     * Caches the individual brand data for one hour.
     */
    getById: async (id) => {
      try {
        const cacheKey = `brand_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const brand = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findBrandById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!brand) return { success: false, error: "Brand not found" };
        return { success: true, brand };
      } catch (err) {
        return { success: false, error: "Failed to fetch brand" };
      }
    },
    /**
     * Updates an EV brand's information and/or logo.
     * Invalidates all caches related to this brand.
     */
    updateBrand: async (id, data, file) => {
      try {
        const existing = await repo.findBrandById(id);
        if (!existing) return { success: false, error: "Brand not found" };
        // Handle logo replacement.
        const updateDate: any = { ...data };
        if (file) {
          if (existing.brand_logo) deleteImage(existing.brand_logo);
          updateDate.brand_logo = addImage(file, bandFolder);
        }
        // If no file is provided, preserve the existing logo by not including brand_logo in updateDate
        const brand = await repo.updateBrand(id, updateDate);
        if (!brand) return { success: false, error: "Failed to update brand" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("brands"),
          CacheService.delete(`brand_${id}`),
        ]);

        return { success: true, brand };
      } catch (err) {
        return { success: false, error: "Failed to update brand" };
      }
    },
    /**
     * Deletes an EV brand and its logo from storage.
     * Invalidates all caches related to this brand.
     */
    deleteBrand: async (id) => {
      try {
        const existing = await repo.findBrandById(id);
        if (!existing) return { success: false, error: "Brand not found" };
        // Delete the associated logo file.
        if (existing.brand_logo) deleteImage(existing.brand_logo);
        const success = await repo.deleteBrand(id);
        if (!success)
          return { success: false, error: "Failed to delete brand" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("brands"),
          CacheService.delete(`brand_${id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete brand" };
      }
    },

    // Category
    /**
     * Creates a new EV category and invalidates the categories list cache.
     */
    createCategory: async (data) => {
      try {
        const category = await repo.createCategory(data);

        // Invalidate the cache for the list of all categories
        await CacheService.delete("categories");

        return { success: true, category };
      } catch (err) {
        return { success: false, error: "Failed to create category" };
      }
    },
    /**
     * Retrieves all EV categories, utilizing a cache-aside pattern.
     * Caches the list of all categories for one hour.
     */
    getAllCategories: async () => {
      try {
        const cacheKey = "categories";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const categories = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findAllCategories();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!categories)
          return { success: false, error: "No categories found" };
        return { success: true, categories };
      } catch (err) {
        return { success: false, error: "Failed to fetch categories" };
      }
    },
    /**
     * Finds a single EV category by its ID, using a cache-aside pattern.
     * Caches the individual category data for one hour.
     */
    getCategoryByid: async (id) => {
      try {
        const cacheKey = `category_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const category = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findCategoryById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!category) return { success: false, error: "Category not found" };
        return { success: true, category };
      } catch (err) {
        return { success: false, error: "Failed to fetch category" };
      }
    },
    /**
     * Updates an EV category's information.
     * Invalidates all caches related to this category.
     */
    updateCategory: async (id, data) => {
      try {
        const existing = await repo.findCategoryById(id);
        if (!existing) return { success: false, error: "Category not found" };
        const category = await repo.updateCategory(id, data);
        if (!category)
          return { success: false, error: "Failed to update category" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("categories"),
          CacheService.delete(`category_${id}`),
        ]);

        return { success: true, category };
      } catch (err) {
        return { success: false, error: "Failed to update category" };
      }
    },
    /**
     * Deletes an EV category.
     * Invalidates all caches related to this category.
     */
    deleteCategory: async (id) => {
      try {
        const existing = await repo.findCategoryById(id);
        if (!existing) return { success: false, error: "Category not found" };
        const success = await repo.deleteCategory(id);
        if (!success)
          return { success: false, error: "Failed to delete category" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("categories"),
          CacheService.delete(`category_${id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete category" };
      }
    },

    // Model
    /**
     * Creates a new EV model, uploads its images, and invalidates the models list cache.
     */
    createModel: async (data) => {
      try {
        // Validate associated brand and category.
        const existingBrand = await repo.findBrandById(data.brand_id);
        if (!existingBrand) return { success: false, error: "Brand not found" };
        const existingCategory = await repo.findCategoryById(data.category_id);
        if (!existingCategory)
          return { success: false, error: "Category not found" };

        const model = await repo.createModel(data);

        // Invalidate the cache for the list of all models
        await CacheService.delete("models");

        return { success: true, model };
      } catch (err) {
        return { success: false, error: "Failed to create model" };
      }
    },
    /**
     * Retrieves all EV models, utilizing a cache-aside pattern.
     * Caches the list of all models for one hour.
     */
    getAllModels: async () => {
      try {
        const cacheKey = "models";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const models = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findAllModels();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!models) return { success: false, error: "No models found" };
        return { success: true, models };
      } catch (err) {
        return { success: false, error: "Failed to fetch models" };
      }
    },
    /**
     * Finds a single EV model by its ID, using a cache-aside pattern.
     * Caches the individual model data for one hour.
     */
    getModelById: async (id) => {
      try {
        const cacheKey = `model_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const model = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findModelById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!model) return { success: false, error: "Model not found" };
        return { success: true, model };
      } catch (err) {
        return { success: false, error: "Failed to fetch model" };
      }
    },
    /**
     * Updates an EV model's information and/or images.
     * Invalidates all caches related to this model.
     */
    updateModel: async (id, data) => {
      try {
        const existing = await repo.findModelById?.(id);
        if (!existing) return { success: false, error: "Model not found" };
        const model = await repo.updateModel(id, data);
        if (!model) return { success: false, error: "Failed to update model" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("models"),
          CacheService.delete(`model_${id}`),
        ]);

        return { success: true, model };
      } catch (err) {
        return { success: false, error: "Failed to update model" };
      }
    },
    /**
     * Deletes an EV model and its images from storage.
     * Invalidates all caches related to this model.
     */
    deleteModel: async (id) => {
      try {
        const existing = await repo.findModelById?.(id);
        if (!existing) return { success: false, error: "Model not found" };
        const success = await repo.deleteModel(id);
        if (!success)
          return { success: false, error: "Failed to delete model" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("models"),
          CacheService.delete(`model_${id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete model" };
      }
    },

    // Listing
    /**
     * Creates a new vehicle listing, uploads its images, and invalidates relevant listing caches.
     */
    createListing: async (data, file) => {
      try {
        // Validate associated seller.
        const existingSeller = await sellerRepo.findById(data.seller_id);
        if (!existingSeller)
          return { success: false, error: "Seller not found" };
        let url: string[] = [];
        // Handle image uploads.
        if (file) url = addImages(file, listingFolder);
        const listingData = {
          ...data,
          images: url,
        };
        const listing = await repo.createListing(listingData);

        // Invalidate listing caches
        await Promise.all([
          CacheService.deletePattern("listings_*"),
          CacheService.delete(`listings_seller_${data.seller_id}`),
        ]);

        return { success: true, listing };
      } catch (err) {
        return { success: false, error: "Failed to create listing" };
      }
    },
    /**
     * Retrieves all vehicle listings based on filters, using a cache-aside pattern.
     * Caches the list of listings for one hour, with a unique key for each filter combination.
     */
    // service.js
    getAllListings: async ({
      page = 1,
      limit = 10,
      search = "",
      filter = "",
    } = {}) => {
      try {
        // Create unique cache key for each query combination
        const cacheKey = `listings_${page}_${limit}_${search}_${filter}`;

        const result = await CacheService.getOrSet(
          cacheKey,
          async () => {
            // Fetch all listings from the database
            let allListings = await repo.findAllListings();
            if (!allListings || allListings.length === 0)
              return { listings: [], total: 0 };

            // --- Filter ---
            if (filter) {
              const filterTerm = filter.toLowerCase();
              allListings = allListings.filter(
                (item) =>
                  item.listing_type?.toLowerCase() === filterTerm ||
                  item.condition?.toLowerCase() === filterTerm ||
                  item.status?.toLowerCase() === filterTerm ||
                  item.color?.toLowerCase() === filterTerm
              );
            }

            // --- Search ---
            if (search) {
              const term = search.toLowerCase();
              allListings = allListings.filter(
                (item) =>
                  item.listing_type?.toLowerCase().includes(term) ||
                  item.condition?.toLowerCase().includes(term) ||
                  item.status?.toLowerCase().includes(term) ||
                  item.color?.toLowerCase().includes(term) ||
                  item.registration_year?.toString().includes(term)
              );
            }

            // --- Pagination ---
            const total = allListings.length;
            const startIndex = (page - 1) * limit;
            const paginated = allListings.slice(startIndex, startIndex + limit);

            return {
              listings: paginated,
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            };
          },
          3600 // Cache for 1 hour
        );

        if (!result.listings || result.listings.length === 0)
          return { success: false, error: "No listings found" };

        return { success: true, ...result };
      } catch (err) {
        return { success: false, error: "Failed to fetch listings" };
      }
    },

    /**
     * Finds a single vehicle listing by its ID, using a cache-aside pattern.
     * Caches the individual listing data for one hour.
     */
    getListingById: async (id) => {
      try {
        const cacheKey = `listing_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const listing = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findListingById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!listing) return { success: false, error: "Listing not found" };
        return { success: true, listing };
      } catch (err) {
        return { success: false, error: "Failed to fetch listing" };
      }
    },
    /**
     * Finds all listings for a specific seller, using a cache-aside pattern.
     * Caches the list of listings for that seller for one hour.
     */
    getListingsBySeller: async (sellerId) => {
      try {
        const cacheKey = `listings_seller_${sellerId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const listings = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findListingsBySeller(sellerId);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!listings) return { success: false, error: "No listings found" };
        return { success: true, listings };
      } catch (err) {
        return { success: false, error: "Failed to fetch seller listings" };
      }
    },
    /**
     * Updates a vehicle listing's information and/or images.
     * Invalidates all caches related to this listing.
     */
    updateListing: async (id, data, file) => {
      try {
        const existing = await repo.findListingById?.(id);
        if (!existing) return { success: false, error: "Listing not found" };
        let url: string[] = [];
        // Handle image replacement.
        if (file) {
          if (existing.images) deleteImages(existing.images);
          url = addImages(file, listingFolder);
        }
        const updateData = {
          ...data,
          images: url,
        };
        const listing = await repo.updateListing(id, updateData);
        if (!listing)
          return { success: false, error: "Failed to update listing" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`listing_${id}`),
          CacheService.deletePattern("listings_*"),
          CacheService.delete(`listings_seller_${listing.seller_id}`),
        ]);

        return { success: true, listing };
      } catch (err) {
        return { success: false, error: "Failed to update listing" };
      }
    },
    /**
     * Quickly updates listing status and/or quantity without handling images.
     * Invalidates all caches related to this listing.
     */
    quickUpdateListing: async (id, data) => {
      try {
        const existing = await repo.findListingById?.(id);
        if (!existing) return { success: false, error: "Listing not found" };

        // Only update the fields provided in data
        const listing = await repo.updateListing(id, data);
        if (!listing)
          return { success: false, error: "Failed to update listing" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`listing_${id}`),
          CacheService.deletePattern("listings_*"),
          CacheService.delete(`listings_seller_${listing.seller_id}`),
        ]);

        return { success: true, listing };
      } catch (err) {
        return { success: false, error: "Failed to update listing" };
      }
    },
    /**
     * Deletes a vehicle listing and its images from storage.
     * Invalidates all caches related to this listing.
     */
    deleteListing: async (id) => {
      try {
        const existing = await repo.findListingById?.(id);
        if (!existing) return { success: false, error: "Listing not found" };
        // Delete associated image files.
        if (existing.images) deleteImages(existing.images);
        const success = await repo.deleteListing(id);
        if (!success)
          return { success: false, error: "Failed to delete listing" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`listing_${id}`),
          CacheService.deletePattern("listings_*"),
          CacheService.delete(`listings_seller_${existing.seller_id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete listing" };
      }
    },
  };
}
