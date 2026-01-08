import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a single prediction made by the chatbot in the database.
 * This logs the user's input and the chatbot's corresponding output for analysis and training purposes.
 */
export interface IPrediction extends Document {
  /** The unique identifier for the prediction document. */
  _id: Types.ObjectId;
  /** The type of prediction made (e.g., "battery_health", "repair_cost"). */
  type: string;
  /** A flexible object containing the user's inputs that led to this prediction. */
  user_inputs: Record<string, any>;
  /** A flexible object containing the chatbot's predicted responses or actions. */
  prediction_result: Record<string, any>;
  /** Optional reference to a conversation this prediction belongs to. */
  conversation_id?: Types.ObjectId;
}

/**
 * Mongoose schema for the Prediction collection.
 */
const PredictionSchema = new Schema<IPrediction>(
  {
    /**
     * The type of prediction made (e.g., "battery_health", "repair_cost").
     */
    type: { type: String, required: true },
    /**
     * A flexible object to store the user's inputs. Using `type: Object` allows for
     * storing various structured data that contributed to the prediction.
     */
    user_inputs: { type: Object, required: true },
    /**
     * A flexible object to store the chatbot's prediction result.
     */
    prediction_result: { type: Object, required: true },
    /**
     * Optional reference to a conversation this prediction belongs to.
     */
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "ChatbotConversation",
      required: false,
    },
  },
  { timestamps: true }
);

/**
 * Creates an index on the `conversation_id` field to allow for efficient retrieval
 * of all predictions associated with a specific conversation.
 */
PredictionSchema.index({ conversation_id: 1 });

/**
 * The Mongoose model for the Prediction collection.
 */
export const Prediction = model<IPrediction>("Prediction", PredictionSchema);
