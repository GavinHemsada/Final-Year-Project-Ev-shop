import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sellerService } from "../sellerService";
import type { AlertProps, SellerProfile } from "@/types";
import { Loader, PageLoader } from "@/components/Loader";
import { Camera } from "lucide-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

/**
 * A page for sellers to manage their profile information.
 */
export const SellerProfilePage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const { getUserID } = useAuth();
  const queryClient = useQueryClient();
  const userId = getUserID();
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isChanged, setIsChanged] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    website: "",
  });

  // Fetch seller profile using React Query
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<SellerProfile | null>({
    queryKey: queryKeys.sellerProfile(userId!),
    queryFn: async () => {
      if (!userId) return null;
      const response = await sellerService.getSellerProfile(userId);
      return response?.seller || response;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating the profile
  const updateProfileMutation = useMutation({
    mutationFn: ({
      profileId,
      formData,
    }: {
      profileId: string;
      formData: FormData;
    }) => sellerService.updateSellerProfile(profileId, formData),
    onSuccess: (data) => {
      const updatedSeller = data?.seller || data;
      queryClient.setQueryData(
        queryKeys.sellerProfile(userId!),
        updatedSeller
      );
      const id = profile?._id;
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sellerProfile(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      setSelectedLogo(null);
      setIsChanged(false);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Profile updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update profile";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    },
  });

  // Effect to sync form data when profile is loaded or changed
  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        description: profile.description || "",
        website: profile.website || "",
      });
      if (profile.shop_logo) {
        setLogoPreview(`${import.meta.env.VITE_API_URL}${profile.shop_logo}`);
      }
      // Reset change tracking when new data is loaded
      setIsChanged(false);
    }
  }, [profile]);

  // Show error alert if query fails
  useEffect(() => {
    if (error) {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load seller profile",
        type: "error",
      });
    }
  }, [error, setAlert]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      setIsChanged(true);
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

    updateProfileMutation.mutate({
      profileId: profile._id,
      formData: formDataToSend,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <PageLoader />
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

  const apiURL = import.meta.env.VITE_API_URL;

  return (
    <div className="bg-white p-8 rounded-xl shadow-md max-w-6xl mx-auto dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">
        Seller Profile
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <div
              className="relative group h-24 w-24 rounded-full border-2 border-gray-200 shadow-md overflow-hidden cursor-pointer"
              onClick={() =>
                document.getElementById("shop-logo-upload")?.click()
              }
            >
              {logoPreview || profile.shop_logo ? (
                <img
                  src={logoPreview || `${apiURL}${profile.shop_logo}`}
                  alt="Shop Logo"
                  loading="lazy"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                  {profile.business_name
                    ? profile.business_name
                        .split(" ")
                        .map((n: string) => n[0]?.toUpperCase())
                        .slice(0, 2)
                        .join("")
                    : profile.user_id?.name
                    ? profile.user_id.name
                        .split(" ")
                        .map((n: string) => n[0]?.toUpperCase())
                        .slice(0, 2)
                        .join("")
                    : "S"}
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <Camera className="text-gray-200" />
              </div>
            </div>

            <input
              id="shop-logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold dark:text-white">
              {profile.business_name || "Business Name"}
            </h2>
            {profile.user_id?.name && (
              <p className="text-gray-500 dark:text-gray-400">
                {profile.user_id.name}
              </p>
            )}
            {profile.user_id?.email && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => {
              setFormData({ ...formData, business_name: e.target.value });
              setIsChanged(true);
            }}
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
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setIsChanged(true);
            }}
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
            onChange={(e) => {
              setFormData({ ...formData, website: e.target.value });
              setIsChanged(true);
            }}
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

        {/* --- Submit Button --- */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isChanged || updateProfileMutation.isPending}
            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 ${
              isChanged
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                : "bg-gray-400 text-gray-200 cursor-not-allowed dark:bg-gray-600"
            }`}
          >
            {updateProfileMutation.isPending ? (
              <Loader size={10} color="#fff" />
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerProfilePage;