import { CreateOrderDTO, UpdateOrderDTO } from "../../dtos/order.DTO";
import { OrderStatus, PaymentStatus } from "../../shared/enum/enum";
import { IOrderRepository } from "./order.repository";
import CacheService from "../../shared/cache/CacheService";
import { IUserRepository } from "../user/user.repository";
import { ISellerRepository } from "../seller/seller.repository";

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
  getOrdersBySellerOrUserId(
    id: string,
    role: "user" | "seller"
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
  
  /**
    * Deletes an order permanently.
    * @param id - The ID of the order to delete.
    * @returns A promise that resolves to an object indicating success or failure.
    */
  deleteOrder(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the order service.
 * It encapsulates the business logic for managing orders, including caching strategies
 * to improve performance.
 *
 * @param repo - The repository for order data access.
 * @returns An implementation of the IOrderService interface.
 */
export function orderService(repo: IOrderRepository, userRepo: IUserRepository, sellerrepo: ISellerRepository): IOrderService {
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

    getOrdersBySellerOrUserId: async (id: string, role: "user" | "seller") => {
      try {
        const trimmedId = id.trim();
        const repos = role === "user" ? userRepo : sellerrepo;
        const exists = await repos.findById(trimmedId);
        if (!exists) {
          return {
            success: false,
            error: `${role === "user" ? "User" : "Seller"} not found`,
          };
        }
        const cacheKey =
          role === "user"
            ? `orders_user_${trimmedId}`
            : `orders_seller_${trimmedId}`;

        const orders = await CacheService.getOrSet(
          cacheKey,
          async () => await repo.findByUserOrSellerId(trimmedId),
          3600 // 1 hour
        );
        console.log(orders);
        return {
          success: true,
          orders: orders ?? [],
        };
      } catch (err: any) {
        console.error(`getOrdersByOwner (${role}) error:`, err);
        return {
          success: false,
          error: err?.message || "Failed to fetch orders",
        };
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
          CacheService.deletePattern(`orders_*`),
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
        const result = await repo.update(id, {
          order_status: OrderStatus.CANCELLED,
        });
        if (!result) return { success: false, error: "Failed to cancel order" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to cancel order" };
      }
    },

    /**
     * Deletes an order permanently.
     * Invalidates all related caches.
     */
    deleteOrder: async (id) => {
      try {
        const order = await repo.findById(id);
        if (!order) return { success: false, error: "Order not found" };

        const success = await repo.delete(id);
        if (!success) return { success: false, error: "Failed to delete order" };

        // Invalidate all relevant caches
        await Promise.all([
          CacheService.delete(`order_${id}`),
          CacheService.deletePattern(`orders_*`),
          CacheService.delete(`orders_user_${order.user_id}`),
          CacheService.delete(`orders_seller_${order.seller_id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete order" };
      }
    },
  };
}
