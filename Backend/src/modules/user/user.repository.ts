import { IUser, User } from "../../entities/User";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the user repository, specifying the methods for data access operations related to users.
 */
export interface IUserRepository {
  /**
   * Finds a user by their email address.
   * @param email - The email of the user to find.
   * @returns A promise that resolves to the user object (without password) or null if not found.
   */
  findByEmail(email: string): Promise<IUser | null>;
  /**
   * Finds a user by their unique ID.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to the user object (without password) or null if not found.
   */
  findById(id: string): Promise<IUser | null>;
  /**
   * Retrieves all users from the database.
   * @returns A promise that resolves to an array of user objects (without passwords) or null.
   */
  findAll(): Promise<IUser[] | null>;
  /**
   * Updates a user's information by saving the modified user document.
   * @param data - The Mongoose user document instance with updated fields.
   * @returns A promise that resolves to the updated user object or null.
   */
  update(data: IUser): Promise<IUser | null>;
  /**
   * Deletes a user by their unique ID.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  delete(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IUserRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const UserRepository: IUserRepository = {
  /** Finds a user by email, excluding the password field from the result for security. */
  findByEmail: withErrorHandling(async (email) => {
    return await User.findOne({ email }).select("-password");
  }),
  /** Finds a user by their document ID, excluding the password field. */
  findById: withErrorHandling(async (_id) => {
    return await User.findById(_id);
  }),
  /** Retrieves all user documents, excluding the password field from each. */
  findAll: withErrorHandling(async () => {
    return await User.find().select("-password");
  }),
  /** Saves an existing and modified Mongoose document instance. */
  update: withErrorHandling(async (data) => {
    return await data.save();
  }),
  /** Deletes a user document by its ID. */
  delete: withErrorHandling(async (id) => {
    const deleted = await User.findByIdAndDelete(id);
    return deleted !== null;
  }),
};
