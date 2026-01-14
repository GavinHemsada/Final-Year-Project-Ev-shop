import { IComplaintRepository } from "./complaint.repository";
import { CreateComplaintDTO, UpdateComplaintDTO } from "./complaint.dto";
import { INotificationService } from "../notification/notification.service";
import { ISellerRepository } from "../seller/seller.repository";
import { IFinancialRepository } from "../financial/financial.repository";
import { sendEmail } from "../../shared/utils/Email.util";

/**
 * Defines the interface for the complaint service.
 */
export interface IComplaintService {
  /**
   * Creates a new complaint.
   * @param data - The complaint data to create.
   * @returns A promise that resolves to an object containing the created complaint or an error.
   */
  create(
    data: CreateComplaintDTO
  ): Promise<{ success: boolean; complaint?: any; error?: string }>;
  /**
   * Retrieves all complaints, optionally filtered by status and user type.
   * @param status - Optional status filter.
   * @param userType - Optional user type filter.
   * @returns A promise that resolves to an object containing an array of complaints or an error.
   */
  findAll(
    status?: string,
    userType?: string
  ): Promise<{ success: boolean; complaints?: any[]; error?: string }>;
  /**
   * Retrieves a complaint by its unique ID.
   * @param id - The ID of the complaint to find.
   * @returns A promise that resolves to an object containing the complaint data or an error.
   */
  findById(
    id: string
  ): Promise<{ success: boolean; complaint?: any; error?: string }>;
  /**
   * Updates a complaint.
   * @param id - The ID of the complaint to update.
   * @param data - The partial data to update.
   * @returns A promise that resolves to an object containing the updated complaint data or an error.
   */
  update(
    id: string,
    data: UpdateComplaintDTO
  ): Promise<{ success: boolean; complaint?: any; error?: string }>;
  /**
   * Deletes a complaint by its unique ID.
   * @param id - The ID of the complaint to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the complaint service.
 * @param repo - The complaint repository for data access.
 * @param notificationService - The notification service for sending notifications.
 * @param sellerRepo - The seller repository for finding seller IDs.
 * @param financialRepo - The financial repository for finding financial institution IDs.
 * @returns An implementation of the IComplaintService interface.
 */
export function complaintService(
  repo: IComplaintRepository,
  notificationService: INotificationService,
  sellerRepo: ISellerRepository,
  financialRepo: IFinancialRepository
): IComplaintService {
  return {
    create: async (data) => {
      try {
        const complaint = await repo.create({
          user_id: data.user_id as any,
          user_type: data.user_type || "buyer",
          subject: data.subject,
          message: data.message,
          status: "Pending",
        });
        if (!complaint) {
          return { success: false, error: "Failed to create complaint" };
        }
        return { success: true, complaint };
      } catch (err) {
        return { success: false, error: "Failed to create complaint" };
      }
    },
    findAll: async (status?: string, userType?: string) => {
      try {
        const complaints = await repo.findAll(status, userType);
        return {
          success: true,
          complaints: complaints ?? [],
        };
      } catch (err) {
        return { success: false, error: "Failed to fetch complaints" };
      }
    },
    findById: async (id) => {
      try {
        const complaint = await repo.findById(id);
        if (!complaint) {
          return { success: false, error: "Complaint not found" };
        }
        return { success: true, complaint };
      } catch (err) {
        return { success: false, error: "Failed to fetch complaint" };
      }
    },
    update: async (id, data) => {
      try {
        const complaint = await repo.update(id, data);
        if (!complaint) {
          return { success: false, error: "Complaint not found" };
        }
        
        // Send notification if status is being changed to Resolved
        if (data.status && data.status.toLowerCase() === "resolved" && complaint.user_id) {
          const userName = (complaint as any).seller_data?.business_name || 
                          (complaint as any).seller_data?.name ||
                          (complaint as any).financial_data?.name || 
                          (complaint as any).financial_data?.business_name ||
                          (complaint.user_id as any)?.name || 
                          "User";
          
          const userEmail = (complaint.user_id as any)?.email;
          
          // Get seller_id or financial_id based on user_type
          let sellerId: string | undefined;
          let financialId: string | undefined;
          
          if (complaint.user_type === "seller") {
            const seller = await sellerRepo.findByUserId(complaint.user_id.toString());
            sellerId = seller?._id?.toString();
          } else if (complaint.user_type === "financial") {
            const financial = await financialRepo.findInstitutionByUserId(complaint.user_id.toString());
            financialId = financial?._id?.toString();
          }
          
          // Create notification
          await notificationService.create({
            user_id: complaint.user_type === "buyer" ? complaint.user_id.toString() : undefined,
            seller_id: sellerId,
            financial_id: financialId,
            type: "COMPLAINT_RESOLVED" as any,
            title: "Complaint Resolved",
            message: `Your complaint "${complaint.subject}" has been resolved by the admin.`,
          });
          
          // Send email if email exists
          if (userEmail) {
            try {
              const emailSubject = "Complaint Resolved - EV Shop";
              const emailText = `Dear ${userName},\n\nWe are pleased to inform you that your complaint has been resolved.\n\nSubject: ${complaint.subject}\nStatus: Resolved\n\nThank you for your patience. If you have any further concerns, please don't hesitate to contact us.\n\nBest regards,\nEV Shop Team`;
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #16a34a;">Complaint Resolved</h2>
                  <p>Dear ${userName},</p>
                  <p>We are pleased to inform you that your complaint has been resolved.</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Subject:</strong> ${complaint.subject}</p>
                    <p><strong>Status:</strong> Resolved</p>
                  </div>
                  <p>Thank you for your patience. If you have any further concerns, please don't hesitate to contact us.</p>
                  <p>Best regards,<br>EV Shop Team</p>
                </div>
              `;
              await sendEmail(userEmail, emailSubject, emailText, emailHtml);
            } catch (emailErr) {
              console.error("Failed to send email:", emailErr);
            }
          }
        }
        
        return { success: true, complaint };
      } catch (err) {
        return { success: false, error: "Failed to update complaint" };
      }
    },
    delete: async (id) => {
      try {
        const result = await repo.delete(id);
        if (!result || !result.deleted) {
          return { success: false, error: "Complaint not found" };
        }
        
        // Send notification if complaint was deleted
        if (result.complaint && result.complaint.user_id) {
          const complaint = result.complaint;
          const userName = (complaint as any).seller_data?.business_name || 
                          (complaint as any).seller_data?.name ||
                          (complaint as any).financial_data?.name || 
                          (complaint as any).financial_data?.business_name ||
                          (complaint.user_id as any)?.name || 
                          "User";
          
          const userEmail = (complaint.user_id as any)?.email;
          
          // Get seller_id or financial_id based on user_type
          let sellerId: string | undefined;
          let financialId: string | undefined;
          
          if (complaint.user_type === "seller") {
            const seller = await sellerRepo.findByUserId(complaint.user_id.toString());
            sellerId = seller?._id?.toString();
          } else if (complaint.user_type === "financial") {
            const financial = await financialRepo.findInstitutionByUserId(complaint.user_id.toString());
            financialId = financial?._id?.toString();
          }
          
          // Create notification
          await notificationService.create({
            user_id: complaint.user_type === "buyer" ? complaint.user_id.toString() : undefined,
            seller_id: sellerId,
            financial_id: financialId,
            type: "COMPLAINT_DELETED" as any,
            title: "Complaint Deleted",
            message: `Your complaint "${complaint.subject}" has been deleted by the admin.`,
          });
          
          // Send email if email exists
          if (userEmail) {
            try {
              const emailSubject = "Complaint Deleted - EV Shop";
              const emailText = `Dear ${userName},\n\nWe are writing to inform you that your complaint has been deleted by the admin.\n\nSubject: ${complaint.subject}\nStatus: Deleted\n\nIf you have any questions or concerns, please contact our support team.\n\nBest regards,\nEV Shop Team`;
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Complaint Deleted</h2>
                  <p>Dear ${userName},</p>
                  <p>We are writing to inform you that your complaint has been deleted by the admin.</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Subject:</strong> ${complaint.subject}</p>
                    <p><strong>Status:</strong> Deleted</p>
                  </div>
                  <p>If you have any questions or concerns, please contact our support team.</p>
                  <p>Best regards,<br>EV Shop Team</p>
                </div>
              `;
              await sendEmail(userEmail, emailSubject, emailText, emailHtml);
            } catch (emailErr) {
              console.error("Failed to send email:", emailErr);
            }
          }
        }
        
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete complaint" };
      }
    },
  };
}
