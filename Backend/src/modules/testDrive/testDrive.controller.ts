import { Request, Response } from "express";
import { ITestDriveService } from "./testDrive.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the test drive controller, specifying methods for handling HTTP requests
 * related to test drive slots, bookings, and ratings.
 */
export interface ITestDriveController {
  // Slot methods
  /**
   * Handles the HTTP request to create a new test drive slot.
   * @param req - The Express request object, containing slot data in the body.
   * @param res - The Express response object.
   */
  createSlot(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a slot by its unique ID.
   * @param req - The Express request object, containing the slot ID in `req.params`.
   * @param res - The Express response object.
   */
  getSlotById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all available test drive slots.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllSlots(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all slots for a specific seller.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  getSlotsBySeller(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all active (available) test drive slots.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getActiveSlots(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing test drive slot.
   * @param req - The Express request object, containing the slot ID and update data.
   * @param res - The Express response object.
   */
  updateSlot(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a test drive slot.
   * @param req - The Express request object, containing the slot ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteSlot(req: Request, res: Response): Promise<Response>;

  // Booking methods
  /**
   * Handles the HTTP request to create a new test drive booking.
   * @param req - The Express request object, containing booking data in the body.
   * @param res - The Express response object.
   */
  createBooking(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a booking by its unique ID.
   * @param req - The Express request object, containing the booking ID in `req.params`.
   * @param res - The Express response object.
   */
  getBookingById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all bookings for a specific customer.
   * @param req - The Express request object, containing the customer ID in `req.params`.
   * @param res - The Express response object.
   */
  getBookingsByCustomer(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing test drive booking.
   * @param req - The Express request object, containing the booking ID and update data.
   * @param res - The Express response object.
   */
  updateBooking(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a test drive booking.
   * @param req - The Express request object, containing the booking ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteBooking(req: Request, res: Response): Promise<Response>;

  // Ratings
  /**
   * Handles the HTTP request to create a new rating for a completed test drive.
   * @param req - The Express request object, containing rating data in the body.
   * @param res - The Express response object.
   */
  createRating(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing rating.
   * @param req - The Express request object, containing the rating ID and update data.
   * @param res - The Express response object.
   */
  updateRating(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a test drive rating.
   * @param req - The Express request object, containing the rating ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteRating(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the test drive controller.
 * It encapsulates the logic for handling API requests related to test drives.
 *
 * @param service - The test drive service dependency that contains the business logic.
 * @returns An implementation of the ITestDriveController interface.
 */
export function testDriveController(
  service: ITestDriveService
): ITestDriveController {
  return {
    // Slot methods
    /**
     * Creates a new test drive slot.
     */
    createSlot: async (req, res) => {
      try {
        const result = await service.createSlot(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating slot");
      }
    },

    /**
     * Retrieves a single test drive slot by its ID.
     */
    getSlotById: async (req, res) => {
      try {
        const result = await service.findSlotById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching slot by id");
      }
    },

    /**
     * Retrieves a list of all test drive slots.
     */
    getAllSlots: async (_req, res) => {
      try {
        const result = await service.findAllSlots();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching all slots");
      }
    },

    /**
     * Retrieves all test drive slots associated with a specific seller.
     */
    getSlotsBySeller: async (req, res) => {
      try {
        const result = await service.findSlotsBySeller(req.params.sellerId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching slots by seller");
      }
    },
    /**
     * Retrieves all currently active (available) test drive slots.
     */
    getActiveSlots: async (_req, res) => {
      try {
        const result = await service.findActiveSlots();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching active slots");
      }
    },
    /**
     * Updates an existing test drive slot's information.
     */
    updateSlot: async (req, res) => {
      try {
        const result = await service.updateSlot(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating slot");
      }
    },

    /**
     * Deletes a test drive slot by its ID.
     */
    deleteSlot: async (req, res) => {
      try {
        const result = await service.deleteSlot(req.params.id);
        if(!result.success) {
          return handleResult(res, result, 400);
        }
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting slot");
      }
    },

    // Booking methods
    /**
     * Creates a new test drive booking for a specific slot.
     */
    createBooking: async (req, res) => {
      try {
        const result = await service.createBooking(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating booking");
      }
    },

    /**
     * Retrieves a single test drive booking by its ID.
     */
    getBookingById: async (req, res) => {
      try {
        const result = await service.findBookingById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching booking by id");
      }
    },

    /**
     * Retrieves all test drive bookings made by a specific customer.
     */
    getBookingsByCustomer: async (req, res) => {
      try {
        const result = await service.findBookingsByCustomerId(
          req.params.customerId
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching bookings by customer");
      }
    },

    /**
     * Updates an existing test drive booking's information.
     */
    updateBooking: async (req, res) => {
      try {
        const result = await service.updateBooking(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating booking");
      }
    },

    /**
     * Deletes a test drive booking by its ID.
     */
    deleteBooking: async (req, res) => {
      try {
        const result = await service.deleteBooking(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting booking");
      }
    },
    // Ratings
    /**
     * Creates a new rating for a completed test drive.
     */
    createRating: async (req, res) => {
      try {
        const result = await service.createRating(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating rating");
      }
    },
    /**
     * Updates an existing test drive rating.
     */
    updateRating: async (req, res) => {
      try {
        const result = await service.updateRating(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating rating");
      }
    },
    /**
     * Deletes a test drive rating by its ID.
     */
    deleteRating: async (req, res) => {
      try {
        const result = await service.deleteRating(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting rating");
      }
    },
  };
}
