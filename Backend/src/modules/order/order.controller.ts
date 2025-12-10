import { Request, Response } from "express";
import { IOrderService } from "./order.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the order controller, specifying methods for handling HTTP requests related to orders.
 */
export interface IOrderController {
  /**
   * Handles the HTTP request to create a new order.
   * @param req - The Express request object, containing order data in the body.
   * @param res - The Express response object.
   */
  createOrder(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all orders.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  getAllOrders(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get an order by its unique ID.
   * @param req - The Express request object, containing the order ID in `req.params`.
   * @param res - The Express response object.
   */
  getOrderById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all orders for a specific user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  getOrdersByUserId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all orders for a specific seller.
   * @param req - The Express request object, containing the seller ID in `req.params`.
   * @param res - The Express response object.
   */
  getOrdersBySellerId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing order (e.g., change its status).
   * @param req - The Express request object, containing the order ID and update data.
   * @param res - The Express response object.
   */
  updateOrder(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to cancel an order.
   * @param req - The Express request object, containing the order ID in `req.params`.
   * @param res - The Express response object.
   */
  cancelOrder(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the order controller.
 * It encapsulates the logic for handling API requests related to orders.
 *
 * @param service - The order service dependency that contains the business logic.
 * @returns An implementation of the IOrderController interface.
 */
export function orderController(service: IOrderService): IOrderController {
  return {
    /**
     * Creates a new order from the items in a user's cart.
     */
    createOrder: async (req, res) => {
      try {
        const result = await service.createOrder(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createOrder");
      }
    },

    /**
     * Retrieves all orders in the system.
     */
    getAllOrders: async (req, res) => {
      try {
        const result = await service.getAllOrders();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllOrders");
      }
    },
    /**
     * Retrieves a single order by its ID.
     */
    getOrderById: async (req, res) => {
      try {
        const result = await service.getOrderById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getOrderById");
      }
    },
    /**
     * Retrieves all orders placed by a specific user.
     */
    getOrdersByUserId: async (req, res) => {
      try {
        // Decode URL-encoded characters (like %0A for newline) and trim whitespace
        const userId = decodeURIComponent(req.params.userId || "").trim();
        if (!userId) {
          return handleError(
            res,
            new Error("User ID is required"),
            "getOrdersByUserId"
          );
        }
        const result = await service.getOrdersByUserId(userId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getOrdersByUserId");
      }
    },
    /**
     * Retrieves all orders associated with a specific seller.
     */
    getOrdersBySellerId: async (req, res) => {
      try {
        const result = await service.getOrdersBySellerId(req.params.sellerId);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getOrdersBySellerId");
      }
    },
    /**
     * Updates an existing order, typically to change its status (e.g., "shipped", "delivered").
     */
    updateOrder: async (req, res) => {
      try {
        const result = await service.updateOrder(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateOrder");
      }
    },
    /**
     * Cancels an order by its ID.
     */
    cancelOrder: async (req, res) => {
      try {
        const result = await service.cancelOrder(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "cancelOrder");
      }
    },
  };
}
