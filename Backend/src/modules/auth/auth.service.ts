import { IAuthRepository } from "./auth.repository";
import {
  RegisterDto,
  LoginDTO,
  ForgetPasswordDTO,
  OTPverifyDTO,
  ResetPasswordDTO,
} from "./auth.dto";
import { sendEmail } from "../../shared/utils/Email.util";
import crypto from "crypto";

/**
 * Defines the interface for the authentication service, outlining the methods for handling all authentication-related business logic.
 */
export interface IAuthService {
  /**
   * Registers a new user.
   * @param data - The registration data transfer object containing email and password.
   * @returns A promise that resolves to an object indicating success or failure, including user data or an error message.
   */
  register(
    data: RegisterDto
  ): Promise<{ success: boolean; user?: any; error?: string }>;
  /**
   * Logs in an existing user.
   * @param data - The login data transfer object containing email and password.
   * @returns A promise that resolves to an object indicating success or failure, including user data or an error message.
   */
  login(
    data: LoginDTO
  ): Promise<{ success: boolean; user?: any; error?: string }>;
  /**
   * Handles user login via an OAuth provider (e.g., Google, Facebook).
   * It finds an existing user by email or creates a new one if they don't exist.
   * @param email - The user's email provided by the OAuth provider.
   * @param name - The user's name provided by the OAuth provider.
   * @returns A promise that resolves to an object indicating success or failure, including user data or an error message.
   */
  oauthLogin(
    email: string,
    name: string
  ): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }>;
  /**
   * Checks if a user account has a password set. This is useful for differentiating
   * between users who registered with a password and those who signed up via OAuth.
   * @param email - The email of the user to check.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  checkPassword(email: string): Promise<{ success: boolean; error?: string }>;
  /**
   * Initiates the password reset process for a user.
   * Generates an OTP, saves its hash to the user record, and sends it via email.
   * @param data - The forget password DTO containing the user's email.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  forgetPassword(
    data: ForgetPasswordDTO
  ): Promise<{ success: boolean; error?: string }>;
  /**
   * Verifies the OTP provided by the user.
   * @param data - The OTP verification DTO containing the email and OTP.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  verifyOTP(data: OTPverifyDTO): Promise<{ success: boolean; error?: string }>;
  /**
   * Resets the user's password after successful OTP verification.
   * @param data - The reset password DTO containing the email and new password.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  resetPassword(
    data: ResetPasswordDTO
  ): Promise<{ success: boolean; error?: string }>;
  /**
   * Updates the `last_login` timestamp for a user.
   * @param userId - The ID of the user.
   * @param lastLogin - The date of the last login.
   * @returns A promise that resolves when the operation is complete.
   */
  updateLastLogin(userId: string, lastLogin: Date): Promise<void>;
}

/**
 * Factory function to create an instance of the authentication service.
 * It encapsulates all business logic for authentication, relying on the provided repository for data access.
 *
 * @param authRepo - The authentication repository for database interactions.
 * @returns An implementation of the IAuthService interface.
 */
