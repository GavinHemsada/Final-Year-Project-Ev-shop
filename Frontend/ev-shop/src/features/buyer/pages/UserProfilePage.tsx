import React, { useState, useEffect } from "react";
import type { User } from "@/types";
import { Camera, AlertTriangle, X } from "lucide-react";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import type { AlertProps } from "@/types";
import { useNavigate } from "react-router-dom";

const apiURL = import.meta.env.VITE_API_URL;

type ProfileFormData = {
  name: string;
  phone: string;
  date_of_birth: string; // use string instead of Date
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
};

const profileSchema = yup.object({
  name: yup.string().required("Full name is required."),
  phone: yup
    .string()
    .matches(/^\+?[0-9\s]{10,15}$/, "Please enter a valid phone number.")
    .nullable()
    .default(""),
  date_of_birth: yup
    .string()
    .test("not-future", "Date of birth cannot be in the future", (value) => {
      if (!value) return true;
      return new Date(value) <= new Date();
    })
    .default(""),
  address: yup
    .object({
      street: yup.string().required("Street is required."),
      city: yup.string().required("City is required."),
      state: yup.string().required("State / Province is required."),
      zipCode: yup
        .string()
        .matches(/^\d{5}(?:[-\s]\d{4})?$/, "Please enter a valid postal code.")
        .required("ZIP / Postal Code is required."),
      country: yup.string().required("Country is required."),
    })
    .required(),
});

const UserProfile: React.FC<{
  user: User;
  checkPassword: boolean;
  setAlert?: (alert: AlertProps | null) => void;
}> = React.memo(({ user, setAlert, checkPassword }) => {
  const [email] = useState(user.email);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isChanged, setIsChanged] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const userID = useAppSelector(selectUserId);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema) as any,
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      date_of_birth: user?.date_of_birth
        ? user.date_of_birth.split("T")[0]
        : "",
      address: {
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        zipCode: user.address?.zipCode || "",
        country: user.address?.country || "",
      },
    },
  });
  const queryClient = useQueryClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsChanged(true);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const updateUserMutation = useMutation({
    mutationFn: (formData: FormData) =>
      buyerService.updateUserProfile(userID!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile(userID!),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userID!) });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Successfully Update uer details",
        type: "success",
      });
    },
    onError: () => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to Update User Detailsr",
        type: "error",
      });
    },
  });

  // Submit form data
  const onSubmit = async (data: ProfileFormData) => {
    if (!userID) throw new Error("User ID not found");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("date_of_birth", data.date_of_birth);
    Object.entries(data.address).forEach(([key, value]) => {
      formData.append(`address[${key}]`, value);
    });

    if (selectedFile) {
      formData.append("profile_image", selectedFile);
    }
    updateUserMutation.mutate(formData);
  };

  // Watch any form value change to enable button
  useEffect(() => {
    const subscription = watch(() => setIsChanged(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  const handlePasswordReset = () => {
    navigate("/auth/forgot-password");
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md max-w-6xl mx-auto dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      {/* Warning Banner */}
      {checkPassword && showWarning && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg relative">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                Password Not Set
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                Please add a password to secure your account.
              </p>
              <button
                onClick={handlePasswordReset}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
              >
                Set Password Now
              </button>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 dark:text-white">My Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <div
              className="relative group h-24 w-24 rounded-full border-2 border-gray-200 shadow-md overflow-hidden cursor-pointer"
              onClick={() =>
                document.getElementById("profile-image-upload")?.click()
              }
            >
              {imagePreview || user.profile_image ? (
                <img
                  src={imagePreview || `${apiURL}${user.profile_image}`}
                  alt="User Avatar"
                  loading="lazy"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-400 font-semibold text-4xl">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n: string) => n[0]?.toUpperCase())
                        .slice(0, 2)
                        .join("")
                    : "?"}
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <Camera className="text-gray-200" />
              </div>
            </div>

            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold dark:text-white">
              {user.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>

        {/* --- Profile Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("name")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              disabled={isSubmitting}
              {...register("phone")}
              placeholder="+94 77 123 4567"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth
            </label>
            <input
              type="date"
              disabled={isSubmitting}
              {...register("date_of_birth")}
              className="dark:[&::-webkit-calendar-picker-indicator]:invert mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-xs text-red-500">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>
        </div>

        {/* --- Address Section --- */}
        <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            Address
          </legend>
          <div className="space-y-4">
            {(
              [
                ["street", "Street"],
                ["city", "City"],
                ["state", "State / Province"],
                ["zipCode", "ZIP / Postal Code"],
                ["country", "Country"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  {...register(`address.${key}` as const)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.address?.[key] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.address[key]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {/* --- Submit Button --- */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isChanged || isSubmitting}
            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 ${
              isChanged
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                : "bg-gray-400 text-gray-200 cursor-not-allowed dark:bg-gray-600"
            }`}
          >
            {isSubmitting ? (
              <Loader size={10} color="#fff" />
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

export default UserProfile;
