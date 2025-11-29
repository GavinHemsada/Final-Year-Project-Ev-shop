import { Request, Response } from "express";
import { IPaymentService } from "./payment.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the payment controller, specifying methods for handling HTTP requests related to payments.
 */
export interface IPaymentController {
  /**
   * Handles the HTTP request to create a new payment session (e.g., with Stripe).
   * @param req - The Express request object, containing payment details in the body.
   * @param res - The Express response object.
   */
  createPayment(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a payment by its unique ID.
   * @param req - The Express request object, containing the payment ID in `req.params`.
   * @param res - The Express response object.
   */
  getPaymentById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a payment associated with a specific order ID.
   * @param req - The Express request object, containing the order ID in `req.params`.
   * @param res - The Express response object.
   */
  getPaymentByOrderId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to validate a payment after the user is redirected from the payment gateway.
   * @param req - The Express request object, containing validation data in `req.params` or `req.body`.
   * @param res - The Express response object.
   */
  validatePayment(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to check the status of a payment.
   * @param req - The Express request object, containing the payment ID in `req.params`.
   * @param res - The Express response object.
   */
  checkPaymentStatus(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all payments, with optional filtering via query parameters.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllPayments(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing payment record.
   * @param req - The Express request object, containing the payment ID and update data.
   * @param res - The Express response object.
   */
  updatePayment(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a payment record.
   * @param req - The Express request object, containing the payment ID in `req.params`.
   * @param res - The Express response object.
   */
  deletePayment(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the redirect from PayHere after payment completion.
   * @param req - The Express request object, containing query parameters from PayHere.
   * @param res - The Express response object.
   */
  handlePaymentReturn(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the redirect from PayHere when payment is cancelled.
   * @param req - The Express request object, containing query parameters from PayHere.
   * @param res - The Express response object.
   */
  handlePaymentCancel(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the payment controller.
 * It encapsulates the logic for handling API requests related to payments.
 *
 * @param service - The payment service dependency that contains the business logic.
 * @returns An implementation of the IPaymentController interface.
 */
export function paymentController(
  service: IPaymentService
): IPaymentController {
  return {
    /**
     * Creates a new payment session.
     */
    createPayment: async (req, res) => {
      try {
        const result = await service.createPayment(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createPayment");
      }
    },
    /**
     * Retrieves a single payment by its ID.
     */
    getPaymentById: async (req, res) => {
      try {
        const result = await service.getPaymentById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getPaymentById");
      }
    },
    /**
     * Retrieves payment details for a specific order.
     */
    getPaymentByOrderId: async (req, res) => {
      try {
        const result = await service.getPaymentByOrderId(req.params.orderId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getPaymentByOrderId");
      }
    },
    /**
     * Validates a payment after the user returns from the payment gateway.
     * PayHere sends form data (application/x-www-form-urlencoded), so we use req.body
     */
    validatePayment: async (req, res) => {
      try {
        // PayHere sends data as form-urlencoded, so we need to use req.body
        const result = await service.validatePayment(req.body);
        // PayHere expects a simple response
        if (result.success) {
          return res.status(200).send("OK");
        }
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "validatePayment");
      }
    },
    /**
     * Checks the status of a specific payment transaction.
     */
    checkPaymentStatus: async (req, res) => {
      try {
        const result = await service.checkPaymentStatus(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "checkPaymentStatus");
      }
    },
    /**
     * Retrieves a list of all payments, with support for query-based filtering.
     */
    getAllPayments: async (req, res) => {
      try {
        const result = await service.getAllPayments(req.query);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllPayments");
      }
    },
    /**
     * Updates an existing payment record.
     */
    updatePayment: async (req, res) => {
      try {
        const result = await service.updatePayment(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updatePayment");
      }
    },
    /**
     * Deletes a payment record by its ID.
     */
    deletePayment: async (req, res) => {
      try {
        const result = await service.deletePayment(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deletePayment");
      }
    },
    /**
     * Handles the redirect from PayHere after payment completion.
     * Redirects user to success or failure page based on payment status.
     * Also updates payment and order status if webhook hasn't fired yet.
     */
    handlePaymentReturn: async (req, res) => {
      try {
        const { order_id, payment_id, status_code } = req.query;
        
        // If we have status_code from PayHere, process it as a webhook would
        if (status_code && order_id) {
          // Process the payment notification similar to webhook
          const webhookData = {
            merchant_id: req.query.merchant_id as string,
            order_id: order_id as string,
            payment_id: payment_id as string,
            payhere_amount: req.query.payhere_amount as string,
            payhere_currency: req.query.payhere_currency as string,
            status_code: status_code as string,
            md5sig: req.query.md5sig as string,
            method: req.query.method as string,
          };
          
          // Try to validate and update payment/order status
          await service.validatePayment(webhookData);
        }
        
        // Get the payment to check its status
        const paymentResult = await service.getPaymentByOrderId(order_id as string);
        
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        
        if (!paymentResult.success || !paymentResult.payment) {
          // Redirect to failure page if payment not found
          res.redirect(`${frontendUrl}/user/payment/failed?order_id=${order_id}`);
          return res;
        }

        const payment = paymentResult.payment;

        // Redirect based on payment status
        if (payment.status === "completed" || status_code === "2") {
          res.redirect(`${frontendUrl}/user/payment/return?order_id=${order_id}&payment_id=${payment_id}`);
        } else if (payment.status === "failed" || status_code === "-2") {
          res.redirect(`${frontendUrl}/user/payment/failed?order_id=${order_id}`);
        } else {
          res.redirect(`${frontendUrl}/user/payment/pending?order_id=${order_id}`);
        }
        return res;
      } catch (err) {
        console.error("Error in handlePaymentReturn:", err);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/user/payment/error`);
        return res;
      }
    },
    /**
     * Handles the redirect from PayHere when payment is cancelled.
     * Redirects user to cancellation page.
     */
    handlePaymentCancel: async (req, res) => {
      try {
        const { order_id } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        
        // Optionally update payment status to cancelled
        if (order_id) {
          const paymentResult = await service.getPaymentByOrderId(order_id as string);
          if (paymentResult.success && paymentResult.payment) {
            // Payment cancellation will be handled by the webhook if user cancels during payment
            // This is just for the redirect
          }
        }
        
        res.redirect(`${frontendUrl}/payment/cancelled?order_id=${order_id || ""}`);
        return res;
      } catch (err) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/payment/error`);
        return res;
      }
    },
  };
}
