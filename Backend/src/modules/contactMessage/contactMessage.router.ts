import { Router } from "express";
import { IContactMessageController } from "./contactMessage.controller";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for contact message-related endpoints.
 */
/**
 * Note: POST /contact-message is handled as a public route in app.ts
 * This router only contains admin routes that require authentication
 */
export const contactMessageRouter = (): Router => {
  const router = Router();
  const contactMessageController = container.resolve<IContactMessageController>(
    "ContactMessageController"
  );

  /**
   * GET /contact-message
   * Retrieves all contact messages (admin only - requires authentication)
   */
  router.get("/", (req, res) =>
    contactMessageController.getAllContactMessages(req, res)
  );

  /**
   * GET /contact-message/stats
   * Gets contact message statistics (admin only - requires authentication)
   */
  router.get("/stats", (req, res) =>
    contactMessageController.getContactMessageStats(req, res)
  );

  /**
   * GET /contact-message/:id
   * Retrieves a contact message by ID (admin only - requires authentication)
   */
  router.get("/:id", (req, res) =>
    contactMessageController.getContactMessageById(req, res)
  );

  /**
   * PUT /contact-message/:id
   * Updates a contact message (admin only - requires authentication)
   */
  router.put("/:id", (req, res) =>
    contactMessageController.updateContactMessage(req, res)
  );

  /**
   * DELETE /contact-message/:id
   * Deletes a contact message (admin only - requires authentication)
   */
  router.delete("/:id", (req, res) =>
    contactMessageController.deleteContactMessage(req, res)
  );

  return router;
};
