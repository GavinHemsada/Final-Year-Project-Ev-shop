import { IContactMessageRepository } from "./contactMessage.repository";
import { CreateContactMessageDTO, UpdateContactMessageDTO } from "./contactMessage.dto";
import { sendEmail } from "../../shared/utils/Email.util";

/**
 * Defines the interface for the contact message service.
 */
export interface IContactMessageService {
  /**
   * Creates a new contact message.
   * @param data - The contact message data to create.
   * @returns A promise that resolves to an object containing the created contact message or an error.
   */
  create(
    data: CreateContactMessageDTO
  ): Promise<{ success: boolean; contactMessage?: any; error?: string }>;
  /**
   * Retrieves all contact messages, optionally filtered by read status.
   * @param isRead - Optional filter for read/unread messages.
   * @returns A promise that resolves to an object containing an array of contact messages or an error.
   */
  findAll(
    isRead?: boolean
  ): Promise<{ success: boolean; contactMessages?: any[]; error?: string }>;
  /**
   * Retrieves a contact message by its unique ID.
   * @param id - The ID of the contact message to find.
   * @returns A promise that resolves to an object containing the contact message data or an error.
   */
  findById(
    id: string
  ): Promise<{ success: boolean; contactMessage?: any; error?: string }>;
  /**
   * Updates a contact message.
   * @param id - The ID of the contact message to update.
   * @param data - The partial data to update.
   * @returns A promise that resolves to an object containing the updated contact message data or an error.
   */
  update(
    id: string,
    data: UpdateContactMessageDTO
  ): Promise<{ success: boolean; contactMessage?: any; error?: string }>;
  /**
   * Deletes a contact message by its unique ID.
   * @param id - The ID of the contact message to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  /**
   * Gets statistics about contact messages.
   * @returns A promise that resolves to an object containing statistics.
   */
  getStats(): Promise<{ success: boolean; stats?: any; error?: string }>;
}

/**
 * Factory function to create an instance of the contact message service.
 * @param repo - The contact message repository for data access.
 * @returns An implementation of the IContactMessageService interface.
 */
export function contactMessageService(
  repo: IContactMessageRepository
): IContactMessageService {
  return {
    create: async (data) => {
      try {
        const contactMessage = await repo.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          isRead: false,
          isReplied: false,
        });
        if (!contactMessage) {
          return { success: false, error: "Failed to create contact message" };
        }

        // Send confirmation email to the user
        try {
          const emailSubject = "Thank You for Contacting EV Shop";
          const emailText = `Dear ${data.name},\n\nThank you for contacting EV Shop. We have received your message and will get back to you as soon as possible.\n\nSubject: ${data.subject}\n\nBest regards,\nEV Shop Team`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Thank You for Contacting EV Shop</h2>
              <p>Dear ${data.name},</p>
              <p>Thank you for contacting EV Shop. We have received your message and will get back to you as soon as possible.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> ${data.subject}</p>
              </div>
              <p>Best regards,<br>EV Shop Team</p>
            </div>
          `;
          await sendEmail(data.email, emailSubject, emailText, emailHtml);
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
          // Don't fail the request if email fails
        }

        return { success: true, contactMessage };
      } catch (err) {
        return { success: false, error: "Failed to create contact message" };
      }
    },
    findAll: async (isRead?: boolean) => {
      try {
        const contactMessages = await repo.findAll(isRead);
        return {
          success: true,
          contactMessages: contactMessages ?? [],
        };
      } catch (err) {
        return { success: false, error: "Failed to fetch contact messages" };
      }
    },
    findById: async (id) => {
      try {
        const contactMessage = await repo.findById(id);
        if (!contactMessage) {
          return { success: false, error: "Contact message not found" };
        }
        return { success: true, contactMessage };
      } catch (err) {
        return { success: false, error: "Failed to fetch contact message" };
      }
    },
    update: async (id, data) => {
      try {
        const contactMessage = await repo.update(id, data);
        if (!contactMessage) {
          return { success: false, error: "Contact message not found" };
        }
        return { success: true, contactMessage };
      } catch (err) {
        return { success: false, error: "Failed to update contact message" };
      }
    },
    delete: async (id) => {
      try {
        const result = await repo.delete(id);
        if (!result || !result.deleted) {
          return { success: false, error: "Contact message not found" };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete contact message" };
      }
    },
    getStats: async () => {
      try {
        const total = await repo.count();
        const unread = await repo.count(false);
        const read = await repo.count(true);
        return {
          success: true,
          stats: {
            total,
            unread,
            read,
          },
        };
      } catch (err) {
        return { success: false, error: "Failed to fetch statistics" };
      }
    },
  };
}
