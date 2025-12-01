import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { financialService, IFinancialService } from "../../../src/modules/financial/financial.service";
import { IFinancialRepository } from "../../../src/modules/financial/financial.repository";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import { FinancialInstitutionDTO, FinancialProductDTO, FinancingApplicationDTO } from "../../../src/dtos/financial.DTO";
import { ApplicationStatus, UserRole } from "../../../src/shared/enum/enum";
import CacheService from "../../../src/shared/cache/CacheService";

jest.mock("../../../src/shared/cache/CacheService");
jest.mock("../../../src/shared/utils/fileHandel", () => ({
  addFiles: jest.fn().mockReturnValue(["path/to/file1.pdf", "path/to/file2.pdf"]),
  deleteFiles: jest.fn(),
}));

describe("FinancialService", () => {
  let service: IFinancialService;
  let mockFinancialRepo: jest.Mocked<IFinancialRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockFinancialRepo = {
      createInstitution: jest.fn(),
      findInstitutionById: jest.fn(),
      findInstitutionByUserId: jest.fn(),
      findAllInstitutions: jest.fn(),
      updateInstitution: jest.fn(),
      deleteInstitution: jest.fn(),
      createProduct: jest.fn(),
      findProductById: jest.fn(),
      findAllProducts: jest.fn(),
      findProductsByInstitution: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      createApplication: jest.fn(),
      findApplicationById: jest.fn(),
      findApplicationsByUser: jest.fn(),
      findApplicationsByProduct: jest.fn(),
      findApplicationsByInstitution: jest.fn(),
      findApplicationsByUserId: jest.fn(),
      findApplicationsByProductId: jest.fn(),
      checkApplictionStatesbyUserID: jest.fn(),
      updateApplication: jest.fn(),
      deleteApplication: jest.fn(),
    } as jest.Mocked<IFinancialRepository>;

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    service = financialService(mockFinancialRepo, mockUserRepo);

    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction();
      }
    );

    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("createInstitution", () => {
    it("should create a new institution successfully", async () => {
      const userId = new Types.ObjectId().toString();
      const institutionData: FinancialInstitutionDTO = {
        user_id: userId,
        name: "Test Bank",
        type: "Bank",
        contact_email: "test@bank.com",
      };
      const mockUser: any = {
        _id: new Types.ObjectId(userId),
        role: [UserRole.USER],
      };
      mockUser.save = jest.fn<() => Promise<any>>().mockResolvedValue(mockUser);
      const mockInstitution = { _id: new Types.ObjectId(), ...institutionData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockFinancialRepo.findInstitutionByUserId.mockResolvedValue(null);
      mockFinancialRepo.createInstitution.mockResolvedValue(mockInstitution as any);

      const result = await service.createInstitution(institutionData);

      expect(result.success).toBe(true);
      expect(result.institution).toEqual(mockInstitution);
      expect(mockUser.save).toHaveBeenCalled();
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if user not found", async () => {
      const institutionData: FinancialInstitutionDTO = {
        user_id: new Types.ObjectId().toString(),
        name: "Test Bank",
        type: "Bank",
        contact_email: "test@bank.com",
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createInstitution(institutionData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should return error if user already has an institution", async () => {
      const userId = new Types.ObjectId().toString();
      const institutionData: FinancialInstitutionDTO = {
        user_id: userId,
        name: "Test Bank",
        type: "Bank",
        contact_email: "test@bank.com",
      };
      const mockUser = { _id: new Types.ObjectId(userId) };
      const existingInstitution = { _id: new Types.ObjectId() };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockFinancialRepo.findInstitutionByUserId.mockResolvedValue(existingInstitution as any);

      const result = await service.createInstitution(institutionData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User already has an institution");
    });
  });

  describe("getInstitutionById", () => {
    it("should return institution by id", async () => {
      const institutionId = new Types.ObjectId().toString();
      const mockInstitution = { _id: new Types.ObjectId(institutionId), institution_name: "Test Bank" };

      mockFinancialRepo.findInstitutionById.mockResolvedValue(mockInstitution as any);

      const result = await service.getInstitutionById(institutionId);

      expect(result.success).toBe(true);
      expect(result.institution).toEqual(mockInstitution);
    });

    it("should return error if institution not found", async () => {
      const institutionId = new Types.ObjectId().toString();

      mockFinancialRepo.findInstitutionById.mockResolvedValue(null);

      const result = await service.getInstitutionById(institutionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Institution not found");
    });
  });

  describe("getAllInstitutions", () => {
    it("should return all institutions", async () => {
      const mockInstitutions = [
        { _id: new Types.ObjectId(), institution_name: "Bank 1" },
        { _id: new Types.ObjectId(), institution_name: "Bank 2" },
      ];

      mockFinancialRepo.findAllInstitutions.mockResolvedValue(mockInstitutions as any);

      const result = await service.getAllInstitutions();

      expect(result.success).toBe(true);
      expect(result.institutions).toEqual(mockInstitutions);
    });
  });

  describe("createProduct", () => {
    it("should create a new product successfully", async () => {
      const productData: FinancialProductDTO = {
        institution_id: new Types.ObjectId().toString(),
        product_name: "Auto Loan",
        product_type: "Auto Loan",
        interest_rate_min: 5.5,
        is_active: true,
      };
      const mockInstitution = { _id: new Types.ObjectId(productData.institution_id) };
      const mockProduct = { _id: new Types.ObjectId(), ...productData };

      mockFinancialRepo.findInstitutionById.mockResolvedValue(mockInstitution as any);
      mockFinancialRepo.createProduct.mockResolvedValue(mockProduct as any);

      const result = await service.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if institution not found", async () => {
      const productData: FinancialProductDTO = {
        institution_id: new Types.ObjectId().toString(),
        product_name: "Auto Loan",
        product_type: "Auto Loan",
        interest_rate_min: 5.5,
        is_active: true,
      };

      mockFinancialRepo.findInstitutionById.mockResolvedValue(null);

      const result = await service.createProduct(productData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Institution not found");
    });
  });

  describe("createApplication", () => {
    it("should create a new application successfully", async () => {
      const applicationData: FinancingApplicationDTO = {
        user_id: new Types.ObjectId().toString(),
        product_id: new Types.ObjectId().toString(),
        application_data: {
          full_name: "John Doe",
          age: 30,
          employment_status: "Employed",
          monthly_income: 5000,
          requested_amount: 50000,
          repayment_period_months: 60,
        },
      };
      const mockUser = { _id: new Types.ObjectId(applicationData.user_id) };
      const mockProduct = { _id: new Types.ObjectId(applicationData.product_id), is_active: true };
      const mockApplication = { _id: new Types.ObjectId(), ...applicationData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockFinancialRepo.findProductById.mockResolvedValue(mockProduct as any);
      mockFinancialRepo.checkApplictionStatesbyUserID.mockResolvedValue(true);
      mockFinancialRepo.createApplication.mockResolvedValue(mockApplication as any);

      const result = await service.createApplication(applicationData);

      expect(result.success).toBe(true);
      expect(result.application).toEqual(mockApplication);
      expect(CacheService.delete).toHaveBeenCalled();
    });

    it("should return error if user not found", async () => {
      const applicationData: FinancingApplicationDTO = {
        user_id: new Types.ObjectId().toString(),
        product_id: new Types.ObjectId().toString(),
        application_data: {
          full_name: "John Doe",
          age: 30,
          employment_status: "Employed",
          monthly_income: 5000,
          requested_amount: 50000,
          repayment_period_months: 60,
        },
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createApplication(applicationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("updateApplicationStatus", () => {
    it("should update application status successfully", async () => {
      const applicationId = new Types.ObjectId().toString();
      const updateData = { status: ApplicationStatus.APPROVED };
      const mockApplication = { _id: new Types.ObjectId(applicationId), ...updateData };

      mockFinancialRepo.findApplicationById.mockResolvedValue(mockApplication as any);
      mockFinancialRepo.updateApplication.mockResolvedValue(mockApplication as any);

      const result = await service.updateApplicationStatus(applicationId, updateData);

      expect(result.success).toBe(true);
      expect(result.application).toEqual(mockApplication);
      expect(CacheService.delete).toHaveBeenCalled();
    });
  });
});

