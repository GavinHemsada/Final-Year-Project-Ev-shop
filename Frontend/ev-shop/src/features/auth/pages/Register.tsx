import { useState, useEffect } from "react";
import GoogleIcon from "@/assets/icons/google-icon.svg";
import FacebookIcon from "@/assets/icons/facebook-icon.svg";
import SignUp from "@/assets/auth_images/sign_up_img.png";
import Logo from "@/assets/logo_no-bg.png";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import Label from "@/components/Label";
import Input from "@/components/inputFiled";
import { Loader, PageLoader } from "@/components/Loader";
import { Alert } from "@/components/MessageAlert";

// Import authentication context and related types.
import { useOAuthHandler } from "@/hooks/useOAuthHandler";

// Import authentication service functions for API calls.
import { authService } from "../authService";

// Import from validation
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const registerSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .email("Invalid email format"),

    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),

    confirmPassword: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password"), ""], "Passwords must match"),
  })
  .required();

// The main component for the registration page.
const RegisterPage = () => {
  // State to manage the loading status during async operations (e.g., API calls).
  const [loading, setLoading] = useState(true);
  // State to toggle password visibility.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // State for displaying feedback messages (e.g., success or error alerts).
  const [message, setMessage] = useState<{
    id: number;
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const handlePageLoad = () => setLoading(false);

    if (document.readyState === "complete") {
      setLoading(false);
    } else {
      window.addEventListener("load", handlePageLoad);
    }

    return () => window.removeEventListener("load", handlePageLoad);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });


  // This effect sets a timer to clear any displayed message after 5 seconds.
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Helper function to show a temporary message to the user.
  const showMessage = (title: string, message: string, type: any) => {
    setMessage({ id: Date.now(),title, message, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const { handleOAuth } = useOAuthHandler("register", showMessage);

  // Handles the form submission for standard email/password registration.
  const onSubmit = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const response = await authService.register(
        data.email,
        data.password,
        data.confirmPassword
      );
      showMessage("Registration Successful", response.message, "success");
      // Redirect to the login page after a successful registration.
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 3000);
    } catch (err: any) {
      if (err.response) {
        showMessage(
          "Registration failed",
          err.response.data.message,
          "error"
        );
      } else if (err.request) {
        showMessage("Registration failed", "No response from server", "error");
      }
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="relative flex flex-col md:flex-row h-screen w-full bg-gray-100 md:bg-black font-sans overflow-hidden">
      {/* Left Panel: Image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${SignUp})` }}
      />

      {/* Right Panel: Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white md:bg-black p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="relative w-full max-w-md p-6 sm:p-8 space-y-3 bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Logo */}
          <img src={Logo} alt="Logo" className="w-20 h-20 mx-auto" />
          {/* Message display area for success/error alerts */}
          <Alert 
            alert={message ? {
              title: message.title,
              message: message.message,
              type: message.type,
            } : null} 
            position="center" 
            container={true}
          />

          {/* Form Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Create an Account
            </h1>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth("google", setLoading)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <img src={GoogleIcon} alt="Google Icon" className="w-5 h-5" />
              Sign up with Google
            </button>
            <button
              onClick={() => handleOAuth("facebook", setLoading)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <img src={FacebookIcon} alt="Facebook Icon" className="w-5 h-5" />
              Sign up with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-sm font-medium text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <div>
              {/* Email Input Field */}
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 mt-1 text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field with toggle */}
            <div className="relative">
              {/* Password Input Field */}
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                autoComplete="new-password"
              />
              {/* Password visibility toggle button */}
              <button
                type="button"
                className="absolute right-3 top-[35px] text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {errors.password && (
                <p className="text-red-500 mt-1 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password field with toggle */}
            <div className="relative">
              {/* Confirm Password Input Field */}
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                autoComplete="new-password"
              />
              {/* Confirm password visibility toggle button */}
              <button
                type="button"
                className="absolute right-3 top-[35px] text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-500 mt-1 text-xs">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all
                ${
                  isSubmitting
                    ? "bg-transparent cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader size={10} color="#4f46e5" />
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          {/* Link to the login page */}
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;