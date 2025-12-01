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
import { cartController, ICartController } from "../../../src/modules/cart/cart.controller";
import { ICartService } from "../../../src/modules/cart/cart.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

// Mock the response utilities
jest.mock("../../../src/shared/utils/Respons.util");

describe("CartController", () => {
  let controller: ICartController;
  let mockCartService: jest.Mocked<ICartService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockCartService = {
      getCart: jest.fn(),
      addItemToCart: jest.fn(),
      updateItemInCart: jest.fn(),
      removeItemFromCart: jest.fn(),
      clearUserCart: jest.fn(),
    } as jest.Mocked<ICartService>;

    controller = cartController(mockCartService);

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    // Mock handleResult and handleError
    (handleResult as jest.Mock) = jest.fn((res, result, status) => res);
    (handleError as jest.Mock) = jest.fn((res, err, operation) => res);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("getCart", () => {
    it("should call service.getCart and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true, cart: { items: [] } };

      mockRequest.params = { userId };
      mockCartService.getCart.mockResolvedValue(mockResult);

      await controller.getCart(mockRequest as Request, mockResponse as Response);

      expect(mockCartService.getCart).toHaveBeenCalledWith(userId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });

    it("should handle errors", async () => {
      const userId = "user123";
      const error = new Error("Service error");

      mockRequest.params = { userId };
      mockCartService.getCart.mockRejectedValue(error);

      await controller.getCart(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "getCart");
    });
  });

  describe("addItem", () => {
    it("should call service.addItemToCart and return result with 201 status", async () => {
      const cartItemData = {
        user_id: "user123",
        listing_id: "listing123",
        quantity: 1,
      };
      const mockResult = { success: true, item: {} };

      mockRequest.body = cartItemData;
      mockCartService.addItemToCart.mockResolvedValue(mockResult);

      await controller.addItem(mockRequest as Request, mockResponse as Response);

      expect(mockCartService.addItemToCart).toHaveBeenCalledWith(cartItemData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });

    it("should handle errors", async () => {
      const error = new Error("Service error");

      mockRequest.body = {};
      mockCartService.addItemToCart.mockRejectedValue(error);

      await controller.addItem(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "addItem");
    });
  });

  describe("updateItem", () => {
    it("should call service.updateItemInCart and return result", async () => {
      const itemId = "item123";
      const updateData = { quantity: 2 };
      const mockResult = { success: true, item: {} };

      mockRequest.params = { itemId };
      mockRequest.body = updateData;
      mockCartService.updateItemInCart.mockResolvedValue(mockResult);

      await controller.updateItem(mockRequest as Request, mockResponse as Response);

      expect(mockCartService.updateItemInCart).toHaveBeenCalledWith(itemId, updateData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });

    it("should handle errors", async () => {
      const error = new Error("Service error");

      mockRequest.params = { itemId: "item123" };
      mockRequest.body = {};
      mockCartService.updateItemInCart.mockRejectedValue(error);

      await controller.updateItem(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "updateItem");
    });
  });

  describe("removeItem", () => {
    it("should call service.removeItemFromCart and return result", async () => {
      const itemId = "item123";
      const mockResult = { success: true };

      mockRequest.params = { itemId };
      mockCartService.removeItemFromCart.mockResolvedValue(mockResult);

      await controller.removeItem(mockRequest as Request, mockResponse as Response);

      expect(mockCartService.removeItemFromCart).toHaveBeenCalledWith(itemId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });

    it("should handle errors", async () => {
      const error = new Error("Service error");

      mockRequest.params = { itemId: "item123" };
      mockCartService.removeItemFromCart.mockRejectedValue(error);

      await controller.removeItem(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "removeItem");
    });
  });

  describe("clearCart", () => {
    it("should call service.clearUserCart and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true };

      mockRequest.params = { userId };
      mockCartService.clearUserCart.mockResolvedValue(mockResult);

      await controller.clearCart(mockRequest as Request, mockResponse as Response);

      expect(mockCartService.clearUserCart).toHaveBeenCalledWith(userId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });

    it("should handle errors", async () => {
      const error = new Error("Service error");

      mockRequest.params = { userId: "user123" };
      mockCartService.clearUserCart.mockRejectedValue(error);

      await controller.clearCart(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockResponse as Response, error, "clearCart");
    });
  });
});

