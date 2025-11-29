import { CartItemDTO, UpdateCartItemDTO } from "../../dtos/cart.DTO";
import { ICartRepository } from "./cart.repository";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the cart service, outlining methods for managing a user's shopping cart.
 */
export interface ICartService {
  /**
   * Retrieves a user's cart, including all items within it.
   * @param userId - The ID of the user whose cart is to be retrieved.
   * @returns A promise that resolves to an object containing the user's cart data or an error.
   */
  getCart(
    userId: string
  ): Promise<{ success: boolean; cart?: any; error?: string }>;
  /**
   * Adds an item to a user's cart. If the item already exists, its quantity is updated.
   * @param data - The data for the cart item to be added.
   * @returns A promise that resolves to an object containing the added or updated item or an error.
   */
  addItemToCart(
    data: CartItemDTO
  ): Promise<{ success: boolean; item?: any; error?: string }>;
  /**
   * Updates the quantity of a specific item in the cart.
   * @param itemId - The ID of the cart item to update.
   * @param data - The data containing the new quantity.
   * @returns A promise that resolves to an object containing the updated item data or an error.
   */
  updateItemInCart(
    itemId: string,
    data: UpdateCartItemDTO
  ): Promise<{ success: boolean; item?: any; error?: string }>;
  /**
   * Removes a specific item from the cart.
   * @param itemId - The ID of the cart item to remove.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  removeItemFromCart(
    itemId: string
  ): Promise<{ success: boolean; error?: string }>;
  /**
   * Removes all items from a user's cart.
   * @param userId - The ID of the user whose cart is to be cleared.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  clearUserCart(userId: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the cart service.
 * It encapsulates the business logic for managing shopping carts, including caching strategies
 * to improve performance.
 *
 * @param cartRepo - The repository for cart data access.
 * @returns An implementation of the ICartService interface.
 */
export function cartService(cartRepo: ICartRepository): ICartService {
  return {
    /**
     * Retrieves a user's cart and its items, using a cache-aside pattern.
     * If the cart doesn't exist, it creates one. The entire cart object, including items,
     * is cached for one hour.
     */
    getCart: async (userId) => {
      try {
        const cacheKey = `cart_${userId}`;
        const cart = await CacheService.getOrSet(
          cacheKey,
          async () => {
            let userCart = await cartRepo.findCartByUserId(userId);
            if (!userCart) {
              userCart = await cartRepo.createCart(userId);
            }
            const items = await cartRepo.findCartItems(
              userCart!._id.toString()
            );
            return { ...userCart!.toObject(), items };
          },
          3600 // Cache for 1 hour
        );
        return { success: true, cart };
      } catch (err) {
        return { success: false, error: "Failed to retrieve cart" };
      }
    },

    /**
     * Adds an item to the cart. If the item is already in the cart, it returns an error.
     * After the operation, it invalidates the user's cart cache to ensure data consistency.
     */
    addItemToCart: async (data) => {
      try {
        const cacheKey = `cart_${data.user_id}`;

        // Find or create a cart for the user.
        let cart = await cartRepo.findCartByUserId(data.user_id);
        if (!cart) {
          cart = await cartRepo.createCart(data.user_id);
        }
        const cartId = cart!._id.toString();
        const existingItem = await cartRepo.findCartItemByListing(
          cartId,
          data.listing_id
        );

        // If item already exists in cart, return an error
        if (existingItem) {
          return { 
            success: false, 
            error: "This item is already in your cart. You can only add each vehicle once." 
          };
        }

        // Create a new cart item
        const newItem = await cartRepo.addCartItem(
          cartId,
          data.listing_id,
          data.quantity
        );

        // Invalidate the cart cache after modifying it
        await CacheService.delete(cacheKey);
        return { success: true, item: newItem };
      } catch (err) {
        return { success: false, error: "Failed to add item to cart" };
      }
    },

    /**
     * Updates the quantity of a specific item in the cart.
     * It invalidates the user's cart cache upon successful update.
     */
    updateItemInCart: async (itemId, data) => {
      try {
        if (data.quantity === undefined) {
          return { success: false, error: "Quantity must be provided" };
        }
        // Get the cart item first to find the cart_id
        const cartItem = await cartRepo.findCartItemById(itemId);
        if (!cartItem) {
          return { success: false, error: "Cart item not found" };
        }
        // Get the cart to find the user_id
        const cart = await cartRepo.findCartById(cartItem.cart_id.toString());
        if (!cart) {
          return { success: false, error: "Cart not found" };
        }
        // Update the item
        const item = await cartRepo.updateCartItem(itemId, data.quantity);
        if (!item) return { success: false, error: "Cart item not found" };
        // Invalidate the user's cart cache
        await CacheService.delete(`cart_${cart.user_id.toString()}`);
        return { success: true, item };
      } catch (err) {
        return { success: false, error: "Failed to update cart item" };
      }
    },

    /**
     * Removes a specific item from the cart.
     * It invalidates the user's cart cache upon successful removal.
     */
    removeItemFromCart: async (itemId) => {
      try {
        // Get the cart item first to find the cart_id
        const cartItem = await cartRepo.findCartItemById(itemId);
        if (!cartItem) {
          return { success: false, error: "Cart item not found" };
        }
        // Get the cart to find the user_id
        const cart = await cartRepo.findCartById(cartItem.cart_id.toString());
        if (!cart) {
          return { success: false, error: "Cart not found" };
        }
        // Remove the item
        const success = await cartRepo.removeCartItem(itemId);
        if (!success) return { success: false, error: "Cart item not found" };
        // Invalidate the user's cart cache
        await CacheService.delete(`cart_${cart.user_id.toString()}`);
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to remove cart item" };
      }
    },

    /**
     * Clears all items from a user's cart and invalidates the corresponding cache entry.
     */
    clearUserCart: async (userId) => {
      try {
        const cart = await cartRepo.findCartByUserId(userId);
        if (!cart) return { success: false, error: "Cart not found" };
        // Remove all items associated with the cart ID.
        await cartRepo.clearCart(cart._id.toString());
        await CacheService.delete(`cart_${userId}`);
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to clear cart" };
      }
    },
  };
}
