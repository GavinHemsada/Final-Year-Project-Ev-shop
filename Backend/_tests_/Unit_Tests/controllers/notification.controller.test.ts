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
import { notificationController, INotificationController } from "../../../src/modules/notification/notification.controller";
import { INotificationService } from "../../../src/modules/notification/notification.service";
import { NotificationType } from "../../../src/shared/enum/enum";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("NotificationController", () => {
  let controller: INotificationController;
  let mockNotificationService: jest.Mocked<INotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotificationService = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<INotificationService>;

    controller = notificationController(mockNotificationService);

    mockRequest = { params: {}, body: {} };
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

  describe("getNotificationByID", () => {
    it("should call service.findById and return result", async () => {
      const notificationId = "notif123";
      const mockResult = { success: true, notification: {} };

      mockRequest.params = { id: notificationId };
      mockNotificationService.findById.mockResolvedValue(mockResult);

      await controller.getNotificationByID(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.findById).toHaveBeenCalledWith(notificationId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("getNotificationsByUserID", () => {
    it("should call service.findByUserId and return result", async () => {
      const userId = "user123";
      const mockResult = { success: true, notifications: [] };

      mockRequest.params = { userId: userId };
      mockNotificationService.findByUserId.mockResolvedValue(mockResult);

      await controller.getNotificationsByUserID(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.findByUserId).toHaveBeenCalledWith(userId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createNotification", () => {
    it("should call service.create and return result with 201 status", async () => {
      const notificationData = { user_id: "user123", title: "Order Confirmed", message: "Test", type: NotificationType.ORDER_CONFIRMED };
      const mockResult = { success: true, notification: {} };

      mockRequest.body = notificationData;
      mockNotificationService.create.mockResolvedValue(mockResult);

      await controller.createNotification(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.create).toHaveBeenCalledWith(notificationData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("markNotificationAsRead", () => {
    it("should call service.markAsRead and return result", async () => {
      const notificationId = "notif123";
      const mockResult = { success: true };

      mockRequest.params = { id: notificationId };
      mockNotificationService.markAsRead.mockResolvedValue(mockResult);

      await controller.markNotificationAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

