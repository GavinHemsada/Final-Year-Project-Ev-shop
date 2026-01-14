/**
 * Data Transfer Object for creating a complaint.
 */
export interface CreateComplaintDTO {
  user_id: string;
  user_type: string;
  subject: string;
  message: string;
}

/**
 * Data Transfer Object for updating a complaint.
 */
export interface UpdateComplaintDTO {
  status?: string;
}
