import { Router } from "express";
import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { CreateOrderDTO, UpdateOrderDTO } from "../../dtos/order.DTO";
import { IOrderController } from "./order.controller";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for order-related endpoints.
 * It resolves the order controller from the dependency injection container and maps
 * controller methods to specific API routes.
 *
 * @returns The configured Express Router for order management.
 */
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */
export const orderRouter = (): Router => {
  const router = Router();
  // Resolve the order controller from the DI container.
  const controller = container.resolve<IOrderController>("OrderController");

  /**
   * @swagger
   * /order:
   *   post:
   *     summary: Create a new order
   *     description: Creates a new order based on the provided details. Requires user authentication.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderDTO'
   *     responses:
   *       '201':
   *         description: Order created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 order: { type: object } # Ideally $ref to an Order schema
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/", validateDto(CreateOrderDTO), (req, res) =>
    controller.createOrder(req, res)
  );
  /**
   * @swagger
   * /order:
   *   get:
   *     summary: Get all orders
   *     description: Retrieves a list of all orders in the system. Requires admin privileges.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all orders.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 orders: { type: array, items: { type: object } } # Ideally $ref to an Order schema
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/", (req, res) => controller.getAllOrders(req, res));

  /**
   * @swagger
   * /order/user/{userId}:
   *   get:
   *     summary: Get orders by user ID
   *     description: Retrieves all orders for a specific user. Requires user to be the owner or an admin.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose orders are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the user's orders.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden (if user is not the owner or an admin).
   *       '404':
   *         description: User not found or no orders found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:role/:userId", (req, res) =>
    controller.getOrdersByUserIdOrSellerId(req, res)
  );

  /**
   * @swagger
   * /order/{id}:
   *   get:
   *     summary: Get order by ID
   *     description: Retrieves a single order by its unique ID. Requires user to be involved in the order or an admin.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the order to retrieve.
   *     responses:
   *       '200':
   *         description: Order details.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Order not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/:id", (req, res) => controller.getOrderById(req, res));

  /**
   * @swagger
   * /order/{id}:
   *   patch:
   *     summary: Update order status
   *     description: Updates an existing order, typically to change its status (e.g., 'SHIPPED', 'DELIVERED'). Requires seller or admin privileges.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the order to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateOrderDTO'
   *     responses:
   *       '200':
   *         description: Order updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Order not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/:id", validateDto(UpdateOrderDTO), (req, res) =>
    controller.updateOrder(req, res)
  );

  /**
   * @swagger
   * /order/{id}/cancel:
   *   patch:
   *     summary: Cancel an order
   *     description: Cancels an order. Requires user to be the one who placed the order or an admin.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the order to cancel.
   *     responses:
   *       '200':
   *         description: Order cancelled successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Order not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/:id/cancel", (req, res) => controller.cancelOrder(req, res));
  
  /**
   * @swagger
   * /order/{id}:
   *   delete:
   *     summary: Delete an order
   *     description: Deletes an order permanently. Requires admin privileges.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the order to delete.
   *     responses:
   *       '200':
   *         description: Order deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Order not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/:id", (req, res) => controller.deleteOrder(req, res));

  return router;
};
