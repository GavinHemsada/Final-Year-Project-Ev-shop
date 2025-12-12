import React, { useState } from "react";
import {
  CarIcon,
  CalendarIcon,
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
} from "@/assets/icons/icons";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { sellerService } from "../sellerService";
import type { AlertProps, TestDriveSlot, EvModel, ConfirmAlertProps } from "@/types";
import { Loader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

/**
 * A page for sellers to manage test drive slots.
 */
export const TestDrivesPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const sellerId = useAppSelector(selectActiveRoleId);
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(true); // Show form by default
  const [editingSlot, setEditingSlot] = useState<TestDriveSlot | null>(null);
  const [formData, setFormData] = useState({
    model_id: "",
    location: "",
    available_date: "",
    max_bookings: 1,
    is_active: true,
  });
  const [addressValidation, setAddressValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    message: "",
  });

  // Fetch test drive slots
  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: queryKeys.testDriveSlots(sellerId || ""),
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await sellerService.getTestDriveSlotsBySeller(sellerId);
      const data = response?.slots || response;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!sellerId,
  });
  console.log(slotsData);
  // Fetch seller's listings to get models
  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: queryKeys.sellerEvlist(sellerId || ""),
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await sellerService.getSellerEvList(sellerId);
      const listingsData = response?.listings || response;

      if (Array.isArray(listingsData)) {
        const uniqueModels = new Map<string, EvModel>();
        listingsData.forEach((listing: any) => {
          if (listing.model_id && listing.model_id._id) {
            const modelId = listing.model_id._id;
            if (!uniqueModels.has(modelId)) {
              uniqueModels.set(modelId, {
                _id: listing.model_id._id,
                model_name: listing.model_id.model_name,
                brand_id: listing.model_id.brand_id
                  ? {
                      brand_name: listing.model_id.brand_id.brand_name,
                    }
                  : undefined,
              });
            }
          }
        });
        return Array.from(uniqueModels.values());
      }
      return [];
    },
    enabled: !!sellerId,
  });

  const slots = slotsData || [];
  const models = modelsData || [];
  const isLoading = isLoadingSlots || isLoadingModels;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (slotData: any) => sellerService.createTestDriveSlot(slotData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testDriveSlots(sellerId!),
      });
      setShowAddForm(false);
      resetForm();
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Test drive slot created successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to create slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create test drive slot";
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
      sellerService.updateTestDriveSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testDriveSlots(sellerId!),
      });
      setEditingSlot(null);
      resetForm();
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Test drive slot updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to update slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update test drive slot";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => sellerService.deleteTestDriveSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testDriveSlots(sellerId!),
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Test drive slot deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to delete slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete test drive slot";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    },
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) return;

    const slotData = {
      seller_id: sellerId,
      model_id: formData.model_id,
      location: formData.location,
      available_date: new Date(formData.available_date).toISOString(),
      max_bookings: formData.max_bookings,
      is_active: formData.is_active,
    };

    createMutation.mutate(slotData);
  };

  const handleUpdateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const slotData = {
      seller_id: sellerId,
      model_id: formData.model_id,
      location: formData.location,
      available_date: new Date(formData.available_date).toISOString(),
      max_bookings: formData.max_bookings,
      is_active: formData.is_active,
    };

    updateMutation.mutate({ id: editingSlot._id, data: slotData });
  };

  const handleDeleteSlot = (slotId: string) => {
    setConfirmAlert?.({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this test drive slot?",
      cancelText: "Cancel",
      confirmText: "Delete",
      onConfirmAction() {
        deleteMutation.mutate(slotId);
      },
    });
  };

  const handleEditSlot = (slot: TestDriveSlot) => {
    setEditingSlot(slot);
    setFormData({
      model_id: slot.model_id._id,
      location: slot.location,
      available_date: new Date(slot.available_date).toISOString().split("T")[0],
      max_bookings: slot.max_bookings,
      is_active: slot.is_active,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      model_id: "",
      location: "",
      available_date: "",
      max_bookings: 1,
      is_active: true,
    });
    setEditingSlot(null);
    setAddressValidation({
      isValidating: false,
      isValid: null,
      message: "",
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
  };

  // Validate address using OpenStreetMap Nominatim API
  async function validateAddress(address: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      return {
        valid: true,
        lat: data[0].lat,
        lon: data[0].lon,
        display_name: data[0].display_name,
      };
    } else {
      return { valid: false };
    }
  }

  // Handle location input change with validation
  const handleLocationChange = async (value: string) => {
    setFormData({ ...formData, location: value });

    if (!value.trim()) {
      setAddressValidation({
        isValidating: false,
        isValid: null,
        message: "",
      });
      return;
    }

    // Set validating state
    setAddressValidation({
      isValidating: true,
      isValid: null,
      message: "Validating address...",
    });

    // Debounce validation
    const timeoutId = setTimeout(async () => {
      try {
        const result = await validateAddress(value);
        if (result.valid) {
          setAddressValidation({
            isValidating: false,
            isValid: true,
            message: `✓ Valid address: ${result.display_name}`,
          });
        } else {
          setAddressValidation({
            isValidating: false,
            isValid: false,
            message: "✗ Address not found. Please enter a valid address.",
          });
        }
      } catch (error) {
        setAddressValidation({
          isValidating: false,
          isValid: false,
          message: "✗ Failed to validate address. Please try again.",
        });
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Test Drive Slots</h1>
        {!showAddForm && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add New Slot
          </button>
        )}
      </div>

      {/* Add/Edit Form - Always visible when showAddForm is true */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold dark:text-white">
              {editingSlot ? "Edit Test Drive Slot" : "Add New Test Drive Slot"}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <form
            onSubmit={editingSlot ? handleUpdateSlot : handleAddSlot}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                EV Model *
              </label>
              <select
                value={formData.model_id}
                onChange={(e) =>
                  setFormData({ ...formData, model_id: e.target.value })
                }
                required
                disabled={models.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {models.length === 0
                    ? "No models available. Create a listing first."
                    : "Select a model"}
                </option>
                {models.map((model) => (
                  <option key={model._id} value={model._id}>
                    {model.brand_id?.brand_name || ""} {model.model_name}
                  </option>
                ))}
              </select>
              {models.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You need to create at least one vehicle listing before you can
                  create test drive slots.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                required
                placeholder="e.g., 123 Main Street, Colombo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {addressValidation.message && (
                <div
                  className={`mt-2 p-1 rounded-lg border ${
                    addressValidation.isValidating
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                      : addressValidation.isValid
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {addressValidation.isValidating ? (
                      <div className="mt-0.5">
                        <svg
                          className="animate-spin h-2 w-2 text-blue-600 dark:text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    ) : addressValidation.isValid ? (
                      <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          addressValidation.isValidating
                            ? "text-blue-800 dark:text-blue-200"
                            : addressValidation.isValid
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {addressValidation.isValidating
                          ? "Checking address..."
                          : addressValidation.isValid
                          ? "Address verified successfully!"
                          : "Address not found"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Available Date *
              </label>
              <input
                type="date"
                value={formData.available_date}
                onChange={(e) =>
                  setFormData({ ...formData, available_date: e.target.value })
                }
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Bookings *
              </label>
              <input
                type="number"
                value={formData.max_bookings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_bookings: parseInt(e.target.value) || 1,
                  })
                }
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Active (available for booking)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {editingSlot ? "Update Slot" : "Create Slot"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slots List */}
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        {slots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/50">
                      <CarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold dark:text-white">
                        {slot.model_id?.brand_id?.brand_name || ""}{" "}
                        {slot.model_id?.model_name || "Unknown Model"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {slot.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSlot(slot)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                      title="Edit slot"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Delete slot"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium dark:text-gray-300">
                      Date:
                    </span>
                    <span className="dark:text-gray-400">
                      {new Date(slot.available_date).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium dark:text-gray-300">
                      Max Bookings:
                    </span>
                    <span className="dark:text-gray-400">
                      {slot.max_bookings}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-gray-300">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        slot.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {slot.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 dark:text-gray-400">
            No test drive slots created yet. Click "Add Slot" to create your
            first slot.
          </p>
        )}
      </div>
    </div>
  );
};

export default TestDrivesPage;
