import {
  FinancialInstitutionDTO,
  FinancialProductDTO,
  FinancingApplicationDTO,
  UpdateFinancingApplicationDTO,
} from "../../dtos/financial.DTO";
import { ApplicationStatus } from "../../shared/enum/enum";
import { IFinancialRepository } from "./financial.repository";
import { IUserRepository } from "../user/user.repository";
import { UserRole } from "../../shared/enum/enum";
import { addFiles, deleteFiles } from "../../shared/utils/fileHandel";
import CacheService from "../../shared/cache/CacheService";

/**
 * Defines the interface for the financial service, outlining methods for managing institutions, products, and applications.
 */
export interface IFinancialService {
  // Institution Methods
  /**
   * Creates a new financial institution.
   * @param data - The data for the new institution.
   * @returns A promise that resolves to an object containing the created institution or an error.
   */
  createInstitution(
    data: FinancialInstitutionDTO
  ): Promise<{ success: boolean; institution?: any; error?: string }>;
  /**
   * Retrieves a financial institution by its unique ID.
   * @param id - The ID of the institution to find.
   * @returns A promise that resolves to an object containing the institution data or an error.
   */
  getInstitutionById(
    id: string
  ): Promise<{ success: boolean; institution?: any; error?: string }>;
  /**
   * Retrieves all financial institutions.
   * @returns A promise that resolves to an object containing an array of all institutions or an error.
   */
  getAllInstitutions(): Promise<{
    success: boolean;
    institutions?: any[];
    error?: string;
  }>;
  /**
   * Updates an existing financial institution.
   * @param id - The ID of the institution to update.
   * @param data - The partial data to update the institution with.
   * @returns A promise that resolves to an object containing the updated institution data or an error.
   */
  updateInstitution(
    id: string,
    data: Partial<FinancialInstitutionDTO>
  ): Promise<{ success: boolean; institution?: any; error?: string }>;
  /**
   * Deletes a financial institution by its unique ID.
   * @param id - The ID of the institution to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteInstitution(id: string): Promise<{ success: boolean; error?: string }>;

  // Product Methods
  /**
   * Creates a new financial product.
   * @param data - The data for the new product.
   * @returns A promise that resolves to an object containing the created product or an error.
   */
  createProduct(
    data: FinancialProductDTO
  ): Promise<{ success: boolean; product?: any; error?: string }>;
  /**
   * Retrieves a financial product by its unique ID.
   * @param id - The ID of the product to find.
   * @returns A promise that resolves to an object containing the product data or an error.
   */
  getProductById(
    id: string
  ): Promise<{ success: boolean; product?: any; error?: string }>;
  /**
   * Retrieves all financial products, with an option to filter for active ones only.
   * @param activeOnly - If true, returns only active products. Defaults to true.
   * @returns A promise that resolves to an object containing an array of products or an error.
   */
  getAllProducts(
    activeOnly?: boolean
  ): Promise<{ success: boolean; products?: any[]; error?: string }>;
  /**
   * Retrieves all financial products offered by a specific institution.
   * @param institutionId - The ID of the institution.
   * @returns A promise that resolves to an object containing an array of products or an error.
   */
  getProductsByInstitution(
    institutionId: string
  ): Promise<{ success: boolean; products?: any[]; error?: string }>;
  /**
   * Updates an existing financial product.
   * @param id - The ID of the product to update.
   * @param data - The partial data to update the product with.
   * @returns A promise that resolves to an object containing the updated product data or an error.
   */
  updateProduct(
    id: string,
    data: Partial<FinancialProductDTO>
  ): Promise<{ success: boolean; product?: any; error?: string }>;
  /**
   * Deletes a financial product by its unique ID.
   * @param id - The ID of the product to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteProduct(id: string): Promise<{ success: boolean; error?: string }>;

  // Application Methods
  /**
   * Creates a new financing application.
   * @param data - The data for the new application.
   * @param files - Optional array of files for additional documents.
   * @returns A promise that resolves to an object containing the created application or an error.
   */
  createApplication(
    data: FinancingApplicationDTO,
    files?: Express.Multer.File[]
  ): Promise<{ success: boolean; application?: any; error?: string }>;
  /**
   * Retrieves a financing application by its unique ID.
   * @param id - The ID of the application to find.
   * @returns A promise that resolves to an object containing the application data or an error.
   */
  getApplicationById(
    id: string
  ): Promise<{ success: boolean; application?: any; error?: string }>;
  /**
   * Retrieves all financing applications submitted by a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's applications or an error.
   */
  getApplicationsByUser(
    userId: string
  ): Promise<{ success: boolean; applications?: any[]; error?: string }>;
  /**
   * Retrieves all financing applications for a specific product.
   * @param productId - The ID of the product.
   * @returns A promise that resolves to an object containing an array of applications or an error.
   */
  getApplicationsByProduct(
    productId: string
  ): Promise<{ success: boolean; applications?: any[]; error?: string }>;
  /**
   * Updates the status of a financing application.
   * @param id - The ID of the application to update.
   * @param data - The data containing the new status.
   * @returns A promise that resolves to an object containing the updated application data or an error.
   */
  updateApplicationStatus(
    id: string,
    data: UpdateFinancingApplicationDTO
  ): Promise<{ success: boolean; application?: any; error?: string }>;
  /**
   * Updates an existing financing application, including its documents.
   * @param id - The ID of the application to update.
   * @param data - The partial data to update the application with.
   * @param files - Optional array of new files to replace existing documents.
   * @returns A promise that resolves to an object containing the updated application data or an error.
   */
  updateApplication(
    id: string,
    data: Partial<FinancingApplicationDTO>,
    files?: Express.Multer.File[]
  ): Promise<{ success: boolean; application?: any; error?: string }>;
  /**
   * Deletes a financing application by its unique ID.
   * @param id - The ID of the application to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteApplication(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the financial service.
 * It encapsulates the business logic for managing financial institutions, products, and applications,
 * including caching strategies to improve performance.
 *
 * @param repo - The repository for financial data access.
 * @param userRepo - The repository for user data access.
 * @returns An implementation of the IFinancialService interface.
 */
export function financialService(
  repo: IFinancialRepository,
  userRepo: IUserRepository
): IFinancialService {
  const folderName = "financial";
  return {
    // Institution Methods
    /**
     * Creates a new financial institution, assigns the 'FINANCE' role to the associated user,
     * and invalidates the cache for the list of all institutions.
     */
    createInstitution: async (data) => {
      try {
        // Validate user and check for existing institution profile.
        const user = await userRepo.findById(data.user_id);
        if (!user) return { success: false, error: "User not found" };
        const existingInstitution = await repo.findInstitutionByUserId(
          data.user_id
        );
        if (existingInstitution)
          return { success: false, error: "User already has an institution" };
        const sellers = await repo.findAllInstitutions();
        if (sellers && sellers.length > 0 && sellers.some(s => s.name === data.name)) {
          return { success: false, error: "Institution name already exists" };
        }
        // Assign role and save user.
        user.role.push(UserRole.FINANCE);
        const updatedUser = await user.save();
        if (!updatedUser)
          return { success: false, error: "User role not updated" };

        const institution = await repo.createInstitution(data);

        // Invalidate institutions list cache
        await CacheService.delete("institutions");

        return { success: true, institution };
      } catch (err) {
        return { success: false, error: "Failed to create institution" };
      }
    },
    /**
     * Finds a single financial institution by its ID, using a cache-aside pattern.
     * Caches the individual institution data for one hour.
     */
    getInstitutionById: async (id) => {
      try {
        const cacheKey = `institution_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const institution = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!institution)
          return { success: false, error: "Institution not found" };
        return { success: true, institution };
      } catch (err) {
        return { success: false, error: "Failed to fetch institution" };
      }
    },
    /**
     * Retrieves all financial institutions, utilizing a cache-aside pattern.
     * Caches the list of all institutions for one hour.
     */
    getAllInstitutions: async () => {
      try {
        const cacheKey = "institutions";
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const institutions = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findAllInstitutions();
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!institutions)
          return { success: false, error: "No institutions found" };
        return { success: true, institutions };
      } catch (err) {
        return { success: false, error: "Failed to fetch institutions" };
      }
    },
    /**
     * Updates a financial institution's information.
     * Invalidates caches for the specific institution and the list of all institutions.
     */
    updateInstitution: async (id, data) => {
      try {
        const { user_id, ...filterData } = data;
        const institution = await repo.updateInstitution(id, filterData);
        if (!institution)
          return { success: false, error: "Institution not found" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`institution_${id}`),
          CacheService.delete("institutions"),
        ]);

        return { success: true, institution };
      } catch (err) {
        return { success: false, error: "Failed to update institution" };
      }
    },
    /**
     * Deletes a financial institution.
     * Invalidates caches for the specific institution and the list of all institutions.
     */
    deleteInstitution: async (id) => {
      try {
        const success = await repo.deleteInstitution(id);
        if (!success) return { success: false, error: "Institution not found" };

        // Invalidate relevant caches
        await Promise.all([
          CacheService.delete(`institution_${id}`),
          CacheService.delete("institutions"),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete institution" };
      }
    },

    // Product Methods
    /**
     * Creates a new financial product after validating the parent institution exists.
     * Invalidates all relevant product caches.
     */
    createProduct: async (data) => {
      try {
        const institution = await repo.findById(data.institution_id);
        if (!institution)
          return { success: false, error: "Institution not found" };

        const product = await repo.createProduct(data);

        // Invalidate product caches
        await Promise.all([
          CacheService.deletePattern("products_*"),
          CacheService.delete(`products_institution_${data.institution_id}`),
        ]);

        return { success: true, product };
      } catch (err) {
        return { success: false, error: "Failed to create product" };
      }
    },
    /**
     * Finds a single financial product by its ID, using a cache-aside pattern.
     * Caches the individual product data for one hour.
     */
    getProductById: async (id) => {
      try {
        const cacheKey = `product_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const product = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findProductById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!product) return { success: false, error: "Product not found" };
        return { success: true, product };
      } catch (err) {
        return { success: false, error: "Failed to fetch product" };
      }
    },
    /**
     * Retrieves all financial products, using a cache-aside pattern.
     * Caches active and all products under separate keys for one hour.
     */
    getAllProducts: async (activeOnly = true) => {
      try {
        const cacheKey = `products_${activeOnly ? "active" : "all"}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const products = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findAllProducts(activeOnly);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!products) return { success: false, error: "No products found" };
        return { success: true, products };
      } catch (err) {
        return { success: false, error: "Failed to fetch products" };
      }
    },
    /**
     * Finds all products for a specific institution, using a cache-aside pattern.
     * Caches the list of products for that institution for one hour.
     */
    getProductsByInstitution: async (institutionId) => {
      try {
        const cacheKey = `products_institution_${institutionId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const products = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findProductsByInstitution(institutionId);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!products) return { success: false, error: "No products found" };
        return { success: true, products };
      } catch (err) {
        return { success: false, error: "Failed to fetch products" };
      }
    },
    /**
     * Updates a financial product's information.
     * Invalidates all caches related to this product.
     */
    updateProduct: async (id, data) => {
      try {
        const product = await repo.updateProduct(id, data);
        if (!product) return { success: false, error: "Product not found" };

        // Invalidate product caches
        await Promise.all([
          CacheService.delete(`product_${id}`),
          CacheService.deletePattern("products_*"),
          CacheService.delete(`products_institution_${product.institution_id}`),
        ]);

        return { success: true, product };
      } catch (err) {
        return { success: false, error: "Failed to update product" };
      }
    },
    /**
     * Deletes a financial product.
     * Invalidates all caches related to this product before deletion.
     */
    deleteProduct: async (id) => {
      try {
        // Fetch the product first to get its institution_id for cache invalidation.
        const product = await repo.findProductById(id);
        if (!product) return { success: false, error: "Product not found" };

        const success = await repo.deleteProduct(id);
        if (!success) return { success: false, error: "Product not found" };

        // Invalidate product caches
        await Promise.all([
          CacheService.delete(`product_${id}`),
          CacheService.deletePattern("products_*"),
          CacheService.delete(`products_institution_${product.institution_id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete product" };
      }
    },

    // Application Methods
    /**
     * Creates a new financing application.
     * It validates the user, product, and checks for existing applications.
     * Handles file uploads for additional documents and invalidates relevant application caches.
     */
    createApplication: async (data, files) => {
      try {
        // Perform validations.
        const user = await userRepo.findById(data.user_id);
        if (!user) return { success: false, error: "User not found" };
        const product = await repo.findProductById(data.product_id);
        if (!product) return { success: false, error: "Product not found" };
        if (!product.is_active)
          return { success: false, error: "Product is not active" };
        const hasApplication = await repo.checkApplictionStatesbyUserID(
          data.user_id
        );
        if (!hasApplication)
          return { success: false, error: "User already has an application" };
        // Handle file uploads.
        let filePaths: string[] = [];
        if (files && files.length > 0) {
          filePaths = addFiles(files, folderName);
        }
        const applicationData = {
          ...data,
          application_data: {
            ...data.application_data,
            additional_documents: filePaths,
          },
          status: ApplicationStatus.PENDING,
        };
        const application = await repo.createApplication(
          applicationData as any
        );

        // Invalidate application caches
        await Promise.all([
          CacheService.delete(`applications_user_${data.user_id}`),
          CacheService.delete(`applications_product_${data.product_id}`),
        ]);

        return { success: true, application };
      } catch (err) {
        return { success: false, error: "Failed to create application" };
      }
    },
    /**
     * Finds a single financing application by its ID, using a cache-aside pattern.
     * Caches the individual application data for one hour.
     */
    getApplicationById: async (id) => {
      try {
        const cacheKey = `application_${id}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const application = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findApplicationById(id);
            return data ?? null;
          },
          3600
        ); // Cache for 1 hour

        if (!application)
          return { success: false, error: "Application not found" };
        return { success: true, application };
      } catch (err) {
        return { success: false, error: "Failed to fetch application" };
      }
    },
    /**
     * Finds all applications for a specific user, using a cache-aside pattern.
     * Caches the list of applications for that user for one hour.
     */
    getApplicationsByUser: async (userId) => {
      try {
        const cacheKey = `applications_user_${userId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const applications = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findApplicationsByUserId(userId);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!applications)
          return { success: false, error: "No applications found" };
        return { success: true, applications };
      } catch (err) {
        return { success: false, error: "Failed to fetch applications" };
      }
    },
    /**
     * Finds all applications for a specific product, using a cache-aside pattern.
     * Caches the list of applications for that product for one hour.
     */
    getApplicationsByProduct: async (productId) => {
      try {
        const cacheKey = `applications_product_${productId}`;
        // Attempt to get from cache, otherwise fetch from repository and set cache.
        const applications = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const data = await repo.findApplicationsByProductId(productId);
            return data ?? [];
          },
          3600
        ); // Cache for 1 hour

        if (!applications)
          return { success: false, error: "No applications found" };
        return { success: true, applications };
      } catch (err) {
        return { success: false, error: "Failed to fetch applications" };
      }
    },
    /**
     * Updates the status of a financing application.
     * Sets a 'processed_at' date if the status is 'APPROVED' or 'REJECTED'.
     * Invalidates all caches related to this application.
     */
    updateApplicationStatus: async (id, data) => {
      try {
        const updateData: Partial<UpdateFinancingApplicationDTO> & {
          processed_at?: Date;
        } = { ...data };

        // Set processed date if the application is being finalized.
        if (
          data.status === ApplicationStatus.APPROVED ||
          data.status === ApplicationStatus.REJECTED
        ) {
          updateData.processed_at = new Date();
        }

        const application = await repo.updateApplication(id, updateData);
        if (!application) {
          return { success: false, error: "Application not found" };
        }

        // Invalidate application caches
        await Promise.all([
          CacheService.delete(`application_${id}`),
          CacheService.delete(`applications_user_${application.user_id}`),
          CacheService.delete(`applications_product_${application.product_id}`),
        ]);

        // A notification could be triggered here to inform the user.
        return { success: true, application };
      } catch (err) {
        return { success: false, error: "Failed to update application status" };
      }
    },
    /**
     * Updates a financing application's data and/or documents.
     * If new files are provided, it deletes the old ones and adds the new ones.
     * Invalidates all caches related to this application.
     */
    updateApplication: async (id, data, files) => {
      try {
        const application = await repo.findApplicationById(id);
        if (!application)
          return { success: false, error: "Application not found" };
        // Handle document replacement.
        let filePaths: string[] = [];
        if (files && files.length > 0) {
          const existingDocs = application.application_data.get(
            "additional_documents"
          );

          if (existingDocs && existingDocs.length > 0) {
            deleteFiles(existingDocs);
          }

          filePaths = addFiles(files, folderName);
        }

        // Prepare the update payload.
        const updateDate = {
          ...data,
          application_data: {
            ...data.application_data,
            additional_documents: filePaths,
          },
        };
        const updatedApplication = await repo.updateApplication(
          id,
          updateDate as any
        );
        if (!updatedApplication)
          return { success: false, error: "Application not found" };

        // Invalidate application caches
        await Promise.all([
          CacheService.delete(`application_${id}`),
          CacheService.delete(
            `applications_user_${updatedApplication.user_id}`
          ),
          CacheService.delete(
            `applications_product_${updatedApplication.product_id}`
          ),
        ]);

        return { success: true, application: updatedApplication };
      } catch (err) {
        return { success: false, error: "Failed to update application" };
      }
    },
    /**
     * Deletes a financing application and its associated documents.
     * Invalidates all caches related to this application before deletion.
     */
    deleteApplication: async (id) => {
      try {
        const application = await repo.findApplicationById(id);
        if (!application)
          return { success: false, error: "Application not found" };

        // Delete associated files from storage.
        if (application?.application_data.additional_documents)
          deleteFiles(application?.application_data.additional_documents);

        const success = await repo.deleteApplication(id);
        if (!success) return { success: false, error: "Application not found" };

        // Invalidate application caches
        await Promise.all([
          CacheService.delete(`application_${id}`),
          CacheService.delete(`applications_user_${application.user_id}`),
          CacheService.delete(`applications_product_${application.product_id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete application" };
      }
    },
  };
}
