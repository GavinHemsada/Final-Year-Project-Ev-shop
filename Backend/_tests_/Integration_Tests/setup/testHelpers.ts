import { Types } from "mongoose";
import { UserRole } from "../../../src/shared/enum/enum";

/**
 * Creates a test user object
 */
export const createTestUser = (overrides?: any) => ({
  _id: new Types.ObjectId(),
  email: "test@example.com",
  password: "hashedPassword123",
  firstName: "Test",
  lastName: "User",
  phone: "1234567890",
  role: [UserRole.USER],
  isEmailVerified: true,
  ...overrides,
});

/**
 * Creates a test seller object
 */
export const createTestSeller = (userId: string, overrides?: any) => ({
  _id: new Types.ObjectId(),
  user_id: new Types.ObjectId(userId),
  business_name: "Test Business",
  license_number: "LIC123",
  ...overrides,
});

/**
 * Creates a test EV brand object
 */
export const createTestBrand = (overrides?: any) => ({
  _id: new Types.ObjectId(),
  brand_name: "Tesla",
  brand_logo: "path/to/logo.jpg",
  ...overrides,
});

/**
 * Creates a test EV model object
 */
export const createTestModel = (brandId: string, overrides?: any) => ({
  _id: new Types.ObjectId(),
  brand_id: new Types.ObjectId(brandId),
  model_name: "Model 3",
  model_images: ["path/to/image1.jpg"],
  ...overrides,
});

/**
 * Creates a test listing object
 */
export const createTestListing = (sellerId: string, modelId: string, overrides?: any) => ({
  _id: new Types.ObjectId(),
  seller_id: new Types.ObjectId(sellerId),
  model_id: new Types.ObjectId(modelId),
  listing_type: "sale",
  condition: "new",
  price: 50000,
  ...overrides,
});

/**
 * Creates a test order object
 */
export const createTestOrder = (userId: string, listingId: string, overrides?: any) => ({
  _id: new Types.ObjectId(),
  user_id: new Types.ObjectId(userId),
  listing_id: new Types.ObjectId(listingId),
  total_amount: 50000,
  order_status: "pending",
  payment_status: "pending",
  ...overrides,
});

/**
 * Creates a test cart item object
 */
export const createTestCartItem = (userId: string, listingId: string, overrides?: any) => ({
  _id: new Types.ObjectId(),
  user_id: new Types.ObjectId(userId),
  listing_id: new Types.ObjectId(listingId),
  quantity: 1,
  ...overrides,
});

