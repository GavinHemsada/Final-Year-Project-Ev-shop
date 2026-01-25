import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, CloseIcon } from "@/assets/icons/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { PageLoader } from "@/components/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useToast } from "@/context/ToastContext";

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
  files: yup.mixed().optional(),
});

interface ApplicationFormData {
  full_name: string;
  age: number;
  employment_status: string;
  monthly_income: number;
  requested_amount: number;
  repayment_period_months: number;
  message_text?: string;
  files?: File[] | null;
}

// Application Form Modal Component
const ApplicationModal: React.FC<{
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => void;
  isLoading: boolean;
}> = ({ product, isOpen, onClose, onSubmit, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(applicationSchema) as any,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFileError("");

    if (files) {
      // Validate file count
      if (files.length > 2) {
        setFileError("Maximum 2 files allowed");
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFiles(files);
    } else {
      setSelectedFiles(null);
    }
  };

  const handleFormSubmit = (data: any) => {
    // Convert FileList to Array BEFORE passing (FileList doesn't serialize through React callbacks)
    let filesArray: File[] = [];
    if (selectedFiles && selectedFiles.length > 0) {
      filesArray = Array.from(selectedFiles);
    }
    const formDataWithFiles: ApplicationFormData = {
      ...data,
      files: filesArray.length > 0 ? filesArray : null,
    };
    onSubmit(formDataWithFiles);
    // Reset form and file state AFTER submission
    reset();
    setSelectedFiles(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            Apply for {product?.product_name}
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
          className="p-6 space-y-6"
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Upload NIC/Passport and one income proof document (salary slip or bank statement). Max 2 files. PDF or image formats only.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf,.doc,.docx,.jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-200"
            />
            {(fileError || errors.files) && (
              <p className="mt-1 text-sm text-red-600">
                {fileError || String(errors.files?.message || "")}
              </p>
            )}
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {selectedFiles.length} file(s) selected:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {Array.from(selectedFiles).map(
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
              {isLoading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FinancingApplicationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const userID = useAppSelector(selectUserId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === "object" && "message" in response) {
          console.error("Error fetching products:", response.message);
          return [];
        }
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

  const products = productsData || [];

  // Mutation for submitting application
  const submitApplicationMutation = useMutation({
    mutationFn: async (formData: ApplicationFormData) => {
      if (!userID || !selectedProduct) {
        throw new Error("User ID or product not found");
      }

      const data = new FormData();
      data.append("user_id", userID);
      data.append("product_id", selectedProduct._id);
      // Include order ID if available
      if (orderId) {
        data.append("order_id", orderId);
      }
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

      // Append files if any (formData.files is now File[] or null)
      if (
        formData.files &&
        Array.isArray(formData.files) &&
        formData.files.length > 0
      ) {
        formData.files.forEach((file: File) => {
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
      showToast({
        text: "Your financing application has been submitted successfully!",
        type: "success",
      });
      // Navigate back to orders page after successful submission
      // navigate("/user/dashboard");
    },
    onError: (error: any) => {
      showToast({
        text:
          error?.response?.data?.message ||
          "Failed to submit application. Please try again.",
        type: "error",
      });
    },
  });

  const handleApplyNow = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmitApplication = (data: ApplicationFormData) => {
    submitApplicationMutation.mutate(data);
  };

  if (productsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <button
          onClick={() => {
            navigate("/user/dashboard");
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          Apply for Financing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Select a financing option and apply for your lease
        </p>

        {productsError ? (
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
            <p className="text-red-500 text-center py-8">
              Failed to load financing products. Please try again later.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              No active financing products available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product: any) => {
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
                    onClick={() => handleApplyNow(product)}
                    className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Apply for Loan
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Application Modal */}
        {selectedProduct && (
          <ApplicationModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmitApplication}
            isLoading={submitApplicationMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default FinancingApplicationPage;
