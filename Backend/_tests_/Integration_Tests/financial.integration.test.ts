import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  jest,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { financialService } from "../../src/modules/financial/financial.service";
import { FinancialRepository } from "../../src/modules/financial/financial.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { FinancialInstitution } from "../../src/entities/FinancialInstitution";
import { User } from "../../src/entities/User";
import { UserRole, ApplicationStatus } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => {
  const mockGetOrSet = jest.fn() as jest.MockedFunction<any>;
  mockGetOrSet.mockImplementation(async (key: string, fetchFunction: any) => {
    if (typeof fetchFunction === "function") {
      return fetchFunction();
    }
    return null;
  });

  const mockDeletePattern = jest.fn() as jest.MockedFunction<any>;
  mockDeletePattern.mockResolvedValue(0);

  return {
    default: {
      getOrSet: mockGetOrSet,
      delete: jest.fn(),
      deletePattern: mockDeletePattern,
    },
    getOrSet: mockGetOrSet,
    delete: jest.fn(),
    deletePattern: mockDeletePattern,
  };
});

jest.mock("../../src/shared/utils/fileHandel", () => ({
  addFiles: jest.fn().mockReturnValue(["path/to/file1.pdf"]),
  deleteFiles: jest.fn(),
}));

describe("Financial Integration Tests", () => {
  let service: ReturnType<typeof financialService>;
  let financialRepo: typeof FinancialRepository;
  let userRepo: typeof UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDB();
    financialRepo = FinancialRepository;
    userRepo = UserRepository;
    const mockNotificationService = {} as any;
    service = financialService(
      financialRepo,
      userRepo,
      mockNotificationService
    );
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "finance@example.com",
      password: "hashedPassword",
      name: "Finance User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Institution Operations", () => {
    it("should create a new financial institution", async () => {
      const institutionData = {
        user_id: testUserId,
        name: "Test Bank",
        type: "Bank",
        contact_email: "contact@testbank.com",
      };

      const mockSave = jest.fn() as jest.MockedFunction<any>;
      mockSave.mockResolvedValue({
        _id: new Types.ObjectId(testUserId),
        role: [UserRole.USER, UserRole.FINANCE],
      });

      jest.spyOn(userRepo, "findById").mockResolvedValue({
        _id: new Types.ObjectId(testUserId),
        role: [UserRole.USER],
        save: mockSave,
      } as any);
      jest
        .spyOn(financialRepo, "findInstitutionByUserId")
        .mockResolvedValue(null);
      jest.spyOn(financialRepo, "createInstitution").mockResolvedValue({
        _id: new Types.ObjectId(),
        ...institutionData,
      } as any);

      const result = await service.createInstitution(institutionData);

      expect(result.success).toBe(true);
      expect(result.institution).toBeDefined();
      expect(result.institution?.name).toBe(institutionData.name);
    });

    it("should get institution by ID", async () => {
      const institution = new FinancialInstitution({
        user_id: new Types.ObjectId(testUserId),
        name: "Test Bank",
        type: "Bank",
      });
      await institution.save();

      jest
        .spyOn(financialRepo, "findById")
        .mockResolvedValue(institution as any);

      const result = await service.getInstitutionById(
        institution._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.institution?._id.toString()).toBe(
        institution._id.toString()
      );
    });

    it("should get all institutions", async () => {
      const institutions = [
        {
          user_id: new Types.ObjectId(),
          name: "Bank 1",
          type: "Bank",
        },
        {
          user_id: new Types.ObjectId(),
          name: "Bank 2",
          type: "Credit Union",
        },
      ];

      await FinancialInstitution.insertMany(institutions);

      jest
        .spyOn(financialRepo, "findAllInstitutions")
        .mockResolvedValue(institutions as any);

      const result = await service.getAllInstitutions();

      expect(result.success).toBe(true);
      expect(result.institutions?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Product Operations", () => {
    it("should create a financial product", async () => {
      const institution = new FinancialInstitution({
        user_id: new Types.ObjectId(testUserId),
        name: "Test Bank",
        type: "Bank",
      });
      await institution.save();

      const productData = {
        institution_id: institution._id.toString(),
        product_name: "Auto Loan",
        product_type: "Auto Loan",
        interest_rate_min: 5.5,
        is_active: true,
      };

      const mockProduct = {
        _id: new Types.ObjectId(),
        ...productData,
        institution_id: institution._id,
      };

      jest
        .spyOn(financialRepo, "findById")
        .mockResolvedValue(institution as any);
      jest
        .spyOn(financialRepo, "createProduct")
        .mockResolvedValue(mockProduct as any);

      const result = await service.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.product?.product_name).toBe(productData.product_name);
    });
  });
});
