import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import {
  TestDriveBookingDTO,
  TestDriveSlotDTO,
  FeedbackDTO,
  UpdateTestDriveBookingDTO
} from "../../dtos/testDrive.DTO";
import { container } from "../../di/container";
import { ITestDriveController } from "./testDrive.controller";

/**
 * Factory function that creates and configures the router for test drive-related endpoints.
 * It resolves the test drive controller from the dependency injection container and maps
 * controller methods to specific API routes for slots, bookings, and ratings.
 *
 * @returns The configured Express Router for test drives.
 */
/**
 * @swagger
 * tags:
 *   - name: Test Drive Slots
 *     description: Management of available test drive time slots
 *   - name: Test Drive Bookings
 *     description: Management of customer test drive bookings
 *   - name: Test Drive Ratings
 *     description: Management of feedback and ratings for test drives
 */
export const testDriveRouter = (): Router => {
  const router = Router();
  // Resolve the test drive controller from the DI container.
  const controller = container.resolve<ITestDriveController>(
    "TestDriveController"
  );

  // --- Test Drive Slot Routes ---

  /**
   * @swagger
   * /test-drive/slots:
   *   post:
   *     summary: Create a new test drive slot
   *     description: Creates a new test drive slot for a specific seller and vehicle model. Requires seller or admin privileges.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestDriveSlotDTO'
   *     responses:
   *       '201':
   *         description: Slot created successfully.
   *       '400':
   *         description: Bad request (validation error, seller/model not found).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/slots", validateDto(TestDriveSlotDTO), (req, res) =>
    controller.createSlot(req, res)
  );

  /**
   * @swagger
   * /test-drive/slots:
   *   get:
   *     summary: Get all test drive slots
   *     description: Retrieves a list of all available test drive slots.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all test drive slots.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/slots", (req, res) => controller.getAllSlots(req, res));

  /**
   * @swagger
   * /test-drive/slots/seller/{sellerId}:
   *   get:
   *     summary: Get slots by seller ID
   *     description: Retrieves all test drive slots for a specific seller.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sellerId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller.
   *     responses:
   *       '200':
   *         description: A list of slots for the specified seller.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/slots/seller/:sellerId", (req, res) =>
    controller.getSlotsBySeller(req, res)
  );

  /**
   * @swagger
   * /test-drive/slots/active:
   *   get:
   *     summary: Get all active slots
   *     description: Retrieves all currently active (available) test drive slots.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of active test drive slots.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/slots/active", (req, res) =>
    controller.getActiveSlots(req, res)
  );

  /**
   * @swagger
   * /test-drive/slots/{id}:
   *   get:
   *     summary: Get slot by ID
   *     description: Retrieves a single test drive slot by its unique ID.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the test drive slot.
   *     responses:
   *       '200':
   *         description: Slot details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Slot not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/slots/:id", (req, res) => controller.getSlotById(req, res));

  /**
   * @swagger
   * /test-drive/slots/{id}:
   *   put:
   *     summary: Update a test drive slot
   *     description: Updates an existing test drive slot. Requires ownership or admin privileges.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the slot to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestDriveSlotDTO'
   *     responses:
   *       '200':
   *         description: Slot updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Slot not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/slots/:id", validateDto(TestDriveSlotDTO), (req, res) =>
    controller.updateSlot(req, res)
  );

  /**
   * @swagger
   * /test-drive/slots/{id}:
   *   delete:
   *     summary: Delete a test drive slot
   *     description: Deletes a test drive slot by its unique ID. Requires ownership or admin privileges.
   *     tags: [Test Drive Slots]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the slot to delete.
   *     responses:
   *       '200':
   *         description: Slot deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Slot not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/slots/:id", (req, res) => controller.deleteSlot(req, res));

  // --- Test Drive Booking Routes ---

  /**
   * @swagger
   * /test-drive/bookings:
   *   post:
   *     summary: Create a new test drive booking
   *     description: Creates a new test drive booking for an available slot. Requires user authentication.
   *     tags: [Test Drive Bookings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestDriveBookingDTO'
   *     responses:
   *       '201':
   *         description: Booking created successfully.
   *       '400':
   *         description: Bad request (validation error, slot not found, or slot is full).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/bookings", validateDto(TestDriveBookingDTO), (req, res) =>
    controller.createBooking(req, res)
  );

  /**
   * @swagger
   * /test-drive/bookings/customer/{customerId}:
   *   get:
   *     summary: Get bookings by customer ID
   *     description: Retrieves all test drive bookings for a specific customer. Requires ownership or admin privileges.
   *     tags: [Test Drive Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the customer.
   *     responses:
   *       '200':
   *         description: A list of the customer's bookings.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Customer not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/bookings/customer/:customerId", (req, res) =>
    controller.getBookingsByCustomer(req, res)
  );

  /**
   * @swagger
   * /test-drive/bookings/{id}:
   *   get:
   *     summary: Get booking by ID
   *     description: Retrieves a single test drive booking by its unique ID. Requires ownership or admin privileges.
   *     tags: [Test Drive Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the booking.
   *     responses:
   *       '200':
   *         description: Booking details.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Booking not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/bookings/:id", (req, res) =>
    controller.getBookingById(req, res)
  );

  /**
   * @swagger
   * /test-drive/bookings/{id}:
   *   put:
   *     summary: Update a test drive booking
   *     description: Updates an existing test drive booking. Requires ownership or admin privileges.
   *     tags: [Test Drive Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the booking to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestDriveBookingDTO'
   *     responses:
   *       '200':
   *         description: Booking updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Booking not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/bookings/:id", validateDto(UpdateTestDriveBookingDTO), (req, res) =>
    controller.updateBooking(req, res)
  );

  /**
   * @swagger
   * /test-drive/bookings/{id}:
   *   delete:
   *     summary: Delete a test drive booking
   *     description: Deletes a test drive booking by its unique ID. Requires ownership or admin privileges.
   *     tags: [Test Drive Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the booking to delete.
   *     responses:
   *       '200':
   *         description: Booking deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Booking not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/bookings/:id", (req, res) =>
    controller.deleteBooking(req, res)
  );

  // --- Test Drive Rating Routes ---

  /**
   * @swagger
   * /test-drive/ratings:
   *   post:
   *     summary: Create a new test drive rating
   *     description: Creates a new rating/feedback for a completed test drive. Requires user authentication.
   *     tags: [Test Drive Ratings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FeedbackDTO'
   *     responses:
   *       '201':
   *         description: Rating created successfully.
   *       '400':
   *         description: Bad request (validation error or booking not found).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/ratings", validateDto(FeedbackDTO), (req, res) =>
    controller.createRating(req, res)
  );

  /**
   * @swagger
   * /test-drive/ratings/{id}:
   *   put:
   *     summary: Update an existing test drive rating
   *     description: Updates an existing rating/feedback. This route is functionally identical to POST and could be consolidated. Requires ownership or admin privileges.
   *     tags: [Test Drive Ratings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FeedbackDTO'
   *     responses:
   *       '200':
   *         description: Rating updated successfully.
   *       '400':
   *         description: Bad request (validation error or booking not found).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/ratings/:id", validateDto(FeedbackDTO), (req, res) =>
    controller.updateRating(req, res)
  );

  /**
   * @swagger
   * /test-drive/ratings/{id}:
   *   delete:
   *     summary: Delete a test drive rating
   *     description: Deletes a rating by the booking ID. Requires ownership or admin privileges.
   *     tags: [Test Drive Ratings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the booking whose rating is to be deleted.
   *     responses:
   *       '200':
   *         description: Rating deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Rating/Booking not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/ratings/:id", (req, res) =>
    controller.deleteRating(req, res)
  );

  return router;
};
