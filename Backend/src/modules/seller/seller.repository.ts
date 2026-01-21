import { Seller, ISeller } from "../../entities/Seller";
import { SellerDTO, UpdateSellerDTO } from "../../dtos/seller.DTO";
import { Types } from "mongoose";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the seller repository, specifying the methods for data access operations related to sellers.
 */
export interface ISellerRepository {
  /**
   * Creates a new seller profile.
   * @param data - The DTO containing the details for the new seller.
   * @returns A promise that resolves to the created seller document or null.
   */
  create(data: SellerDTO): Promise<ISeller | null>;
  /**
   * Finds a seller by their unique ID.
   * @param id - The ID of the seller to find.
   * @returns A promise that resolves to the seller document or null if not found.
   */
  findById(id: string): Promise<ISeller | null>;
  /**
   * Finds a seller profile by the associated user's ID.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the seller document or null if not found.
   */
  findByUserId(userId: string): Promise<ISeller | null>;
  /**
   * Retrieves all sellers from the database.
   * @returns A promise that resolves to an array of seller documents or null.
   */
  findAll(): Promise<ISeller[] | null>;
  /**
   * Updates a seller's average rating and total review count.
   * @param id - The ID of the seller to update.
   * @param rating - The new average rating.
   * @param reviewCount - The new total number of reviews.
   * @returns A promise that resolves to the updated seller document or null.
   */
  updateRatingAndReviewCount(
    id: string,
    rating: number,
    reviewCount: number
  ): Promise<ISeller | null>;
  /**
   * Updates a seller's profile information.
   * @param id - The ID of the seller to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated seller document or null.
   */
  update(id: string, data: Partial<UpdateSellerDTO>): Promise<ISeller | null>;
  /**
   * Deletes a seller by their unique ID.
   * @param id - The ID of the seller to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  delete(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the ISellerRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const SellerRepository: ISellerRepository = {
  /** Creates a new Seller document. */
  create: withErrorHandling(async (data: SellerDTO) => {
    const seller = new Seller(data);
    return await seller.save();
  }),

  /** Finds a single Seller by their document ID and populates the associated user data. */
  findById: withErrorHandling(async (id: string) => {
    return await Seller.findById(id).populate("user_id");
  }),

  /** Finds a single Seller by the associated user's ID and populates the user data. */
  findByUserId: withErrorHandling(async (userId: string) => {
    return await Seller.findOne({
      user_id: new Types.ObjectId(userId),
    }).populate("user_id");
  }),

  /** Retrieves all Seller documents and populates their associated user data. */
  findAll: withErrorHandling(async () => {
    return await Seller.find().populate("user_id");
  }),
  /** Finds a Seller by ID and updates their rating and review count. */
  updateRatingAndReviewCount: withErrorHandling(
    async (id: string, rating: number, reviewCount: number) => {
      return await Seller.findByIdAndUpdate(
        id,
        {
          rating: rating,
          total_reviews: reviewCount,
        },
        { new: true }
      );
    }
  ),
  /** Finds a Seller by ID and updates their profile information. */
  update: withErrorHandling(
    async (id: string, data: Partial<UpdateSellerDTO>) => {
      return await Seller.findByIdAndUpdate(id, data, { new: true });
    }
  ),

  /** Deletes a Seller by their document ID. */
  delete: withErrorHandling(async (id: string) => {
    const result = await Seller.findByIdAndDelete(id);
    return result !== null;
    }),
};

