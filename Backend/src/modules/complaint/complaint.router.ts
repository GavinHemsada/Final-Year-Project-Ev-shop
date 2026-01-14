import { Router } from "express";
import { IComplaintController } from "./complaint.controller";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for complaint-related endpoints.
 */
export const complaintRouter = (): Router => {
  const router = Router();
  const complaintController = container.resolve<IComplaintController>(
    "ComplaintController"
  );

  /**
   * POST /complaint
   * Creates a new complaint
   */
  router.post("/", (req, res) =>
    complaintController.createComplaint(req, res)
  );

  /**
   * GET /complaint
   * Retrieves all complaints (optionally filtered by status)
   */
  router.get("/", (req, res) =>
    complaintController.getAllComplaints(req, res)
  );

  /**
   * GET /complaint/:id
   * Retrieves a complaint by ID
   */
  router.get("/:id", (req, res) =>
    complaintController.getComplaintById(req, res)
  );

  /**
   * PUT /complaint/:id
   * Updates a complaint (e.g., to resolve it)
   */
  router.put("/:id", (req, res) =>
    complaintController.updateComplaint(req, res)
  );

  /**
   * DELETE /complaint/:id
   * Deletes a complaint
   */
  router.delete("/:id", (req, res) =>
    complaintController.deleteComplaint(req, res)
  );

  return router;
};
