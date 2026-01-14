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
import { orderService } from "../../src/modules/order/order.service";
import { OrderRepository } from "../../src/modules/order/order.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import Order from "../../src/entities/Order";
import { User } from "../../src/entities/User";
import { UserRole, OrderStatus, PaymentStatus } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

describe("Order Integration Tests", () => {
  let service: ReturnType<typeof orderService>;
  let orderRepo: typeof OrderRepository;
  let userRepo: typeof UserRepository;
  let testUserId: string;
  let testListingId: string;
  let testSellerId: string;

  beforeAll(async () => {
    await setupTestDB();
    orderRepo = OrderRepository;
    userRepo = UserRepository;
    const sellerRepo = {} as any;
    service = orderService(orderRepo, userRepo, sellerRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "orderuser@example.com",
      password: "hashedPassword",
      name: "Order User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
    testListingId = new Types.ObjectId().toString();
    testSellerId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Order Operations", () => {
    it("should create a new order", async () => {
      const orderData = {
        user_id: testUserId,
        seller_id: testSellerId,
        listing_id: testListingId,
        total_amount: 50000,
      };

      jest.spyOn(orderRepo, "create").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...orderData,
        order_status: OrderStatus.PENDING,
        payment_status: PaymentStatus.CANCELLED,
      } as any);

      const result = await service.createOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.total_amount).toBe(orderData.total_amount);
    });

    it("should get orders by user ID", async () => {
      const sellerId = new Types.ObjectId();
      const orders = [
        {
          user_id: new Types.ObjectId(testUserId),
          seller_id: sellerId,
          listing_id: new Types.ObjectId(),
          total_amount: 50000,
          order_status: OrderStatus.PENDING,
          payment_status: PaymentStatus.CANCELLED,
          order_date: new Date(),
        },
        {
          user_id: new Types.ObjectId(testUserId),
          seller_id: sellerId,
          listing_id: new Types.ObjectId(),
          total_amount: 75000,
          order_status: OrderStatus.CONFIRMED,
          payment_status: PaymentStatus.CONFIRMED,
          order_date: new Date(),
        },
      ];

      await Order.insertMany(orders);

      // The service checks if user exists first, so we need to ensure userRepo.findById returns the user
      jest.spyOn(userRepo, "findById").mockResolvedValue({
        _id: new Types.ObjectId(testUserId),
      } as any);
      jest.spyOn(orderRepo, "findByUserOrSellerId").mockResolvedValue(orders as any);

      const result = await service.getOrdersBySellerOrUserId(testUserId, "user");

      expect(result.success).toBe(true);
      expect(result.orders?.length).toBe(2);
    });

    it("should update order status", async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(testUserId),
        seller_id: new Types.ObjectId(),
        listing_id: new Types.ObjectId(),
        total_amount: 50000,
        order_status: OrderStatus.PENDING,
        payment_status: PaymentStatus.CANCELLED,
        order_date: new Date(),
        populate: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(orderRepo, "findById").mockResolvedValue(mockOrder as any);
      jest.spyOn(orderRepo, "update").mockResolvedValue({
        ...mockOrder,
        order_status: OrderStatus.CONFIRMED,
      } as any);

      const result = await service.updateOrder(mockOrder._id.toString(), {
        order_status: OrderStatus.CONFIRMED,
      });

      expect(result.success).toBe(true);
      expect(result.order?.order_status).toBe(OrderStatus.CONFIRMED);
    });

    it("should get order by ID", async () => {
      const order = new Order({
        user_id: new Types.ObjectId(testUserId),
        seller_id: new Types.ObjectId(),
        listing_id: new Types.ObjectId(),
        total_amount: 50000,
        order_status: OrderStatus.PENDING,
        payment_status: PaymentStatus.CANCELLED,
        order_date: new Date(),
      });
      await order.save();

      jest.spyOn(orderRepo, "findById").mockResolvedValue(order as any);

      const result = await service.getOrderById(order._id.toString());

      expect(result.success).toBe(true);
      expect(result.order?._id.toString()).toBe(order._id.toString());
    });
  });
});

