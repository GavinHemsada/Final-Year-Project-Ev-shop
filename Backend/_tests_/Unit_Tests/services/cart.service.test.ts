import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { cartService, ICartService } from "../../../src/modules/cart/cart.service";
import { ICartRepository } from "../../../src/modules/cart/cart.repository";
import { ICart } from "../../../src/entities/Cart";
import { ICartItem } from "../../../src/entities/CartItem";
import { CartItemDTO, UpdateCartItemDTO } from "../../../src/dtos/cart.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

// Mock CacheService
jest.mock("../../../src/shared/cache/CacheService");

// Helper function to create a mock cart
const createMockCart = (overrides: Partial<ICart> = {}): ICart => {
  const baseCart: Partial<ICart> = {
    _id: new Types.ObjectId(),
    user_id: new Types.ObjectId(),
    toObject: jest.fn(() => ({
      _id: baseCart._id,
      user_id: baseCart.user_id,
    })),
    ...overrides,
  };
  return baseCart as ICart;
};

// Helper function to create a mock cart item
const createMockCartItem = (overrides: Partial<ICartItem> = {}): ICartItem => {
  const baseItem: Partial<ICartItem> = {
    _id: new Types.ObjectId(),
    cart_id: new Types.ObjectId(),
    listing_id: new Types.ObjectId(),
    quantity: 1,
    ...overrides,
  };
  return baseItem as ICartItem;
};

