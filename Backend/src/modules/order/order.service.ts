import { CreateOrderDTO, UpdateOrderDTO } from "../../dtos/order.DTO";
import { OrderStatus, PaymentStatus } from "../../shared/enum/enum";
import { IOrderRepository } from "./order.repository";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the order service, outlining the methods for managing orders.
 */
export interface IOrderService {
  /**
   * Creates a new order.
   * @param data - The data for the new order.
   * @returns A promise that resolves to an object containing the created order or an error.
   */
  createOrder(
    data: CreateOrderDTO
  ): Promise<{ success: boolean; order?: any; error?: string }>;

  /**
   * Retrieves all orders.
   * @returns A promise that resolves to an object containing an array of all orders or an error.
   */
  getAllOrders(): Promise<{ success: boolean; orders?: any[]; error?: string }>;
  /**
   * Retrieves an order by its unique ID.
   * @param id - The ID of the order to find.
   * @returns A promise that resolves to an object containing the order data or an error.
   */
  getOrderById(
    id: string
  ): Promise<{ success: boolean; order?: any; error?: string }>;
  /**
   * Retrieves all orders placed by a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's orders or an error.
   */
  getOrdersByUserId(
    userId: string
  ): Promise<{ success: boolean; orders?: any[]; error?: string }>;
  /**
   * Retrieves all orders associated with a specific seller.
   * @param sellerId - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's orders or an error.
   */
  getOrdersBySellerId(
    sellerId: string
  ): Promise<{ success: boolean; orders?: any[]; error?: string }>;
  /**
   * Updates an existing order.
   * @param id - The ID of the order to update.
   * @param data - The data to update the order with.
   * @returns A promise that resolves to an object containing the updated order data or an error.
   */
  updateOrder(
    id: string,
    data: UpdateOrderDTO
  ): Promise<{ success: boolean; order?: any; error?: string }>;
  /**
   * Cancels an order by updating its status.
   * @param id - The ID of the order to cancel.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  cancelOrder(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the order service.
 * It encapsulates the business logic for managing orders, including caching strategies
 * to improve performance.
 *
 * @param repo - The repository for order data access.
 * @returns An implementation of the IOrderService interface.
 */
export function orderService(repo: IOrderRepository): IOrderService {
  return {
    /**
     * Creates a new order with default statuses and invalidates the relevant user and seller order list caches.
     */
    createOrder: async (data) => {
      try {
        const orderData = {
          ...data,
          order_date: new Date(),
          order_status: OrderStatus.PENDING,
          payment_status: PaymentStatus.CONFIRMED,
        };
        const order = await repo.create(orderData);
        if (!order) return { success: false, error: "Failed to create order" };
        // Invalidate caches for user and seller order lists.
        await Promise.all([
          CacheService.delete(`orders_user_${order.user_id}`),
          CacheService.delete(`orders_seller_${order.seller_id}`),
        ]);

        return { success: true, order };
      } catch (err) {
        return { success: false, error: "Failed to create order" };
      }
    },
    /**
     * Retrieves all orders without caching.
     * This method fetches the complete list of orders directly from the repository.
     */
    getAllOrders: async () => {
      try {
        const cacheKey = `orders_all`;
        const orders = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const orders = await repo.findAll();
            return orders ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!orders) return { success: false, error: "No orders found" };
        return { success: true, orders };
      } catch (err) {
        return { success: false, error: "Failed to fetch orders" };
      }
    },

    /**
     * Finds a single order by its ID, using a cache-aside pattern.
     * Caches the individual order data for one hour.
     */
    getOrderById: async (id) => {
      try {
        const cacheKey = `order_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const order = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const orderData = await repo.findById(id);
            return orderData ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!order) return { success: false, error: "Order not found" };
        return { success: true, order };
      } catch (err) {
        return { success: false, error: "Failed to fetch order" };
      }
    },

    /**
     * Finds all orders for a specific user, using a cache-aside pattern.
     * Caches the list of orders for that user for one hour.
     */
    getOrdersByUserId: async (userId) => {
      try {
        if (!userId || !userId.trim()) {
          return { success: false, error: "User ID is required" };
        }
        const trimmedUserId = userId.trim();

        const cacheKey = `orders_user_${trimmedUserId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const orders = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const ordersData = await repo.findByUserId(trimmedUserId);
            return ordersData ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!orders) return { success: false, error: "No orders found" };
        // Return success even if array is empty (user has no orders)
        return { success: true, orders };
      } catch (err: any) {
        console.error("getOrdersByUserId error:", err);
        return {
          success: false,
          error: err?.message || "Failed to fetch orders",
        };
      }
    },

    /**
     * Finds all orders for a specific seller, using a cache-aside pattern.
     * Caches the list of orders for that seller for one hour.
     */
    getOrdersBySellerId: async (sellerId) => {
      try {
        const cacheKey = `orders_seller_${sellerId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const orders = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const ordersData = await repo.findBySellerId(sellerId);
            return ordersData ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!orders) return { success: false, error: "No orders found" };
        return { success: true, orders };
      } catch (err) {
        return { success: false, error: "Failed to fetch orders" };
      }
    },

    /**
     * Updates an order's information.
     * Invalidates all caches related to this order (specific order, user's list, seller's list) to ensure data consistency.
     */
    updateOrder: async (id, data) => {
      try {
        // Fetch the existing order to get its IDs for cache invalidation.
        const existingOrder = await repo.findById(id);
        if (!existingOrder) return { success: false, error: "Order not found" };

        const order = await repo.update(id, data);
        if (!order) return { success: false, error: "Order not found" };

        // Invalidate all relevant caches
        await Promise.all([
          CacheService.delete(`order_${id}`),
          CacheService.delete(`orders_user_${existingOrder.user_id}`),
          CacheService.delete(`orders_seller_${existingOrder.seller_id}`),
        ]);

        return { success: true, order };
      } catch (err) {
        return { success: false, error: "Failed to update order" };
      }
    },

    /**
     * Cancels an order by setting its status to CANCELLED.
     * This method reuses the `updateOrder` logic to ensure consistent cache invalidation.
     */
    cancelOrder: async (id) => {
      try {
        const order = await repo.findById(id);
        if (!order) return { success: false, error: "Order not found" };

        // Reuse updateOrder logic to ensure consistent cache invalidation.
        const result = await orderService(repo).updateOrder(id, {
          order_status: OrderStatus.CANCELLED,
        });

        return { success: result.success, error: result.error };
      } catch (err) {
        return { success: false, error: "Failed to cancel order" };
      }
    },
  };
}
