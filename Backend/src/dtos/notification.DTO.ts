import { IsString, IsEnum, IsMongoId, IsOptional } from "class-validator";
import { NotificationType } from "../shared/enum/enum";

/**
 * Data Transfer Object (DTO) for creating a new notification.
 * Defines the validation rules for the notification payload.
 */
export class NotificationDTO {
  /**
   * The MongoDB ObjectId of the user who will receive the notification.
   */
  @IsMongoId()
  @IsString()
  @IsOptional()
  user_id?: string;

  /** The MongoDB ObjectId of the seller associated with the notification, if applicable. */
  @IsMongoId()
  @IsString()
  @IsOptional()
  seller_id?: string;

  /** The MongoDB ObjectId of the financial entity associated with the notification, if applicable. */
  @IsMongoId()
  @IsString()
  @IsOptional()
  financial_id?: string;

  /**
   * The type of the notification (e.g., 'NewOrder', 'PasswordReset', 'SystemAlert').
   * Must be one of the values defined in the `NotificationType` enum.
   */
  @IsEnum(NotificationType)
  type!: NotificationType;

  /**
   * The title of the notification.
   */
  @IsString()
  title!: string;

  /**
   * The detailed message content of the notification.
   */
  @IsString()
  message!: string;
}
