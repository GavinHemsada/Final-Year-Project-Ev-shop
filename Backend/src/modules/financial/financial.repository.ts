import { Types } from "mongoose";
import {
  FinancialInstitution,
  IFinancialInstitution,
} from "../../entities/FinancialInstitution";
import {
  FinancialProduct,
  IFinancialProduct,
} from "../../entities/FinancialProduct";
import {
  FinancingApplication,
  IFinancingApplication,
} from "../../entities/FinancingApplication";
import {
  FinancialInstitutionDTO,
  FinancialProductDTO,
  FinancingApplicationDTO,
  UpdateFinancingApplicationDTO,
} from "../../dtos/financial.DTO";
import { ApplicationStatus } from "../../shared/enum/enum";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the financial repository, specifying the methods for data access operations
 * related to financial institutions, products, and applications.
 */
export interface IFinancialRepository {
  // Institution Methods
  /**
   * Creates a new financial institution.
   * @param data - The DTO containing the details for the new institution.
   * @returns A promise that resolves to the created institution document or null.
   */
  createInstitution(
    data: FinancialInstitutionDTO
  ): Promise<IFinancialInstitution | null>;
  /**
   * Finds a financial institution by its unique ID.
   * @param id - The ID of the institution to find.
   * @returns A promise that resolves to the institution document or null if not found.
   */
  findById(id: string): Promise<IFinancialInstitution | null>;
  /**
   * Finds a financial institution by the associated user's ID.
   * @param id - The ID of the user.
   * @returns A promise that resolves to the institution document or null if not found.
   */
  findInstitutionByUserId(id: string): Promise<IFinancialInstitution | null>;
  /**
   * Retrieves all financial institutions.
   * @returns A promise that resolves to an array of institution documents or null.
   */
  findAllInstitutions(): Promise<IFinancialInstitution[] | null>;
  /**
   * Updates an existing financial institution.
   * @param id - The ID of the institution to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated institution document or null.
   */
  updateInstitution(
    id: string,
    data: Partial<FinancialInstitutionDTO>
  ): Promise<IFinancialInstitution | null>;
  /**
   * Deletes a financial institution by its unique ID.
   * @param id - The ID of the institution to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteInstitution(id: string): Promise<boolean | null>;

  // Product Methods
  /**
   * Creates a new financial product.
   * @param data - The DTO containing the details for the new product.
   * @returns A promise that resolves to the created product document or null.
   */
  createProduct(data: FinancialProductDTO): Promise<IFinancialProduct | null>;
  /**
   * Finds a financial product by its unique ID.
   * @param id - The ID of the product to find.
   * @returns A promise that resolves to the product document or null if not found.
   */
  findProductById(id: string): Promise<IFinancialProduct | null>;
  /**
   * Retrieves all financial products, with an option to filter for active ones.
   * @param activeOnly - If true, returns only active products. Defaults to true.
   * @returns A promise that resolves to an array of product documents or null.
   */
  findAllProducts(activeOnly?: boolean): Promise<IFinancialProduct[] | null>;
  /**
   * Finds all financial products offered by a specific institution.
   * @param institutionId - The ID of the institution.
   * @returns A promise that resolves to an array of product documents or null.
   */
  findProductsByInstitution(
    institutionId: string
  ): Promise<IFinancialProduct[] | null>;
  /**
   * Updates an existing financial product.
   * @param id - The ID of the product to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated product document or null.
   */
  updateProduct(
    id: string,
    data: Partial<FinancialProductDTO>
  ): Promise<IFinancialProduct | null>;
  /**
   * Deletes a financial product by its unique ID.
   * @param id - The ID of the product to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteProduct(id: string): Promise<boolean | null>;

  // Application Methods
  /**
   * Creates a new financing application.
   * @param data - The DTO containing the details for the new application.
   * @returns A promise that resolves to the created application document or null.
   */
  createApplication(
    data: FinancingApplicationDTO
  ): Promise<IFinancingApplication | null>;
  /**
   * Finds a financing application by its unique ID.
   * @param id - The ID of the application to find.
   * @returns A promise that resolves to the application document or null if not found.
   */
  findApplicationById(id: string): Promise<IFinancingApplication | null>;
  /**
   * Finds all financing applications submitted by a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of application documents or null.
   */
  findApplicationsByUserId(
    userId: string
  ): Promise<IFinancingApplication[] | null>;
  /**
   * Finds all financing applications for a specific product.
   * @param productId - The ID of the financial product.
   * @returns A promise that resolves to an array of application documents or null.
   */
  findApplicationsByProductId(
    productId: string
  ): Promise<IFinancingApplication[] | null>;
  /**
   * Updates an existing financing application.
   * @param id - The ID of the application to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated application document or null.
   */
  updateApplication(
    id: string,
    data: Partial<UpdateFinancingApplicationDTO | FinancingApplicationDTO>
  ): Promise<IFinancingApplication | null>;
  /**
   * Deletes a financing application by its unique ID.
   * @param id - The ID of the application to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteApplication(id: string): Promise<boolean | null>;
  /**
   * Checks if a user has any active (pending, approved, or under review) applications.
   * @param id - The ID of the user to check.
   * @returns A promise that resolves to true if the user has no active applications, otherwise false.
   */
  checkApplictionStatesbyUserID(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IFinancialRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const FinancialRepository: IFinancialRepository = {
  // Institution Methods
  /** Creates a new FinancialInstitution document. */
  createInstitution: withErrorHandling(async (data) => {
    const institution = new FinancialInstitution(data);
    return await institution.save();
  }),
  /** Finds a single financial institution by its document ID. */
  findById: withErrorHandling(async (id) =>
    FinancialInstitution.findById(id)
  ),
  /** Retrieves all financial institutions. */
  findAllInstitutions: withErrorHandling(async () =>
    FinancialInstitution.find()
  ),
  /** Finds a single financial institution by the associated user's ID. */
  findInstitutionByUserId: withErrorHandling(async (id) =>
    FinancialInstitution.findOne({ user_id: new Types.ObjectId(id) })
  ),
  /** Finds a financial institution by ID and updates it with new data. */
  updateInstitution: withErrorHandling(async (id, data) =>
    FinancialInstitution.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes a financial institution by its document ID. */
  deleteInstitution: withErrorHandling(async (id) => {
    const result = await FinancialInstitution.findByIdAndDelete(id);
    return result !== null;
  }),

  // Product Methods
  /** Creates a new FinancialProduct document. */
  createProduct: withErrorHandling(async (data) => {
    const product = new FinancialProduct(data);
    return await product.save();
  }),
  /** Finds a single financial product by its document ID. */
  findProductById: withErrorHandling(async (id) =>
    FinancialProduct.findById(id)
  ),
  /** Retrieves all financial products, filtering for active ones by default, and populates institution details. */
  findAllProducts: withErrorHandling(async (activeOnly = true) => {
    const filter = activeOnly ? { is_active: true } : {};
    return FinancialProduct.find(filter).populate("institution_id");
  }),
  /** Finds all financial products for a specific institution. */
  findProductsByInstitution: withErrorHandling(async (institutionId) =>
    FinancialProduct.find({
      institution_id: new Types.ObjectId(institutionId),
    })
  ),
  /** Finds a financial product by ID and updates it with new data. */
  updateProduct: withErrorHandling(async (id, data) =>
    FinancialProduct.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes a financial product by its document ID. */
  deleteProduct: withErrorHandling(async (id) => {
    const result = await FinancialProduct.findByIdAndDelete(id);
    return result !== null;
  }),

  // Application Methods
  /** Creates a new FinancingApplication document. */
  createApplication: withErrorHandling(async (data) => {
    const application = new FinancingApplication(data);
    return await application.save();
  }),
  /** Finds a single financing application by ID and populates user and product/institution details. */
  findApplicationById: withErrorHandling(async (id) =>
    FinancingApplication.findById(id)
      .populate("user_id", "name email")
      .populate({
        path: "product_id",
        populate: { path: "institution_id", select: "name" },
      })
  ),
  /** Finds all financing applications for a specific user, sorted by most recent, and populates product/institution details. */
  findApplicationsByUserId: withErrorHandling(async (userId) =>
    FinancingApplication.find({ user_id: new Types.ObjectId(userId) })
      .populate({
        path: "product_id",
        populate: { path: "institution_id", select: "name" },
      })
      .sort({ createdAt: -1 })
  ),
  /** Finds all financing applications for a specific product, sorted by most recent, and populates user and product/institution details. */
  findApplicationsByProductId: withErrorHandling(async (productId) =>
    FinancingApplication.find({ product_id: new Types.ObjectId(productId) })
      .populate("user_id", "name email")
      .populate({
        path: "product_id",
        populate: { path: "institution_id", select: "name" },
      })
      .sort({ createdAt: -1 })
  ),
  /** Finds a financing application by ID and updates it with new data. */
  updateApplication: withErrorHandling(async (id, data) =>
    FinancingApplication.findByIdAndUpdate(id, data, { new: true })
  ),
  /** Deletes a financing application by its document ID. */
  deleteApplication: withErrorHandling(async (id) => {
    const result = await FinancingApplication.findByIdAndDelete(id);
    return result !== null;
  }),
  /** Checks if a user has any applications with a status that blocks them from creating a new one. */
  checkApplictionStatesbyUserID: withErrorHandling(async (id) => {
    const result = await FinancingApplication.find({
      user_id: new Types.ObjectId(id),
    });

    if (result.length === 0) {
      return true;
    }

    // Check if any of the user's applications have a "blocking" status.
    const hasBlockedStatus = result.some(
      (element) =>
        element.status === ApplicationStatus.PENDING ||
        element.status === ApplicationStatus.APPROVED ||
        element.status === ApplicationStatus.UNDER_REVIEW
    );

    // If there is a blocking status, return false (user cannot apply). Otherwise, return true.
    return !hasBlockedStatus;
  }),
};
