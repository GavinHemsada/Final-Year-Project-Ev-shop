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
import { authService, IAuthService } from "../../../src//modules/auth/auth.service";
import { IAuthRepository } from "../../../src//modules/auth/auth.repository";
import { IUser } from "../../../src/entities/User";
import {
  RegisterDto,
  LoginDTO,
  ForgetPasswordDTO,
  OTPverifyDTO,
  ResetPasswordDTO,
} from "../../../src/modules/auth/auth.dto";
import { UserRole } from "../../../src/shared/enum/enum";

// Mock external dependencies
jest.mock("../../../src/shared/utils/Email.util", () => ({
  sendEmail: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("../../../src/shared/cache/CacheService", () => ({
  __esModule: true,
  default: {
    getOrSet: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
}));

// Import the mocked function
import { sendEmail } from "../../../src/shared/utils/Email.util";

// A more type-safe helper for creating mock user documents
const createMockUserDocument = (
  overrides: Partial<IUser> = {}
): jest.Mocked<IUser & { save: jest.Mock; comparePassword: jest.Mock }> => {
  const baseUser: Partial<IUser> = {
    _id: new Types.ObjectId(),
    email: "test@example.com",
    password: "hashedpassword",
    name: "Test User",
    role: [UserRole.USER],
  };

  const mockUser: IUser & { save: jest.Mock; comparePassword: jest.Mock } = {
    ...baseUser,
    ...overrides,
    save: jest.fn(async function (this: any) {
      return this;
    }),
    comparePassword: jest.fn(async (raw: string) => {
      // Simulate password check, can be overridden in tests
      return raw !== "wrong-password";
    }),
  } as any; // Cast to 'any' then to the final type to satisfy complex Mongoose/Jest types

  return mockUser as jest.Mocked<
    IUser & { save: jest.Mock; comparePassword: jest.Mock }
  >;
};

describe("AuthService", () => {
  let service: IAuthService;
  let mockAuthRepo: jest.Mocked<IAuthRepository>;

  beforeAll(async () => {
    // Use MONGO_URI from global setup
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthRepo = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findUser: jest.fn(),
      findOrCreate: jest.fn(),
      checkPassword: jest.fn(),
      updateLastLogin: jest.fn(),
    } as jest.Mocked<IAuthRepository>;

    service = authService(mockAuthRepo);

    // Mock sendEmail to always succeed by default
    (sendEmail as jest.Mock).mockImplementation(() => Promise.resolve(true));
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const registerData: RegisterDto = {
        email: "newuser@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const mockUser = createMockUserDocument({ email: registerData.email });

      mockAuthRepo.findByEmail.mockResolvedValue(null);
      mockAuthRepo.save.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockAuthRepo.save).toHaveBeenCalledWith(
        registerData.email,
        registerData.password
      );
    });

    it("should return an error if user already exists", async () => {
      const registerData: RegisterDto = {
        email: "existing@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const mockUser = createMockUserDocument({ email: registerData.email });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User already exists");
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockAuthRepo.save).not.toHaveBeenCalled();
    });

    it("should return an error if repository save fails", async () => {
      const registerData: RegisterDto = {
        email: "fail@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      mockAuthRepo.findByEmail.mockResolvedValue(null);
      mockAuthRepo.save.mockRejectedValue(new Error("DB Error"));

      const result = await service.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Registration failed");
    });
  });

  describe("login", () => {
    it("should log in a user successfully with correct credentials", async () => {
      const loginData: LoginDTO = {
        email: "user@example.com",
        password: "Password123!",
      };
      const mockUser = createMockUserDocument({ email: loginData.email });

      mockAuthRepo.findUser.mockResolvedValue(mockUser);

      const result = await service.login(loginData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuthRepo.findUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
    });

    it("should return an error for invalid credentials", async () => {
      const loginData: LoginDTO = {
        email: "wrong@example.com",
        password: "WrongPassword123!",
      };

      mockAuthRepo.findUser.mockResolvedValue(null);

      const result = await service.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(mockAuthRepo.findUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
    });

    it("should return an error if repository findUser fails", async () => {
      const loginData: LoginDTO = {
        email: "error@example.com",
        password: "Password123!",
      };

      mockAuthRepo.findUser.mockRejectedValue(new Error("DB Error"));

      const result = await service.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Login failed");
    });
  });

  describe("oauthLogin", () => {
    it("should successfully log in or create a user via OAuth", async () => {
      const email = "oauth@example.com";
      const name = "OAuth User";
      const mockUser = createMockUserDocument({ email, name });

      mockAuthRepo.findOrCreate.mockResolvedValue(mockUser);

      const result = await service.oauthLogin(email, name);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuthRepo.findOrCreate).toHaveBeenCalledWith(email, name);
    });

    it("should return an error if findOrCreate fails", async () => {
      const email = "oauth_fail@example.com";
      const name = "OAuth Fail";

      mockAuthRepo.findOrCreate.mockResolvedValue(null);

      const result = await service.oauthLogin(email, name);

      expect(result.success).toBe(false);
      expect(result.error).toBe("OAuth login failed");
    });

    it("should return an error if repository throws an exception", async () => {
      const email = "oauth_exception@example.com";
      const name = "OAuth Exception";

      mockAuthRepo.findOrCreate.mockRejectedValue(new Error("DB Error"));

      const result = await service.oauthLogin(email, name);

      expect(result.success).toBe(false);
      expect(result.error).toBe("OAuth login failed");
    });
  });

  describe("checkPassword", () => {
    it("should return success if password is set", async () => {
      const email = "haspass@example.com";
      mockAuthRepo.checkPassword.mockResolvedValue(true);

      const result = await service.checkPassword(email);

      expect(result.success).toBe(true);
      expect(mockAuthRepo.checkPassword).toHaveBeenCalledWith(email);
    });

    it("should return error if password is not set", async () => {
      const email = "nopass@example.com";
      mockAuthRepo.checkPassword.mockResolvedValue(false);

      const result = await service.checkPassword(email);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password not set");
      expect(mockAuthRepo.checkPassword).toHaveBeenCalledWith(email);
    });

    it("should return error if repository checkPassword fails", async () => {
      const email = "error@example.com";
      mockAuthRepo.checkPassword.mockRejectedValue(new Error("DB Error"));

      const result = await service.checkPassword(email);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password check failed");
    });
  });

  describe("forgetPassword", () => {
    it("should send OTP successfully if user exists", async () => {
      const forgetData: ForgetPasswordDTO = { email: "test@example.com" };
      const mockUser = createMockUserDocument({ email: forgetData.email });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);
      (sendEmail as jest.Mock).mockImplementation(() =>
        Promise.resolve(true)
      ); // Explicitly mock success for this test

      const result = await service.forgetPassword(forgetData);

      expect(result.success).toBe(true);
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(forgetData.email);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.resetOtp).toBeDefined();
      expect(mockUser.resetOtp?.otpHash).toBeDefined();
      expect(mockUser.resetOtp?.expiresAt).toBeInstanceOf(Date);
      expect(mockUser.resetOtp?.attempts).toBe(0);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        forgetData.email,
        expect.any(String),
        expect.stringMatching(/Your OTP code is \d+/),
        expect.stringMatching(/<div class="otp-code">\d+<\/div>/)
      );
    });

    it("should return an error if user does not exist", async () => {
      const forgetData: ForgetPasswordDTO = {
        email: "nonexistenttt@example.com",
      };
      mockAuthRepo.findByEmail.mockResolvedValue(null);

      const result = await service.forgetPassword(forgetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User with this email does not exist");
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(forgetData.email);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("should return an error if sending OTP email fails", async () => {
      const forgetData: ForgetPasswordDTO = { email: "emailfail@example.com" };
      const mockUser = createMockUserDocument({ email: forgetData.email });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);
      (sendEmail as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error("Email failed"))
      ); // Simulate email sending failure

      const result = await service.forgetPassword(forgetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Forget password process failed");
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP successfully", async () => {
      const verifyData: OTPverifyDTO = {
        email: "verify@example.com",
        otp: "123456",
      };
      const hashedOtp = require("crypto")
        .createHash("sha256")
        .update(verifyData.otp)
        .digest("hex");
      const mockUser = createMockUserDocument({
        email: verifyData.email,
        resetOtp: {
          otpHash: hashedOtp,
          expiresAt: new Date(Date.now() + 60 * 1000),
          attempts: 0,
        },
      });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.verifyOTP(verifyData);

      expect(result.success).toBe(true);
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(verifyData.email);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.resetOtp).toBeUndefined();
    });

    it("should return an error for invalid OTP", async () => {
      const verifyData: OTPverifyDTO = {
        email: "invalid@example.com",
        otp: "000000",
      };
      const correctHashedOtp = require("crypto")
        .createHash("sha256")
        .update("123456")
        .digest("hex");
      const mockUser = createMockUserDocument({
        email: verifyData.email,
        resetOtp: {
          otpHash: correctHashedOtp,
          expiresAt: new Date(Date.now() + 60 * 1000),
          attempts: 0,
        },
      });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.verifyOTP(verifyData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid OTP");
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.resetOtp?.attempts).toBe(1);
    });

    it("should return an error for expired OTP", async () => {
      const verifyData: OTPverifyDTO = {
        email: "expired@example.com",
        otp: "123456",
      };
      const hashedOtp = require("crypto")
        .createHash("sha256")
        .update(verifyData.otp)
        .digest("hex");
      const mockUser = createMockUserDocument({
        email: verifyData.email,
        resetOtp: {
          otpHash: hashedOtp,
          expiresAt: new Date(Date.now() - 60 * 1000),
          attempts: 0,
        },
      });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.verifyOTP(verifyData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("OTP expired");
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.resetOtp).toBeUndefined();
    });

    it("should return an error if max OTP attempts reached", async () => {
      const verifyData: OTPverifyDTO = {
        email: "maxattempts@example.com",
        otp: "000000",
      };
      const correctHashedOtp = require("crypto")
        .createHash("sha256")
        .update("123456")
        .digest("hex");
      const mockUser = createMockUserDocument({
        email: verifyData.email,
        resetOtp: {
          otpHash: correctHashedOtp,
          expiresAt: new Date(Date.now() + 60 * 1000),
          attempts: 5,
        },
      });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.verifyOTP(verifyData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Max OTP attempts reached");
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.resetOtp).toBeUndefined();
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const resetData: ResetPasswordDTO = {
        email: "reset@example.com",
        password: "NewPassword123!",
      };
      const mockUser = createMockUserDocument({
        email: resetData.email,
        resetOtp: {
          otpHash: "somehash",
          expiresAt: new Date(),
          attempts: 0,
        },
      });

      mockAuthRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.resetPassword(resetData);

      expect(result.success).toBe(true);
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(resetData.email);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockUser.password).toBe(resetData.password);
      expect(mockUser.resetOtp).toBeUndefined();
    });

    it("should return an error if user does not exist", async () => {
      const resetData: ResetPasswordDTO = {
        email: "nonexistent@example.com",
        password: "NewPassword123!",
      };
      mockAuthRepo.findByEmail.mockResolvedValue(null);

      const result = await service.resetPassword(resetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid request");
      expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith(resetData.email);
    });
  });

  describe("updateLastLogin", () => {
    it("should call authRepo.updateLastLogin", async () => {
      const userId = new Types.ObjectId().toHexString();
      const lastLogin = new Date();

      await service.updateLastLogin(userId, lastLogin);

      expect(mockAuthRepo.updateLastLogin).toHaveBeenCalledWith(
        userId,
        lastLogin
      );
    });

    it("should not throw an error if authRepo.updateLastLogin fails", async () => {
      const userId = new Types.ObjectId().toHexString();
      const lastLogin = new Date();

      // Spy on console.error and provide a mock implementation to suppress logs in test output
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockAuthRepo.updateLastLogin.mockRejectedValue(new Error("DB Error"));

      await expect(
        service.updateLastLogin(userId, lastLogin)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update last login:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
