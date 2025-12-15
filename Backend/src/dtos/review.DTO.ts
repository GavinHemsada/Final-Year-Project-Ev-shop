import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { ReviewType } from "../shared/enum/enum";

/**
 * Data Transfer Object (DTO) for creating or updating a review.
 * Defines the validation rules for the review payload.
 */
export class ReviewDTO {
  /**
   * The MongoDB ObjectId of the user who is writing the review.
   */
  @IsString()
  reviewer_id!: string;

  /**
   * The type of entity being reviewed (e.g., 'Seller', 'Product').
   * Must be one of the values defined in the `ReviewType` enum.
   */
  @IsEnum(ReviewType)
  target_type!: string;

  /**
   * The MongoDB ObjectId of the entity being reviewed (e.g., the seller's ID).
   */
  @IsString()
  target_id!: string;

  /**
   * The MongoDB ObjectId of the order associated with the review.
   * This can be used to verify that the reviewer has actually purchased the item or service.
   */
  @IsString()
  @IsOptional()
  order_id?: string;

  
  /**
   * The MongoDB ObjectId of the test drive associated with the review.
   * This can be used to verify that the reviewer has actually taken a test drive.
   */
  @IsString()
  @IsOptional()
  testDrive_id?: string;

  /**
   * The numerical rating given by the reviewer, on a scale of 1 to 5.
   */
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  /**
   * A short, descriptive title for the review.
   */
  @IsString()
  title!: string;

  /**
   * The detailed text content of the review. This field is optional.
   */
  @IsOptional()
  @IsString()
  comment?: string;
}
