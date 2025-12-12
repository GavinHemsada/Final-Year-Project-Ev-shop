import { IsMongoId, IsNotEmpty, IsString, MinLength, ValidateIf } from "class-validator";

/**
 * Data Transfer Object (DTO) for creating a new forum post.
 * Defines the validation rules for the post creation payload.
 */
export class PostDTO {
  /**
   * The MongoDB ObjectId of the user creating the post.
   */
  @ValidateIf(o => !o.seller_id && !o.financial_id)
  @IsMongoId()
  user_id?: string;
  
  /**
   * The MongoDB ObjectId of the seller selling the item in the post.
   */
  @ValidateIf(o => !o.user_id && !o.financial_id)
  @IsMongoId()
  seller_id?: string;
  /**
   * The MongoDB ObjectId of the related financial institution.
   */
  @ValidateIf(o => !o.user_id && !o.seller_id)
  @IsMongoId()
  financial_id?: string;
  /**
   * The title of the post. It must not be empty and should have a minimum length.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: "Title must be at least 5 characters long" })
  title!: string;

  /**
   * The main content/body of the post. It must not be empty.
   */
  @IsString()
  @IsNotEmpty()
  content!: string;
}

/**
 * Data Transfer Object (DTO) for creating a new reply to a forum post.
 * Defines the validation rules for the reply creation payload.
 */
export class PostReplyDTO {
  /**
   * The MongoDB ObjectId of the user creating the reply.
   */
  @ValidateIf(o => !o.seller_id && !o.financial_id)
  @IsMongoId()
  user_id?: string;
  /**
   * The MongoDB ObjectId of the seller selling the item in the post.
   */
  @ValidateIf(o => !o.user_id && !o.financial_id)
  @IsMongoId()
  seller_id?: string;
  /**
   * The MongoDB ObjectId of the related financial institution.
   */
  @ValidateIf(o => !o.user_id && !o.seller_id)
  @IsMongoId()
  financial_id?: string;
  /**
   * The MongoDB ObjectId of the post being replied to.
   */
  @IsMongoId()
  post_id!: string;
  /**
   * The content of the reply. It must not be empty.
   */
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class PostUpdateReplyDTO  {
  /**
   * The content of the reply. It must not be empty.
   */
  @IsString()
  @IsNotEmpty()
  content!: string;
}