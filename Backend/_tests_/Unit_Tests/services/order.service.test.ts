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
import { orderService, IOrderService } from "../../../src/modules/order/order.service";
import { IOrderRepository } from "../../../src/modules/order/order.repository";
import { CreateOrderDTO, UpdateOrderDTO } from "../../../src/dtos/order.DTO";
import { OrderStatus, PaymentStatus } from "../../../src/shared/enum/enum";
import CacheService from "../../../src/shared/cache/CacheService";

// Mock CacheService
jest.mock("../../../src/shared/cache/CacheService");

// Helper function to create a mock order
const createMockOrder = (overrides: any = {}) => {
  return {
    _id: new Types.ObjectId(),
    user_id: new Types.ObjectId(),
    seller_id: new Types.ObjectId(),
    listing_id: new Types.ObjectId(),
    order_date: new Date(),
    order_status: OrderStatus.PENDING,
    payment_status: PaymentStatus.CONFIRMED,
    ...overrides,
  };
};

describe("OrderService", () => {
  let service: IOrderService;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;
  let mockUserRepo: jest.Mocked<any>;
  let mockSellerRepo: jest.Mocked<any>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrderRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserOrSellerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    mockUserRepo = {
      findById: jest.fn(),
    } as jest.Mocked<any>;
    mockSellerRepo = {
      findById: jest.fn(),
    } as jest.Mocked<any>;
    service = orderService(mockOrderRepo, mockUserRepo, mockSellerRepo);

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

  describe("createOrder", () => {
    it("should create a new order successfully", async () => {
      const orderData: CreateOrderDTO = {
        user_id: new Types.ObjectId().toString(),
        seller_id: new Types.ObjectId().toString(),
        listing_id: new Types.ObjectId().toString(),
        total_amount: 50000,
      };
      const mockOrder = createMockOrder(orderData);

      mockOrderRepo.create.mockResolvedValue(mockOrder as any);

      const result = await service.createOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
      expect(mockOrderRepo.create).toHaveBeenCalled();
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const orderData: CreateOrderDTO = {
        user_id: new Types.ObjectId().toString(),
        seller_id: new Types.ObjectId().toString(),
        listing_id: new Types.ObjectId().toString(),
        total_amount: 50000,
      };

      mockOrderRepo.create.mockResolvedValue(null);

      const result = await service.createOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create order");
    });
  });

  describe("getOrderById", () => {
    it("should return order by id", async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = createMockOrder();

      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      const result = await service.getOrderById(orderId);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
      expect(mockOrderRepo.findById).toHaveBeenCalledWith(orderId);
    });

    it("should return error if order not found", async () => {
      const orderId = new Types.ObjectId().toString();

      mockOrderRepo.findById.mockResolvedValue(null);

      const result = await service.getOrderById(orderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Order not found");
    });
  });

  describe("getOrdersBySellerOrUserId", () => {
    it("should return orders for a user", async () => {
      const userId = new Types.ObjectId().toString();
      const mockOrders = [createMockOrder(), createMockOrder()];

      mockUserRepo.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as any);
      mockOrderRepo.findByUserOrSellerId.mockResolvedValue(mockOrders as any);

      const result = await service.getOrdersBySellerOrUserId(userId, "user");

      expect(result.success).toBe(true);
      expect(result.orders).toEqual(mockOrders);
      expect(mockOrderRepo.findByUserOrSellerId).toHaveBeenCalledWith(userId);
    });

    it("should return empty array if no orders found", async () => {
      const userId = new Types.ObjectId().toString();

      mockUserRepo.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as any);
      mockOrderRepo.findByUserOrSellerId.mockResolvedValue(null);

      const result = await service.getOrdersBySellerOrUserId(userId, "user");

      // Service returns empty array with success when no orders found
      expect(result.success).toBe(true);
      expect(result.orders).toEqual([]);
    });

    it("should return orders for a seller", async () => {
      const sellerId = new Types.ObjectId().toString();
      const mockOrders = [createMockOrder(), createMockOrder()];

      mockSellerRepo.findById.mockResolvedValue({ _id: new Types.ObjectId(sellerId) } as any);
      mockOrderRepo.findByUserOrSellerId.mockResolvedValue(mockOrders as any);

      const result = await service.getOrdersBySellerOrUserId(sellerId, "seller");

      expect(result.success).toBe(true);
      expect(result.orders).toEqual(mockOrders);
      expect(mockOrderRepo.findByUserOrSellerId).toHaveBeenCalledWith(sellerId);
    });
  });

  describe("updateOrder", () => {
    it("should update order successfully", async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = createMockOrder();
      const updateData: UpdateOrderDTO = { order_status: OrderStatus.CONFIRMED };
      const updatedOrder = { ...mockOrder, ...updateData };

      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockOrderRepo.update.mockResolvedValue(updatedOrder as any);

      const result = await service.updateOrder(orderId, updateData);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(updatedOrder);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if order not found", async () => {
      const orderId = new Types.ObjectId().toString();
      const updateData: UpdateOrderDTO = { order_status: OrderStatus.CONFIRMED };

      mockOrderRepo.findById.mockResolvedValue(null);

      const result = await service.updateOrder(orderId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Order not found");
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = createMockOrder();

      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockOrderRepo.update.mockResolvedValue({
        ...mockOrder,
        order_status: OrderStatus.CANCELLED,
      } as any);

      const result = await service.cancelOrder(orderId);

      expect(result.success).toBe(true);
    });

    it("should return error if order not found", async () => {
      const orderId = new Types.ObjectId().toString();

      mockOrderRepo.findById.mockResolvedValue(null);

      const result = await service.cancelOrder(orderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Order not found");
    });
  });
});

