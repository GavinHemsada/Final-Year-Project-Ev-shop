import { IsString, IsNumber, IsOptional, IsBoolean, IsMongoId, IsEmail } from "class-validator";

/**
 * Data Transfer Object (DTO) for creating a new repair location.
 */
export class RepairLocationDTO {
  /**
   * The MongoDB ObjectId of the seller who owns this repair location.
   */
  @IsMongoId()
  seller_id!: string;

  /**
   * The name of the repair location.
   */
  @IsString()
  name!: string;

  /**
   * The full address of the repair location.
   */
  @IsString()
  address!: string;

  /**
   * The latitude coordinate of the location.
   */
  @IsNumber()
  latitude!: number;

  /**
   * The longitude coordinate of the location.
   */
  @IsNumber()
  longitude!: number;

  /**
   * Contact phone number. This field is optional.
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Contact email. This field is optional.
   */
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Operating hours. This field is optional.
   */
  @IsOptional()
  @IsString()
  operating_hours?: string;

  /**
   * Description of services. This field is optional.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Whether the location is active. This field is optional and defaults to true.
   */
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

/**
 * Data Transfer Object (DTO) for updating an existing repair location.
 * All fields are optional, allowing for partial updates.
 */
export class UpdateRepairLocationDTO {
  /**
   * The new name for the repair location.
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * An updated address for the repair location.
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Updated latitude coordinate.
   */
  @IsOptional()
  @IsNumber()
  latitude?: number;

  /**
   * Updated longitude coordinate.
   */
  @IsOptional()
  @IsNumber()
  longitude?: number;

  /**
   * Updated contact phone number.
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Updated contact email.
   */
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Updated operating hours.
   */
  @IsOptional()
  @IsString()
  operating_hours?: string;

  /**
   * Updated description.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Updated active status.
   */
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

