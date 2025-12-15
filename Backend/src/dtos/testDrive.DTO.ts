import {
  IsString,
  IsDate,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { TestDriveBookingStatus } from "../shared/enum/enum";

/**
 * Data Transfer Object (DTO) for creating or updating a test drive slot.
 * Defines the validation rules for the test drive slot payload.
 */
export class TestDriveSlotDTO {
  /**
   * The ID of the seller offering the test drive slot.
   */
  @IsString()
  seller_id!: string;

  /**
   * The physical location (e.g., address) where the test drive will take place.
   */
  @IsString()
  location!: string;

  /**
   * The ID of the EV model available for the test drive in this slot.
   */
  @IsString()
  model_id!: string;

  /**
   * The date the slot is available.
   * The `@Type(() => Date)` decorator ensures the incoming string is transformed into a Date object.
   */
  @IsDate()
  @Type(() => Date)
  available_date!: Date;

  /**
   * The maximum number of individual bookings allowed for this slot.
   */
  @IsNumber()
  max_bookings!: number;

  /**
   * Indicates if the slot is currently active and available for booking.
   * This field is optional and defaults to true if not provided.
   */
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

/**
 * Data Transfer Object (DTO) for creating a new test drive booking.
 * Defines the validation rules for the booking payload.
 * A `status` field using the `TestDriveBookingStatus` enum could be added here for updates.
 */
export class TestDriveBookingDTO {
  /**
   * The ID of the customer making the booking.
   */
  @IsString()
  customer_id!: string;

  /**
   * The ID of the test drive slot being booked.
   */
  @IsString()
  slot_id!: string;

  /**
   * The specific date of the booking.
   * The `@Type(() => Date)` decorator ensures the incoming string is transformed into a Date object.
   */
  @IsDate()
  @Type(() => Date)
  booking_date!: Date;

  /**
   * The specific time of the booking (e.g., "14:00").
   */
  @IsString()
  booking_time!: string;

  /**
   * The expected duration of the test drive in minutes.
   */
  @IsNumber()
  duration_minutes!: number;
}

export class UpdateTestDriveBookingDTO {
  /**
   * The specific time of the booking (e.g., "14:00").
   */
  @IsString()
  booking_time!: string;

  /**
   * The expected duration of the test drive in minutes.
   */
  @IsNumber()
  duration_minutes!: number;
}
/**
 * Data Transfer Object (DTO) for submitting feedback or a rating after a test drive.
 * Defines the validation rules for the feedback payload.
 */
export class FeedbackDTO {
  /**
   * The ID of the completed test drive booking this feedback is for.
   */
  @IsString()
  booking_id!: string;

  /**
   * A numerical rating for the test drive experience, from 1 to 5.
   */
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  /**
   * An optional text comment providing more details about the experience.
   */
  @IsString()
  @IsOptional()
  comment?: string;
}
