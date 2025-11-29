import { useState, useEffect } from "react";
import { HeartIcon } from "@/assets/icons/icons";
import type { AlertProps, Vehicle } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { buyerService } from "../buyerService";
import { LazyVehicleCard } from "@/components/EvModelCard";
import { Loader } from "@/components/Loader";
import { useToast } from "@/context/ToastContext";

const SavedVehicles: React.FC<{
  setAlert?: (alert: AlertProps | null) => void; // Keep for backward compatibility but prefer toast
}> = ({ setAlert }) => {
  const { getUserID } = useAuth();
  const userId = getUserID();
  const { showToast } = useToast();
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSavedVehicles();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchSavedVehicles = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await buyerService.getSavedVehicles(userId);

      // handleResult unwraps the response, so response is directly the savedVehicles array
      let savedVehiclesData: any[] = [];

      if (Array.isArray(response)) {
        // Response is directly the array (unwrapped by handleResult)
        savedVehiclesData = response;
      } else if (response && Array.isArray(response.savedVehicles)) {
        // Response has the wrapper structure (fallback)
        savedVehiclesData = response.savedVehicles;
      } else if (response && response.success && Array.isArray(response.savedVehicles)) {
        // Response has success wrapper (fallback)
        savedVehiclesData = response.savedVehicles;
      }

      // Map saved vehicles to Vehicle type format
      const vehicles: Vehicle[] = savedVehiclesData
        .filter((saved: any) => saved && saved.listing_id) // Filter out any null/undefined entries
        .map((saved: any) => {
          const listing = saved.listing_id;
          if (!listing) return null;

          return {
            ...listing,
            _id: listing._id || listing.id,
          };
        })
        .filter((v: Vehicle | null) => v !== null) as Vehicle[];

      setSavedVehicles(vehicles);
    } catch (error: any) {
      console.error("Failed to fetch saved vehicles:", error);
      const errorMessage = error?.response?.data?.message || "Failed to load saved vehicles";
      showToast({
        text: errorMessage,
        type: "error",
      });
      setSavedVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (listingId: string) => {
    if (!userId) return;

    try {
      await buyerService.removeSavedVehicle(userId, listingId);
      // If no error thrown, assume success
      // Remove from local state
      setSavedVehicles((prev) => prev.filter((v) => v._id !== listingId));
      showToast({
        text: "Vehicle removed from saved",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to remove saved vehicle:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to remove saved vehicle";
      showToast({
        text: errorMessage,
        type: "error",
      });
    }
  };

  if (!userId) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Saved Vehicles
        </h1>
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view your saved vehicles.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Saved Vehicles
        </h1>
        <div className="flex justify-center items-center py-16">
          <Loader size={40} color="#4f46e5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">
        Saved Vehicles
      </h1>

      {savedVehicles.length === 0 ? (
        <div className="text-center py-16">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-white">
            No Saved Vehicles
          </h2>
          <p className="text-gray-500 mt-2 dark:text-gray-400">
            Click the heart icon on a vehicle to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVehicles.map((vehicle) => (
            <LazyVehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedVehicles;