export function authService(authRepo: IAuthRepository): IAuthService {
  // Maximum number of incorrect OTP attempts before the OTP is invalidated.
  const MAX_OTP_ATTEMPTS = 5;
  // OTP validity duration in minutes, sourced from environment variables with a default fallback.
  const OTP_EXPIRES_MIN = +(process.env.OTP_EXPIRES_MIN || 10);

  /**
   * Hashes a plain-text OTP using SHA256 for secure storage.
   * @param otp - The plain-text OTP string.
   * @returns The hex-encoded hash of the OTP.
   */
  const hashOtp = (otp: string): string => {
    return crypto.createHash("sha256").update(otp).digest("hex");
  };

  return {
    /**
     * Handles user registration. Checks if a user with the given email already exists
     * before creating a new user record.
     */
    register: async (data: RegisterDto) => {
      try {
        const { email, password } = data;
        const existingUser = await authRepo.findByEmail(email);
        if (existingUser) {
          return { success: false, error: "User already exists" };
        }
        const newUser = await authRepo.save(email, password);
        return { success: true, user: newUser };
      } catch (err) {
        return { success: false, error: "Registration failed" };
      }
    },
    /**
     * Handles user login by validating credentials against the repository.
     */
    login: async (data: LoginDTO) => {
      try {
        const { email, password } = data;
        const user = await authRepo.findUser(email, password);
        if (!user) {
          return { success: false, error: "Invalid credentials" };
        }
        return { success: true, user };
      } catch (err) {
        return { success: false, error: "Login failed" };
      }
    },
    /**
     * Handles OAuth (social) logins by finding an existing user or creating a new one.
     */
    oauthLogin: async (email: string, name: string) => {
      try {
        const user = await authRepo.findOrCreate(email, name);
        if (!user) {
          return { success: false, error: "OAuth login failed" };
        }
        return { success: true, user };
      } catch (err) {
        return { success: false, error: "OAuth login failed" };
      }
    },
    /**
     * Checks if a password is set for a user account, which helps in UI flows
     * to distinguish between OAuth-only users and those with local credentials.
     */
    checkPassword: async (email: string) => {
      try {
        const checkpass = await authRepo.checkPassword(email);
        if (!checkpass) return { success: false, error: "Password not set" };
        return { success: true };
      } catch (err) {
        return { success: false, error: "Password check failed" };
      }
    },
    /**
     * Manages the "forget password" flow by generating and sending an OTP to the user's email.
     * The hashed OTP, its expiration, and attempt count are stored in the user's record.
     */
    forgetPassword: async (data: ForgetPasswordDTO) => {
      try {
        const { email } = data;
        const user = await authRepo.findByEmail(email);
        if (!user) {
          return {
            success: false,
            error: "User with this email does not exist",
          };
        }
        // Generate a 6-digit numeric OTP.
        const otp = Array.from({ length: 6 }, () =>
          Math.floor(Math.random() * 10)
        ).join("");

        const otpHash = hashOtp(otp);

        user.resetOtp = {
          otpHash,
          expiresAt: new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000),
          attempts: 0,
        };
        await user.save();

        const subject = "🔐 Your OTP Code - EV Shop";
        const text = `Your OTP code is ${otp}. It is valid for ${OTP_EXPIRES_MIN} minutes. Please do not share this code with anyone.`;
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f7fa;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-container {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              border: 2px dashed #667eea;
            }
            .otp-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              color: #667eea;
              letter-spacing: 8px;
              margin: 15px 0;
              font-family: 'Courier New', monospace;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            }
            .otp-validity {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            .timer-icon {
              display: inline-block;
              font-size: 18px;
              margin-right: 5px;
            }
            .security-notice {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .security-notice p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .security-tips {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .security-tips h3 {
              margin: 0 0 15px 0;
              font-size: 16px;
              color: #333;
            }
            .security-tips ul {
              margin: 0;
              padding-left: 20px;
            }
            .security-tips li {
              color: #555;
              font-size: 14px;
              margin: 8px 0;
              line-height: 1.5;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 5px 0;
            }
            .footer strong {
              color: #495057;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <h1>🔐 Verification Code</h1>
              <p>Secure your account with this one-time password</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hello,
              </div>

              <div class="message">
                You've requested to reset your password for your <strong>EV Shop</strong> account. 
                Please use the verification code below to proceed with resetting your password.
              </div>

              <!-- OTP Display -->
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-validity">
                  <span class="timer-icon">⏱️</span>
                  This code will expire in <strong>${OTP_EXPIRES_MIN} minutes</strong>
                </div>
              </div>

              <!-- Security Warning -->
              <div class="security-notice">
                <p><strong>⚠️ Security Alert:</strong> Never share this code with anyone. EV Shop staff will never ask for your verification code.</p>
              </div>

              <!-- Security Tips -->
              <div class="security-tips">
                <h3>🛡️ Security Tips</h3>
                <ul>
                  <li>This code is valid for only ${OTP_EXPIRES_MIN} minutes</li>
                  <li>You have ${MAX_OTP_ATTEMPTS} attempts to enter the correct code</li>
                  <li>If you didn't request this code, please ignore this email</li>
                  <li>Make sure you're on the official EV Shop website</li>
                </ul>
              </div>

              <div class="message">
                If you didn't request a password reset, please ignore this email or contact our support team 
                if you have concerns about your account security.
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>EV Shop</strong></p>
              <p>Your trusted partner for electric vehicles</p>
              <p style="margin-top: 15px; font-size: 12px;">
                This is an automated security email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

        const mailResponse = await sendEmail(email, subject, text, html);
        if (!mailResponse) {
          return { success: false, error: "Failed to send OTP email" };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: "Forget password process failed" };
      }
    },
    /**
     * Verifies the provided OTP against the stored hash. It enforces expiration time
     * and a maximum number of attempts to prevent brute-force attacks.
     * The OTP data is cleared from the user record upon success or after too many failed attempts.
     */
    verifyOTP: async (data: OTPverifyDTO) => {
      try {
        const { email, otp } = data;
        const user = await authRepo.findByEmail(email);
        if (!user || !user.resetOtp) {
          return { success: false, error: "Invalid request" };
        }
        // Check if OTP has expired.
        if (new Date() > user.resetOtp.expiresAt) {
          user.resetOtp = undefined;
          await user.save();
          return { success: false, error: "OTP expired" };
        }
        // Check if max attempts have been reached.
        if (user.resetOtp.attempts >= MAX_OTP_ATTEMPTS) {
          user.resetOtp = undefined;
          await user.save();
          return { success: false, error: "Max OTP attempts reached" };
        }
        // Compare the provided OTP hash with the stored hash.
        if (hashOtp(otp) !== user.resetOtp.otpHash) {
          user.resetOtp.attempts += 1;
          if (user.resetOtp.attempts >= MAX_OTP_ATTEMPTS) {
            user.resetOtp = undefined;
          }
          await user.save();
          return { success: false, error: "Invalid OTP" };
        }
        // On success, clear the OTP data.
        user.resetOtp = undefined;
        await user.save();
        return { success: true };
      } catch (err) {
        return { success: false, error: "Verify OTP process failed" };
      }
    },
    /**
     * Finalizes the password reset process by updating the user's password in the database.
     */
    resetPassword: async (data: ResetPasswordDTO) => {
      try {
        const { email, password } = data;
        const user = await authRepo.findByEmail(email);
        if (!user) {
          return { success: false, error: "Invalid request" };
        }
        user.password = password;
        user.resetOtp = undefined;
        await user.save();
        return { success: true };
      } catch (err) {
        return { success: false, error: "Reset password process failed" };
      }
    },
    /**
     * Updates the last login timestamp for a user. This is a fire-and-forget operation from the controller's perspective.
     */
    updateLastLogin: async (userId: string, lastLogin: Date) => {
      try {
        await authRepo.updateLastLogin(userId, lastLogin);
      } catch (err) {
        console.error("Failed to update last login:", err);
      }
    }
  };
}
