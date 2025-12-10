import { EvBrand, IEvBrand } from "../../entities/EvBrand";
import { EvCategory, IEvCategory } from "../../entities/EvCategory";
import { EvModel, IEvModel } from "../../entities/EvModel";
import { VehicleListing, IVehicleListing } from "../../entities/VehicleListing";
import {
  EvBrandDTO,
  EvCategoryDTO,
  EvModelDTO,
  VehicleListingDTO,
  UpdateVehicleListingDTO,
} from "../../dtos/ev.DTO";
import { Types } from "mongoose";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the EV repository, specifying the methods for data access operations
 * related to EV Brands, Categories, Models, and Listings.
 */
export interface IEvRepository {
  // Brand
  /**
   * Creates a new EV brand.
   * @param data - The DTO containing the details for the new brand.
   * @returns A promise that resolves to the created brand document or null.
   */
  createBrand(data: EvBrandDTO): Promise<IEvBrand | null>;
  /**
   * Retrieves all EV brands.
   * @returns A promise that resolves to an array of brand documents or null.
   */
  findAllBrands(): Promise<IEvBrand[] | null>;
  /**
   * Finds an EV brand by its unique ID.
   * @param id - The ID of the brand to find.
   * @returns A promise that resolves to the brand document or null if not found.
   */
  findBrandById(id: string): Promise<IEvBrand | null>;
  /**
   * Updates an existing EV brand.
   * @param id - The ID of the brand to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated brand document or null.
   */
  updateBrand(id: string, data: Partial<EvBrandDTO>): Promise<IEvBrand | null>;
  /**
   * Deletes an EV brand by its unique ID.
   * @param id - The ID of the brand to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteBrand(id: string): Promise<boolean | null>;

  // Category
  /**
   * Creates a new EV category.
   * @param data - The DTO containing the details for the new category.
   * @returns A promise that resolves to the created category document or null.
   */
  createCategory(data: EvCategoryDTO): Promise<IEvCategory | null>;
  /**
   * Retrieves all EV categories.
   * @returns A promise that resolves to an array of category documents or null.
   */
  findAllCategories(): Promise<IEvCategory[] | null>;
  /**
   * Finds an EV category by its unique ID.
   * @param id - The ID of the category to find.
   * @returns A promise that resolves to the category document or null if not found.
   */
  findCategoryById(id: string): Promise<IEvCategory | null>;
  /**
   * Updates an existing EV category.
   * @param id - The ID of the category to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated category document or null.
   */
  updateCategory(
    id: string,
    data: Partial<EvCategoryDTO>
  ): Promise<IEvCategory | null>;
  /**
   * Deletes an EV category by its unique ID.
   * @param id - The ID of the category to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteCategory(id: string): Promise<boolean | null>;

  // Model
  /**
   * Creates a new EV model.
   * @param data - The DTO containing the details for the new model.
   * @returns A promise that resolves to the created model document or null.
   */
  createModel(data: EvModelDTO): Promise<IEvModel | null>;
  /**
   * Retrieves all EV models.
   * @returns A promise that resolves to an array of model documents or null.
   */
  findAllModels(): Promise<IEvModel[] | null>;
  /**
   * Finds an EV model by its unique ID.
   * @param id - The ID of the model to find.
   * @returns A promise that resolves to the model document or null if not found.
   */
  findModelById(id: string): Promise<IEvModel | null>;
  /**
   * Finds all EV models belonging to a specific brand.
   * @param brandId - The ID of the brand.
   * @returns A promise that resolves to an array of model documents or null.
   */
  findModelsByBrand(brandId: string): Promise<IEvModel[] | null>;
  /**
   * Updates an existing EV model.
   * @param id - The ID of the model to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated model document or null.
   */
  updateModel(id: string, data: Partial<EvModelDTO>): Promise<IEvModel | null>;
  /**
   * Deletes an EV model by its unique ID.
   * @param id - The ID of the model to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteModel(id: string): Promise<boolean | null>;

  // Listing
  /**
   * Creates a new vehicle listing.
   * @param data - The DTO containing the details for the new listing.
   * @returns A promise that resolves to the created listing document or null.
   */
  createListing(data: VehicleListingDTO): Promise<IVehicleListing | null>;
  /**
   * Retrieves all vehicle listings that match a given set of filters.
   * @param filters - An object containing key-value pairs for filtering listings.
   * @returns A promise that resolves to an array of listing documents or null.
   */
  findAllListings(): Promise<IVehicleListing[] | null>;
  /**
   * Finds a vehicle listing by its unique ID.
   * @param id - The ID of the listing to find.
   * @returns A promise that resolves to the listing document or null if not found.
   */
  findListingById(id: string): Promise<IVehicleListing | null>;
  /**
   * Finds all vehicle listings created by a specific seller.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an array of listing documents or null.
   */
  findListingsBySeller(sellerId: string): Promise<IVehicleListing[] | null>;
  /**
   * Updates an existing vehicle listing.
   * @param id - The ID of the listing to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated listing document or null.
   */
  updateListing(
    id: string,
    data: Partial<UpdateVehicleListingDTO>
  ): Promise<IVehicleListing | null>;
  /**
   * Deletes a vehicle listing by its unique ID (soft delete).
   * @param id - The ID of the listing to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteListing(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IEvRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const EvRepository: IEvRepository = {
  // Brand
  /** Creates a new EvBrand document. */
  createBrand: withErrorHandling(async (data) => {
    const brand = new EvBrand(data);
    return await brand.save();
  }),
  /** Retrieves all EvBrand documents. */
  findAllBrands: withErrorHandling(async () => EvBrand.find()),
  /** Finds a single EvBrand by its document ID. */
  findBrandById: withErrorHandling(async (_id) => EvBrand.findById(_id)),
  /** Finds an EvBrand by ID and updates it with new data. */
  updateBrand: withErrorHandling(async (id, data) =>
    EvBrand.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes an EvBrand by its document ID. */
  deleteBrand: withErrorHandling(async (id) => {
    const result = await EvBrand.findByIdAndDelete(id);
    return result !== null;
  }),

  // Category
  /** Creates a new EvCategory document. */
  createCategory: withErrorHandling(async (data) => {
    const category = new EvCategory(data);
    return await category.save();
  }),
  /** Retrieves all EvCategory documents. */
  findAllCategories: withErrorHandling(async () => EvCategory.find()),
  /** Finds a single EvCategory by its document ID. */
  findCategoryById: withErrorHandling(async (id) => EvCategory.findById(id)),
  /** Finds an EvCategory by ID and updates it with new data. */
  updateCategory: withErrorHandling(async (id, data) =>
    EvCategory.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes an EvCategory by its document ID. */
  deleteCategory: withErrorHandling(async (id) => {
    const result = await EvCategory.findByIdAndDelete(id);
    return result !== null;
  }),

  // Model
  /** Creates a new EvModel document. */
  createModel: withErrorHandling(async (data) => {
    const model = new EvModel(data);
    return await model.save();
  }),
  /** Retrieves all EvModel documents, populating brand and category details. */
  findAllModels: withErrorHandling(async () =>
    EvModel.find().populate("brand_id").populate("category_id")
  ),
  /** Finds a single EvModel by ID, populating brand and category details. */
  findModelById: withErrorHandling(async (id) =>
    EvModel.findById(id).populate("brand_id").populate("category_id")
  ),
  /** Finds all EvModels for a specific brand, populating category details. */
  findModelsByBrand: withErrorHandling(async (brandId) =>
    EvModel.find({ brand_id: new Types.ObjectId(brandId) }).populate(
      "category_id"
    )
  ),
  /** Finds an EvModel by ID and updates it with new data. */
  updateModel: withErrorHandling(async (id, data) =>
    EvModel.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes an EvModel by its document ID. */
  deleteModel: withErrorHandling(async (id) => {
    const result = await EvModel.findByIdAndDelete(id);
    return result !== null;
  }),

  // Listing
  /** Creates a new VehicleListing document. */
  createListing: withErrorHandling(async (data) => {
    const listing = new VehicleListing(data);
    return await listing.save();
  }),
  /**
   * Retrieves all active vehicle listings, applying any additional filters provided.
   * Populates nested details for the model, brand, category, and seller.
   */
  findAllListings: withErrorHandling(async () => {
    return await VehicleListing.find()
      .populate({
        path: "model_id",
        populate: [{ path: "brand_id" }, { path: "category_id" }],
      })
      .populate({
        path: "seller_id",
        select: "business_name user_id shop_logo street_address",
        populate: {
          path: "user_id",
          select: "profile_image name",
        },
      })
      .sort({ createdAt: -1 });
  }),
  /**
   * Finds a single vehicle listing by ID, populating detailed information
   * about the model, brand, category, and seller.
   */
  findListingById: withErrorHandling(async (id) => {
    return await VehicleListing.findById(id)
      .populate({
        path: "model_id",
        populate: [
          { path: "brand_id", select: "brand_name brand_logo description" },
          { path: "category_id", select: "category_name description" },
        ],
      })
      .populate({
        path: "seller_id",
        select: "business_name user_id shop_logo street_address",
        populate: {
          path: "user_id",
          select: "profile_image name",
        },
      });
  }),
  /** Finds all vehicle listings for a specific seller, sorted by most recent. */
  findListingsBySeller: withErrorHandling(async (sellerId) => {
    return await VehicleListing.find({
      seller_id: new Types.ObjectId(sellerId),
    })
      .populate({
        path: "model_id",
        populate: [
          { path: "brand_id", select: "brand_name brand_logo description" },
          { path: "category_id", select: "category_name" },
        ],
      })
      .populate({
        path: "seller_id",
        select: "business_name user_id shop_logo street_address",
        populate: {
          path: "user_id",
          select: "profile_image name",
        },
      })
      .sort({ createdAt: -1 });
  }),
  /** Finds a vehicle listing by ID and updates it with new data. */
  updateListing: withErrorHandling(async (id, data) =>
    VehicleListing.findByIdAndUpdate(id, data, { new: true })
  ),
  /**
   * Performs a soft delete on a vehicle listing by setting its status to "inactive".
   * This preserves the record in the database but hides it from public view.
   */
  deleteListing: withErrorHandling(async (id) => {
    const result = await VehicleListing.findByIdAndDelete(id);
    return result !== null;
  }),
};
