import { Types } from "mongoose";
import { TestDriveSlot, ITestDriveSlot } from "../../entities/TestDriveSlot";
import {
  TestDriveBooking,
  ITestDriveBooking,
} from "../../entities/TestDrivingBooking";
import {
  TestDriveBookingDTO,
  TestDriveSlotDTO,
  FeedbackDTO,
} from "../../dtos/testDrive.DTO";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the test drive repository, specifying methods for data access operations
 * related to test drive slots, bookings, and feedback.
 */
export interface ITestDriveRepository {
  // Slot methods
  /**
   * Creates a new test drive slot.
   * @param data - The DTO containing the details for the new slot.
   * @returns A promise that resolves to the created test drive slot document or null.
   */
  createSlot(data: TestDriveSlotDTO): Promise<ITestDriveSlot | null>;
  /**
   * Finds a test drive slot by its unique ID.
   * @param id - The ID of the slot to find.
   * @returns A promise that resolves to the test drive slot document or null if not found.
   */
  findSlotById(id: string): Promise<ITestDriveSlot | null>;
  /**
   * Retrieves all test drive slots.
   * @returns A promise that resolves to an array of test drive slot documents or null.
   */
  findAllSlots(): Promise<ITestDriveSlot[] | null>;
  /**
   * Finds all test drive slots offered by a specific seller.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an array of test drive slot documents or null.
   */
  findSlotsBySeller(sellerId: string): Promise<ITestDriveSlot[] | null>;
  /**
   * Finds all currently active test drive slots.
   * @returns A promise that resolves to an array of active test drive slot documents or null.
   */
  findActiveSlots(): Promise<ITestDriveSlot[] | null>;
  /**
   * Updates an existing test drive slot.
   * @param id - The ID of the slot to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated test drive slot document or null.
   */
  updateSlot(
    id: string,
    data: Partial<TestDriveSlotDTO>
  ): Promise<ITestDriveSlot | null>;
  /**
   * Deletes a test drive slot by its unique ID.
   * @param id - The ID of the slot to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteSlot(id: string): Promise<boolean | null>;

  // Booking methods
  /**
   * Creates a new test drive booking.
   * @param data - The DTO containing the details for the new booking.
   * @returns A promise that resolves to the created test drive booking document or null.
   */
  createBooking(data: TestDriveBookingDTO): Promise<ITestDriveBooking | null>;
  /**
   * Finds a test drive booking by its unique ID.
   * @param id - The ID of the booking to find.
   * @returns A promise that resolves to the test drive booking document or null if not found.
   */
  findBookingById(id: string): Promise<ITestDriveBooking | null>;
  /**
   * Finds all test drive bookings made by a specific customer.
   * @param customerId - The ID of the customer.
   * @returns A promise that resolves to an array of test drive booking documents or null.
   */
  findBookingsByCustomerId(
    customerId: string
  ): Promise<ITestDriveBooking[] | null>;
  /**
   * Finds all test drive bookings for a specific slot.
   * @param slotId - The ID of the test drive slot.
   * @returns A promise that resolves to an array of test drive booking documents or null.
   */
  findBookingsBySlotId(slotId: string): Promise<ITestDriveBooking[] | null>;
  /**
   * Decreases the available slot count for a specific test drive slot.
   * @param slotId - The ID of the test drive slot.
   * @returns A promise that resolves to true if the operation was successful, otherwise false.
   */
  decreaseSlotCount(slotId: string): Promise<boolean | null>;
  /**
   * Updates an existing test drive booking.
   * @param id - The ID of the booking to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated test drive booking document or null.
   */
  updateBooking(
    id: string,
    data: Partial<TestDriveBookingDTO>
  ): Promise<ITestDriveBooking | null>;
  /**
   * Deletes a test drive booking by its unique ID.
   * @param id - The ID of the booking to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteBooking(id: string): Promise<boolean | null>;

  // rating
  /**
   * Adds or updates feedback (rating and comment) for a specific booking.
   * @param data - The DTO containing the booking ID, rating, and comment.
   * @returns A promise that resolves to the updated test drive booking document or null.
   */
  createRating(data: FeedbackDTO): Promise<ITestDriveBooking | null>;
  /**
   * Updates an existing feedback/rating.
   * @param id - The ID of the booking to update.
   * @param data - The partial data to update the rating with.
   * @returns A promise that resolves to the updated rating or null.
   */
  updateRating(
    id: string,
    data: Partial<FeedbackDTO>
  ): Promise<ITestDriveBooking | null>;
  /**
   * Deletes the feedback for a specific booking.
   * @param id - The ID of the booking whose feedback should be deleted.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteRating(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the ITestDriveRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const TestDriveRepository: ITestDriveRepository = {
  // Slot methods
  /** Creates a new TestDriveSlot document. */
  createSlot: withErrorHandling(async (data) => {
    const slot = new TestDriveSlot(data);
    return await slot.save();
  }),

