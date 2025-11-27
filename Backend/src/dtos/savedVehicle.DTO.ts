import { IsMongoId } from "class-validator";

/**
 * Data Transfer Object (DTO) for saving a vehicle.
 * Defines the validation rules for the save vehicle payload.
 */
export class SaveVehicleDTO {
  /**
   * The MongoDB ObjectId of the user saving the vehicle.
   */
  @IsMongoId()
  user_id!: string;

  /**
   * The MongoDB ObjectId of the vehicle listing being saved.
   */
  @IsMongoId()
  listing_id!: string;
}

