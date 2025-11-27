import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { EvListingFormData, AlertProps } from "@/types";
import { sellerService } from "../sellerService";
import { EvCheckIcon } from "@/assets/icons/icons";
import { FormSelectField } from "@/components/FormSelect";
import { FormInputField } from "@/components/FormInput";
import { StepContainer } from "@/components/StepContainer";
import { ListingType, VehicleCondition } from "@/types/enum";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/MessageAlert";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/Loader";

// Schema is slightly modified for editing
const EvListEditSchema = yup.object({
  // Step 1
  brand_id: yup.string().required("Brand is required"),
  category_id: yup.string().required("Category is required"),

  // Step 2
  model_name: yup.string().required("Model name is required"),
  year: yup
    .number()
    .typeError("Enter a valid year")
    .min(1900)
    .max(new Date().getFullYear() + 1, "Invalid year")
    .required("Year is required"),
  battery_capacity_kwh: yup
    .number()
    .typeError("Enter a valid battery capacity")
    .positive("Must be greater than 0")
    .required("Battery capacity is required"),
  range_km: yup
    .number()
    .typeError("Enter a valid range")
    .positive("Must be greater than 0")
    .required("Range is required"),
  charging_time_hours: yup
    .number()
    .typeError("Enter a valid charging time")
    .positive("Must be greater than 0")
    .required("Charging time is required"),
  motor_type: yup.string().required("Motor type is required"),
  seating_capacity: yup
    .number()
    .typeError("Enter a valid seating capacity")
    .positive()
    .required("Seating capacity is required"),
  price_range: yup.string().required("Price range is required"),
  specifications: yup
    .array()
    .of(yup.string())
    .min(1, "At least one specification is required") // Added min
    .required("Specifications are required"),
  features: yup
    .array()
    .of(yup.string())
    .min(1, "At least one feature is required") // Added min
    .required("Features are required"),

  // Step 3
  listing_type: yup.string().required("Listing type is required"),
  condition: yup.string().required("Condition is required"),
  price: yup
    .number()
    .typeError("Enter a valid price")
    .positive("Price must be positive")
    .required("Price is required"),
  battery_health: yup
    .number()
    .typeError("Enter a valid percentage")
    .min(0)
    .max(100)
    .required("Battery health is required"),
  color: yup.string().required("Color is required"),
  registration_year: yup
    .number()
    .typeError("Enter a valid registration year")
    .max(new Date().getFullYear(), "Year cannot exceed current year")
    .required("Registration year is required")
    .test(
      "is-greater-than-year", // FIXED
      "Registration year must be on or after manufacturing year",
      function (value) {
        const { year } = this.parent; // Compare against 'year'
        if (!value || !year) return true;
        return value >= year;
      }
    ),
  number_of_ev: yup
    .number()
    .typeError("Enter a valid number of units")
    .positive()
    .required(),

  // Step 4
  images: yup
    .mixed<File[]>()
    .test(
      "fileCount",
      "You can upload a maximum of 5 images.",
      (value) => !value || value.length <= 5
    )
    .test(
      "fileDimensions",
      "Each image must be at most 800×450 pixels.",
      async (value) => {
        if (!value) return true;
        const checks = await Promise.all(
          value.map(
            (file: File) =>
              new Promise((resolve) => {
                // Check if it's a new File, not an existing URL string
                if (!file.name) return resolve(true);
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                  const valid = img.width <= 800 && img.height <= 450;
                  URL.revokeObjectURL(img.src);
                  resolve(valid);
                };
                img.onerror = () => resolve(false);
              })
          )
        );
        return checks.every((valid) => valid);
      }
    ),
});

