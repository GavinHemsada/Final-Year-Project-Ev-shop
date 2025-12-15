import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId, setActiveRole, addNewRole } from "@/context/authSlice";
import { CloseIcon } from "@/assets/icons/icons";
import { buyerService } from "../buyerService";
import { Loader } from "@/components/Loader";
import { useNavigate } from "react-router-dom";
import type { AlertProps } from "@/types";
/**
 * A component for a "Become a Seller" registration form.
 * Renders as a modal overlay.
 */
const BecomeSellerPage: React.FC<{ onClose: () => void; setAlert?: (alert: AlertProps | null) => void }> = ({ onClose, setAlert }) => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);

  const [formData, setFormData] = useState({
    business_name: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    license_number: "",
    description: "",
    website: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const navigate = useNavigate();

  // Navigate to seller dashboard after Redux state updates
  useEffect(() => {
    if (shouldNavigate && successMessage) {
      const timer = setTimeout(async () => {
        // Set active role to seller before navigating
        await dispatch(setActiveRole("seller"));
        navigate("/seller/dashboard");
        setShouldNavigate(false); // Reset the flag
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, successMessage, navigate, dispatch]);
  /**
   * Handles changes for all form inputs.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required.";
    }

    if (!formData.street_address.trim()) {
      newErrors.street_address = "Street address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required.";
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = "Postal code is required.";
    } else if (!/^\d+$/.test(formData.postal_code.trim())) {
        // Simple numeric check for postal code, can be adjusted based on requirements
      newErrors.postal_code = "Postal code must be numeric.";
    }

    // Validate website URL if provided
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
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    const sellerData = {
      ...formData,
      user_id: userId,
    };
    console.log("Submitting seller application:", sellerData);

    try {
      await buyerService.becomeaSeller(sellerData);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Successfully register for new Seller",
        type: "success",
      });
      dispatch(addNewRole("seller"));
      setSuccessMessage("Application submitted successfully!");
      setShouldNavigate(true); // Trigger navigation via useEffect
      // Clear the form on success
      setFormData({
        business_name: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        license_number: "",
        description: "",
        website: "",
      });
    } catch (err: any) {
      console.log(err.response.data.message);
      setAlert?.({
        id: Date.now(),
        title: "Fail Registration",
        message: err?.response.data.message || "An unexpected error occurred. Please try again.",
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
      {/* --- MODAL CONTENT --- */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl relative flex flex-col animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- STICKY HEADER --- */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-8 py-5 text-center rounded-t-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={onClose}
            className="absolute top-5 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            aria-label="Close modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Become a Seller
          </h1>
          <p className="mt-2 text-md text-gray-600 dark:text-gray-300">
            Fill out the details below to register your business on our
            platform.
          </p>
        </div>

        {/* --- SCROLLABLE FORM --- */}
        <div className="px-8 py-6 overflow-y-auto max-h-[75vh]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Business Name */}
            <div>
              <label
                htmlFor="business_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                value={formData.business_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="e.g., Acme Auto Parts"
              />
              {errors.business_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.business_name}
                </p>
              )}
            </div>

             {/* Address Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="street_address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="street_address"
                  name="street_address"
                  type="text"
                  value={formData.street_address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="e.g., 123 Main St"
                />
                {errors.street_address && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.street_address}
                  </p>
                )}
              </div>

               {/* City */}
               <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., New York"
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.city}
                    </p>
                  )}
               </div>

                {/* State */}
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., NY"
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.state}
                    </p>
                  )}
                </div>

                {/* Postal Code */}
                 <div>
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    value={formData.postal_code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., 10001"
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.postal_code}
                    </p>
                  )}
                 </div>

                 {/* Country */}
                 <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., USA"
                  />
                  {errors.country && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.country}
                    </p>
                  )}
                 </div>
             </div>

            {/* License Number */}
            <div>
              <label
                htmlFor="license_number"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Business License Number
              </label>
              <input
                id="license_number"
                name="license_number"
                type="text"
                value={formData.license_number}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="e.g., 12345-ABC"
              />
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="https://www.yourbusiness.com"
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
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Briefly describe what your business sells or does..."
              />
            </div>

            {/* Alerts */}
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

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {isLoading ? (
                  <Loader size={10} color="#4f46e5" />
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeSellerPage;
