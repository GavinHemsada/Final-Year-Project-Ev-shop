import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  XCircleIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
  InfoIcon,
} from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { PageLoader } from "@/components/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useToast } from "@/context/ToastContext";
import { axiosPrivate } from "@/config/config";

const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        color: "text-green-500 dark:text-green-400",
        label: "Approved",
      };
    case "under_review":
      return {
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
        color: "text-yellow-500 dark:text-yellow-400",
        label: "Under Review",
      };
    case "pending":
      return {
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
        color: "text-yellow-500 dark:text-yellow-400",
        label: "Pending",
      };
    case "rejected":
      return {
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        color: "text-red-500 dark:text-red-400",
        label: "Rejected",
      };
    case "completed":
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        color: "text-green-500 dark:text-green-400",
        label: "Completed",
      };
    default:
      return {
        icon: <FileTextIcon className="h-5 w-5 text-gray-500" />,
        color: "text-gray-500 dark:text-gray-400",
        label: status,
      };
  }
};

// Helper function to format interest rate
const formatInterestRate = (min?: number, max?: number) => {
  if (min && max) {
    if (min === max) return `${min}%`;
    return `${min}% - ${max}%`;
  }
  if (min) return `From ${min}%`;
  if (max) return `Up to ${max}%`;
  return "Contact for rates";
};

// Helper function to format loan term
const formatLoanTerm = (minMonths?: number, maxMonths?: number) => {
  if (minMonths && maxMonths) {
    const minYears = Math.floor(minMonths / 12);
    const maxYears = Math.floor(maxMonths / 12);
    if (minYears === maxYears) {
      return `Up to ${maxYears} ${maxYears === 1 ? "year" : "years"}`;
    }
    return `${minYears} - ${maxYears} years`;
  }
  if (maxMonths) {
    const years = Math.floor(maxMonths / 12);
    return `Up to ${years} ${years === 1 ? "year" : "years"}`;
  }
  if (minMonths) {
    const years = Math.floor(minMonths / 12);
    return `From ${years} ${years === 1 ? "year" : "years"}`;
  }
  return "Flexible terms";
};

// Validation schema for financing application
const applicationSchema = yup.object({
  full_name: yup.string().required("Full name is required"),
  age: yup
    .number()
    .required("Age is required")
    .min(18, "You must be at least 18 years old")
    .integer("Age must be a whole number"),
  employment_status: yup.string().required("Employment status is required"),
  monthly_income: yup
    .number()
    .required("Monthly income is required")
    .min(0, "Monthly income must be positive"),
  requested_amount: yup
    .number()
    .required("Requested amount is required")
    .min(1, "Requested amount must be greater than 0"),
  repayment_period_months: yup
    .number()
    .required("Repayment period is required")
    .min(1, "Repayment period must be at least 1 month")
    .integer("Repayment period must be a whole number"),
  message_text: yup.string().optional(),
  files: yup
    .mixed<File[]>()
    .test("fileCount", "Maximum 2 files allowed", (value) => {
      if (!value || value.length === 0) return true;
      return value.length <= 2;
    })
    .optional(),
});

interface ApplicationFormData {
  full_name: string;
  age: number;
  employment_status: string;
  monthly_income: number;
  requested_amount: number;
  repayment_period_months: number;
  message_text?: string;
  files?: FileList | null;
}

