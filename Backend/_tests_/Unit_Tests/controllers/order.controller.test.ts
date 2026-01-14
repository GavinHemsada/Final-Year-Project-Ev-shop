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
import mongoose from "mongoose";
import { Request, Response } from "express";
import { orderController, IOrderController } from "../../../src/modules/order/order.controller";
import { IOrderService } from "../../../src/modules/order/order.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";
import { OrderStatus } from "../../../src/shared/enum/enum";

// Mock the response utilities
jest.mock("../../../src/shared/utils/Respons.util");

describe("OrderController", () => {
  let controller: IOrderController;
  let mockOrderService: jest.Mocked<IOrderService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrderService = {
      createOrder: jest.fn(),
      getAllOrders: jest.fn(),
      getOrderById: jest.fn(),
      getOrdersBySellerOrUserId: jest.fn(),
      updateOrder: jest.fn(),
      cancelOrder: jest.fn(),
    } as jest.Mocked<IOrderService>;

    controller = orderController(mockOrderService);

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    (handleResult as jest.Mock) = jest.fn((res, result, status) => res);
    (handleError as jest.Mock) = jest.fn((res, err, operation) => res);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("createOrder", () => {
    it("should call service.createOrder and return result", async () => {
      const orderData = { user_id: "user123", seller_id: "seller123", listing_id: "listing123", total_amount: 50000 };
      const mockResult = { success: true, order: {} };

      mockRequest.body = orderData;
      mockOrderService.createOrder.mockResolvedValue(mockResult);

      await controller.createOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(orderData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });

    it("should handle errors", async () => {
      const error = new Error("Service error");

      mockRequest.body = {};
      mockOrderService.createOrder.mockRejectedValue(error);

      await controller.createOrder(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "createOrder");
    });
  });

  describe("getOrderById", () => {
    it("should call service.getOrderById and return result", async () => {
      const orderId = "order123";
      const mockResult = { success: true, order: {} };

      mockRequest.params = { id: orderId };
      mockOrderService.getOrderById.mockResolvedValue(mockResult);

      await controller.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(orderId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getAllOrders", () => {
    it("should call service.getAllOrders and return result", async () => {
      const mockResult = { success: true, orders: [] };

      mockOrderService.getAllOrders.mockResolvedValue(mockResult);

      await controller.getAllOrders(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getAllOrders).toHaveBeenCalled();
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getOrdersByUserIdOrSellerId", () => {
    it("should call service.getOrdersBySellerOrUserId with user role and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true, orders: [] };

      mockRequest.params = { userId, role: "user" };
      mockOrderService.getOrdersBySellerOrUserId.mockResolvedValue(mockResult);

      await controller.getOrdersByUserIdOrSellerId(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getOrdersBySellerOrUserId).toHaveBeenCalledWith(userId, "user");
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });

    it("should call service.getOrdersBySellerOrUserId with seller role and return result", async () => {
      const sellerId = "seller123";
      const mockResult = { success: true, orders: [] };

      mockRequest.params = { userId: sellerId, role: "seller" };
      mockOrderService.getOrdersBySellerOrUserId.mockResolvedValue(mockResult);

      await controller.getOrdersByUserIdOrSellerId(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getOrdersBySellerOrUserId).toHaveBeenCalledWith(sellerId, "seller");
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("updateOrder", () => {
    it("should call service.updateOrder and return result", async () => {
      const orderId = "order123";
      const updateData = { order_status: OrderStatus.CONFIRMED };
      const mockResult = { success: true, order: {} };

      mockRequest.params = { id: orderId };
      mockRequest.body = updateData;
      mockOrderService.updateOrder.mockResolvedValue(mockResult);

      await controller.updateOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.updateOrder).toHaveBeenCalledWith(orderId, updateData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("cancelOrder", () => {
    it("should call service.cancelOrder and return result", async () => {
      const orderId = "order123";
      const mockResult = { success: true };

      mockRequest.params = { id: orderId };
      mockOrderService.cancelOrder.mockResolvedValue(mockResult);

      await controller.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(orderId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

