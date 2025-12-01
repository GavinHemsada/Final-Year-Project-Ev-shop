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
import { notificationService, INotificationService } from "../../../src/modules/notification/notification.service";
import { INotificationRepository } from "../../../src/modules/notification/notification.repository";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import { NotificationDTO } from "../../../src/dtos/notification.DTO";
import { NotificationType } from "../../../src/shared/enum/enum";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");

describe("NotificationService", () => {
  let service: INotificationService;
  let mockNotificationRepo: jest.Mocked<INotificationRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotificationRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      notificationReaded: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<INotificationRepository>;

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    service = notificationService(mockNotificationRepo, mockUserRepo);

    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction();
      }
    );

    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("findById", () => {
    it("should return notification by id", async () => {
      const notificationId = new Types.ObjectId().toString();
      const mockNotification = { _id: new Types.ObjectId(notificationId), message: "Test notification" };

      mockNotificationRepo.findById.mockResolvedValue(mockNotification as any);

      const result = await service.findById(notificationId);

      expect(result.success).toBe(true);
      expect(result.notification).toEqual(mockNotification);
    });

    it("should return error if notification not found", async () => {
      const notificationId = new Types.ObjectId().toString();

      mockNotificationRepo.findById.mockResolvedValue(null);

      const result = await service.findById(notificationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Notification not found");
    });
  });

  describe("findByUserId", () => {
    it("should return notifications for a user", async () => {
      const userId = new Types.ObjectId().toString();
      const mockNotifications = [
        { _id: new Types.ObjectId(), message: "Notification 1" },
        { _id: new Types.ObjectId(), message: "Notification 2" },
      ];

      mockNotificationRepo.findByUserId.mockResolvedValue(mockNotifications as any);

      const result = await service.findByUserId(userId);

      expect(result.success).toBe(true);
      expect(result.notifications).toEqual(mockNotifications);
    });
  });

  describe("create", () => {
    it("should create a new notification", async () => {
      const userId = new Types.ObjectId().toString();
      const notificationData: NotificationDTO = {
        user_id: userId,
        title: "Order Confirmed",
        message: "New notification",
        type: NotificationType.ORDER_CONFIRMED,
      };
      const mockUser = { _id: new Types.ObjectId(userId) };
      const mockNotification = { _id: new Types.ObjectId(), ...notificationData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockNotificationRepo.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(notificationData);

      expect(result.success).toBe(true);
      expect(result.notification).toEqual(mockNotification);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if user not found", async () => {
      const notificationData: NotificationDTO = {
        user_id: new Types.ObjectId().toString(),
        title: "Order Confirmed",
        message: "New notification",
        type: NotificationType.ORDER_CONFIRMED,
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.create(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockNotification = {
        _id: new Types.ObjectId(notificationId),
        user_id: new Types.ObjectId(userId),
      };

      mockNotificationRepo.findById.mockResolvedValue(mockNotification as any);
      mockNotificationRepo.notificationReaded.mockResolvedValue(true);

      const result = await service.markAsRead(notificationId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if notification not found", async () => {
      const notificationId = new Types.ObjectId().toString();

      mockNotificationRepo.findById.mockResolvedValue(null);

      const result = await service.markAsRead(notificationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Notification not found");
    });
  });

  describe("update", () => {
    it("should update notification successfully", async () => {
      const notificationId = new Types.ObjectId().toString();
      const updateData: Partial<NotificationDTO> = { message: "Updated message" };
      const mockNotification = { _id: new Types.ObjectId(notificationId), ...updateData };

      mockNotificationRepo.findById.mockResolvedValue(mockNotification as any);
      mockNotificationRepo.update.mockResolvedValue(mockNotification as any);

      const result = await service.update(notificationId, updateData);

      expect(result.success).toBe(true);
      expect(result.notification).toEqual(mockNotification);
    });
  });

  describe("delete", () => {
    it("should delete notification successfully", async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockNotification = {
        _id: new Types.ObjectId(notificationId),
        user_id: new Types.ObjectId(userId),
      };

      mockNotificationRepo.findById.mockResolvedValue(mockNotification as any);
      mockNotificationRepo.delete.mockResolvedValue(true);

      const result = await service.delete(notificationId);

      expect(result.success).toBe(true);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });
});

