import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
} from "class-validator";

/**
 * Data Transfer Object (DTO) for creating a new chatbot conversation entry.
 * This is typically used to log a user's message.
 */
export class ChatbotConversationDTO {
  /**
   * The MongoDB ObjectId of the user interacting with the chatbot.
   */
  @IsMongoId()
  user_id!: string;

  /**
   * The text of the message sent by the user. Must not be an empty string.
   */
  @IsString()
  @IsNotEmpty()
  message_text!: string;
}

/**
 * Data Transfer Object (DTO) for creating a new prediction record.
 * This is used to log the inputs and the corresponding outputs from the chatbot's prediction model.
 */
export class PredictionDTO {
  /**
   * The type of prediction made (e.g., "battery_health", "repair_cost").
   */
  @IsString()
  @IsNotEmpty()
  type!: string;

  /**
   * A flexible object containing the user's inputs that led to this prediction.
   * Stores all input parameters like age_years, mileage, battery_cycles, etc.
   */
  @IsObject()
  user_inputs!: Record<string, any>;

  /**
   * A flexible object containing the chatbot's prediction result.
   * Stores the prediction value and any additional metadata.
   */
  @IsObject()
  prediction_result!: Record<string, any>;

  /**
   * The MongoDB ObjectId of the conversation this prediction belongs to (optional).
   */
  @IsMongoId()
  @IsOptional()
  conversation_id?: string;
}
