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
import { PageLoader, Loader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { useToast } from "@/context/ToastContext";

type TabType = "slots" | "bookings" | "completed" | "rejected";

/**
 * A page for sellers to manage test drive slots and bookings.
 */
export const TestDrivesPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const sellerId = useAppSelector(selectActiveRoleId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("slots");

  const [showAddForm, setShowAddForm] = useState(true);
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

  // Pagination state for each tab
  const [activeBookingsPage, setActiveBookingsPage] = useState(1);
  const [completedBookingsPage, setCompletedBookingsPage] = useState(1);
  const [rejectedBookingsPage, setRejectedBookingsPage] = useState(1);
  const itemsPerPage = 10;

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

  // Fetch test drive bookings
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["testDriveBookings", sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await sellerService.getTestDriveBookings(sellerId);
      const data = response?.bookings || response;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!sellerId && activeTab !== "slots",
  });

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
  console.log("bookingsData", bookingsData);
  const slots = slotsData || [];
  const bookings = bookingsData || [];
  const confirmedBookings = bookings.filter(
    (b: any) => b.status?.toLowerCase() === "confirmed"
  );
  const completedBookings = bookings.filter(
    (b: any) => b.status?.toLowerCase() === "completed"
  );
  const rejectedBookings = bookings.filter(
    (b: any) => b.status?.toLowerCase() === "cancelled" || b.status?.toLowerCase() === "expired"
  );
  const models = modelsData || [];
  const isLoading = isLoadingSlots || isLoadingModels;

  // Pagination calculations
  const totalActivePages = Math.ceil(confirmedBookings.length / itemsPerPage);
  const totalCompletedPages = Math.ceil(completedBookings.length / itemsPerPage);
  const totalRejectedPages = Math.ceil(rejectedBookings.length / itemsPerPage);

  const paginatedActiveBookings = confirmedBookings.slice(
    (activeBookingsPage - 1) * itemsPerPage,
    activeBookingsPage * itemsPerPage
  );
  const paginatedCompletedBookings = completedBookings.slice(
    (completedBookingsPage - 1) * itemsPerPage,
    completedBookingsPage * itemsPerPage
  );
  const paginatedRejectedBookings = rejectedBookings.slice(
    (rejectedBookingsPage - 1) * itemsPerPage,
    rejectedBookingsPage * itemsPerPage
  );

  // Update booking status mutations
  const completeBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      sellerService.markBookingAsCompleted(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testDriveBookings", sellerId] });
      showToast({
        text: "Booking marked as completed successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to mark booking as completed",
        type: "error",
      });
    },
  });

  const rejectBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      sellerService.markBookingAsCancelled(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testDriveBookings", sellerId] });
      showToast({
        text: "Booking rejected successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to reject booking",
        type: "error",
      });
    },
  });

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

  const handleMarkComplete = (bookingId: string) => {
    completeBookingMutation.mutate(bookingId);
  };

  const handleReject = (bookingId: string) => {
    setConfirmAlert?.({
      title: "Confirm Rejection",
      message: "Are you sure you want to reject this test drive booking?",
      cancelText: "Cancel",
      confirmText: "Reject",
      onConfirmAction() {
        rejectBookingMutation.mutate(bookingId);
      },
    });
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

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setFormData({ ...formData, location: value });
    // Reset validation state on input change
    setAddressValidation({
      isValidating: false,
      isValid: null,
      message: "",
    });
  };

  const handleCheckAddress = async () => {
    if (!formData.location.trim()) {
      return;
    }

    setAddressValidation({
      isValidating: true,
      isValid: null,
      message: "Validating address...",
    });

    try {
      const result = await validateAddress(formData.location);
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
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const getStatusChip = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "cancelled":
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Test Drive Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("slots")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "slots"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Test Drive Slots
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              {slots.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "bookings"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Active Bookings
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
              {confirmedBookings.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "completed"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Completed
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              {completedBookings.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "rejected"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Rejected/Expired
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
              {rejectedBookings.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Slots Tab */}
      {activeTab === "slots" && (
        <>
          {/* Add Button */}
          {!showAddForm && (
            <div className="flex justify-end">
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
            </div>
          )}

          {/* Add/Edit Form */}
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      required
                      placeholder="e.g., 123 Main Street, Colombo"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCheckAddress}
                      disabled={!formData.location.trim() || addressValidation.isValidating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {addressValidation.isValidating ? "Checking..." : "Check Address"}
                    </button>
                  </div>
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
        </>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Active Bookings</h2>
          {isLoadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader size={40} color="#4f46e5" />
            </div>
          ) : confirmedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {paginatedActiveBookings.map((booking: any) => (
                    <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.customer_id?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.customer_id?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.slot_id?.model_id?.brand_id?.brand_name || ""}{" "}
                          {booking.slot_id?.model_id?.model_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.booking_time} ({booking.duration_minutes} min)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.slot_id?.location || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleMarkComplete(booking._id)}
                            disabled={completeBookingMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {completeBookingMutation.isPending ? (
                              <>
                                <Loader size={8} color="#ffffff" />
                                Updating...
                              </>
                            ) : (
                              "Mark Complete"
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(booking._id)}
                            disabled={rejectBookingMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rejectBookingMutation.isPending ? (
                              <>
                                <Loader size={8} color="#ffffff" />
                                Rejecting...
                              </>
                            ) : (
                              "Reject"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              No active bookings found.
            </p>
          )}
          
          {/* Pagination Controls */}
          {totalActivePages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(activeBookingsPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(activeBookingsPage * itemsPerPage, confirmedBookings.length)} of{" "}
                {confirmedBookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveBookingsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={activeBookingsPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                {Array.from({ length: totalActivePages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setActiveBookingsPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      activeBookingsPage === page
                        ? "bg-blue-600 text-white dark:bg-blue-700"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setActiveBookingsPage((prev) => Math.min(prev + 1, totalActivePages))}
                  disabled={activeBookingsPage === totalActivePages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === "completed" && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Completed Bookings</h2>
          {isLoadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader size={40} color="#4f46e5" />
            </div>
          ) : completedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {paginatedCompletedBookings.map((booking: any) => (
                    <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.customer_id?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.customer_id?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.slot_id?.model_id?.brand_id?.brand_name || ""}{" "}
                          {booking.slot_id?.model_id?.model_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.booking_time} ({booking.duration_minutes} min)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.slot_id?.location || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              No completed bookings found.
            </p>
          )}
          
          {/* Pagination Controls */}
          {totalCompletedPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(completedBookingsPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(completedBookingsPage * itemsPerPage, completedBookings.length)} of{" "}
                {completedBookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompletedBookingsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={completedBookingsPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                {Array.from({ length: totalCompletedPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCompletedBookingsPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      completedBookingsPage === page
                        ? "bg-blue-600 text-white dark:bg-blue-700"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCompletedBookingsPage((prev) => Math.min(prev + 1, totalCompletedPages))}
                  disabled={completedBookingsPage === totalCompletedPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejected Tab */}
      {activeTab === "rejected" && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Rejected/Expired Bookings</h2>
          {isLoadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader size={40} color="#4f46e5" />
            </div>
          ) : rejectedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {paginatedRejectedBookings.map((booking: any) => (
                    <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.customer_id?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.customer_id?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.slot_id?.model_id?.brand_id?.brand_name || ""}{" "}
                          {booking.slot_id?.model_id?.model_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.booking_time} ({booking.duration_minutes} min)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.slot_id?.location || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              No rejected or expired bookings found.
            </p>
          )}
          
          {/* Pagination Controls */}
          {totalRejectedPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(rejectedBookingsPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(rejectedBookingsPage * itemsPerPage, rejectedBookings.length)} of{" "}
                {rejectedBookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectedBookingsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={rejectedBookingsPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                {Array.from({ length: totalRejectedPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setRejectedBookingsPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      rejectedBookingsPage === page
                        ? "bg-blue-600 text-white dark:bg-blue-700"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setRejectedBookingsPage((prev) => Math.min(prev + 1, totalRejectedPages))}
                  disabled={rejectedBookingsPage === totalRejectedPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestDrivesPage;
