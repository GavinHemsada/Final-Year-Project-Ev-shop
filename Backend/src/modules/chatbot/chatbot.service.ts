import { IChatbotRepository } from "./chatbot.repository";
import { ChatbotConversationDTO, PredictionDTO } from "../../dtos/chatbot.DTO";
import { IUserRepository } from "../user/user.repository";
import { getChatbotResponse } from "../../shared/utils/chatbot";
import CacheService from "../../shared/cache/CacheService";
import { IEvRepository } from "../ev/ev.repository";
import { ITestDriveRepository } from "../testDrive/testDrive.repository";
import { IRepairLocationRepository } from "../repairLocation/repairLocation.repository";

/**
 * Defines the interface for the chatbot service, outlining methods for managing conversations and predictions.
 */
export interface IChatbotService {
  /**
   * Finds a single conversation by its unique ID.
   * @param id - The ID of the conversation to find.
   * @returns A promise that resolves to an object containing the conversation data or an error.
   */
  findConversationById(
    id: string
  ): Promise<{ success: boolean; conversation?: any; error?: string }>;
  /**
   * Retrieves all conversations.
   * @returns A promise that resolves to an object containing an array of all conversations or an error.
   */
  findAllConversations(): Promise<{
    success: boolean;
    conversations?: any[];
    error?: string;
  }>;
  /**
   * Finds all conversations for a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's conversations or an error.
   */
  findConversationsByUserId(
    user_id: string
  ): Promise<{ success: boolean; conversations?: any[]; error?: string }>;
  /**
   * Gets a response from the underlying chatbot model for a given question.
   * @param question - The user's question.
   * @returns A promise that resolves to an object containing the chatbot's response or an error.
   */
  getRespons(
    question: string
  ): Promise<{ success: boolean; response?: any; error?: string }>;
  /**
   * Creates a new conversation.
   * @param data - The data for the new conversation.
   * @returns A promise that resolves to an object containing the created conversation or an error.
   */
  createConversation(
    data: ChatbotConversationDTO
  ): Promise<{ success: boolean; conversation?: any; error?: string }>;
  /**
   * Updates an existing conversation.
   * @param id - The ID of the conversation to update.
   * @param data - The partial data to update the conversation with.
   * @returns A promise that resolves to an object containing the updated conversation data or an error.
   */
  updateConversation(
    id: string,
    data: Partial<ChatbotConversationDTO>
  ): Promise<{ success: boolean; conversation?: any; error?: string }>;
  /**
   * Deletes a conversation by its unique ID.
   * @param id - The ID of the conversation to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteConversation(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Retrieves all predictions.
   * @returns A promise that resolves to an object containing an array of all predictions or an error.
   */
  findAllPredictions(): Promise<{
    success: boolean;
    predictions?: any[];
    error?: string;
  }>;
  /**
   * Finds a single prediction by its unique ID.
   * @param id - The ID of the prediction to find.
   * @returns A promise that resolves to an object containing the prediction data or an error.
   */
  findPredictionById(
    id: string
  ): Promise<{ success: boolean; prediction?: any; error?: string }>;
  /**
   * Finds all predictions associated with a specific conversation.
   * @param conversation_id - The ID of the conversation.
   * @returns A promise that resolves to an object containing an array of predictions or an error.
   */
  findPredictionsByConversationId(
    conversation_id: string
  ): Promise<{ success: boolean; predictions?: any[]; error?: string }>;
  /**
   * Creates a new prediction.
   * @param data - The data for the new prediction.
   * @returns A promise that resolves to an object containing the created prediction or an error.
   */
  createPrediction(
    data: PredictionDTO
  ): Promise<{ success: boolean; prediction?: any; error?: string }>;
  /**
   * Updates an existing prediction.
   * @param id - The ID of the prediction to update.
   * @param data - The partial data to update the prediction with.
   * @returns A promise that resolves to an object containing the updated prediction data or an error.
   */
  updatePrediction(
    id: string,
    data: Partial<PredictionDTO>
  ): Promise<{ success: boolean; prediction?: any; error?: string }>;
  /**
   * Deletes a prediction by its unique ID.
   * @param id - The ID of the prediction to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deletePrediction(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the chatbot service.
 * It encapsulates the business logic for managing chatbot interactions, including caching strategies
 * to improve performance for retrieving historical data.
 *
 * @param chatbotRepo - The repository for chatbot data access.
 * @param userRepo - The repository for user data access.
 * @param evRepo - The repository for EV data access.
 * @param testDriveRepo - The repository for test drive data access (optional).
 * @param repairLocationRepo - The repository for repair location data access (optional).
 * @returns An implementation of the IChatbotService interface.
 */
export function chatbotService(
  chatbotRepo: IChatbotRepository,
  userRepo: IUserRepository,
  evRepo: IEvRepository,
  testDriveRepo?: ITestDriveRepository,
  repairLocationRepo?: IRepairLocationRepository
): IChatbotService {
  return {
    /**
     * Finds a single conversation by its ID, using a cache-aside pattern.
     * Caches the individual conversation data for one hour.
     */
    findConversationById: async (id) => {
      try {
        const cacheKey = `conversation_${id}`;
        const conversation = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findConversationById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!conversation)
          return { success: false, error: "Conversation not found" };
        return { success: true, conversation };
      } catch (err) {
        return { success: false, error: "Failed to fetch conversation" };
      }
    },
    /**
     * Retrieves all conversations, utilizing a cache-aside pattern.
     * Caches the list of all conversations for one hour.
     */
    findAllConversations: async () => {
      try {
        const cacheKey = "conversations";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const conversations = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findAllConversations();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!conversations)
          return { success: false, error: "No conversations found" };
        return { success: true, conversations };
      } catch (err) {
        return { success: false, error: "Failed to fetch conversations" };
      }
    },
    /**
     * Finds all conversations for a specific user, using a cache-aside pattern.
     * Caches the list of conversations for that user for one hour.
     */
    findConversationsByUserId: async (user_id) => {
      try {
        const cacheKey = `conversations_user_${user_id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const conversations = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findConversationsByUserId(user_id);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!conversations)
          return {
            success: false,
            error: "No conversations found for this user",
          };
        return { success: true, conversations };
      } catch (err) {
        return { success: false, error: "Failed to fetch conversations" };
      }
    },
    /**
     * Gets a real-time response from the external chatbot utility.
     * This method is not cached to ensure responses are always live.
     */
    getRespons: async (question) => {
      try {
        const response = await getChatbotResponse(
          question,
          evRepo,
          testDriveRepo,
          repairLocationRepo
        );
        if (!response)
          return { success: false, error: "Failed to get response" };
        return { success: true, response };
      } catch (err) {
        return { success: false, error: "Failed to get response" };
      }
    },
    /**
     * Creates a new conversation after validating the user exists.
     * It invalidates relevant conversation caches to ensure data consistency.
     */
    createConversation: async (data) => {
      try {
        const user = await userRepo.findById(data.user_id);
        if (!user) return { success: false, error: "User not found" };
        const conversation = await chatbotRepo.createConversation(data);

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete("conversations"),
          CacheService.delete(`conversations_user_${data.user_id}`),
        ]);

        return { success: true, conversation };
      } catch (err) {
        return { success: false, error: "Failed to create conversation" };
      }
    },
    /**
     * Updates an existing conversation's data.
     * It invalidates all caches related to this conversation upon successful update.
     */
    updateConversation: async (id, data) => {
      try {
        const existing = await chatbotRepo.findConversationById(id);
        if (!existing)
          return { success: false, error: "Conversation not found" };

        const conversation = await chatbotRepo.updateConversation(id, data);
        if (!conversation)
          return { success: false, error: "Conversation not found" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`conversation_${id}`),
          CacheService.delete("conversations"),
          CacheService.delete(`conversations_user_${existing.user_id}`),
        ]);

        return { success: true, conversation };
      } catch (err) {
        return { success: false, error: "Failed to update conversation" };
      }
    },
    /**
     * Deletes a conversation and all its associated predictions.
     * It invalidates all caches related to the conversation and its predictions.
     */
    deleteConversation: async (id) => {
      try {
        const existing = await chatbotRepo.findConversationById(id);
        if (!existing)
          return { success: false, error: "Conversation not found" };

        const success = await chatbotRepo.deleteConversation(id);
        if (!success)
          return { success: false, error: "Conversation not found" };

        // Invalidate relevant caches for conversation and its predictions
        await Promise.all([
          CacheService.delete(`conversation_${id}`),
          CacheService.delete("conversations"),
          CacheService.delete(`conversations_user_${existing.user_id}`),
          CacheService.delete(`predictions_conversation_${id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete conversation" };
      }
    },

    // Prediction
    /**
     * Retrieves all predictions, utilizing a cache-aside pattern.
     * Caches the list of all predictions for one hour.
     */
    findAllPredictions: async () => {
      try {
        const cacheKey = "predictions";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const predictions = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findAllPredictions();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!predictions)
          return { success: false, error: "No predictions found" };
        return { success: true, predictions };
      } catch (err) {
        return { success: false, error: "Failed to fetch predictions" };
      }
    },
    /**
     * Finds a single prediction by its ID, using a cache-aside pattern.
     * Caches the individual prediction data for one hour.
     */
    findPredictionById: async (id) => {
      try {
        const cacheKey = `prediction_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const prediction = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findPredictionById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!prediction)
          return { success: false, error: "Prediction not found" };
        return { success: true, prediction };
      } catch (err) {
        return { success: false, error: "Failed to fetch prediction" };
      }
    },
    /**
     * Finds all predictions for a specific conversation, using a cache-aside pattern.
     * Caches the list of predictions for that conversation for one hour.
     */
    findPredictionsByConversationId: async (conversation_id) => {
      try {
        const cacheKey = `predictions_conversation_${conversation_id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const predictions = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await chatbotRepo.findPredictionsByConversationId(
              conversation_id
            );
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!predictions)
          return {
            success: false,
            error: "No predictions found for this conversation",
          };
        return { success: true, predictions };
      } catch (err) {
        return { success: false, error: "Failed to fetch predictions" };
      }
    },
    /**
     * Creates a new prediction after validating the parent conversation exists.
     * It invalidates relevant prediction caches.
     */
    createPrediction: async (data) => {
      try {
        // Only validate conversation if conversation_id is provided
        if (data.conversation_id) {
          const conversation = await chatbotRepo.findConversationById(
            data.conversation_id
          );
          if (!conversation)
            return { success: false, error: "Conversation not found" };
        }

        const prediction = await chatbotRepo.createPrediction(data);

        // Invalidate relevant caches
        const cacheDeletes = [CacheService.delete("predictions")];
        if (data.conversation_id) {
          cacheDeletes.push(
            CacheService.delete(
              `predictions_conversation_${data.conversation_id}`
            )
          );
        }
        await Promise.all(cacheDeletes);

        return { success: true, prediction };
      } catch (err) {
        return { success: false, error: "Failed to create prediction" };
      }
    },
    /**
     * Updates an existing prediction's data.
     * It invalidates all caches related to this prediction upon successful update.
     */
    updatePrediction: async (id, data) => {
      try {
        const existing = await chatbotRepo.findPredictionById(id);
        if (!existing) return { success: false, error: "Prediction not found" };

        const prediction = await chatbotRepo.updatePrediction(id, data);
        if (!prediction)
          return { success: false, error: "Prediction not found" };

        // Invalidate relevant caches
        const cacheDeletes = [
          CacheService.delete(`prediction_${id}`),
          CacheService.delete("predictions"),
        ];
        if (existing.conversation_id) {
          cacheDeletes.push(
            CacheService.delete(
              `predictions_conversation_${existing.conversation_id}`
            )
          );
        }
        await Promise.all(cacheDeletes);

        return { success: true, prediction };
      } catch (err) {
        return { success: false, error: "Failed to update prediction" };
      }
    },
    /**
     * Deletes a prediction from the system.
     * It invalidates all caches related to this prediction before deletion.
     */
    deletePrediction: async (id) => {
      try {
        const existing = await chatbotRepo.findPredictionById(id);
        if (!existing) return { success: false, error: "Prediction not found" };

        const success = await chatbotRepo.deletePrediction(id);
        if (!success) return { success: false, error: "Prediction not found" };

        // Invalidate relevant caches
        const cacheDeletes = [
          CacheService.delete(`prediction_${id}`),
          CacheService.delete("predictions"),
        ];
        if (existing.conversation_id) {
          cacheDeletes.push(
            CacheService.delete(
              `predictions_conversation_${existing.conversation_id}`
            )
          );
        }
        await Promise.all(cacheDeletes);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete prediction" };
      }
    },
  };
}
