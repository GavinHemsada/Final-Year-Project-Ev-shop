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
import mongoose from "mongoose";
import { Request, Response } from "express";
import { financialController, IFinancialController } from "../../../src/modules/financial/financial.controller";
import { IFinancialService } from "../../../src/modules/financial/financial.service";
import { ApplicationStatus } from "../../../src/shared/enum/enum";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("FinancialController", () => {
  let controller: IFinancialController;
  let mockFinancialService: jest.Mocked<IFinancialService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockFinancialService = {
      createInstitution: jest.fn(),
      getInstitutionById: jest.fn(),
      findInstitutionByUserId: jest.fn(),
      getAllInstitutions: jest.fn(),
      updateInstitution: jest.fn(),
      deleteInstitution: jest.fn(),
      createProduct: jest.fn(),
      getProductById: jest.fn(),
      getAllProducts: jest.fn(),
      getProductsByInstitution: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      createApplication: jest.fn(),
      getApplicationById: jest.fn(),
      getApplicationsByUser: jest.fn(),
      getApplicationsByProduct: jest.fn(),
      getApplicationsByInstitution: jest.fn(),
      updateApplicationStatus: jest.fn(),
      updateApplication: jest.fn(),
      deleteApplication: jest.fn(),
    } as jest.Mocked<IFinancialService>;

    controller = financialController(mockFinancialService);

    mockRequest = { params: {}, body: {}, files: undefined };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    (handleResult as jest.Mock) = jest.fn((res, result, status) => res);
    (handleError as jest.Mock) = jest.fn((res, err, operation) => res);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("createInstitution", () => {
    it("should call service.createInstitution and return result with 201 status", async () => {
      const institutionData = { 
        user_id: "user123", 
        name: "Test Bank", 
        type: "Bank", 
        contact_email: "test@bank.com",
        website: "https://bank.com",
        contact_phone: "1234567890" 
      };
      const mockResult = { success: true, institution: {} };

      mockRequest.body = institutionData;
      mockFinancialService.createInstitution.mockResolvedValue(mockResult);

      await controller.createInstitution(mockRequest as Request, mockResponse as Response);

      expect(mockFinancialService.createInstitution).toHaveBeenCalledWith(institutionData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("getInstitution", () => {
    it("should call service.getInstitutionById and return result", async () => {
      const institutionId = "inst123";
      const mockResult = { success: true, institution: {} };

      mockRequest.params = { id: institutionId };
      mockFinancialService.getInstitutionById.mockResolvedValue(mockResult);

      await controller.getInstitution(mockRequest as Request, mockResponse as Response);

      expect(mockFinancialService.getInstitutionById).toHaveBeenCalledWith(institutionId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createProduct", () => {
    it("should call service.createProduct and return result with 201 status", async () => {
      const productData = { institution_id: "inst123", product_name: "Auto Loan", product_type: "Auto Loan", interest_rate_min: 5.5, max_amount: 100000, is_active: true };
      const mockResult = { success: true, product: {} };

      mockRequest.body = productData;
      mockFinancialService.createProduct.mockResolvedValue(mockResult);

      await controller.createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockFinancialService.createProduct).toHaveBeenCalledWith(productData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("createApplication", () => {
    it("should call service.createApplication and return result with 201 status", async () => {
      const applicationData = { user_id: "user123", product_id: "product123", application_data: { full_name: "John Doe", age: 30, employment_status: "Employed", monthly_income: 5000, requested_amount: 50000, repayment_period_months: 60 } };
      const mockResult = { success: true, application: {} };

      mockRequest.body = applicationData;
      mockFinancialService.createApplication.mockResolvedValue(mockResult);

      await controller.createApplication(mockRequest as Request, mockResponse as Response);

      expect(mockFinancialService.createApplication).toHaveBeenCalledWith(applicationData, []);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("updateApplicationStatus", () => {
    it("should call service.updateApplicationStatus and return result", async () => {
      const applicationId = "app123";
      const updateData = { status: ApplicationStatus.APPROVED };
      const mockResult = { success: true, application: {} };

      mockRequest.params = { id: applicationId };
      mockRequest.body = updateData;
      mockFinancialService.updateApplicationStatus.mockResolvedValue(mockResult);

      await controller.updateApplicationStatus(mockRequest as Request, mockResponse as Response);

      expect(mockFinancialService.updateApplicationStatus).toHaveBeenCalledWith(applicationId, updateData);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });
});

