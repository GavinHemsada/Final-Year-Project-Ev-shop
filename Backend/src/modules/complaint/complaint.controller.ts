import { Request, Response } from "express";
import { IComplaintService } from "./complaint.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the complaint controller.
 */
export interface IComplaintController {
  /**
   * Handles the HTTP request to create a new complaint.
   */
  createComplaint(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all complaints.
   */
  getAllComplaints(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a complaint by ID.
   */
  getComplaintById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update a complaint.
   */
  updateComplaint(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a complaint.
   */
  deleteComplaint(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the complaint controller.
 */
export function complaintController(
  complaintService: IComplaintService
): IComplaintController {
  return {
    createComplaint: async (req, res) => {
      try {
        const result = await complaintService.create(req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error creating complaint");
      }
    },
    getAllComplaints: async (req, res) => {
      try {
        const status = req.query.status as string | undefined;
        const userType = req.query.user_type as string | undefined;
        const result = await complaintService.findAll(status, userType);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting all complaints");
      }
    },
    getComplaintById: async (req, res) => {
      try {
        const result = await complaintService.findById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting complaint");
      }
    },
    updateComplaint: async (req, res) => {
      try {
        const result = await complaintService.update(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error updating complaint");
      }
    },
    deleteComplaint: async (req, res) => {
      try {
        const result = await complaintService.delete(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error deleting complaint");
      }
    },
  };
}
