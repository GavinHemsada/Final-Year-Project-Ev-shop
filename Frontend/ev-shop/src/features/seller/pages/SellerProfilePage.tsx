import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sellerService } from "../sellerService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";
import { UserIcon } from "@/assets/icons/icons";

interface SellerProfile {
  _id: string;
  user_id: {
    _id: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
  business_name?: string;
  license_number?: string;
  description?: string;
  website?: string;
  shop_logo?: string;
  rating?: number;
  total_reviews: number;
}

/**
 * A page for sellers to manage their profile information.
 */
export const SellerProfilePage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const { getUserID } = useAuth();
  const userId = getUserID();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    website: "",
  });

  // Fetch seller profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const response = await sellerService.getSellerProfile(userId);
        // handleResult unwraps the response, so response is directly the seller object
        const sellerData = response?.seller || response;
        if (sellerData?._id) {
          setProfile(sellerData);
          setFormData({
            business_name: sellerData.business_name || "",
            description: sellerData.description || "",
            website: sellerData.website || "",
          });
          // Set logo preview if exists
          if (sellerData.shop_logo) {
            setLogoPreview(
              `${import.meta.env.VITE_API_URL}${sellerData.shop_logo}`
            );
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch seller profile:", error);
        setAlert?.({
          id: Date.now(),
          title: "Error",
          message: "Failed to load seller profile",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, setAlert]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?._id) return;

    try {
      setIsSaving(true);
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("business_name", formData.business_name);
      if (formData.description) {
        formDataToSend.append("description", formData.description);
      }
      if (formData.website) {
        formDataToSend.append("website", formData.website);
      }
      if (selectedLogo) {
        formDataToSend.append("shop_logo", selectedLogo);
      }

      const response = await sellerService.updateSellerProfile(
        profile._id,
        formDataToSend
      );
      // handleResult unwraps the response
      const updatedSeller = response?.seller || response;
      if (updatedSeller) {
        setProfile(updatedSeller);
        setSelectedLogo(null);
        // Update logo preview if new logo was uploaded
        if (updatedSeller.shop_logo) {
          setLogoPreview(
            `${import.meta.env.VITE_API_URL}${updatedSeller.shop_logo}`
          );
        }
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Profile updated successfully!",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update profile";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Seller profile not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold dark:text-white">Seller Profile</h1>

      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 relative">
            {/* Shop Logo */}
            {logoPreview || profile.shop_logo ? (
              <img
                src={logoPreview || `${import.meta.env.VITE_API_URL}${profile.shop_logo}`}
                alt={profile.business_name || "Shop Logo"}
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : profile.user_id?.profile_image ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${profile.user_id.profile_image}`}
                alt={profile.business_name || "Seller"}
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile.business_name
                  ? profile.business_name.charAt(0).toUpperCase()
                  : profile.user_id?.name?.charAt(0).toUpperCase() || "S"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.business_name || "Business Name"}
            </h2>
            {profile.user_id?.name && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {profile.user_id.name}
              </p>
            )}
            {profile.user_id?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.user_id.email}
              </p>
            )}
            {profile.rating !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-500 text-lg">★</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({profile.total_reviews} reviews)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shop Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Shop logo preview"
                    className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900/50 dark:file:text-blue-300
                    dark:hover:file:bg-blue-900/70
                    cursor-pointer"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Upload a logo for your shop (JPG or PNG, max 5MB)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              required
              placeholder="Enter your business name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Describe your business, services, and what makes you unique..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://www.yourwebsite.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a valid URL starting with http:// or https://
            </p>
          </div>

          {/* Read-only fields */}
          {profile.license_number && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Number
              </label>
              <input
                type="text"
                value={profile.license_number}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                License number cannot be changed
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  business_name: profile.business_name || "",
                  description: profile.description || "",
                  website: profile.website || "",
                });
                setSelectedLogo(null);
                if (profile.shop_logo) {
                  setLogoPreview(
                    `${import.meta.env.VITE_API_URL}${profile.shop_logo}`
                  );
                } else {
                  setLogoPreview(null);
                }
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerProfilePage;