describe("CartService", () => {
  let service: ICartService;
  let mockCartRepo: jest.Mocked<ICartRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockCartRepo = {
      findCartByUserId: jest.fn(),
      createCart: jest.fn(),
      findCartItems: jest.fn(),
      findCartItemByListing: jest.fn(),
      findCartItemById: jest.fn(),
      findCartById: jest.fn(),
      addCartItem: jest.fn(),
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
      clearCart: jest.fn(),
    } as jest.Mocked<ICartRepository>;

    service = cartService(mockCartRepo);

    // Mock CacheService.getOrSet to execute the fetchFunction
    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction();
      }
    );

    // Mock CacheService.delete
    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("getCart", () => {
    it("should return existing cart with items", async () => {
      const userId = new Types.ObjectId().toString();
      const mockCart = createMockCart({ user_id: new Types.ObjectId(userId) });
      const mockItems = [createMockCartItem(), createMockCartItem()];

      mockCartRepo.findCartByUserId.mockResolvedValue(mockCart);
      mockCartRepo.findCartItems.mockResolvedValue(mockItems);

      const result = await service.getCart(userId);

      expect(result.success).toBe(true);
      expect(result.cart).toBeDefined();
      expect(result.cart?.items).toEqual(mockItems);
      expect(mockCartRepo.findCartByUserId).toHaveBeenCalledWith(userId);
      expect(mockCartRepo.findCartItems).toHaveBeenCalled();
    });

    it("should create a new cart if one doesn't exist", async () => {
      const userId = new Types.ObjectId().toString();
      const mockCart = createMockCart({ user_id: new Types.ObjectId(userId) });
      const mockItems: ICartItem[] = [];

      mockCartRepo.findCartByUserId.mockResolvedValue(null);
      mockCartRepo.createCart.mockResolvedValue(mockCart);
      mockCartRepo.findCartItems.mockResolvedValue(mockItems);

      const result = await service.getCart(userId);

      expect(result.success).toBe(true);
      expect(result.cart).toBeDefined();
      expect(mockCartRepo.createCart).toHaveBeenCalledWith(userId);
    });

    it("should handle errors gracefully", async () => {
      const userId = new Types.ObjectId().toString();
      mockCartRepo.findCartByUserId.mockRejectedValue(new Error("Database error"));

      const result = await service.getCart(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to retrieve cart");
    });
  });

  describe("addItemToCart", () => {
    it("should add a new item to cart successfully", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });
      const mockItem = createMockCartItem();

      const cartItemData: CartItemDTO = {
        user_id: userId,
        listing_id: listingId,
        quantity: 1,
      };

      mockCartRepo.findCartByUserId.mockResolvedValue(mockCart);
      mockCartRepo.findCartItemByListing.mockResolvedValue(null);
      mockCartRepo.addCartItem.mockResolvedValue(mockItem);

      const result = await service.addItemToCart(cartItemData);

      expect(result.success).toBe(true);
      expect(result.item).toEqual(mockItem);
      expect(mockCartRepo.addCartItem).toHaveBeenCalledWith(
        cartId,
        listingId,
        1
      );
      expect(CacheService.delete).toHaveBeenCalledWith(`cart_${userId}`);
    });

    it("should create cart if it doesn't exist when adding item", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });
      const mockItem = createMockCartItem();

      const cartItemData: CartItemDTO = {
        user_id: userId,
        listing_id: listingId,
        quantity: 2,
      };

      mockCartRepo.findCartByUserId.mockResolvedValue(null);
      mockCartRepo.createCart.mockResolvedValue(mockCart);
      mockCartRepo.findCartItemByListing.mockResolvedValue(null);
      mockCartRepo.addCartItem.mockResolvedValue(mockItem);

      const result = await service.addItemToCart(cartItemData);

      expect(result.success).toBe(true);
      expect(mockCartRepo.createCart).toHaveBeenCalledWith(userId);
    });

    it("should return error if item already exists in cart", async () => {
      const userId = new Types.ObjectId().toString();
      const listingId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });
      const existingItem = createMockCartItem();

      const cartItemData: CartItemDTO = {
        user_id: userId,
        listing_id: listingId,
        quantity: 1,
      };

      mockCartRepo.findCartByUserId.mockResolvedValue(mockCart);
      mockCartRepo.findCartItemByListing.mockResolvedValue(existingItem);

      const result = await service.addItemToCart(cartItemData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already in your cart");
      expect(mockCartRepo.addCartItem).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const cartItemData: CartItemDTO = {
        user_id: new Types.ObjectId().toString(),
        listing_id: new Types.ObjectId().toString(),
        quantity: 1,
      };

      mockCartRepo.findCartByUserId.mockRejectedValue(new Error("Database error"));

      const result = await service.addItemToCart(cartItemData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to add item to cart");
    });
  });

  describe("updateItemInCart", () => {
    it("should update item quantity successfully", async () => {
      const itemId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockCartItem = createMockCartItem({
        _id: new Types.ObjectId(itemId),
        cart_id: new Types.ObjectId(cartId),
      });
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });
      const updatedItem = createMockCartItem({ quantity: 2 });

      const updateData: UpdateCartItemDTO = { quantity: 2 };

      mockCartRepo.findCartItemById.mockResolvedValue(mockCartItem);
      mockCartRepo.findCartById.mockResolvedValue(mockCart);
      mockCartRepo.updateCartItem.mockResolvedValue(updatedItem);

      const result = await service.updateItemInCart(itemId, updateData);

      expect(result.success).toBe(true);
      expect(result.item).toEqual(updatedItem);
      expect(mockCartRepo.updateCartItem).toHaveBeenCalledWith(itemId, 2);
      expect(CacheService.delete).toHaveBeenCalledWith(`cart_${userId}`);
    });

    it("should return error if quantity is not provided", async () => {
      const itemId = new Types.ObjectId().toString();
      const updateData: UpdateCartItemDTO = {};

      const result = await service.updateItemInCart(itemId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Quantity must be provided");
    });

    it("should return error if cart item not found", async () => {
      const itemId = new Types.ObjectId().toString();
      const updateData: UpdateCartItemDTO = { quantity: 2 };

      mockCartRepo.findCartItemById.mockResolvedValue(null);

      const result = await service.updateItemInCart(itemId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cart item not found");
    });

    it("should handle errors gracefully", async () => {
      const itemId = new Types.ObjectId().toString();
      const updateData: UpdateCartItemDTO = { quantity: 2 };

      mockCartRepo.findCartItemById.mockRejectedValue(new Error("Database error"));

      const result = await service.updateItemInCart(itemId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update cart item");
    });
  });

  describe("removeItemFromCart", () => {
    it("should remove item from cart successfully", async () => {
      const itemId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockCartItem = createMockCartItem({
        _id: new Types.ObjectId(itemId),
        cart_id: new Types.ObjectId(cartId),
      });
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });

      mockCartRepo.findCartItemById.mockResolvedValue(mockCartItem);
      mockCartRepo.findCartById.mockResolvedValue(mockCart);
      mockCartRepo.removeCartItem.mockResolvedValue(true);

      const result = await service.removeItemFromCart(itemId);

      expect(result.success).toBe(true);
      expect(mockCartRepo.removeCartItem).toHaveBeenCalledWith(itemId);
      expect(CacheService.delete).toHaveBeenCalledWith(`cart_${userId}`);
    });

    it("should return error if cart item not found", async () => {
      const itemId = new Types.ObjectId().toString();

      mockCartRepo.findCartItemById.mockResolvedValue(null);

      const result = await service.removeItemFromCart(itemId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cart item not found");
    });

    it("should handle errors gracefully", async () => {
      const itemId = new Types.ObjectId().toString();

      mockCartRepo.findCartItemById.mockRejectedValue(new Error("Database error"));

      const result = await service.removeItemFromCart(itemId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to remove cart item");
    });
  });

  describe("clearUserCart", () => {
    it("should clear all items from cart successfully", async () => {
      const userId = new Types.ObjectId().toString();
      const cartId = new Types.ObjectId().toString();
      const mockCart = createMockCart({
        _id: new Types.ObjectId(cartId),
        user_id: new Types.ObjectId(userId),
      });

      mockCartRepo.findCartByUserId.mockResolvedValue(mockCart);
      mockCartRepo.clearCart.mockResolvedValue(true);

      const result = await service.clearUserCart(userId);

      expect(result.success).toBe(true);
      expect(mockCartRepo.clearCart).toHaveBeenCalledWith(cartId);
      expect(CacheService.delete).toHaveBeenCalledWith(`cart_${userId}`);
    });

    it("should return error if cart not found", async () => {
      const userId = new Types.ObjectId().toString();

      mockCartRepo.findCartByUserId.mockResolvedValue(null);

      const result = await service.clearUserCart(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cart not found");
    });

    it("should handle errors gracefully", async () => {
      const userId = new Types.ObjectId().toString();

      mockCartRepo.findCartByUserId.mockRejectedValue(new Error("Database error"));

      const result = await service.clearUserCart(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to clear cart");
    });
  });
});

