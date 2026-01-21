import {
  TestDriveBookingDTO,
  TestDriveSlotDTO,
  FeedbackDTO,
} from "../../dtos/testDrive.DTO";
import { ITestDriveRepository } from "./testDrive.repository";
import { ISellerRepository } from "../seller/seller.repository";
import { IEvRepository } from "../ev/ev.repository";
import {
  TestDriveBookingStatus,
  NotificationType,
} from "../../shared/enum/enum";
import CacheService from "../../shared/cache/CacheService";
import { INotificationService } from "../notification/notification.service";

/**
 * Formats a date to YYYY-MM-DD format for comparison.
 */
const formatDateOnly = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Defines the interface for the test drive service, outlining the methods for managing test drive slots, bookings, and feedback.
 */
export interface ITestDriveService {
  // Slot methods
  /**
   * Creates a new test drive slot.
   * @param data - The data for the new slot.
   * @returns A promise that resolves to an object containing the created slot or an error.
   */
  createSlot(
    data: TestDriveSlotDTO
  ): Promise<{ success: boolean; slot?: any; error?: string }>;
  /**
   * Finds a test drive slot by its unique ID.
   * @param id - The ID of the slot to find.
   * @returns A promise that resolves to an object containing the slot data or an error.
   */
  findSlotById(
    id: string
  ): Promise<{ success: boolean; slot?: any; error?: string }>;
  /**
   * Retrieves all test drive slots.
   * @returns A promise that resolves to an object containing an array of all slots or an error.
   */
  findAllSlots(): Promise<{ success: boolean; slots?: any[]; error?: string }>;
  /**
   * Finds all test drive slots offered by a specific seller.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's slots or an error.
   */
  findSlotsBySeller(
    sellerId: string
  ): Promise<{ success: boolean; slots?: any[]; error?: string }>;
  /**
   * Retrieves all currently active test drive slots.
   * @returns A promise that resolves to an object containing an array of active slots or an error.
   */
  findActiveSlots(): Promise<{
    success: boolean;
    slots?: any[];
    error?: string;
  }>;
  /**
   * Updates an existing test drive slot.
   * @param id - The ID of the slot to update.
   * @param data - The partial data to update the slot with.
   * @returns A promise that resolves to an object containing the updated slot data or an error.
   */
  updateSlot(
    id: string,
    data: Partial<TestDriveSlotDTO>
  ): Promise<{ success: boolean; slot?: any; error?: string }>;
  /**
   * Deletes a test drive slot by its unique ID.
   * @param id - The ID of the slot to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteSlot(id: string): Promise<{ success: boolean; error?: string }>;

  // Booking methods
  /**
   * Creates a new test drive booking.
   * @param data - The data for the new booking.
   * @returns A promise that resolves to an object containing the created booking or an error.
   */
  createBooking(
    data: TestDriveBookingDTO
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Finds a test drive booking by its unique ID.
   * @param id - The ID of the booking to find.
   * @returns A promise that resolves to an object containing the booking data or an error.
   */
  findBookingById(
    id: string
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Finds all test drive bookings.
   * @returns A promise that resolves to an object containing an array of all bookings or an error.
   */
  findAllBookings(): Promise<{ success: boolean; bookings?: any[]; error?: string }>;
  /**
   * Finds all test drive bookings made by a specific customer.
   * @param customerId - The ID of the customer.
   * @returns A promise that resolves to an object containing an array of the customer's bookings or an error.
   */
  findBookingsByCustomerId(
    customerId: string
  ): Promise<{ success: boolean; bookings?: any[]; error?: string }>;
  /**
   * Finds all test drive bookings for a specific seller's slots.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's bookings or an error.
   */
  findBookingsBySeller(
    sellerId: string
  ): Promise<{ success: boolean; bookings?: any[]; error?: string }>;
  /**
   * Marks a booking as completed.
   * @param bookingId - The ID of the booking to mark as completed.
   * @returns A promise that resolves to an object containing the updated booking or an error.
   */
  markBookingAsCompleted(
    bookingId: string
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Marks a booking as cancelled/rejected.
   * @param bookingId - The ID of the booking to mark as cancelled.
   * @returns A promise that resolves to an object containing the updated booking or an error.
   */
  markBookingAsCancelled(
    bookingId: string
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Marks a booking as expired.
   * @param bookingId - The ID of the booking to mark as expired.
   * @returns A promise that resolves to an object containing the updated booking or an error.
   */
  markBookingAsExpired(
    bookingId: string
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Updates an existing test drive booking.
   * @param id - The ID of the booking to update.
   * @param data - The partial data to update the booking with.
   * @returns A promise that resolves to an object containing the updated booking data or an error.
   */
  updateBooking(
    id: string,
    data: Partial<TestDriveBookingDTO>
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Deletes a test drive booking by its unique ID.
   * @param id - The ID of the booking to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteBooking(id: string): Promise<{ success: boolean; error?: string }>;

  // Rating
  /**
   * Creates a new feedback/rating for a completed test drive booking.
   * @param data - The feedback data.
   * @returns A promise that resolves to an object containing the created rating or an error.
   */
  createRating(
    data: FeedbackDTO
  ): Promise<{ success: boolean; booking?: any; error?: string }>;
  /**
   * Updates an existing feedback/rating.
   * @param id - The ID of the rating to update.
   * @param data - The partial data to update the rating with.
   * @returns A promise that resolves to an object containing the updated rating or an error.
   */
  updateRating(
    id: string,
    data: Partial<FeedbackDTO>
  ): Promise<{ success: boolean; bookingrate?: any; error?: string }>;
  /**
   * Deletes a feedback/rating by its unique ID.
   * @param id - The ID of the rating to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteRating(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the test drive service.
 * It encapsulates the business logic for managing test drive slots, bookings, and feedback,
 * including caching strategies to improve performance.
 *
 * @param testDriveRepo - The repository for test drive data access.
 * @param sellerRepo - The repository for seller data access.
 * @param evmodelRepo - The repository for EV model data access.
 * @returns An implementation of the ITestDriveService interface.
 */
export function testDriveService(
  testDriveRepo: ITestDriveRepository,
  sellerRepo: ISellerRepository,
  evmodelRepo: IEvRepository,
  notiRepo: INotificationService
): ITestDriveService {
  function timeToMinutes(time: string) {
    const [timePart, meridiem] = time.split(" "); // "10:30 AM" => ["10:30", "AM"]
    let [hours, minutes] = timePart.split(":").map(Number);

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  function isTimeSlotAvailable(
    bookingsOnSlot: { booking_time: string; duration_minutes: number }[],
    newBooking: { booking_time: string; duration_minutes: number }
  ) {
    const newStart = timeToMinutes(newBooking.booking_time);
    const newEnd = newStart + newBooking.duration_minutes;

    return !bookingsOnSlot.some((b) => {
      const existingStart = timeToMinutes(b.booking_time);
      const existingEnd = existingStart + b.duration_minutes;

      // Check if time durations overlap
      return newStart < existingEnd && existingStart < newEnd;
    });
  }

  return {
    // Slot methods
    /**
     * Finds a single test drive slot by its ID, using a cache-aside pattern.
     * Caches the individual slot data for one hour.
     */
    findSlotById: async (id) => {
      try {
        const cachekey = `slot_${id}`;
        const cachedSlot = await CacheService.getOrSet<any | null>(
          cachekey,
          async () => {
            const slot = await testDriveRepo.findSlotById(id);
            return slot ?? null;
          },
          3600
        );
        if (!cachedSlot) {
          return { success: false, error: "Slot not found" };
        }
        return { success: true, slot: cachedSlot };
      } catch (err) {
        return { success: false, error: "Failed to fetch slot" };
      }
    },
    /**
     * Retrieves all test drive slots, utilizing a cache-aside pattern.
     * Caches the list of all slots for one hour.
     */
    findAllSlots: async () => {
      try {
        const cachekey = "slots";
        const cachedSlots = await CacheService.getOrSet(
          cachekey,
          async () => {
            const slots = await testDriveRepo.findAllSlots();
            return slots ?? null;
          },
          3600
        );
        if (!cachedSlots) {
          return { success: false, error: "No slots found" };
        }
        return { success: true, slots: cachedSlots };
      } catch (err) {
        return { success: false, error: "Failed to fetch slots" };
      }
    },
    /**
     * Finds all slots for a specific seller, using a cache-aside pattern.
     * Caches the list of slots for that seller for one hour.
     */
    findSlotsBySeller: async (sellerId) => {
      try {
        const cachekey = `slots_seller_${sellerId}`;
        const cacheSlots = await CacheService.getOrSet(
          cachekey,
          async () => {
            const slots = await testDriveRepo.findSlotsBySeller(sellerId);
            return slots ?? null;
          },
          3600
        );
        if (!cacheSlots) {
          return { success: false, error: "No slots found" };
        }
        return { success: true, slots: cacheSlots };
      } catch (err) {
        return { success: false, error: "Failed to fetch slots for seller" };
      }
    },
    /**
     * Finds all active slots, using a cache-aside pattern.
     * Caches the list of active slots for one hour.
     */
    findActiveSlots: async () => {
      try {
        const cachekey = "slots_active";
        const cacheSlots = await CacheService.getOrSet(
          cachekey,
          async () => {
            const slots = await testDriveRepo.findActiveSlots();
            return slots ?? null;
          },
          3600
        );
        if (!cacheSlots) {
          return { success: false, error: "No active slots found" };
        }
        return { success: true, slots: cacheSlots };
      } catch (err) {
        return { success: false, error: "Failed to fetch active slots" };
      }
    },
    /**
     * Creates a new test drive slot after validating the associated seller and EV model.
     * It invalidates all slot-related caches to ensure data consistency.
     */
    createSlot: async (data) => {
      try {
        const seller = await sellerRepo.findById(data.seller_id);
        if (!seller) return { success: false, error: "Seller not found" };
        const model = await evmodelRepo.findModelById(data.model_id);
        if (!model) return { success: false, error: "Model not found" };
        const slot = await testDriveRepo.createSlot(data);
        if (!slot) return { success: false, error: "Failed to create slot" };
        // Invalidate all slot-related caches to ensure fresh data on next read.
        await Promise.all([
          CacheService.delete("slots"),
          CacheService.deletePattern("slots_*"),
        ]);
        return { success: true, slot: slot };
      } catch (err) {
        return { success: false, error: "Failed to create slot" };
      }
    },
    /**
     * Updates an existing test drive slot's information.
     * It invalidates all slot-related caches upon a successful update.
     */
    updateSlot: async (id, data) => {
      try {
        const model = await evmodelRepo.findModelById(data.model_id!);
        if (!model) return { success: false, error: "Model not found" };
        const slot = await testDriveRepo.updateSlot(id, data);
        if (!slot) return { success: false, error: "Slot not found" };
        // Invalidate all slot-related caches.
        await Promise.all([
          CacheService.delete("slots"),
          CacheService.deletePattern("slots_*"),
          CacheService.delete(`slot_${id}`),
        ]);
        return { success: true, slote: slot };
      } catch (err) {
        return { success: false, error: "Failed to update slot" };
      }
    },
    /**
     * Deletes a test drive slot from the system.
     * It invalidates all slot-related caches upon successful deletion.
     */
    deleteSlot: async (id) => {
      try {
        const success = await testDriveRepo.deleteSlot(id);
        if (!success) return { success: false, error: "Slot not found" };
        await Promise.all([
          // Invalidate all slot-related caches.
          CacheService.delete("slots"),
          CacheService.deletePattern("slots_*"),
          CacheService.delete(`slot_${id}`),
        ]);
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete slot" };
      }
    },

    // Booking methods
    /**
     * Finds a single test drive booking by its ID, using a cache-aside pattern.
     * Caches the individual booking data for one hour.
     */
    findBookingById: async (id) => {
      try {
        const cachekey = `booking_${id}`;
        const cachedBooking = await CacheService.getOrSet<any | null>(
          cachekey,
          async () => {
            const booking = await testDriveRepo.findBookingById(id);
            return booking ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!cachedBooking) {
          return { success: false, error: "Booking not found" };
        }
        return { success: true, booking: cachedBooking };
      } catch (err) {
        return { success: false, error: "Failed to fetch booking" };
      }
    },
    /**
     * Finds all bookings, utilizing a cache-aside pattern.
     */
    findAllBookings: async () => {
      try {
        const cachekey = "bookings_all";
        const cachedBookings = await CacheService.getOrSet<any[] | null>(
          cachekey,
          async () => {
            const bookings = await testDriveRepo.findAllBookings();
            return bookings ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!cachedBookings) {
          return { success: false, error: "No bookings found" };
        }
        return { success: true, bookings: cachedBookings };
      } catch (err) {
        return { success: false, error: "Failed to fetch all bookings" };
      }
    },
    /**
     * Finds all bookings for a specific customer, using a cache-aside pattern.
     * Caches the list of bookings for that customer for one hour.
     */
    findBookingsByCustomerId: async (customerId) => {
      try {
        const cachekey = `bookings_customer_${customerId}`;
        const cachedBookings = await CacheService.getOrSet<any[] | null>(
          cachekey,
          async () => {
            const bookings = await testDriveRepo.findBookingsByCustomerId(
              customerId
            );
            return bookings ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!cachedBookings) {
          return { success: false, error: "No bookings found" };
        }
        return { success: true, bookings: cachedBookings };
      } catch (err) {
        return { success: false, error: "Failed to fetch bookings" };
      }
    },
    /**
     * Finds all bookings for a specific seller's slots, using a cache-aside pattern.
     * Caches the list of bookings for that seller for one hour.
     */
    findBookingsBySeller: async (sellerId) => {
      try {
        const cachekey = `bookings_seller_${sellerId}`;
        const cachedBookings = await CacheService.getOrSet<any[] | null>(
          cachekey,
          async () => {
            const bookings = await testDriveRepo.findBookingsBySeller(
              sellerId
            );
            return bookings ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!cachedBookings) {
          return { success: false, error: "No bookings found" };
        }
        return { success: true, bookings: cachedBookings };
      } catch (err) {
        return { success: false, error: "Failed to fetch bookings" };
      }
    },
    /**
     * Marks a booking as completed and invalidates relevant caches.
     */
    markBookingAsCompleted: async (bookingId) => {
      try {
        const booking = await testDriveRepo.markBookingAsCompleted(bookingId);
        if (!booking) {
          return { success: false, error: "Booking not found" };
        }
        // Invalidate caches
        await Promise.all([
          CacheService.delete(`booking_${bookingId}`),
          CacheService.deletePattern("bookings_seller_*"),
          CacheService.deletePattern("bookings_customer_*"),
        ]);
        return { success: true, booking };
      } catch (err) {
        return { success: false, error: "Failed to mark booking as completed" };
      }
    },
    /**
     * Marks a booking as cancelled and invalidates relevant caches.
     */
    markBookingAsCancelled: async (bookingId) => {
      try {
        const booking = await testDriveRepo.markBookingAsCancelled(bookingId);
        if (!booking) {
          return { success: false, error: "Booking not found" };
        }
        // Invalidate caches
        await Promise.all([
          CacheService.delete(`booking_${bookingId}`),
          CacheService.deletePattern("bookings_seller_*"),
          CacheService.deletePattern("bookings_customer_*"),
        ]);
        return { success: true, booking };
      } catch (err) {
        return { success: false, error: "Failed to mark booking as cancelled" };
      }
    },
    /**
     * Marks a booking as expired and invalidates relevant caches.
     */
    markBookingAsExpired: async (bookingId) => {
      try {
        const booking = await testDriveRepo.markBookingAsExpired(bookingId);
        if (!booking) {
          return { success: false, error: "Booking not found" };
        }
        // Invalidate caches
        await Promise.all([
          CacheService.delete(`booking_${bookingId}`),
          CacheService.deletePattern("bookings_seller_*"),
          CacheService.deletePattern("bookings_customer_*"),
        ]);
        return { success: true, booking };
      } catch (err) {
        return { success: false, error: "Failed to mark booking as expired" };
      }
    },
    /**
     * Creates a new test drive booking.
     * It performs validations to ensure the slot is not fully booked and the customer
     * does not already have a booking for the same slot and date.
     * Invalidates relevant booking caches upon successful creation.
     */
    createBooking: async (data) => {
      try {
        // Validate that the slot exists.
        const slot = await testDriveRepo.findSlotById(data.slot_id);
        if (!slot) return { success: false, error: "Slot not found" };

        const bookingsOnSlot = await testDriveRepo.findBookingsBySlotId(
          data.slot_id
        );
        if (!bookingsOnSlot)
          return { success: false, error: "No bookings found" };
        // Check if the slot has reached its maximum booking capacity.
        if (bookingsOnSlot.length >= slot.max_bookings) {
          return { success: false, error: "Slot is fully booked" };
        }
        // Check if the customer already has a booking for the same slot.
        
        const existingBooking = bookingsOnSlot.find(
          (b) => b.customer_id.toString() === data.customer_id
        );
        if(existingBooking){
          return { success: false, error: "Customer already has a booking" };
        }
        // Check for time slot availability to avoid overlapping bookings.
        if (
          !isTimeSlotAvailable(bookingsOnSlot, {
            booking_time: data.booking_time,
            duration_minutes: data.duration_minutes,
          })
        ) {
          return { success: false, error: "Slot is reserved" };
        }
        // Prepare and create the new booking.
        const bookingData = {
          ...data,
          booking_date: slot.available_date,
          status: TestDriveBookingStatus.CONFIRMED,
        };
        const booking = await testDriveRepo.createBooking(bookingData as any);
        if (!booking)
          return { success: false, error: "Failed to create booking" };
        // Invalidate caches related to this customer and the new booking.
        await Promise.all([
          CacheService.delete(`bookings_customer_${data.customer_id}`),
          CacheService.delete(`booking_${booking.id}`),
          CacheService.delete("slots_active"),
          CacheService.deletePattern("slots_*"),
          CacheService.deletePattern("booking_*"),
          CacheService.deletePattern("bookings_*"),
          CacheService.deletePattern("bookings_customer_*"),
        ]);
        const decreaseResult = await testDriveRepo.decreaseSlotCount(
          data.slot_id
        );
        if (!decreaseResult) {
          return { success: false, error: "Failed to update slot count" };
        }
        const notiSeller = await notiRepo.create({
          seller_id: slot.seller_id._id.toString(),
          title: "New Booking Received",
          type: NotificationType.BOOKING_CONFIRMED,
          message: `Customer booked a slot on ${formatDateOnly(
            slot.available_date
          )}.`,
        });
        if (!notiSeller) {
          return { success: false, error: "Failed to create notification" };
        }
        return { success: true, booking };
      } catch (err) {
        console.log(err);
        return { success: false, error: "Failed to create booking" };
      }
    },

    /**
     * Updates an existing test drive booking.
     * It invalidates caches for the specific booking and the associated customer's booking list.
     */
    updateBooking: async (id, data) => {
      try {
        // Fetch the existing booking to get customer_id for cache invalidation.
        const existingBooking = await testDriveRepo.findBookingById(id);
        if (!existingBooking) {
          return { success: false, error: "Booking not found" };
        }

        const isTimeChanged =
          (data.booking_time &&
            data.booking_time !== existingBooking.booking_time) ||
          (data.duration_minutes &&
            data.duration_minutes !== existingBooking.duration_minutes);

        if (isTimeChanged) {
          // Get all bookings on the same slot EXCEPT this booking
          const bookingsOnSlot = await testDriveRepo.findBookingsBySlotId(
            existingBooking.slot_id._id.toString(),
            id
          );

          if (
            !isTimeSlotAvailable(bookingsOnSlot!, {
              booking_time: data.booking_time ?? existingBooking.booking_time,
              duration_minutes:
                data.duration_minutes ?? existingBooking.duration_minutes,
            })
          ) {
            return { success: false, error: "Slot is reserved" };
          }
        }
        const { customer_id, ...filterData } = data;
        const booking = await testDriveRepo.updateBooking(id, filterData);
        if (!booking) return { success: false, error: "Booking not found" };
        // Invalidate caches to ensure data consistency.
        await Promise.all([
          CacheService.delete(`booking_${id}`),
          CacheService.delete(
            `bookings_customer_${existingBooking.customer_id}`
          ),
        ]);
        return { success: true, booking };
      } catch (err) {
        return { success: false, error: "Failed to update booking" };
      }
    },
    /**
     * Deletes a test drive booking from the system.
     * It invalidates caches for the specific booking and the customer's booking list before deletion.
     */
    deleteBooking: async (id) => {
      try {
        const booking = await testDriveRepo.findBookingById(id);
        if (booking) {
          // Invalidate caches before deleting to prevent serving stale data.
          await CacheService.delete(`booking_${id}`);
          await CacheService.delete(`bookings_customer_${booking.customer_id}`);
          await CacheService.delete("slots_active");
          await CacheService.deletePattern("slots_*");
        }
        const success = await testDriveRepo.deleteBooking(id);
        const slotIncreaseResult = await testDriveRepo.invokeSlotIncrease(id);
        if (!slotIncreaseResult) {
          return { success: false, error: "Failed to update slot count" };
        }
        if (!success) return { success: false, error: "Booking not found" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete booking" };
      }
    },

    // Ratings
    /**
     * Creates a feedback/rating for a specific test drive booking.
     */
    createRating: async (data) => {
      try {
        const booking = await testDriveRepo.findBookingById(data.booking_id);
        if (!booking) return { success: false, error: "Booking not found" };
        const bookingrate = await testDriveRepo.createRating(data);
        return { success: true, bookingrate };
      } catch (err) {
        return { success: false, error: "Failed to create rating" };
      }
    },
    /**
     * Updates an existing feedback/rating.
     */
    updateRating: async (id, data) => {
      try {
        const bookingrate = await testDriveRepo.updateRating(id, data);
        return { success: true, bookingrate };
      } catch (err) {
        return { success: false, error: "Failed to update rating" };
      }
    },
    /**
     * Deletes a feedback/rating from the system.
     */
    deleteRating: async (id) => {
      try {
        const success = await testDriveRepo.deleteRating(id);
        if (!success) return { success: false, error: "Rating not found" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete rating" };
      }
    },
  };
}
