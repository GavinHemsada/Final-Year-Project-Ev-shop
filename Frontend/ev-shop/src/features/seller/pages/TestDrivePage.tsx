import React, { useState, useEffect } from "react";
import {
  CarIcon,
  CalendarIcon,
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
} from "@/assets/icons/icons";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { sellerService } from "../sellerService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";

interface TestDriveSlot {
  _id: string;
  seller_id: string;
  location: string;
  model_id: {
    _id: string;
    model_name: string;
    brand_id?: {
      brand_name: string;
    };
  };
  available_date: string;
  max_bookings: number;
  is_active: boolean;
}

interface EvModel {
  _id: string;
  model_name: string;
  brand_id?: {
    brand_name: string;
  };
}

/**
 * A page for sellers to manage test drive slots.
 */
export const TestDrivesPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const userId = useAppSelector(selectUserId);
  const [slots, setSlots] = useState<TestDriveSlot[]>([]);
  const [models, setModels] = useState<EvModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(true); // Show form by default
  const [editingSlot, setEditingSlot] = useState<TestDriveSlot | null>(null);
  const [formData, setFormData] = useState({
    model_id: "",
    location: "",
    available_date: "",
    max_bookings: 1,
    is_active: true,
  });

  // Fetch seller profile and slots
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        // Get seller profile to get seller ID
        const sellerResponse = await sellerService.getSellerProfile(userId);
        // handleResult unwraps the response, so response is directly the seller object
        const seller = sellerResponse?.seller || sellerResponse;
        if (seller?._id) {
          setSellerId(seller._id);

          // Fetch slots for this seller
          const slotsResponse = await sellerService.getTestDriveSlotsBySeller(
            seller._id
          );
          // handleResult unwraps the response, so response is directly the slots array
          const slotsData = slotsResponse?.slots || slotsResponse;
          if (Array.isArray(slotsData)) {
            setSlots(slotsData);
          } else {
            setSlots([]);
          }

          // Fetch seller's own listings to get their models
          const listingsResponse = await sellerService.getSellerEvList(
            seller._id
          );
          // handleResult unwraps the response
          const listingsData = listingsResponse?.listings || listingsResponse;
          if (Array.isArray(listingsData)) {
            // Extract unique models from seller's listings
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
            setModels(Array.from(uniqueModels.values()));
          } else {
            setModels([]);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        setAlert?.({
          id: Date.now(),
          title: "Error",
          message: "Failed to load test drive slots",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, setAlert]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) return;

    try {
      const slotData = {
        seller_id: sellerId,
        model_id: formData.model_id,
        location: formData.location,
        available_date: new Date(formData.available_date).toISOString(),
        max_bookings: formData.max_bookings,
        is_active: formData.is_active,
      };

      const response = await sellerService.createTestDriveSlot(slotData);
      // handleResult unwraps the response
      const newSlot = response?.slot || response;

      if (newSlot) {
        setSlots([...slots, newSlot]);
        setShowAddForm(false);
        resetForm();
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Test drive slot created successfully!",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Failed to create slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create test drive slot";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    try {
      const slotData = {
        seller_id: sellerId,
        model_id: formData.model_id,
        location: formData.location,
        available_date: new Date(formData.available_date).toISOString(),
        max_bookings: formData.max_bookings,
        is_active: formData.is_active,
      };

      const response = await sellerService.updateTestDriveSlot(
        editingSlot._id,
        slotData
      );
      // handleResult unwraps the response
      const updatedSlot = response?.slot || response;

      if (updatedSlot) {
        setSlots(
          slots.map((slot) =>
            slot._id === editingSlot._id ? updatedSlot : slot
          )
        );
        setEditingSlot(null);
        resetForm();
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Test drive slot updated successfully!",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Failed to update slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update test drive slot";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this test drive slot?")
    ) {
      return;
    }

    try {
      await sellerService.deleteTestDriveSlot(slotId);
      setSlots(slots.filter((slot) => slot._id !== slotId));
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Test drive slot deleted successfully!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to delete slot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete test drive slot";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
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
  };

  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Please log in to manage test drive slots.
        </p>
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
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
                placeholder="e.g., 123 Main Street, Colombo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
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
