import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
  IsObject,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApplicationStatus } from "../shared/enum/enum";

/**
 * Data Transfer Object (DTO) for creating or updating a financial institution.
 * Defines the validation rules for the institution's payload.
 */
export class FinancialInstitutionDTO {
  /**
   * The MongoDB ObjectId of the user who manages this institution.
   */
  @IsString()
  user_id!: string;

  /**
   * The official name of the financial institution.
   */
  @IsString()
  name!: string;

  /**
   * The type of institution (e.g., "Bank", "Credit Union", "Fintech").
   */
  @IsString()
  type!: string;

  /**
   * A brief description of the institution. This field is optional.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * The URL of the institution's official website. Must be a valid URL format. This field is optional.
   */
  @IsOptional()
  @IsUrl()
  website?: string;

  /**
   * The primary contact email for the institution. Must be a valid email format. This field is optional.
   */
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  /**
   * The primary contact phone number for the institution. Must be a valid phone number format. This field is optional.
   */
  @IsOptional()
  @IsPhoneNumber()
  contact_phone?: string;
}

/**
 * Data Transfer Object (DTO) for creating or updating a financial product (e.g., a loan).
 * Defines the validation rules for the product's payload.
 */
export class FinancialProductDTO {
  /**
   * The MongoDB ObjectId of the institution offering this product.
   */
  @IsString()
  institution_id!: string;

  /**
   * The name of the financial product (e.g., "EV Green Loan").
   */
  @IsString()
  product_name!: string;

  /**
   * The type of product (e.g., "Auto Loan", "Personal Loan").
   */
  @IsString()
  product_type!: string;

  /**
   * A detailed description of the product. This field is optional.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * The minimum applicable interest rate. This field is optional.
   */
  @IsOptional()
  @IsNumber()
  interest_rate_min?: number;

  /**
   * The maximum applicable interest rate. This field is optional.
   */
  @IsOptional()
  @IsNumber()
  interest_rate_max?: number;

  /**
   * The minimum loan term in months. This field is optional.
   */
  @IsOptional()
  @IsNumber()
  term_months_min?: number;

  /**
   * The maximum loan term in months. This field is optional.
   */
  @IsOptional()
  @IsNumber()
  term_months_max?: number;

  /**
   * The minimum required down payment percentage or amount. This field is optional.
   */
  @IsOptional()
  @IsNumber()
  down_payment_min?: number;

  /**
   * An object containing various eligibility criteria (e.g., `{ "min_credit_score": 650 }`). This field is optional.
   */
  @IsOptional()
  @IsObject()
  eligibility_criteria?: Record<string, any>;

  /**
   * An array of strings describing the key features of the product. This field is optional.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  /**
   * Indicates if the product is currently active and available for applications. This field is optional.
   */
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

/**
 * A nested DTO representing the core data submitted by an applicant.
 * This is used within the main `FinancingApplicationDTO`.
 */
class ApplicationDataDTO {
  /**
   * The applicant's full legal name.
   */
  @IsString()
  full_name!: string;

  /**
   * The applicant's age. Must be an integer and at least 18.
   */
  @IsInt()
  @Min(18)
  age!: number;

  /**
   * The applicant's current employment status (e.g., "Employed", "Self-Employed").
   */
  @IsString()
  employment_status!: string;

  /**
   * The applicant's gross monthly income.
   */
  @IsNumber()
  monthly_income!: number;

  /**
   * The total loan amount the applicant is requesting.
   */
  @IsNumber()
  requested_amount!: number;

  /**
   * The desired loan repayment period in months.
   */
  @IsInt()
  repayment_period_months!: number;
}

/**
 * Data Transfer Object (DTO) for creating a new financing application.
 * Defines the validation rules for the application payload.
 */
export class FinancingApplicationDTO {
  /**
   * The MongoDB ObjectId of the user submitting the application.
   */
  @IsString()
  user_id!: string;

  /**
   * The MongoDB ObjectId of the financial product being applied for.
   */
  @IsString()
  product_id!: string;

  /**
   * An optional ID of the vehicle listing this application is for (for lease applications).
   */
  @IsOptional()
  @IsString()
  list_id?: string;

  /**
   * An optional message from the applicant to the institution.
   */
  @IsOptional()
  @IsString()
  message_text?: string;

  /**
   * The core application data. This is a nested object.
   * The `@Transform` decorator handles cases where this object is sent as a JSON string
   * (common with `multipart/form-data`) and parses it into an object.
   * The `@ValidateNested` decorator triggers validation on the nested `ApplicationDataDTO`.
   */
  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value; // return raw string if not valid JSON
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => ApplicationDataDTO)
  application_data!: ApplicationDataDTO;
}

/**
 * Data Transfer Object (DTO) for updating an existing financing application,
 * typically performed by an administrator or loan officer.
 */
export class UpdateFinancingApplicationDTO {
  /**
   * The new status of the application (e.g., "Approved", "Rejected", "PendingReview").
   * Must be one of the values defined in the `ApplicationStatus` enum.
   */
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  /**
   * The approved loan amount. This is typically set when the status is "Approved". This field is optional.
   */
  @IsOptional()
  @IsNumber()
  approval_amount?: number;

  /**
   * An object containing the final terms of the loan (e.g., interest rate, final term). This field is optional.
   */
  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  /**
   * The reason for rejection, required if the status is "Rejected". This field is optional.
   */
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
