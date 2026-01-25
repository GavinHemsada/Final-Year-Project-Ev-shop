import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { sellerService } from "../sellerService";
import type { AlertProps, ConfirmAlertProps } from "@/types";
import { PageLoader, Loader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/assets/icons/icons";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FadeLoader } from "react-spinners";
import { useToast } from "@/context/ToastContext";
import type { RepairLocation, RepairLocationFormData } from "@/types";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (color: string = "red") => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const repairLocationSchema = yup.object({
  name: yup.string().required("Location name is required"),
  address: yup.string().required("Address is required"),
  latitude: yup
    .number()
    .required("Latitude is required")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: yup
    .number()
    .required("Longitude is required")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  phone: yup
    .string()
    .matches(/^\+?[0-9\s\-()]{10,15}$/, "Please enter a valid phone number")
    .optional(),
  email: yup.string().email("Please enter a valid email address").optional(),
  operating_hours: yup.string().optional(),
  description: yup.string().optional(),
  is_active: yup.boolean().required(),
});

// Component to handle map clicks
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * A page for sellers to manage their repair locations on a map.
 */
export const RepairLocationsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const sellerId = useAppSelector(selectActiveRoleId);
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const { showToast } = useToast();
  const [editingLocation, setEditingLocation] = useState<RepairLocation | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 2;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<RepairLocationFormData>({
    resolver: yupResolver(repairLocationSchema) as any,
    defaultValues: {
      name: "",
      address: "",
      latitude: 7.8731, // Default to Sri Lanka center
      longitude: 80.7718,
      phone: "",
      email: "",
      operating_hours: "",
      description: "",
      is_active: true,
    },
  });

  const formData = watch();

  // Fetch repair locations using React Query
  const {
    data: locationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.repairLocations(sellerId || ""),
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await sellerService.getRepairLocationsBySeller(sellerId);
      const locations = response?.locations || response || [];
      return Array.isArray(locations) ? locations : [];
    },
    enabled: !!sellerId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const locations: RepairLocation[] = locationsData || [];
  console.log(locations);
  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        (location.phone && location.phone.toLowerCase().includes(query)) ||
        (location.email && location.email.toLowerCase().includes(query)) ||
        (location.description &&
          location.description.toLowerCase().includes(query))
    );
  }, [locations, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLocations.length / locationsPerPage);
  const startIndex = (currentPage - 1) * locationsPerPage;
  const paginatedLocations = filteredLocations.slice(
    startIndex,
    startIndex + locationsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Geocoding mutation
  const geocodeMutation = useMutation({
    mutationFn: async (address: string) => {
      // First attempt: specific search
      let searchAddress = address;
      if (!address.toLowerCase().includes("sri lanka")) {
        searchAddress += ", Sri Lanka";
      }
      
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchAddress
        )}&limit=1`
      );
      
      if (!response.ok) throw new Error("Failed to fetch geocoding data");
      let data = await response.json();

      // Second attempt: if no results, try without "Sri Lanka" suffix (if added) or just the address
      if (data.length === 0) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}&limit=1`
        );
        if (!response.ok) throw new Error("Failed to fetch geocoding data");
        data = await response.json();
      }
      
      // Third attempt: Clean up address (remove "No", "No.", etc.)
      if (data.length === 0) {
         const cleanAddress = address.replace(/^(no\.?\s*\d+,?)/i, "").trim();
         if (cleanAddress !== address) {
            response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                cleanAddress + ", Sri Lanka"
            )}&limit=1`
            );
            if (!response.ok) throw new Error("Failed to fetch geocoding data");
            data = await response.json();
         }
      }

      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setValue("latitude", parseFloat(data[0].lat), { shouldValidate: true });
        setValue("longitude", parseFloat(data[0].lon), {
          shouldValidate: true,
        });
        showToast?.({ text: "Location found on map!", type: "success" });
      } else {
        showToast?.({
          text: "Could not find specific location. Please click on the map to set coordinates manually.",
          type: "warning",
        });
      }
    },
    onError: () =>
      showToast?.({
        text: "Failed to geocode address. Please click on the map to set coordinates.",
        type: "error",
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (locationData: any) =>
      sellerService.createRepairLocation(locationData),
    onSuccess: () => {
      // Invalidate seller's repair locations
      queryClient.invalidateQueries({
        queryKey: queryKeys.repairLocations(sellerId || ""),
      });
      // Invalidate active repair locations (used in welcome page map)
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeRepairLocations,
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Repair location added successfully!",
        type: "success",
      });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create repair location:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to save repair location";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sellerService.updateRepairLocation({
        locationId: id,
        locationData: data,
      }),
    onSuccess: async () => {
      // Force refetch seller's repair locations
      await queryClient.refetchQueries({
        queryKey: queryKeys.repairLocations(sellerId!),
      });
      // Invalidate active repair locations (used in welcome page map)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.activeRepairLocations,
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Repair location updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to update repair location:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to save repair location";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    },
    onSettled: () => {
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sellerService.deleteRepairLocation({ locationId: id }),
    onSuccess: () => {
      // Invalidate seller's repair locations
      queryClient.invalidateQueries({
        queryKey: queryKeys.repairLocations(sellerId || ""),
      });
      // Invalidate active repair locations (used in welcome page map)
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeRepairLocations,
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Repair location deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to delete repair location:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete repair location",
        type: "error",
      });
    },
  });

  // Show error alert if query fails
  useEffect(() => {
    if (error) {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load repair locations",
        type: "error",
      });
    }
  }, [error, setAlert]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!showAddForm && !editingLocation) return;

    setValue("latitude", parseFloat(lat.toFixed(6)), { shouldValidate: true });
    setValue("longitude", parseFloat(lng.toFixed(6)), { shouldValidate: true });
  };

  const handleGeocodeAddress = async () => {
    const address = watch("address");
    if (!address) {
      showToast?.({
        text: "Please enter an address first",
        type: "warning",
      });
      return;
    }
    geocodeMutation.mutate(address);
  };

  const resetForm = () => {
    reset({
      name: "",
      address: "",
      latitude: 7.8731,
      longitude: 80.7718,
      phone: "",
      email: "",
      operating_hours: "",
      description: "",
      is_active: true,
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const onSubmit = async (data: RepairLocationFormData) => {
    if (!sellerId) return;

    if (editingLocation) {
      updateMutation.mutate({
        id: editingLocation._id,
        data: {
          ...data,
          seller_id: sellerId,
        },
      });
    } else {
      createMutation.mutate({
        ...data,
        is_active: "true",
        seller_id: sellerId,
      });
    }
  };

  const handleEdit = (location: RepairLocation) => {
    setEditingLocation(location);
    reset({
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone || "",
      email: location.email || "",
      operating_hours: location.operating_hours || "",
      description: location.description || "",
      is_active: location.is_active,
    });
    setShowAddForm(true);

    // Scroll to top of page to show the edit form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    setConfirmAlert?.({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this repair location?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirmAction() {
        deleteMutation.mutate(id);
      },
    });
  };

  // Calculate center of paginated locations for map view
  const getMapCenter = () => {
    if (paginatedLocations.length === 0) {
      return [7.8731, 80.7718] as [number, number]; // Default to Sri Lanka center
    }
    const avgLat =
      paginatedLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
      paginatedLocations.length;
    const avgLng =
      paginatedLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
      paginatedLocations.length;
    return [avgLat, avgLng] as [number, number];
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Repair Locations</h1>
        {!showAddForm && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Location
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {editingLocation
              ? "Edit Repair Location"
              : "Add New Repair Location"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g., Main Service Center"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="e.g., 123 Main St, Colombo"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocodeMutation.isPending}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Find location on map"
                  >
                    {geocodeMutation.isPending ? (
                      <div className="h-5 w-5 flex items-center justify-center scale-75">
                        <FadeLoader
                          color="#0062ffff"
                          height={8}
                          width={4}
                          margin={-1}
                          radius={-1}
                        />
                      </div>
                    ) : (
                      <MapPinIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("latitude", { valueAsNumber: true })}
                  placeholder="e.g., 7.8731"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.latitude ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.latitude && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.latitude.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("longitude", { valueAsNumber: true })}
                  placeholder="e.g., 80.7718"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.longitude ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.longitude && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g., +94 11 234 5678"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="e.g., service@example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  {...register("operating_hours")}
                  placeholder="e.g., Mon-Fri: 9AM-6PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Active Status
                </label>
                <select
                  {...register("is_active", {
                    setValueAs: (value) => value === "true",
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Describe services offered at this location..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>

            {/* Map for selecting location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Click on map to set location coordinates *
              </label>
              <div className="w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
                <MapContainer
                  center={[
                    formData.latitude || 7.8731,
                    formData.longitude || 80.7718,
                  ]}
                  zoom={10}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {formData.latitude && formData.longitude && (
                    <Marker
                      position={[formData.latitude, formData.longitude]}
                      icon={createCustomIcon("red")}
                    />
                  )}
                  <MapClickHandler onClick={handleMapClick} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click on the map or use the address geocoding button to set
                coordinates
              </p>
              {(errors.latitude || errors.longitude) && (
                <p className="text-red-500 text-xs mt-1">
                  Please set location coordinates on the map
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending ? (
                  <>
                    <Loader size={8} color="#ffffff" />
                    Saving...
                  </>
                ) : editingLocation ? (
                  "Update Location"
                ) : (
                  "Add Location"
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      {!showAddForm && locations.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations by name, address, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Locations List with Map */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Map View */}
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Map View</h2>
          <div className="w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
            {paginatedLocations.length > 0 ? (
              <MapContainer
                center={getMapCenter()}
                zoom={paginatedLocations.length === 1 ? 12 : 8}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {paginatedLocations.map((location) => (
                  <Marker
                    key={location._id}
                    position={[location.latitude, location.longitude]}
                    icon={createCustomIcon(
                      location.is_active ? "blue" : "gray"
                    )}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm">{location.name}</h3>
                        <p className="text-xs text-gray-600">
                          {location.address}
                        </p>
                        {location.phone && (
                          <p className="text-xs text-gray-600">
                            Phone: {location.phone}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? "No locations found matching your search."
                    : "No locations to display. Add a location to see it on the map."}
                </p>
              </div>
            )}
          </div>
          {paginatedLocations.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing {paginatedLocations.length} of {filteredLocations.length}{" "}
              location
              {filteredLocations.length !== 1 ? "s" : ""} on map
            </p>
          )}
        </div>

        {/* Locations List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold dark:text-white">
              Your Locations
            </h2>
            {filteredLocations.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredLocations.length} total
              </span>
            )}
          </div>
          {filteredLocations.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
              <p className="text-gray-500 text-center py-10 dark:text-gray-400">
                {searchQuery
                  ? "No locations found matching your search."
                  : "No repair locations added yet. Click 'Add Location' to get started."}
              </p>
            </div>
          ) : (
            <>
              {paginatedLocations.map((location) => (
                <div
                  key={location._id}
                  className="bg-white p-4 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {location.name}
                      </h3>
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{location.address}</span>
                      </div>
                      {location.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{location.phone}</span>
                        </div>
                      )}
                      {location.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{location.email}</span>
                        </div>
                      )}
                      {location.operating_hours && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{location.operating_hours}</span>
                        </div>
                      )}
                      {location.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {location.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            location.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {location.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30"
                        title="Edit location"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(location._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                        title="Delete location"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white dark:bg-blue-700"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Results Info */}
              {filteredLocations.length > 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Showing {startIndex + 1}-
                  {Math.min(
                    startIndex + locationsPerPage,
                    filteredLocations.length
                  )}{" "}
                  of {filteredLocations.length} location
                  {filteredLocations.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairLocationsPage;
