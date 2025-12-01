import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { cartService } from "../../src/modules/cart/cart.service";
import { CartRepository } from "../../src/modules/cart/cart.repository";
import { Cart } from "../../src/entities/Cart";
import { CartItem } from "../../src/entities/CartItem";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";
import { ListingType, VehicleCondition } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

describe("Cart Integration Tests", () => {
  let service: ReturnType<typeof cartService>;
  let cartRepo: typeof CartRepository;
  let testUserId: string;
  let testListingId: string;

  beforeAll(async () => {
    await setupTestDB();
    cartRepo = CartRepository;
    service = cartService(cartRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "cartuser@example.com",
      password: "hashedPassword",
      name: "Cart User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();

    // Create test listing (simplified - in real scenario would need brand, model, seller)
    testListingId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Cart Operations", () => {
    it("should add item to cart", async () => {
      const cartData = {
        user_id: testUserId,
        listing_id: testListingId,
        quantity: 1,
      };

      const mockCart = { _id: new Types.ObjectId(), user_id: new Types.ObjectId(testUserId) };
      jest.spyOn(cartRepo, "findCartByUserId").mockResolvedValue(mockCart as any);
      jest.spyOn(cartRepo, "findCartItemByListing").mockResolvedValue(null);
      jest.spyOn(cartRepo, "addCartItem").mockResolvedValue({
        _id: new Types.ObjectId(),
        cart_id: mockCart._id,
        listing_id: new Types.ObjectId(testListingId),
        quantity: 1,
      } as any);

      const result = await service.addItemToCart(cartData);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
    });

    it("should get cart items for user", async () => {
      // Mock cart and cart items
      const mockCart = {
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(testUserId),
        toObject: () => ({
          _id: new Types.ObjectId(),
          user_id: new Types.ObjectId(testUserId),
        }),
      };

      const cartItems = [
        {
          _id: new Types.ObjectId(),
          cart_id: mockCart._id,
          listing_id: new Types.ObjectId(),
          quantity: 1,
        },
        {
          _id: new Types.ObjectId(),
          cart_id: mockCart._id,
          listing_id: new Types.ObjectId(),
          quantity: 2,
        },
      ];

      jest.spyOn(cartRepo, "findCartByUserId").mockResolvedValue(mockCart as any);
      jest.spyOn(cartRepo, "findCartItems").mockResolvedValue(cartItems as any);

      const result = await service.getCart(testUserId);

      expect(result.success).toBe(true);
      expect(result.cart?.items?.length).toBe(2);
    });

    it("should update cart item quantity", async () => {
      const cart = new Cart({
        user_id: new Types.ObjectId(testUserId),
      });
      await cart.save();

      const cartItem = new CartItem({
        cart_id: cart._id,
        listing_id: new Types.ObjectId(),
        quantity: 1,
      });
      await cartItem.save();

      jest.spyOn(cartRepo, "updateCartItem").mockResolvedValue({
        ...cartItem.toObject(),
        quantity: 3,
      } as any);

      const result = await service.updateItemInCart(cartItem._id.toString(), { quantity: 3 });

      expect(result.success).toBe(true);
      expect(result.item?.quantity).toBe(3);
    });

    it("should remove item from cart", async () => {
      const cart = new Cart({
        user_id: new Types.ObjectId(testUserId),
      });
      await cart.save();

      const cartItem = new CartItem({
        cart_id: cart._id,
        listing_id: new Types.ObjectId(),
        quantity: 1,
      });
      await cartItem.save();

      jest.spyOn(cartRepo, "findCartItemById").mockResolvedValue(cartItem as any);
      jest.spyOn(cartRepo, "findCartById").mockResolvedValue(cart as any);
      jest.spyOn(cartRepo, "removeCartItem").mockResolvedValue(true);

      const result = await service.removeItemFromCart(cartItem._id.toString());

      expect(result.success).toBe(true);
    });

    it("should clear cart for user", async () => {
      const cart = new Cart({
        user_id: new Types.ObjectId(testUserId),
      });
      await cart.save();

      const cartItems = [
        {
          cart_id: cart._id,
          listing_id: new Types.ObjectId(),
          quantity: 1,
        },
        {
          cart_id: cart._id,
          listing_id: new Types.ObjectId(),
          quantity: 2,
        },
      ];

      await CartItem.insertMany(cartItems);

      const mockCart = { _id: new Types.ObjectId(), user_id: new Types.ObjectId(testUserId) };
      jest.spyOn(cartRepo, "findCartByUserId").mockResolvedValue(mockCart as any);
      jest.spyOn(cartRepo, "clearCart").mockResolvedValue(true);

      const result = await service.clearUserCart(testUserId);

      expect(result.success).toBe(true);
    });
  });
});

