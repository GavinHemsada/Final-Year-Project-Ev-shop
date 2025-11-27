import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CloseIcon } from "@/assets/icons/icons";
import { buyerService } from "../buyerService";
import { Loader } from "@/components/Loader";
import { useNavigate } from "react-router-dom";
import type { AlertProps } from "@/types";
/**
 * A component for a "Register Financial Institution" form.
 * Renders as a modal overlay.
 */
const RegisterFinancialInstitutionPage: React.FC<{ onClose: () => void; setAlert?: (alert: AlertProps | null) => void }> = ({
  onClose,
  setAlert,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    website: "",
    contact_email: "",
    contact_phone: "",
  });

  const { getUserID, addnewRole, setActiveRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  /**
   * Handles changes for all form inputs.
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  /**
   * --- NEW: Validation logic ---
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Institution name is required.";
    }
    if (!formData.type.trim()) {
      newErrors.type = "Institution type is required.";
    }

    // Optional field validations
    if (
      formData.contact_email &&
      !/^\S+@\S+\.\S+$/.test(formData.contact_email)
    ) {
      newErrors.contact_email = "Please enter a valid email address.";
    }
    if (
      formData.contact_phone &&
      !/^\+?[0-9\s()-]{10,15}$/.test(formData.contact_phone)
    ) {
      newErrors.contact_phone = "Please enter a valid phone number.";
    }
    if (formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch (_) {
        newErrors.website =
          "Please enter a valid URL (e.g., https://example.com).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles the form submission.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return; // Stop submission if validation fails
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    // Construct the payload based on the DTO
    const institutionData = {
      ...formData,
      user_id: getUserID(), // Add the required user_id from context
    };

    try {
      await buyerService.becomeaFinancing(institutionData);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Successfully register for new Financial Institution",
        type: "success",
      });
      setFormData({
        name: "",
        type: "",
        description: "",
        website: "",
        contact_email: "",
        contact_phone: "",
      });
    } catch (err: any) {
      setAlert?.({
        id: Date.now(),
        title: "Fail Registration",
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    // --- MODAL OVERLAY ---
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex justify-center items-center p-4 sm:p-6 lg:p-8 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl relative flex flex-col animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- STICKY HEADER --- */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-5 text-center rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            aria-label="Close modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Register Financial Institution
          </h1>
          <p className="mt-2 text-md text-gray-600 dark:text-gray-300">
            Fill out the details below to register your institution.
          </p>
        </div>

        {/* --- FORM --- */}
        <div className="px-8 py-6 overflow-y-auto max-h-[80vh]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Institution Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., Global Finance Bank"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Institution Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Institution Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="" disabled>
                  Select a type
                </option>
                <option value="Bank">Bank</option>
                <option value="Credit Union">Credit Union</option>
                <option value="Fintech">Fintech</option>
                <option value="Lending Institution">Lending Institution</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{errors.type}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label
                htmlFor="contact_email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Contact Email (Optional)
              </label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., contact@institution.com"
              />
              {errors.contact_email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.contact_email}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label
                htmlFor="contact_phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Contact Phone (Optional)
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., +1 (555) 123-4567"
              />
              {errors.contact_phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.contact_phone}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Website (Optional)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="https://www.institution.com"
              />
              {errors.website && (
                <p className="mt-1 text-xs text-red-500">{errors.website}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Briefly describe the institution..."
              />
            </div>

            {/* --- FEEDBACK MESSAGES --- */}
            {errors.form && (
              <div
                className="px-4 py-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Error:</span> {errors.form}
              </div>
            )}

            {successMessage && (
              <div
                className="px-4 py-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Success:</span> {successMessage}
              </div>
            )}

            {/* --- SUBMIT BUTTON --- */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <Loader size={10} color="#4f46e5" />
                ) : (
                  "Register Institution"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterFinancialInstitutionPage;