  /** Finds a single TestDriveSlot by its document ID. */
  findSlotById: withErrorHandling(async (id) => {
    return await TestDriveSlot.findById(id)
      .populate({
        path: "model_id",
        select: "model_name",
        populate: {
          path: "brand_id",
          select: "brand_logo brand_name",
        },
      })
      .populate({
        path: "seller_id",
        select: "business_name rating",
      });
  }),

  /** Finds all active TestDriveSlots, sorted by their available date. */
  findAllSlots: withErrorHandling(async () => {
    return await TestDriveSlot.find({ is_active: true })
      .sort({
        available_date: 1,
      })
      .populate({
        path: "model_id",
        select: "model_name",
        populate: {
          path: "brand_id",
          select: "brand_logo brand_name",
        },
      })
      .populate({
        path: "seller_id",
        select: "business_name rating",
      });
  }),

  /** Finds all TestDriveSlots for a given seller, sorted by most recent. */
  findSlotsBySeller: withErrorHandling(async (sellerId) => {
    return await TestDriveSlot.find({
      seller_id: new Types.ObjectId(sellerId),
    })
      .populate({
        path: "model_id",
        select: "model_name",
        populate: {
          path: "brand_id",
          select: "brand_logo brand_name",
        },
      })
      .populate({
        path: "seller_id",
        select: "business_name rating",
      });
  }),
  /** Finds all active TestDriveSlots, sorted by their available date. */
  findActiveSlots: withErrorHandling(async () => {
    return await TestDriveSlot.find({ is_active: true })
      .sort({
        available_date: 1,
      })
      .populate({
        path: "model_id",
        select: "model_name",
        populate: {
          path: "brand_id",
          select: "brand_logo brand_name",
        },
      })
      .populate({
        path: "seller_id",
        select: "business_name rating",
      });
  }),
  /** Finds a TestDriveSlot by ID and updates it with new data. */
  updateSlot: withErrorHandling(async (id, data) => {
    return await TestDriveSlot.findByIdAndUpdate(id, data, { new: true });
  }),

  /** Deletes a TestDriveSlot by its document ID. */
  deleteSlot: withErrorHandling(async (id) => {
    const result = await TestDriveSlot.findByIdAndDelete(id);
    return result !== null;
  }),

  // Booking methods
  /** Creates a new TestDriveBooking document. */
  createBooking: withErrorHandling(async (data) => {
    const booking = new TestDriveBooking(data);
    return await booking.save();
  }), 

  /** Finds a single TestDriveBooking by ID and populates the related slot information. */
  findBookingById: withErrorHandling(async (id) => {
    return await TestDriveBooking.findById(id).populate("slot_id");
  }),

  /** Finds all TestDriveBookings for a given customer, sorted by most recent. */
  findBookingsByCustomerId: withErrorHandling(async (customerId) => {
    return await TestDriveBooking.find({
      customer_id: new Types.ObjectId(customerId),
    })
      .populate("slot_id")
      .sort({ booking_date: -1 });
  }),

  /** Finds all TestDriveBookings associated with a specific slot. */
  findBookingsBySlotId: withErrorHandling(async (slotId) => {
    return await TestDriveBooking.find({ slot_id: new Types.ObjectId(slotId) });
  }),
  /** Decreases the available slot count for a specific test drive slot. */
  decreaseSlotCount: withErrorHandling(async (slotId) => {
    const slot = await TestDriveSlot.findById(slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }
    slot.max_bookings -= 1;
    const result = await slot.save();
    return result !== null;
  }),

  /** Finds a TestDriveBooking by ID and updates it with new data. */
  updateBooking: withErrorHandling(async (id, data) => {
    return await TestDriveBooking.findByIdAndUpdate(id, data, { new: true });
  }),

  /** Deletes a TestDriveBooking by its document ID. */
  deleteBooking: withErrorHandling(async (id) => {
    const result = await TestDriveBooking.findByIdAndDelete(id);
    return result !== null;
  }),

  // Ratings
  /** Finds a booking by ID and adds the rating and comment to it. */
  createRating: withErrorHandling(async (data) => {
    const booking = await TestDriveBooking.findById(data.booking_id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    booking.feedback_rating = data.rating;
    booking.feedback_comment = data.comment;
    return await booking.save();
  }),
  /** Finds a booking by ID and updates the rating and/or comment. */
  updateRating: withErrorHandling(async (id, data) => {
    const booking = await TestDriveBooking.findById(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (data.rating) {
      booking.feedback_rating = data.rating;
    }
    if (data.comment) {
      booking.feedback_comment = data.comment;
    }
    return await booking.save();
  }),
  /** Finds a booking by ID and removes the feedback rating and comment. */
  deleteRating: withErrorHandling(async (id) => {
    const booking = await TestDriveBooking.findById(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    booking.feedback_rating = undefined;
    booking.feedback_comment = undefined;
    const result = await booking.save();
    return result !== null;
  }),
};
