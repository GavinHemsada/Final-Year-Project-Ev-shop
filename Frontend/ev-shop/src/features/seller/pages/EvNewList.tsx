import { useEffect, useState, type ChangeEvent } from "react";
import type { Brand, categorie, EvListingFormData, AlertProps } from "@/types";
import { sellerService } from "../sellerService";
import { EvCheckIcon } from "@/assets/icons/icons";
import { FormSelectField } from "@/components/FormSelect";
import { FormInputField } from "@/components/FormInput";
import { StepContainer } from "@/components/StepContainer";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { ListingType, VehicleCondition } from "@/types/enum";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const EvListschema = yup.object({
  // Step 1
  brand_id: yup.string().required("Brand is required"),
  category_id: yup.string().required("Category is required"),

  // Step 2
  model_name: yup.string().required("Model name is required"),
  year: yup
    .number()
    .typeError("Enter a valid year")
    .min(1900)
    .max(new Date().getFullYear() + 1, "Invalid year"),
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
    .min(1, "At least 1 specification is required"),
  features: yup
    .array()
    .of(yup.string())
    .min(1, "At least 1 feature is required"),

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
      "is-greater",
      "Year must be greater than or equal to registration year",
      function (registrationYear) {
      const { year } = this.parent;
      if (!year || !registrationYear) return true; 
      return registrationYear >= year;
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
    .test("required", "At least one image is required", (value) => {
      return value && value.length > 0;
    })
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
            // <-- No 'Array.from' needed
            (file: File) =>
              new Promise((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                  const valid = img.width <= 800 && img.height <= 600;
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

export default function EvListingStepper({ setAlert }: { setAlert?: (alert: AlertProps | null) => void } = { setAlert: undefined }) {
  const sellerId = useAppSelector(selectActiveRoleId);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [evBrands, setEvBrands] = useState<Brand[]>([]);
  const [evCatogorys, setEvCatogorys] = useState<categorie[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
    watch,
  } = useForm<EvListingFormData>({
    resolver: yupResolver(EvListschema) as any,
    mode: "onChange",
    defaultValues: {
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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const result = await sellerService.getAllEvBrand();
        const formatted = result.map((brand: any) => ({
          id: brand._id,
          name: brand.brand_name,
        }));
        setEvBrands(formatted);
        console.log("Brands:", result);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    const fetchModels = async () => {
      try {
        const result = await sellerService.getAllEvCateogry();
        const formatted = result.map((catogory: any) => ({
          id: catogory._id,
          name: catogory.category_name,
        }));
        setEvCatogorys(formatted);
        console.log("Models:", result);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    fetchModels();
    fetchBrands();
  }, []);

  const steps = [
    { id: 1, name: "Vehicle" },
    { id: 2, name: "Model Details" },
    { id: 3, name: "Listing" },
    { id: 4, name: "Photos" },
    { id: 5, name: "Review & Submit" },
  ];

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
        "price_range",
        "specifications",
        "features",
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

  const onSubmite = async (data: EvListingFormData) => {
    try {
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
      const modelResult = await sellerService.createnewModel(modeldata);
      console.log(modelResult);

      const modelid = modelResult._id;

      const listingdata = new FormData();
      listingdata.append("seller_id", sellerId!);
      listingdata.append("model_id", modelid);
      listingdata.append("listing_type", data.listing_type);
      listingdata.append("condition", data.condition);
      listingdata.append("price", data.price.toString());
      listingdata.append("battery_health", data.battery_health.toString());
      listingdata.append("color", data.color);
      listingdata.append("registration_year", data.registration_year);
      listingdata.append("number_of_ev", data.number_of_ev.toString());

      data.images.forEach((file) => {
        listingdata.append("images", file);
      });

      const listingResult = await sellerService.createListing(listingdata);
      console.log(listingResult);
    } catch (error) {
      console.error("Error submitting form:", error);
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
                {...register("brand_id")} // <-- Use register
                options={[{ id: "", name: "Select a brand" }, ...evBrands]}
                error={errors.brand_id?.message}
              />

              <FormSelectField
                label="Category"
                {...register("category_id")} // <-- Use register
                disabled={!formData.brand_id}
                options={
                  formData.brand_id
                    ? [{ id: "", name: "Select a category" }, ...evCatogorys]
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
              {/* Model Name */}
              <FormInputField
                label="Model Name"
                type="text"
                placeholder="e.g., Tesla Model 3"
                {...register("model_name")} // <-- Use register
                error={errors.model_name?.message} // <-- Access message
              />

              {/* Year */}
              <FormInputField
                label="Year"
                type="number"
                placeholder="e.g., 2024"
                {...register("year")} // <-- Use register
                error={errors.year?.message}
              />

              {/* Battery Capacity */}
              <FormInputField
                label="Battery Capacity (kWh)"
                type="number"
                placeholder="e.g., 75"
                {...register("battery_capacity_kwh")} // <-- Use register
                error={errors.battery_capacity_kwh?.message}
              />

              {/* Range */}
              <FormInputField
                label="Range (km)"
                type="number"
                placeholder="e.g., 400"
                {...register("range_km")} // <-- Use register
                error={errors.range_km?.message}
              />

              {/* Charging Time */}
              <FormInputField
                label="Charging Time (hours)"
                type="number"
                placeholder="e.g., 8"
                {...register("charging_time_hours")} // <-- Use register
                error={errors.charging_time_hours?.message}
              />

              {/* Motor Type */}
              <FormInputField
                label="Motor Type"
                type="text"
                placeholder="e.g., Dual Motor"
                {...register("motor_type")} // <-- Use register
                error={errors.motor_type?.message}
              />

              {/* Seating Capacity */}
              <FormInputField
                label="Seating Capacity"
                type="number"
                placeholder="e.g., 5"
                {...register("seating_capacity")} // <-- Use register
                error={errors.seating_capacity?.message}
              />

              {/* Price Range (Not in schema, so control manually) */}
              <FormInputField
                label="Price Range"
                type="text"
                placeholder="e.g., LKR 4,000,000 - LKR 6,000,000"
                {...register("price_range")} // <-- Use register
                error={errors.price_range?.message}
              />

              {/* Specifications (Custom array field) */}
              <FormInputField
                label="Specifications"
                name="specifications"
                type="text"
                placeholder="e.g., Air Conditioning, Power Steering"
                value={(watch("specifications") || []).join(", ")}
                onChange={(e) => {
                  const value = e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean); // remove empty strings
                  setValue("specifications", value, { shouldValidate: true });
                }}
                error={errors.specifications?.message}
              />

              {/* Features (Custom array field) */}
              <FormInputField
                label="Features"
                name="features"
                type="text"
                placeholder="e.g., Air Conditioning, Power Steering, ABS"
                value={(watch("features") || []).join(", ")}
                onChange={(e) => {
                  const value = e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean); // remove empty strings
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
              {" "}
              {/* Added gap */}
              {/* Listing Type */}
              <FormSelectField
                label="Listing Type"
                {...register("listing_type")} // <-- Use register
                options={[
                  { id: "", name: "Select Listing Type" },
                  ...Object.values(ListingType).map((status) => ({
                    id: status,
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                  })),
                ]}
                error={errors.listing_type?.message}
              />
              {/* Condition */}
              <FormSelectField
                label="Condition"
                {...register("condition")} // <-- Use register
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
              {/* Price */}
              <FormInputField
                label="Price (LKR)"
                type="number"
                min="0"
                placeholder="e.g., 3500000"
                {...register("price")} // <-- Use register
                error={errors.price?.message}
              />
              {/* Battery Health */}
              <FormInputField
                label="Battery Health (%)"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 90"
                {...register("battery_health")} // <-- Use register
                error={errors.battery_health?.message}
              />
              {/* Color */}
              <FormInputField
                label="Color"
                type="text"
                placeholder="e.g., Pearl White"
                {...register("color")} // <-- Use register
                error={errors.color?.message}
              />
              {/* Registration Year */}
              <FormInputField
                label="Registration Year"
                type="number"
                placeholder="e.g., 2022"
                {...register("registration_year")} // <-- Use register
                error={errors.registration_year?.message}
              />
              {/* Number of EVs */}
              <FormInputField
                label="Number of Units"
                type="number"
                min="1"
                placeholder="e.g., 2"
                {...register("number_of_ev")} // <-- Use register
                error={errors.number_of_ev?.message}
              />
            </div>
          </StepContainer>
        );
      case 4:
        return (
          <StepContainer title="Step 4: Add Photos">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (max 5)
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  // <-- Fix handler
                  const files = Array.from(e.target.files || []);
                  const currentImages = watch("images") || []; // Get from RHF

                  if (files.length + currentImages.length > 5) {
                    alert("You can upload a maximum of 5 images.");
                    e.target.value = ""; // Clear input
                    return;
                  }

                  const newImages = [...currentImages, ...files];
                  setValue("images", newImages, { shouldValidate: true }); // Set in RHF
                  e.target.value = ""; // Clear input to allow re-selection
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
                  {errors.images?.message} {/* <-- Access message */}
                </p>
              )}

              {/* ✅ Preview Section (Uses 'formData' from watch) */}
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)} // for preview only
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-sm border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // <-- Fix handler
                          const currentImages = watch("images") || [];
                          const newImages = currentImages.filter(
                            (_, i) => i !== index
                          );
                          setValue("images", newImages, {
                            // Set in RHF
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
              )}
            </div>
          </StepContainer>
        );
      case 5:
        // This step correctly uses 'formData' from 'watch()' for review
        return (
          <StepContainer title="Step 5: Review Your Listing">
            <div className="space-y-6 mt-4">
              {/* Vehicle Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Vehicle Information
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Brand:</strong>{" "}
                    {evBrands.find((b) => b.id === formData.brand_id)?.name ||
                      "—"}
                  </li>
                  <li>
                    <strong>Category:</strong>{" "}
                    {evCatogorys.find((c) => c.id === formData.category_id)
                      ?.name || "—"}
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
                  Uploaded Images
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
                  <p className="text-sm text-gray-500">No images uploaded.</p>
                )}
              </div>
            </div>
          </StepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-lg">
      {/* Stepper */}
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
                        currentStep >= step.id ? "text-white" : "text-gray-500"
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
      <form onSubmit={handleSubmit(onSubmite)}>
        {renderStepContent()}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={prevStep} // <-- Use prevStep handler
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
          >
            Back
          </button>
          {currentStep === 5 ? (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Submit
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
  );
}