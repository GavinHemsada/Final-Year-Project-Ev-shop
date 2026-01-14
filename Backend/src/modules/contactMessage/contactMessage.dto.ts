/**
 * Data Transfer Object for creating a contact message.
 */
export interface CreateContactMessageDTO {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Data Transfer Object for updating a contact message.
 */
export interface UpdateContactMessageDTO {
  isRead?: boolean;
  isReplied?: boolean;
}