// Application Form Modal Component
const ApplicationModal: React.FC<{
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => void;
  isLoading: boolean;
  application?: any; // For edit mode
  isEditMode?: boolean;
}> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  application,
  isEditMode = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(applicationSchema) as any,
    defaultValues:
      isEditMode && application?.application_data
        ? {
            full_name: application.application_data.full_name || "",
            age: application.application_data.age || "",
            employment_status:
              application.application_data.employment_status || "",
            monthly_income: application.application_data.monthly_income || "",
            requested_amount:
              application.application_data.requested_amount || "",
            repayment_period_months:
              application.application_data.repayment_period_months || "",
            message_text: application.message_text || "",
          }
        : undefined,
  });

  const selectedFiles = watch("files" as any);

  // Get existing documents from application
  const getExistingDocuments = () => {
    if (!isEditMode || !application?.application_data) return [];
    const appData = application.application_data;
    // Handle both Map and object formats
    if (typeof appData.get === "function") {
      return appData.get("additional_documents") || [];
    }
    return appData.additional_documents || [];
  };

  const existingDocuments = getExistingDocuments();

  const getFileUrl = (filePath: string) => {
    // Files are served from /uploads route (static files at root level, not under /api/v1)
    // The backend serves static files at /uploads, so we need to use the server root URL
    const apiBaseURL = axiosPrivate.defaults.baseURL || "";
    // Extract the server base URL (remove /api/v1 if present)
    // e.g., "http://localhost:3000/api/v1" -> "http://localhost:3000"
    const serverBaseURL = apiBaseURL.replace(/\/api\/v1\/?$/, "");
    // Remove leading slash from filePath if present, then add it back
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    // Remove trailing slash from serverBaseURL if present
    const cleanBaseURL = serverBaseURL.endsWith("/")
      ? serverBaseURL.slice(0, -1)
      : serverBaseURL;
    return `${cleanBaseURL}${cleanPath}`;
  };

  const handleViewDocument = (filePath: string) => {
    const url = getFileUrl(filePath);
    window.open(url, "_blank");
  };

  const handleDownloadDocument = (filePath: string) => {
    const url = getFileUrl(filePath);
    const link = document.createElement("a");
    link.href = url;
    link.download = filePath.split("/").pop() || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = (data: any) => {
    onSubmit(data as ApplicationFormData);
    if (!isEditMode) {
      reset();
    }
  };

  if (!isOpen) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold dark:text-white">
            {isEditMode
              ? "Edit Application"
              : `Apply for ${product?.product_name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("full_name")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your full legal name"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.full_name.message)}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("age", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your age"
              min="18"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.age.message)}
              </p>
            )}
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Employment Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("employment_status")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select employment status</option>
              <option value="Employed">Employed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
              <option value="Student">Student</option>
            </select>
            {errors.employment_status && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.employment_status.message)}
              </p>
            )}
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Income (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("monthly_income", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your monthly income"
              min="0"
              step="0.01"
            />
            {errors.monthly_income && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.monthly_income.message)}
              </p>
            )}
          </div>

          {/* Requested Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Requested Loan Amount (LKR){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("requested_amount", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter the loan amount you need"
              min="1"
              step="0.01"
            />
            {errors.requested_amount && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.requested_amount.message)}
              </p>
            )}
          </div>

          {/* Repayment Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repayment Period (Months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("repayment_period_months", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter desired repayment period in months"
              min="1"
            />
            {errors.repayment_period_months && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.repayment_period_months.message)}
              </p>
            )}
          </div>

          {/* Message (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              {...register("message_text")}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Any additional information you'd like to share..."
            />
            {errors.message_text && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.message_text.message)}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supporting Documents (Optional, Max 2 files)
            </label>

            {/* Show existing documents in edit mode */}
            {isEditMode && existingDocuments.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Documents:
                </p>
                <div className="space-y-2">
                  {existingDocuments.map((docPath: string, index: number) => {
                    const fileName =
                      docPath.split("/").pop() || `Document ${index + 1}`;
                    const fileExtension =
                      fileName.split(".").pop()?.toLowerCase() || "";
                    const isImage = ["jpg", "jpeg", "png", "gif"].includes(
                      fileExtension
                    );

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isImage && (
                            <button
                              type="button"
                              onClick={() => handleViewDocument(docPath)}
                              className="p-1.5 text-blue-600 rounded hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                              title="View Document"
                            >
                              <svg
                                className="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(docPath)}
                            className="p-1.5 text-green-600 rounded hover:bg-green-50 transition-colors dark:text-green-400 dark:hover:bg-green-900/20"
                            title="Download Document"
                          >
                            <svg
                              className="h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Upload new files to replace existing documents
                </p>
              </div>
            )}

            <input
              type="file"
              multiple
              accept=".pdf,application/pdf,.doc,.docx,.jpg,.jpeg,.png,image/jpeg,image/png"
              {...register("files" as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {(errors as any).files && (
              <p className="mt-1 text-sm text-red-600">
                {String((errors as any).files.message)}
              </p>
            )}
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  New file(s) selected:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {Array.from(selectedFiles as FileList).map(
                    (file: File, index: number) => (
                      <li key={index}>{file.name}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Submitting..."
                : isEditMode
                ? "Update Application"
                : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const FinancingPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const userID = useAppSelector(selectUserId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rejectionReasonModal, setRejectionReasonModal] = useState<{
    isOpen: boolean;
    application: any | null;
  }>({ isOpen: false, application: null });
  const [activeTab, setActiveTab] = useState<"products" | "applications">(
    "products"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch active financing products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["financingProducts"],
    queryFn: async () => {
      try {
        const response = await buyerService.getFinancingOptions();
        // The backend handleResult returns the products array directly (not wrapped)
        // So response is either:
        // - An array of products (success case)
        // - An object with message property (error case)
        if (Array.isArray(response)) {
          return response;
        }
        // If it's an error object with message
        if (response && typeof response === "object" && "message" in response) {
          console.error("Error fetching products:", response.message);
          return [];
        }
        // Fallback: if response has products property (shouldn't happen but just in case)
        if (
          response &&
          typeof response === "object" &&
          "products" in response
        ) {
          return Array.isArray(response.products) ? response.products : [];
        }
        return [];
      } catch (error) {
        console.error("Error fetching financing products:", error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  // Fetch user's financing applications
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: ["userFinancingApplications", userID],
    queryFn: async () => {
      if (!userID) return [];
      const response = await buyerService.getUserFinancingApplications(userID);
      // Backend unwraps response via handleResult, so it returns the applications array directly
      if (Array.isArray(response)) {
        return response;
      }
      // Fallback: handle wrapped response if backend changes
      if (
        response &&
        typeof response === "object" &&
        "applications" in response
      ) {
        return Array.isArray(response.applications)
          ? response.applications
          : [];
      }
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success &&
        "applications" in response
      ) {
        return Array.isArray(response.applications)
          ? response.applications
          : [];
      }
      return [];
    },
    enabled: !!userID,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  console.log(applicationsData);
  const products = productsData || [];
  const applications = applicationsData || [];

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.product_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "" ||
      product.product_type?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Mutation for submitting application
  const submitApplicationMutation = useMutation({
    mutationFn: async (formData: ApplicationFormData) => {
      if (!userID || !selectedProduct) {
        throw new Error("User ID or product not found");
      }

      const data = new FormData();
      data.append("user_id", userID);
      data.append("product_id", selectedProduct._id);
      data.append("message_text", formData.message_text || "");
      data.append(
        "application_data",
        JSON.stringify({
          full_name: formData.full_name,
          age: formData.age,
          employment_status: formData.employment_status,
          monthly_income: formData.monthly_income,
          requested_amount: formData.requested_amount,
          repayment_period_months: formData.repayment_period_months,
        })
      );

      // Append files if any
      if (formData.files && formData.files.length > 0) {
        Array.from(formData.files).forEach((file) => {
          data.append("files", file);
        });
      }

      return buyerService.submitFinancingApplication(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userFinancingApplications", userID],
      });
      setIsModalOpen(false);
      setSelectedProduct(null);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Your financing application has been submitted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Failed to submit application. Please try again.",
        type: "error",
      });
    },
  });

  const handleSubmitApplication = (data: ApplicationFormData) => {
    if (isEditMode && selectedApplication) {
      updateApplicationMutation.mutate({
        applicationId: selectedApplication._id,
        data,
      });
    } else {
      submitApplicationMutation.mutate(data);
    }
  };

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: ApplicationFormData;
    }) => {
      if (!userID || !selectedProduct) {
        throw new Error("User ID or product not found");
      }

      const formData = new FormData();
      formData.append("user_id", userID);
      formData.append("product_id", selectedProduct._id);
      formData.append("message_text", data.message_text || "");
      formData.append(
        "application_data",
        JSON.stringify({
          full_name: data.full_name,
          age: data.age,
          employment_status: data.employment_status,
          monthly_income: data.monthly_income,
          requested_amount: data.requested_amount,
          repayment_period_months: data.repayment_period_months,
        })
      );

      // Append files if any
      if (data.files && data.files.length > 0) {
        Array.from(data.files).forEach((file) => {
          formData.append("files", file);
        });
      }

      return buyerService.updateFinancingApplication(applicationId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userFinancingApplications", userID],
      });
      setIsModalOpen(false);
      setSelectedProduct(null);
      setSelectedApplication(null);
      setIsEditMode(false);
      showToast({
        text: "Application updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to update application",
        type: "error",
      });
    },
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return buyerService.deleteFinancingApplication(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userFinancingApplications", userID],
      });
      setDeleteConfirmId(null);
      showToast({
        text: "Application deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to delete application",
        type: "error",
      });
    },
  });

  const handleEdit = (application: any) => {
    setSelectedApplication(application);
    setSelectedProduct(application.product_id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (applicationId: string) => {
    setDeleteConfirmId(applicationId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteApplicationMutation.mutate(deleteConfirmId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setSelectedApplication(null);
    setIsEditMode(false);
  };

  if (productsLoading || applicationsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-12">
      {/* Tab Navigation */}
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <div className="mb-6">
          <h1 className="text-3xl font-bold dark:text-white mb-2">Financing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore financing options and manage your applications.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "products"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Available Options
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "applications"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            My Applications
            {applications.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                {applications.length}
              </span>
            )}
          </button>
        </div>

        {/* Section for Available Financing Options */}
        {activeTab === "products" && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                    placeholder="Search by Item Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="md:w-1/4">
                <select
                  className="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Auto Loan">Auto Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Lease">Lease</option>
                </select>
              </div>
            </div>

            {productsError ? (
              <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
                <p className="text-red-500 text-center py-8">
                  Failed to load financing products. Please try again later.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
                <p className="text-gray-500 text-center py-8 dark:text-gray-400">
                  No products found matching your search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => {
                  const institution = product.institution_id;
                  const institutionName =
                    institution?.name || "Unknown Institution";
                  const institutionLogo =
                    institution?.logo ||
                    "https://placehold.co/40x40/3498db/ffffff?text=" +
                      institutionName.charAt(0);

                  return (
                    <div
                      key={product._id}
                      className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <img
                            src={institutionLogo}
                            alt={`${institutionName} logo`}
                            className="h-10 w-10 rounded-full object-cover bg-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/40x40/3498db/ffffff?text=${institutionName.charAt(
                                0
                              )}`;
                            }}
                          />
                          <div>
                            <h3 className="text-xl font-bold dark:text-white">
                              {product.product_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              by {institutionName}
                            </p>
                          </div>
                        </div>
                        {/* Product Type Badge */}
                        <div className="mb-3">
                           <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                            {product.product_type || "Generic Loan"}
                          </span>
                        </div>
                        <p className="text-gray-600 my-3 dark:text-gray-300">
                          {product.description || "No description available."}
                        </p>
                        <div className="text-sm space-y-2 mt-4 pt-4 border-t dark:border-gray-700">
                          <p className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              Interest Rate:
                            </span>
                            <span className="font-semibold dark:text-white">
                              {formatInterestRate(
                                product.interest_rate_min,
                                product.interest_rate_max
                              )}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              Loan Term:
                            </span>
                            <span className="font-semibold dark:text-white">
                              {formatLoanTerm(
                                product.term_months_min,
                                product.term_months_max
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="w-full mt-6 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold shadow-sm"
                      >
                        Apply Now
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section for User's Finance Applications */}
        {activeTab === "applications" && (
          <div className="mt-6">
            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
              {applications.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app: any) => {
                    const statusInfo = getStatusInfo(app.status || "pending");
                    const product = app.product_id;
                    const institution = product?.institution_id;
                    const submittedDate = app.createdAt || app.submitted_date;
                    return (
                      <li
                        key={app._id}
                        className="py-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-lg dark:text-white">
                            {product?.product_name || "Unknown Product"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {institution?.name || "Unknown Institution"}{" "}
                            &middot; Submitted on{" "}
                            {submittedDate
                              ? new Date(submittedDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex items-center gap-2 ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            <span className="font-semibold">
                              {statusInfo.label}
                            </span>
                          </div>
                          {/* View Rejection Reason button - only show for rejected applications */}
                          {app.status?.toLowerCase() === "rejected" &&
                            app.rejection_reason && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRejectionReasonModal({
                                    isOpen: true,
                                    application: app,
                                  });
                                }}
                                className="p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                                title="View Rejection Reason"
                                aria-label="View Rejection Reason"
                              >
                                <InfoIcon className="h-5 w-5" />
                              </button>
                            )}
                          {/* Edit and Delete buttons - only show for pending applications */}
                          {(app.status?.toLowerCase() === "pending" ||
                            app.status?.toLowerCase() === "under_review") && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(app)}
                                className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                                title="Edit Application"
                                aria-label="Edit Application"
                              >
                                <EditIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(app._id)}
                                className="p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                                title="Delete Application"
                                aria-label="Delete Application"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : applicationsError ? (
                <p className="text-red-500 text-center py-8">
                  Failed to load your applications. Please try again later.
                </p>
              ) : (
                <p className="text-gray-500 text-center py-8 dark:text-gray-400">
                  You have not submitted any finance applications.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application Modal */}
      {selectedProduct && (
        <ApplicationModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitApplication}
          isLoading={
            isEditMode
              ? updateApplicationMutation.isPending
              : submitApplicationMutation.isPending
          }
          application={selectedApplication}
          isEditMode={isEditMode}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectionReasonModal.isOpen &&
        rejectionReasonModal.application &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
            onClick={() =>
              setRejectionReasonModal({ isOpen: false, application: null })
            }
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                  Application Rejected
                </h2>
                <button
                  onClick={() =>
                    setRejectionReasonModal({ isOpen: false, application: null })
                  }
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">Product:</span>{" "}
                  {rejectionReasonModal.application.product_id?.product_name ||
                    "Unknown Product"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">Institution:</span>{" "}
                  {rejectionReasonModal.application.product_id?.institution_id
                    ?.name ||
                    rejectionReasonModal.application.product_id?.institution_id
                      ?.business_name ||
                    "Unknown Institution"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Submitted:</span>{" "}
                  {rejectionReasonModal.application.createdAt ||
                  rejectionReasonModal.application.submitted_date
                    ? new Date(
                        rejectionReasonModal.application.createdAt ||
                          rejectionReasonModal.application.submitted_date
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Reason for Rejection:
                </h3>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {rejectionReasonModal.application.rejection_reason ||
                      "No reason provided."}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setRejectionReasonModal({ isOpen: false, application: null })
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">
                Delete Application
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this application? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={deleteApplicationMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteApplicationMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {deleteApplicationMutation.isPending
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FinancingPage;
