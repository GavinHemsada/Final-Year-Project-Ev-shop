import { Types } from "mongoose";
import { Cart, ICart } from "../../entities/Cart";
import { CartItem, ICartItem } from "../../entities/CartItem";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the cart repository, specifying the methods for data access operations
 * related to shopping carts and their items.
 */
export interface ICartRepository {
  /**
   * Finds a user's cart by their user ID.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the cart document or null if not found.
   */
  findCartByUserId(userId: string): Promise<ICart | null>;
  /**
   * Creates a new, empty cart for a user.
   * @param userId - The ID of the user for whom to create the cart.
   * @returns A promise that resolves to the newly created cart document or null.
   */
  createCart(userId: string): Promise<ICart | null>;
  /**
   * Finds all items within a specific cart.
   * @param cartId - The ID of the cart.
   * @returns A promise that resolves to an array of cart item documents or null.
   */
  findCartItems(cartId: string): Promise<ICartItem[] | null>;
  /**
   * Finds a specific cart item within a cart by the listing ID.
   * @param cartId - The ID of the cart.
   * @param listingId - The ID of the vehicle listing.
   * @returns A promise that resolves to the cart item document or null if not found.
   */
  findCartItemByListing(
    cartId: string,
    listingId: string
  ): Promise<ICartItem | null>;
  /**
   * Finds a cart item by its document ID.
   * @param itemId - The ID of the cart item.
   * @returns A promise that resolves to the cart item document or null if not found.
   */
  findCartItemById(itemId: string): Promise<ICartItem | null>;
  /**
   * Finds a cart by its document ID.
   * @param cartId - The ID of the cart.
   * @returns A promise that resolves to the cart document or null if not found.
   */
  findCartById(cartId: string): Promise<ICart | null>;
  /**
   * Adds a new item to a cart.
   * @param cartId - The ID of the cart.
   * @param listingId - The ID of the vehicle listing to add.
   * @param quantity - The quantity of the item to add.
   * @returns A promise that resolves to the newly created cart item document or null.
   */
  addCartItem(
    cartId: string,
    listingId: string,
    quantity: number
  ): Promise<ICartItem | null>;
  /**
   * Updates the quantity of an existing item in the cart.
   * @param itemId - The ID of the cart item to update.
   * @param quantity - The new quantity.
   * @returns A promise that resolves to the updated cart item document or null.
   */
  updateCartItem(itemId: string, quantity: number): Promise<ICartItem | null>;
  /**
   * Removes a specific item from the cart.
   * @param itemId - The ID of the cart item to remove.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  removeCartItem(itemId: string): Promise<boolean | null>;
  /**
   * Removes all items from a specific cart.
   * @param cartId - The ID of the cart to clear.
   * @returns A promise that resolves to true if any items were deleted, otherwise false.
   */
  clearCart(cartId: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the ICartRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const CartRepository: ICartRepository = {
  /** Finds a single cart document by the user's ID. */
  findCartByUserId: withErrorHandling(async (userId: string) =>
    Cart.findOne({ user_id: new Types.ObjectId(userId) })
  ),

  /** Creates a new Cart document for a given user ID. */
  createCart: withErrorHandling(async (userId: string) => {
    const cart = new Cart({ user_id: new Types.ObjectId(userId) });
    return await cart.save();
  }),

  /** Finds all cart items for a given cart ID and populates the associated listing details. */
  findCartItems: withErrorHandling(async (cartId: string) =>
    CartItem.find({ cart_id: new Types.ObjectId(cartId) })
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
            select: "business_name user_id",
            populate: {
              path: "user_id",
              select: "profile_image name",
            },
          },
        ],
      })
      .exec()
  ),

  /** Finds a single cart item within a cart that matches a specific listing ID. */
  findCartItemByListing: withErrorHandling(
    async (cartId: string, listingId: string) =>
      CartItem.findOne({
        cart_id: new Types.ObjectId(cartId),
        listing_id: new Types.ObjectId(listingId),
      })
  ),

  /** Finds a cart item by its document ID. */
  findCartItemById: withErrorHandling(async (itemId: string) =>
    CartItem.findById(itemId)
  ),

  /** Finds a cart by its document ID. */
  findCartById: withErrorHandling(async (cartId: string) =>
    Cart.findById(cartId)
  ),

  /** Creates a new CartItem document. */
  addCartItem: withErrorHandling(
    async (cartId: string, listingId: string, quantity: number) => {
      const cartItem = new CartItem({
        cart_id: new Types.ObjectId(cartId),
        listing_id: new Types.ObjectId(listingId),
        quantity,
      });
      return await cartItem.save();
    }
  ),

  /** Atomically finds a cart item by its ID and updates its quantity. */
  updateCartItem: withErrorHandling(async (itemId: string, quantity: number) =>
    CartItem.findByIdAndUpdate(itemId, { quantity }, { new: true })
  ),

  /** Deletes a cart item by its document ID. */
  removeCartItem: withErrorHandling(async (itemId: string) => {
    const result = await CartItem.findByIdAndDelete(itemId);
    return result !== null;
  }),

  /** Deletes all cart items that belong to a specific cart ID. */
  clearCart: withErrorHandling(async (cartId: string) => {
    const result = await CartItem.deleteMany({
      cart_id: new Types.ObjectId(cartId),
    });
    return result.deletedCount > 0;
  }),
};
