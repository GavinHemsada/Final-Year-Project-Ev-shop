import { CreatePaymentDTO } from "../../dtos/payment.DTO";
import { IPaymentRepository } from "./payment.repository";
import { IOrderRepository } from "../order/order.repository";
import { PaymentStatus, OrderStatus } from "../../shared/enum/enum";
import {
  createPaymentRequest,
  singelLineAddress,
  verifyNotificationHash,
} from "../../shared/utils/Payhere";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the payment service, outlining methods for creating and managing payments.
 */
export interface IPaymentService {
  /**
   * Creates a new payment record and generates a request object for the payment gateway.
   * @param data - The data required to create the payment.
   * @returns A promise that resolves to an object containing the payment gateway request object or an error.
   */
  createPayment(
    data: CreatePaymentDTO
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Validates a payment notification received from the payment gateway.
   * @param data - The notification data from the payment gateway.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  validatePayment(
    data: any
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Retrieves a payment by its unique ID.
   * @param id - The ID of the payment to find.
   * @returns A promise that resolves to an object containing the payment data or an error.
   */
  getPaymentById(
    id: string
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Retrieves a payment by its associated order ID.
   * @param orderId - The ID of the order.
   * @returns A promise that resolves to an object containing the payment data or an error.
   */
  getPaymentByOrderId(
    orderId: string
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Checks the status of a payment by its unique ID.
   * @param id - The ID of the payment to check.
   * @returns A promise that resolves to an object containing the payment data or an error.
   */
  checkPaymentStatus(
    id: string
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Retrieves a list of all payments, with optional filtering.
   * @param query - The query parameters for filtering payments.
   * @returns A promise that resolves to an object containing an array of payments or an error.
   */
  getAllPayments(
    query: any
  ): Promise<{ success: boolean; payments?: any[]; error?: string }>;
  /**
   * Updates an existing payment record.
   * @param id - The ID of the payment to update.
   * @param data - The data to update the payment with.
   * @returns A promise that resolves to an object containing the updated payment data or an error.
   */
  updatePayment(
    id: string,
    data: CreatePaymentDTO
  ): Promise<{ success: boolean; payment?: any; error?: string }>;
  /**
   * Deletes a payment record by its unique ID.
   * @param id - The ID of the payment to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deletePayment(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the payment service.
 * It encapsulates the business logic for handling payment creation, validation, and management,
 * including caching strategies to improve performance.
 *
 * @param repo - The repository for payment data access.
 * @param orderRepo - The repository for order data access.
 * @returns An implementation of the IPaymentService interface.
 */
export function paymentService(
  repo: IPaymentRepository,
  orderRepo: IOrderRepository
): IPaymentService {
  const notifyurl = process.env.PAYHERE_NOTIFY!;
  return {
    /**
     * Creates a payment record in the database and prepares a request object for the PayHere gateway.
     * Invalidates payment list caches upon creation.
     */
    createPayment: async (data) => {
      try {
        // Ensure the associated order exists.
        const order = await orderRepo.findById(data.order_id);
        if (!order) return { success: false, error: "Order not found" };
        
        // Check if user_id is populated (object with properties) or just an ObjectId
        if (!order.user_id || typeof order.user_id !== "object" || !("name" in order.user_id)) {
          return { success: false, error: "Order user information not found. Please ensure the order is properly created." };
        }

        const { returnUrl, cancelUrl, ...otherData } = data;
        // Prepare the data for the payment record.
        const paymentData = {
          ...otherData,
          status: PaymentStatus.CONFIRMED,
        };
        
        // Create the payment request object with customer details from the order.
        const user = order.user_id;
        const nameParts = (user.name || "User").split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "Name";
        
        const requestObject = createPaymentRequest({
          orderId: paymentData.order_id,
          amount: paymentData.amount,
          currency: "LKR",
          description: paymentData.payment_type,
          customerInfo: {
            firstName: firstName,
            lastName: lastName,
            email: user.email || "customer@example.com",
            phone: user.phone || "0000000000",
            address: user.address ? singelLineAddress(user.address) : "Address not provided",
            city: user.address?.city || "Colombo",
            country: user.address?.country || "Sri Lanka",
          },
          returnUrl: data.returnUrl,
          cancelUrl: data.cancelUrl,
          notifyUrl: notifyurl,
        });
        
        if (!requestObject)
          return { success: false, error: "Failed to create payment request" };
        // Create the payment record in the database.
        const payment = await repo.create(paymentData);
        if (!payment)
          return { success: false, error: "Failed to create new  payment" };

        // Invalidate list of all payments
        await CacheService.deletePattern("payments_query_*");

        return { success: true, requestObject };
      } catch (err) {
        console.log(err);
        return { success: false, error: "Failed to create payment" };
      }
    },
    /**
     * Validates the payment notification from PayHere by verifying the hash.
     * Updates the payment status in the database and invalidates relevant caches.
     */
    validatePayment: async (data) => {
      try {
        const {
          merchant_id,
          order_id,
          payment_id,
          payhere_amount,
          payhere_currency,
          status_code,
          md5sig,
          method,
        } = data;

        console.log("Payment webhook received:", {
          merchant_id,
          order_id,
          payment_id,
          status_code,
          method,
        });

        // Verify the integrity of the notification hash.
        const valid = verifyNotificationHash({
          merchantId: merchant_id,
          orderId: order_id,
          payhereAmount: payhere_amount,
          payhereCurrency: payhere_currency,
          statusCode: status_code,
          md5sig: md5sig,
        });

        if (!valid) {
          console.error("Invalid payment hash verification");
          return { success: false, error: "Invalid payment hash" };
        }

        // Find the corresponding payment record by order_id
        // Note: order_id from PayHere is the order's _id that we sent
        const payment = await repo.findByOrderId(order_id);
        if (!payment) {
          console.error(`Payment not found for order_id: ${order_id}`);
          return { success: false, error: "Payment not found" };
        }

        console.log(`Payment found: ${payment._id}, current status: ${payment.status}`);

        // Find the order to update
        const order = await orderRepo.findById(order_id);
        if (!order) {
          console.error(`Order not found for order_id: ${order_id}`);
          return { success: false, error: "Order not found" };
        }

        console.log(`Order found: ${order._id}, current status: ${order.order_status}`);

        // Update the payment status based on the status code from PayHere.
        if (status_code === "2") {
          // Payment completed
          payment.status = PaymentStatus.COMPLETED;
          payment.payment_method = method?.toLowerCase();
          payment.payment_id = payment_id;
          await payment.save();
          console.log(`Payment ${payment._id} updated to COMPLETED`);

          // Update order status to CONFIRMED when payment is completed
          order.order_status = OrderStatus.CONFIRMED;
          order.payment_status = "confirmed";
          await order.save();
          console.log(`Order ${order._id} updated to CONFIRMED`);

          // Invalidate order caches
          await Promise.all([
            CacheService.delete(`order_${order_id}`),
            CacheService.delete(`orders_user_${order.user_id}`),
            CacheService.delete(`orders_seller_${order.seller_id}`),
          ]);
        } else if (status_code === "-2") {
          // Payment failed
          payment.status = PaymentStatus.FAILED;
          payment.payment_method = method?.toLowerCase();
          payment.payment_id = payment_id;
          await payment.save();
          console.log(`Payment ${payment._id} updated to FAILED`);

          // Update order payment status to failed
          order.payment_status = "failed";
          await order.save();
          console.log(`Order ${order._id} payment_status updated to failed`);

          await Promise.all([
            CacheService.delete(`order_${order_id}`),
            CacheService.delete(`orders_user_${order.user_id}`),
            CacheService.delete(`orders_seller_${order.seller_id}`),
          ]);
        } else if (status_code === "-1") {
          // Payment cancelled
          payment.status = PaymentStatus.CANCELLED;
          payment.payment_method = method?.toLowerCase();
          payment.payment_id = payment_id;
          await payment.save();
          console.log(`Payment ${payment._id} updated to CANCELLED`);

          // Update order status to CANCELLED when payment is cancelled
          order.order_status = OrderStatus.CANCELLED;
          order.payment_status = "cancelled";
          await order.save();
          console.log(`Order ${order._id} updated to CANCELLED`);

          await Promise.all([
            CacheService.delete(`order_${order_id}`),
            CacheService.delete(`orders_user_${order.user_id}`),
            CacheService.delete(`orders_seller_${order.seller_id}`),
          ]);
        } else {
          console.log(`Unknown status_code: ${status_code}, not updating payment/order`);
        }

        // Invalidate caches for this specific payment
        await Promise.all([
          CacheService.delete(`payment_${payment._id}`),
          CacheService.delete(`payment_order_${order_id}`),
          CacheService.deletePattern("payments_query_*"),
        ]);

        return { success: true };
      } catch (err) {
        console.error("Error validating payment:", err);
        return { success: false, error: "Failed to validate payment" };
      }
    },
    /**
     * Retrieves the status and details of a payment by its ID, using a cache-aside pattern.
     * Caches the payment data for one hour.
     */
    checkPaymentStatus: async (id) => {
      try {
        const cacheKey = `payment_${id}`;
        const payment = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const paymentData = await repo.findById(id);
            return paymentData ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!payment) return { success: false, error: "Payment not found" };
        return { success: true, payment };
      } catch (err) {
        return { success: false, error: "Failed to check payment status" };
      }
    },
    /**
     * Finds a single payment by its ID, using a cache-aside pattern.
     * Caches the individual payment data for one hour.
     */
    getPaymentById: async (id) => {
      try {
        const cacheKey = `payment_${id}`;
        const payment = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const paymentData = await repo.findById(id);
            return paymentData ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!payment) return { success: false, error: "Payment not found" };
        return { success: true, payment };
      } catch (err) {
        return { success: false, error: "Failed to fetch payment" };
      }
    },
    /**
     * Finds a payment by its associated order ID, using a cache-aside pattern.
     * Caches the payment data for one hour.
     */
    getPaymentByOrderId: async (orderId) => {
      try {
        const cacheKey = `payment_order_${orderId}`;
        const payment = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const paymentData = await repo.findByOrderId(orderId);
            return paymentData ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!payment)
          return { success: false, error: "Payment not found for this order" };
        return { success: true, payment };
      } catch (err) {
        return { success: false, error: "Failed to fetch payment" };
      }
    },
    /**
     * Retrieves all payments based on a query, utilizing a cache-aside pattern.
     * Caches the list of payments for one hour, with a unique key for each query.
     */
    getAllPayments: async (query) => {
      try {
        const cacheKey = `payments_query_${JSON.stringify(query || {})}`;
        const payments = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const paymentsData = await repo.findAll(query);
            return paymentsData ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!payments) return { success: false, error: "No payments found" };
        return { success: true, payments };
      } catch (err) {
        return { success: false, error: "Failed to retrieve payments" };
      }
    },
    /**
     * Updates a payment's information.
     * Invalidates all caches related to this payment to ensure data consistency.
     */
    updatePayment: async (id, data) => {
      try {
        const existingPayment = await repo.findById(id);
        if (!existingPayment)
          return { success: false, error: "Payment not found" };

        const payment = await repo.update(id, data);
        if (!payment) return { success: false, error: "Payment not found" };

        // Invalidate all relevant caches
        await Promise.all([
          CacheService.delete(`payment_${id}`),
          CacheService.delete(`payment_order_${existingPayment.order_id}`),
          CacheService.deletePattern("payments_query_*"),
        ]);

        return { success: true, payment };
      } catch (err) {
        return { success: false, error: "Failed to update payment" };
      }
    },
    /**
     * Deletes a payment from the system.
     * Invalidates all caches related to this payment before performing the deletion.
     */
    deletePayment: async (id) => {
      try {
        const existingPayment = await repo.findById(id);
        if (existingPayment) {
          // Invalidate caches before deletion
          await Promise.all([
            CacheService.delete(`payment_${id}`),
            CacheService.delete(`payment_order_${existingPayment.order_id}`),
            CacheService.deletePattern("payments_query_*"),
          ]);
        }

        const success = await repo.delete(id);
        if (!success) return { success: false, error: "Payment not found" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete payment" };
      }
    },
  };
}
