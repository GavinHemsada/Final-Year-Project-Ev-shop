import { IContactMessage, ContactMessage } from "../../entities/ContactMessage";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the contact message repository.
 */
export interface IContactMessageRepository {
  /**
   * Creates a new contact message.
   * @param data - The contact message data to create.
   * @returns A promise that resolves to the created contact message document or null.
   */
  create(data: Partial<IContactMessage>): Promise<IContactMessage | null>;
  /**
   * Finds all contact messages, optionally filtered by read status.
   * @param isRead - Optional filter for read/unread messages.
   * @returns A promise that resolves to an array of contact message documents or null.
   */
  findAll(isRead?: boolean): Promise<IContactMessage[] | null>;
  /**
   * Finds a contact message by its unique ID.
   * @param id - The ID of the contact message to find.
   * @returns A promise that resolves to the contact message document or null if not found.
   */
  findById(id: string): Promise<IContactMessage | null>;
  /**
   * Updates a contact message by its unique ID.
   * @param id - The ID of the contact message to update.
   * @param data - The partial data to update.
   * @returns A promise that resolves to the updated contact message document or null.
   */
  update(id: string, data: Partial<IContactMessage>): Promise<IContactMessage | null>;
  /**
   * Deletes a contact message by its unique ID.
   * @param id - The ID of the contact message to delete.
   * @returns A promise that resolves to an object with deletion status.
   */
  delete(id: string): Promise<{ deleted: boolean } | null>;
  /**
   * Counts contact messages, optionally filtered by read status.
   * @param isRead - Optional filter for read/unread messages.
   * @returns A promise that resolves to the count.
   */
  count(isRead?: boolean): Promise<number>;
}

/**
 * The concrete implementation of the IContactMessageRepository interface.
 */
export const ContactMessageRepository: IContactMessageRepository = {
  create: withErrorHandling(async (data) => {
    const contactMessage = new ContactMessage(data);
    return await contactMessage.save();
  }),
  findAll: withErrorHandling(async (isRead?: boolean) => {
    const filter: any = {};
    if (isRead !== undefined) {
      filter.isRead = isRead;
    }
    return await ContactMessage.find(filter).sort({ createdAt: -1 });
  }),
  findById: withErrorHandling(async (id) => {
    return await ContactMessage.findById(id);
  }),
  update: withErrorHandling(async (id, data) => {
    return await ContactMessage.findByIdAndUpdate(id, data, { new: true });
  }),
  delete: withErrorHandling(async (id) => {
    const result = await ContactMessage.findByIdAndDelete(id);
    return { deleted: result !== null };
  }),
  count: async (isRead?: boolean): Promise<number> => {
    try {
      const filter: any = {};
      if (isRead !== undefined) {
        filter.isRead = isRead;
      }
      const count = await ContactMessage.countDocuments(filter);
      return count ?? 0;
    } catch (error) {
      console.error(`Error in count method:`, error);
      return 0;
    }
  },
};
