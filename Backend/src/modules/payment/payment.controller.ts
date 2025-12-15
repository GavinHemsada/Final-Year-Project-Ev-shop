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
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
        // Sanitize query params to handle arrays (take first/last or unique)
        const getQueryParam = (param: any): string | undefined => {
          if (Array.isArray(param)) {
            return param[0] as string;
          }
          return param as string | undefined;
        };

        const order_id = getQueryParam(req.query.order_id);
        const payment_id = getQueryParam(req.query.payment_id);
        let status_code = getQueryParam(req.query.status_code);
        
        console.log("=== PAYMENT RETURN HANDLER ===");
        console.log("Query params (raw):", req.query);
        console.log("Query params (sanitized):", { order_id, payment_id, status_code });

        // If we have status_code, process standard webhook logic
        if (status_code && order_id) {
          console.log("Processing payment notification (standard)...");
          const webhookData = {
            merchant_id: getQueryParam(req.query.merchant_id),
            order_id: order_id,
            payment_id: payment_id,
            payhere_amount: getQueryParam(req.query.payhere_amount),
            payhere_currency: getQueryParam(req.query.payhere_currency),
            status_code: status_code,
            md5sig: getQueryParam(req.query.md5sig),
            method: getQueryParam(req.query.method),
          };
          await service.validatePayment(webhookData);
        } else if (order_id && !status_code) {
           console.log("Processing payment return without status_code (Dev/Fallback flow)...");
           const paymentCheck = await service.getPaymentByOrderId(order_id);
           
           if (paymentCheck.success && paymentCheck.payment) {
               if (paymentCheck.payment.status === "confirmed") {
                   console.log("Payment is CONFIRMED, assuming success from Return URL visit. Forcing validation...");
                   const mockSuccessData = {
                       merchant_id: process.env.PAYHERE_MERCHANT_ID || "",
                       order_id: order_id,
                       payment_id: payment_id || paymentCheck.payment.payment_id || "manual_verify",
                       payhere_amount: paymentCheck.payment.amount.toString(),
                       payhere_currency: "LKR",
                       status_code: "2", // Success
                       md5sig: "",  // No hash check for manual
                       method: "visa",
                   };
                   await service.validatePayment(mockSuccessData);
                   status_code = "2"; // Update local var to ensure redirect logic works
               } else if (paymentCheck.payment.status === "completed") {
                   status_code = "2"; // Already done
               }
           }
        }

        if (!order_id) {
            console.error("No order_id found in return URL");
            res.redirect(`${frontendUrl}/user/payment/error`);
            return res;
        }

        // Get the payment to check its status
        const paymentResult = await service.getPaymentByOrderId(order_id);

        if (!paymentResult.success || !paymentResult.payment) {
          console.log("Payment not found, redirecting to failed page");
          res.redirect(
            `${frontendUrl}/user/payment/failed?order_id=${order_id}`
          );
          return res;
        }

        const payment = paymentResult.payment;
        console.log("Payment status:", payment.status);

        // Redirect based on payment status
        if (payment.status === "completed" || payment.status === "CONFIRMED" || status_code === "2") {
          if (payment.status === "completed" || status_code === "2") {
             console.log("Redirecting to success page");
             res.redirect(
               `${frontendUrl}/user/payment/return?order_id=${order_id}&payment_id=${payment_id || payment.payment_id || ""}`
             );
          } else {
             // Fallback if status didn't update (should be rare with logic above)
             console.log("Payment status unclear (likely pending webhook), redirecting to pending page");
             res.redirect(
               `${frontendUrl}/user/payment/pending?order_id=${order_id}`
             );
          }
        } else if (payment.status === "failed" || status_code === "-2") {
          console.log("Redirecting to failed page");
          res.redirect(
            `${frontendUrl}/user/payment/failed?order_id=${order_id}`
          );
        } else if (payment.status === "cancelled" || status_code === "-1") {
          console.log("Redirecting to cancel page");
          res.redirect(
            `${frontendUrl}/user/payment/cancel?order_id=${order_id}`
          );
        } else {
          console.log("Payment status unclear, redirecting to pending page");
          res.redirect(
            `${frontendUrl}/user/payment/pending?order_id=${order_id}`
          );
        }
        return res;
      } catch (err) {
        console.error("Error in handlePaymentReturn:", err);
        res.redirect(`${frontendUrl}/user/payment/error`);
        return res;
      }
    },
    /**
     * Handles the redirect from PayHere when payment is cancelled.
     * Updates payment and order status to cancelled, then redirects user to cancellation page.
     */
    handlePaymentCancel: async (req, res) => {
      try {
        const { order_id } = req.query;
        console.log("=== PAYMENT CANCEL HANDLER ===");
        console.log("Order ID:", order_id);

        // Update payment and order status to cancelled
        if (order_id) {
          try {
            console.log("Attempting to update payment/order status to CANCELLED...");
            
            // Simulate webhook cancellation by calling validatePayment with status_code -1
            const result = await service.validatePayment({
              merchant_id: process.env.PAYHERE_MERCHANT_ID || "",
              order_id: order_id as string,
              payment_id: "",
              payhere_amount: "0",
              payhere_currency: "LKR",
              status_code: "-1", // -1 indicates cancelled
              md5sig: "", // Not validating hash for manual cancellation
              method: "manual_cancel",
            });
            
            console.log("Validation result:", result);
            
            if (result.success) {
              console.log(`✓ Payment and Order for order_id ${order_id} updated to CANCELLED`);
            } else {
              console.error(`✗ Failed to update status: ${result.error}`);
            }
          } catch (error) {
            console.error("Error updating payment/order status:", error);
            // Continue to redirect even if update fails
          }
        } else {
          console.log("No order_id provided in query");
        }

        console.log("Redirecting to cancel page...");
        res.redirect(
          `${frontendUrl}/user/payment/cancel?order_id=${order_id || ""}`
        );
        return res;
      } catch (err) {
        console.error("Error in handlePaymentCancel:", err);
        res.redirect(`${frontendUrl}/user/payment/error`);
        return res;
      }
    },
  };
}
