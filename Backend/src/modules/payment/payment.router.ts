import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { CreatePaymentDTO } from "../../dtos/payment.DTO";
import { IPaymentController } from "./payment.controller";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for payment-related endpoints.
 * It resolves the payment controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for payment processing.
 */
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and management
 */
export const paymentRouter = (): Router => {
  const router = Router();
  // Resolve the payment controller from the DI container.
  const controller = container.resolve<IPaymentController>("PaymentController");

  /**
   * @swagger
   * /payment:
   *   post:
   *     summary: Create a payment session
   *     description: Creates a new payment session and returns a request object for the payment gateway (e.g., PayHere). Requires user authentication.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePaymentDTO'
   *     responses:
   *       '201':
   *         description: Payment session created successfully. Returns a request object for the payment gateway.
   *       '400':
   *         description: Bad request (validation error or order not found).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/", validateDto(CreatePaymentDTO), (req, res) =>
    controller.createPayment(req, res)
  );

  /**
   * @swagger
   * /payment/payment-notify:
   *   post:
   *     summary: Handle payment gateway notification (Webhook)
   *     description: Handles webhook notifications from the payment gateway (e.g., PayHere) to validate a payment and update its status. This endpoint is public and intended to be called by the payment service.
   *     tags: [Payments]
   *     requestBody:
   *       description: The notification payload from the payment gateway.
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               merchant_id: { type: string }
   *               order_id: { type: string }
   *               payment_id: { type: string }
   *               payhere_amount: { type: string }
   *               payhere_currency: { type: string }
   *               status_code: { type: string }
   *               md5sig: { type: string }
   *               method: { type: string }
   *     responses:
   *       '200':
   *         description: Notification received and processed successfully.
   *       '400':
   *         description: Bad request (e.g., invalid hash, payment not found).
   *       '500':
   *         description: Internal server error.
   */
  // Payment webhook and return/cancel endpoints are registered in app.ts as public routes
  // They are not included here to avoid duplication

  /**
   * @swagger
   * /payment/payment-status/{id}:
   *   get:
   *     summary: Check payment status
   *     description: Checks the status of a specific payment transaction by its ID.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the payment to check.
   *     responses:
   *       '200':
   *         description: Payment status retrieved successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Payment not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/payment-status/:id", (req, res) =>
    controller.checkPaymentStatus(req, res)
  );

  /**
   * @swagger
   * /payment:
   *   get:
   *     summary: Get all payments
   *     description: Retrieves a list of all payments. Typically restricted to Admins. Supports filtering via query parameters.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [PENDING, COMPLETED, FAILED, CANCELLED, CONFIRMED] }
   *         description: Filter payments by status.
   *       - in: query
   *         name: user_id
   *         schema: { type: string }
   *         description: Filter payments by user ID.
   *     responses:
   *       '200':
   *         description: A list of payments.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not an admin).
   *       '500':
   *         description: Internal server error.
   */
  router.get("/", (req, res) => controller.getAllPayments(req, res));

  /**
   * @swagger
   * /payment/{id}:
   *   get:
   *     summary: Get payment by ID
   *     description: Retrieves a single payment record by its unique ID.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the payment to retrieve.
   *     responses:
   *       '200':
   *         description: Payment details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Payment not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:id", (req, res) => controller.getPaymentById(req, res));

  /**
   * @swagger
   * /payment/order/{orderId}:
   *   get:
   *     summary: Get payment by order ID
   *     description: Retrieves payment details for a specific order.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the order to retrieve payment details for.
   *     responses:
   *       '200':
   *         description: Payment details for the order.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Payment for the specified order not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/order/:orderId", (req, res) =>
    controller.getPaymentByOrderId(req, res)
  );

  /**
   * @swagger
   * /payment/{id}:
   *   patch:
   *     summary: Update a payment
   *     description: Updates an existing payment record. This is typically restricted to Admins for manual adjustments.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the payment to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePaymentDTO'
   *     responses:
   *       '200':
   *         description: Payment updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Payment not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/:id", validateDto(CreatePaymentDTO), (req, res) =>
    controller.updatePayment(req, res)
  );

  /**
   * @swagger
   * /payment/{id}:
   *   delete:
   *     summary: Delete a payment
   *     description: Deletes a payment record by its unique ID. This is typically restricted to Admins.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the payment to delete.
   *     responses:
   *       '200':
   *         description: Payment deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Payment not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/:id", (req, res) => controller.deletePayment(req, res));

  return router;
};