export default function EvListingEditStepper() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getActiveRoleId } = useAuth();
  const sellerId = getActiveRoleId();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [modelId, setModelId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<AlertProps | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
    watch,
    reset, // NEW: To populate form
  } = useForm<EvListingFormData>({
    resolver: yupResolver(EvListEditSchema) as any, // Use edit schema
    mode: "onChange",
    defaultValues: {
      // Default values are empty, reset() will populate them
      brand_id: "",
      category_id: "",
      model_name: "",
      year: "",
      battery_capacity_kwh: "",
      range_km: "",
      charging_time_hours: "",
      motor_type: "",
      seating_capacity: "",
      price_range: "",
      specifications: [],
      features: [],
      listing_type: "",
      condition: "",
      price: "",
      battery_health: "",
      color: "",
      registration_year: "",
      number_of_ev: "",
      images: [],
    },
  });

  const formData = watch();

  // React Query: Fetch brands and categories
  const { data: brandsData } = useQuery({
    queryKey: ["evBrands"],
    queryFn: async () => {
      const result = await sellerService.getAllEvBrand();
      return result.map((brand: any) => ({
        id: brand._id,
        name: brand.brand_name,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["evCategories"],
    queryFn: async () => {
      const result = await sellerService.getAllEvCateogry();
      return result.map((category: any) => ({
        id: category._id,
        name: category.category_name,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const evBrands = brandsData || [];
  const evCategories = categoriesData || [];

  // React Query: Fetch listing data for editing
  const { data: listingData, isLoading: isLoadingListing } = useQuery({
    queryKey: ["listingForEdit", listingId],
    queryFn: () => sellerService.getListingForEdit(listingId!),
    enabled: !!listingId && evBrands.length > 0 && evCategories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Populate form when listing data is loaded
  useEffect(() => {
    if (listingData && listingData.model_id) {
      const formattedData: any = {
        brand_id:
          listingData.model_id?.brand_id?._id ||
          listingData.model_id?.brand_id ||
          "",
        category_id:
          listingData.model_id?.category_id?._id ||
          listingData.model_id?.category_id ||
          "",
        model_name: listingData.model_id?.model_name || "",
        year: listingData.model_id?.year || "",
        battery_capacity_kwh: listingData.model_id?.battery_capacity_kwh || "",
        range_km: listingData.model_id?.range_km || "",
        charging_time_hours: listingData.model_id?.charging_time_hours || "",
        motor_type: listingData.model_id?.motor_type || "",
        seating_capacity: listingData.model_id?.seating_capacity || "",
        price_range: listingData.model_id?.price_range || "",
        specifications: listingData.model_id?.specifications || [],
        features: listingData.model_id?.features || [],
        listing_type: listingData.listing_type || "",
        condition: listingData.condition || "",
        price: listingData.price || "",
        battery_health: listingData.battery_health || "",
        color: listingData.color || "",
        registration_year: listingData.registration_year || "",
        number_of_ev: listingData.number_of_ev || "",
        images: [],
      };

      reset(formattedData);
      setModelId(listingData.model_id._id || listingData.model_id);

      // Store existing images
      if (listingData.images && Array.isArray(listingData.images)) {
        setExistingImages(listingData.images);
      }
    }
  }, [listingData, reset]);

  const steps = [
    { id: 1, name: "Vehicle" },
    { id: 2, name: "Model Details" },
    { id: 3, name: "Listing" },
    { id: 4, name: "Photos" },
    { id: 5, name: "Review & Submit" },
  ];

  // --- Handlers (validateStep, nextStep, prevStep are identical) ---
  const validateStep = async () => {
    const stepFields: Record<number, (keyof EvListingFormData)[]> = {
      1: ["brand_id", "category_id"],
      2: [
        "model_name",
        "year",
        "battery_capacity_kwh",
        "range_km",
        "charging_time_hours",
        "motor_type",
        "seating_capacity",
        "price_range", // NEW: Added
        "specifications", // NEW: Added
        "features", // NEW: Added
      ],
      3: [
        "listing_type",
        "condition",
        "price",
        "battery_health",
        "color",
        "registration_year",
        "number_of_ev",
      ],
      4: ["images"],
    };

    const fieldsToValidate = stepFields[currentStep];
    if (!fieldsToValidate) return true;

    const valid = await trigger(fieldsToValidate);
    return valid;
  };

  const nextStep = async () => {
    const valid = await validateStep();
    if (valid) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // React Query Mutation: Update Model
  const updateModelMutation = useMutation({
    mutationFn: ({ modelId, modelData }: { modelId: string; modelData: any }) =>
      sellerService.updateModel(modelId, modelData),
  });

  // React Query Mutation: Update Listing
  const updateListingMutation = useMutation({
    mutationFn: ({
      listingId,
      listingData,
    }: {
      listingId: string;
      listingData: FormData;
    }) => sellerService.updateListing(listingId, listingData),
  });

  // Submit handler for editing
  const onEditSubmit = async (data: EvListingFormData) => {
    if (!listingId || !modelId) {
      setAlertMessage({
        id: Date.now(),
        title: "Error",
        message: "Missing Listing ID or Model ID for update",
        type: "error",
      });
      return;
    }

    try {
      // 1. Prepare Model Data for update
      const modeldata = {
        brand_id: data.brand_id,
        category_id: data.category_id,
        model_name: data.model_name,
        year: data.year,
        battery_capacity_kwh: data.battery_capacity_kwh,
        range_km: data.range_km,
        charging_time_hours: data.charging_time_hours,
        motor_type: data.motor_type,
        seating_capacity: data.seating_capacity,
        price_range: data.price_range,
        specifications: data.specifications,
        features: data.features,
      };

      // 2. Prepare Listing Data for update
      const listingdata = new FormData();
      listingdata.append("listing_type", data.listing_type);
      listingdata.append("condition", data.condition);
      listingdata.append("price", data.price.toString());
      listingdata.append("battery_health", data.battery_health.toString());
      listingdata.append("color", data.color);
      listingdata.append(
        "registration_year",
        data.registration_year.toString()
      );
      listingdata.append("number_of_ev", data.number_of_ev.toString());

      // Handle NEW images
      data.images.forEach((file) => {
        listingdata.append("images", file);
      });

      // Execute mutations
      await updateModelMutation.mutateAsync({ modelId, modelData: modeldata });
      await updateListingMutation.mutateAsync({
        listingId,
        listingData: listingdata,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["listingForEdit", listingId],
      });
      if (sellerId) {
        queryClient.invalidateQueries({ queryKey: ["sellerEvlist", sellerId] });
      }

      setAlertMessage({
        id: Date.now(),
        title: "Success",
        message: "Listing updated successfully!",
        type: "success",
      });

      // Redirect after success
      setTimeout(() => {
        navigate("/seller/dashboard");
      }, 2000);
    } catch (error: any) {
      setAlertMessage({
        id: Date.now(),
        title: "Error",
        message: error.response?.data?.message || "Failed to update listing",
        type: "error",
      });
    }
  };

  // --- Render Steps ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContainer title="Step 1: Identify Your Vehicle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FormSelectField
                label="Brand"
                {...register("brand_id")}
                options={[{ id: "", name: "Select a brand" }, ...evBrands]}
                error={errors.brand_id?.message}
              />

              <FormSelectField
                label="Category"
                {...register("category_id")}
                disabled={!formData.brand_id}
                options={
                  formData.brand_id
                    ? [{ id: "", name: "Select a category" }, ...evCategories]
                    : [{ id: "", name: "Select a brand first" }]
                }
                error={errors.category_id?.message}
              />
            </div>
          </StepContainer>
        );
      case 2:
        return (
          <StepContainer title="Step 2: Specify Vehicle Model Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <FormInputField
                label="Model Name"
                type="text"
                placeholder="e.g., Tesla Model 3"
                {...register("model_name")}
                error={errors.model_name?.message}
              />
              <FormInputField
                label="Year"
                type="number"
                placeholder="e.g., 2024"
                {...register("year")}
                error={errors.year?.message}
              />
              <FormInputField
                label="Battery Capacity (kWh)"
                type="number"
                placeholder="e.g., 75"
                {...register("battery_capacity_kwh")}
                error={errors.battery_capacity_kwh?.message}
              />
              <FormInputField
                label="Range (km)"
                type="number"
                placeholder="e.g., 400"
                {...register("range_km")}
                error={errors.range_km?.message}
              />
              <FormInputField
                label="Charging Time (hours)"
                type="number"
                placeholder="e.g., 8"
                {...register("charging_time_hours")}
                error={errors.charging_time_hours?.message}
              />
              <FormInputField
                label="Motor Type"
                type="text"
                placeholder="e.g., Dual Motor"
                {...register("motor_type")}
                error={errors.motor_type?.message}
              />
              <FormInputField
                label="Seating Capacity"
                type="number"
                placeholder="e.g., 5"
                {...register("seating_capacity")}
                error={errors.seating_capacity?.message}
              />
              <FormInputField
                label="Price Range"
                type="text"
                placeholder="e.g., LKR 4,000,000 - LKR 6,000,000"
                {...register("price_range")}
                error={errors.price_range?.message}
              />
              {/* FIXED: Use setValue for comma-separated array fields */}
              <FormInputField
                name="specifications"
                label="Specifications"
                type="text"
                placeholder="e.g., Air Conditioning, Power Steering"
                value={formData.specifications.join(", ")}
                onChange={(e) => {
                  const value = e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean); // Filter empty strings
                  setValue("specifications", value, { shouldValidate: true });
                }}
                error={errors.specifications?.message}
              />
              <FormInputField
                name="features"
                label="Features"
                type="text"
                placeholder="e.g., Air Conditioning, Power Steering, ABS"
                value={formData.features.join(", ")}
                onChange={(e) => {
                  const value = e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean); // Filter empty strings
                  setValue("features", value, { shouldValidate: true });
                }}
                error={errors.features?.message}
              />
            </div>
          </StepContainer>
        );
      case 3:
        return (
          <StepContainer title="Step 3: Set Listing & Price">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <FormSelectField
                label="Listing Type"
                {...register("listing_type")}
                options={[
                  { id: "", name: "Select Listing Type" },
                  ...Object.values(ListingType).map((status) => ({
                    id: status,
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                  })),
                ]}
                error={errors.listing_type?.message}
              />
              <FormSelectField
                label="Condition"
                {...register("condition")}
                options={[
                  { id: "", name: "Select Condition" },
                  ...Object.values(VehicleCondition).map((condition) => ({
                    id: condition,
                    name:
                      condition.charAt(0).toUpperCase() + condition.slice(1),
                  })),
                ]}
                error={errors.condition?.message}
              />
              <FormInputField
                label="Price (LKR)"
                type="number"
                min="0"
                placeholder="e.g., 3500000"
                {...register("price")}
                error={errors.price?.message}
              />
              <FormInputField
                label="Battery Health (%)"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 90"
                {...register("battery_health")}
                error={errors.battery_health?.message}
              />
              <FormInputField
                label="Color"
                type="text"
                placeholder="e.g., Pearl White"
                {...register("color")}
                error={errors.color?.message}
              />
              <FormInputField
                label="Registration Year"
                type="number"
                placeholder="e.g., 2022"
                {...register("registration_year")}
                error={errors.registration_year?.message}
              />
              <FormInputField
                label="Number of Units"
                type="number"
                min="1"
                placeholder="e.g., 2"
                {...register("number_of_ev")}
                error={errors.number_of_ev?.message}
              />
            </div>
          </StepContainer>
        );
      case 4:
        return (
          <StepContainer title="Step 4: Add Photos">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You can upload new images to add to this listing. Existing
                images will be kept.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Images (max 5)
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const files = Array.from(e.target.files || []);
                  const currentImages = watch("images") || [];

                  if (files.length + currentImages.length > 5) {
                    setAlertMessage({
                      id: Date.now(),
                      title: "Warning",
                      message: "You can upload a maximum of 5 images.",
                      type: "error",
                    });
                    e.target.value = "";
                    return;
                  }

                  const newImages = [...currentImages, ...files];
                  setValue("images", newImages, { shouldValidate: true });
                  e.target.value = "";
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {errors.images && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.images?.message}
                </p>
              )}

              {/* Preview Section - New Images */}
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    New Images:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg shadow-sm border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentImages = watch("images") || [];
                            const newImages = currentImages.filter(
                              (_, i) => i !== index
                            );
                            setValue("images", newImages, {
                              shouldValidate: true,
                            });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Images Preview */}
              {existingImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Existing Images:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg shadow-sm border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">Existing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StepContainer>
        );
      case 5:
        // Review step works the same, reading from formData
        return (
          <StepContainer title="Step 5: Review Your Listing">
            {/* ... (Review markup is identical to create component) ... */}
            <div className="space-y-6 mt-4">
              {/* Vehicle Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Vehicle Information
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Brand:</strong>{" "}
                    {evBrands.find(
                      (b: { id: string; name: string }) =>
                        b.id === formData.brand_id
                    )?.name || "—"}
                  </li>
                  <li>
                    <strong>Category:</strong>{" "}
                    {evCategories.find(
                      (c: { id: string; name: string }) =>
                        c.id === formData.category_id
                    )?.name || "—"}
                  </li>
                  <li>
                    <strong>Model Name:</strong> {formData.model_name || "—"}
                  </li>
                  <li>
                    <strong>Year:</strong> {formData.year || "—"}
                  </li>
                </ul>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Performance
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Battery Capacity:</strong>{" "}
                    {formData.battery_capacity_kwh || "—"} kWh
                  </li>
                  <li>
                    <strong>Range:</strong> {formData.range_km || "—"} km
                  </li>
                  <li>
                    <strong>Charging Time:</strong>{" "}
                    {formData.charging_time_hours || "—"} hrs
                  </li>
                  <li>
                    <strong>Motor Type:</strong> {formData.motor_type || "—"}
                  </li>
                  <li>
                    <strong>Seating Capacity:</strong>{" "}
                    {formData.seating_capacity || "—"}
                  </li>
                </ul>
              </div>

              {/* Listing Details */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Listing Details
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Listing Type:</strong>{" "}
                    {formData.listing_type || "—"}
                  </li>
                  <li>
                    <strong>Condition:</strong> {formData.condition || "—"}
                  </li>
                  <li>
                    <strong>Price:</strong>{" "}
                    {formData.price ? `LKR ${formData.price}` : "—"}
                  </li>
                  <li>
                    <strong>Battery Health:</strong>{" "}
                    {formData.battery_health
                      ? `${formData.battery_health}%`
                      : "—"}
                  </li>
                  <li>
                    <strong>Color:</strong> {formData.color || "—"}
                  </li>
                  <li>
                    <strong>Registration Year:</strong>{" "}
                    {formData.registration_year || "—"}
                  </li>
                  <li>
                    <strong>Number of Units:</strong>{" "}
                    {formData.number_of_ev || "—"}
                  </li>
                </ul>
              </div>

              {/* Images Preview */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  New Uploaded Images
                </h4>
                {formData.images && formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {formData.images.map((img, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No new images uploaded.
                  </p>
                )}
              </div>
            </div>
          </StepContainer>
        );

      default:
        return null;
    }
  };

  // Show loading spinner while fetching data
  if (isLoadingListing || !listingData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 flex justify-center items-center">
        <Loader size={20} color="#4f46e5" />
        <p className="ml-4">Loading listing details...</p>
      </div>
    );
  }

  const isSubmitting =
    updateModelMutation.isPending || updateListingMutation.isPending;

  return (
    <>
      <Alert
        alert={
          alertMessage
            ? {
                title: alertMessage.title,
                message: alertMessage.message,
                type: alertMessage.type,
              }
            : null
        }
        onClose={() => setAlertMessage(null)}
      />
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-lg">
        {/* Stepper (Identical) */}
        <div className="mb-8">
          <div className="relative">
            <div
              className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200"
              aria-hidden="true"
            ></div>
            <div
              className="absolute left-0 top-1/2 -mt-px h-0.5 bg-blue-600 transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            ></div>

            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${currentStep >= step.id ? "bg-blue-600" : "bg-gray-200"}
                    ${currentStep > step.id ? "text-white" : "text-gray-500"}`}
                  >
                    {currentStep > step.id ? (
                      <EvCheckIcon />
                    ) : (
                      <span
                        className={`font-medium ${
                          currentStep >= step.id
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {step.id}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2 text-gray-700">
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit(onEditSubmit)}>
          {renderStepContent()}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              disabled={currentStep === 1 || isSubmitting}
              onClick={prevStep}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {currentStep === 5 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={10} color="#fff" />
                    Updating...
                  </>
                ) : (
                  "Update Listing"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
