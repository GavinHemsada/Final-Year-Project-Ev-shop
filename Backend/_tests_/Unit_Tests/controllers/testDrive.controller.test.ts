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
import { testDriveController, ITestDriveController } from "../../../src/modules/testDrive/testDrive.controller";
import { ITestDriveService } from "../../../src/modules/testDrive/testDrive.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("TestDriveController", () => {
  let controller: ITestDriveController;
  let mockTestDriveService: jest.Mocked<ITestDriveService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTestDriveService = {
      createSlot: jest.fn(),
      findSlotById: jest.fn(),
      findAllSlots: jest.fn(),
      findSlotsBySeller: jest.fn(),
      findActiveSlots: jest.fn(),
      updateSlot: jest.fn(),
      deleteSlot: jest.fn(),
      createBooking: jest.fn(),
      findBookingById: jest.fn(),
      findBookingsByCustomerId: jest.fn(),
      updateBooking: jest.fn(),
      deleteBooking: jest.fn(),
      createFeedback: jest.fn(),
      findFeedbackById: jest.fn(),
      findFeedbacksByBookingId: jest.fn(),
      updateFeedback: jest.fn(),
      deleteFeedback: jest.fn(),
      createRating: jest.fn(),
      updateRating: jest.fn(),
      deleteRating: jest.fn(),
    } as jest.Mocked<ITestDriveService>;

    controller = testDriveController(mockTestDriveService);

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

  describe("getSlotById", () => {
    it("should call service.findSlotById and return result", async () => {
      const slotId = "slot123";
      const mockResult = { success: true, slot: {} };

      mockRequest.params = { id: slotId };
      mockTestDriveService.findSlotById.mockResolvedValue(mockResult);

      await controller.getSlotById(mockRequest as Request, mockResponse as Response);

      expect(mockTestDriveService.findSlotById).toHaveBeenCalledWith(slotId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createSlot", () => {
    it("should call service.createSlot and return result with 201 status", async () => {
      const slotData = { seller_id: "seller123", location: "Test Location", model_id: "model123", available_date: new Date(), max_bookings: 5, is_active: true };
      const mockResult = { success: true, slot: {} };

      mockRequest.body = slotData;
      mockTestDriveService.createSlot.mockResolvedValue(mockResult);

      await controller.createSlot(mockRequest as Request, mockResponse as Response);

      expect(mockTestDriveService.createSlot).toHaveBeenCalledWith(slotData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("createBooking", () => {
    it("should call service.createBooking and return result with 201 status", async () => {
      const bookingData = { customer_id: "customer123", slot_id: "slot123", booking_date: new Date(), booking_time: "09:00", duration_minutes: 30 };
      const mockResult = { success: true, booking: {} };

      mockRequest.body = bookingData;
      mockTestDriveService.createBooking.mockResolvedValue(mockResult);

      await controller.createBooking(mockRequest as Request, mockResponse as Response);

      expect(mockTestDriveService.createBooking).toHaveBeenCalledWith(bookingData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("getBookingsByCustomerId", () => {
    it("should call service.findBookingsByCustomerId and return result", async () => {
      const customerId = "customer123";
      const mockResult = { success: true, bookings: [] };

      mockRequest.params = { customerId };
      mockTestDriveService.findBookingsByCustomerId.mockResolvedValue(mockResult);

      await controller.getBookingsByCustomer(mockRequest as Request, mockResponse as Response);

      expect(mockTestDriveService.findBookingsByCustomerId).toHaveBeenCalledWith(customerId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

