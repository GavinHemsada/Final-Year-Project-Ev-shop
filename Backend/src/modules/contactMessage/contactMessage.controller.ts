import { Request, Response } from "express";
import { IContactMessageService } from "./contactMessage.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the contact message controller.
 */
export interface IContactMessageController {
  /**
   * Handles the HTTP request to create a new contact message.
   */
  createContactMessage(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all contact messages.
   */
  getAllContactMessages(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get a contact message by ID.
   */
  getContactMessageById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update a contact message.
   */
  updateContactMessage(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a contact message.
   */
  deleteContactMessage(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get contact message statistics.
   */
  getContactMessageStats(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the contact message controller.
 */
export function contactMessageController(
  contactMessageService: IContactMessageService
): IContactMessageController {
  return {
    createContactMessage: async (req, res) => {
      try {
        const result = await contactMessageService.create(req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error creating contact message");
      }
    },
    getAllContactMessages: async (req, res) => {
      try {
        const isRead = req.query.isRead !== undefined ? req.query.isRead === "true" : undefined;
        const result = await contactMessageService.findAll(isRead);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting all contact messages");
      }
    },
    getContactMessageById: async (req, res) => {
      try {
        const result = await contactMessageService.findById(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting contact message");
      }
    },
    updateContactMessage: async (req, res) => {
      try {
        const result = await contactMessageService.update(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error updating contact message");
      }
    },
    deleteContactMessage: async (req, res) => {
      try {
        const result = await contactMessageService.delete(req.params.id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error deleting contact message");
      }
    },
    getContactMessageStats: async (req, res) => {
      try {
        const result = await contactMessageService.getStats();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "Error getting contact message statistics");
      }
    },
  };
}
