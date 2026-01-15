import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { notificationService } from "../../src/modules/notification/notification.service";
import { NotificationRepository } from "../../src/modules/notification/notification.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { User } from "../../src/entities/User";
import { UserRole, NotificationType } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => {
  const mockGetOrSet = jest.fn() as jest.MockedFunction<any>;
  mockGetOrSet.mockImplementation(async (key: string, fetchFunction: any) => {
    if (typeof fetchFunction === "function") {
      return fetchFunction();
    }
    return null;
  });
  
  return {
    getOrSet: mockGetOrSet,
    delete: jest.fn(),
  };
});

describe("Notification Integration Tests", () => {
  let service: ReturnType<typeof notificationService>;
  let notificationRepo: typeof NotificationRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDB();
    notificationRepo = NotificationRepository;
    const sellerRepo = {} as any;
    const financialRepo = {} as any;
    service = notificationService(notificationRepo, UserRepository, sellerRepo, financialRepo);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Notification Operations", () => {
    it("should create a new notification", async () => {
      // Create a test user first (with unique email to avoid duplicates)
      const uniqueEmail = `notifuser${Date.now()}@example.com`;
      const user = new User({
        email: uniqueEmail,
        password: "hashedPassword",
        name: "Notification User",
        phone: "1234567890",
        role: [UserRole.USER],
      });
      await user.save();
      const testUserId = user._id.toString();

      // Verify user exists before creating notification - retry if needed
      let foundUser = await UserRepository.findById(testUserId);
      if (!foundUser) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        foundUser = await UserRepository.findById(testUserId);
      }
      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(testUserId);

      const notificationData = {
        user_id: testUserId,
        type: NotificationType.ORDER_CONFIRMED,
        title: "Order Confirmed",
        message: "Your order has been confirmed",
      };

      // Don't mock - let it use the real repository
      const result = await service.create(notificationData);

      if (!result.success) {
        console.error("Notification creation failed:", result.error);
        // Double-check user exists
        const userCheck = await UserRepository.findById(testUserId);
        console.error("User check after failure:", userCheck ? "Found" : "Not found");
        if (userCheck) {
          console.error("User ID:", userCheck._id.toString());
        }
      }
      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(result.notification?.title).toBe(notificationData.title);
    });

    it("should get notifications by user ID", async () => {
      // Create a test user first
      const uniqueEmail = `notifuser2${Date.now()}@example.com`;
      const user = new User({
        email: uniqueEmail,
        password: "hashedPassword",
        name: "Notification User 2",
        phone: "1234567890",
        role: [UserRole.USER],
      });
      await user.save();
      const testUserId2 = user._id.toString();

      jest.spyOn(notificationRepo, "findByUserId").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          title: "Notification 1",
          message: "Message 1",
        },
        {
          _id: new Types.ObjectId(),
          title: "Notification 2",
          message: "Message 2",
        },
      ] as any);

      const result = await service.findByUserId(testUserId2);

      expect(result.success).toBe(true);
      expect(result.notifications).toBeDefined();
    });
  });
});

