import { useMemo } from "react";
import { HeartIcon } from "@/assets/icons/icons";
import type { Vehicle } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { buyerService } from "../buyerService";
import { LazyVehicleCard } from "@/components/EvModelCard";
import { Loader } from "@/components/Loader";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

const SavedVehicles: React.FC = () => {
  const { getUserID } = useAuth();
  const userId = getUserID();

  const {
    data: savedVehiclesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.savedVehicles(userId!),
    queryFn: () => buyerService.getSavedVehicles(userId!),
    enabled: !!userId,
    select: (response: any) => {
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && Array.isArray(response.savedVehicles)) {
        data = response.savedVehicles;
      }
      return (
        data
          .filter((saved: any) => saved && saved.listing_id)
          .map((saved: any) => ({
            ...saved.listing_id,
            _id: saved.listing_id._id || saved.listing_id.id,
          }))
          .filter(Boolean) || []
      );
    },
  });

  const savedVehicles: Vehicle[] = useMemo(
    () => savedVehiclesData || [],
    [savedVehiclesData]
  );

  // const removeMutation = useMutation({
  //   mutationFn: (listingId: string) =>
  //     buyerService.removeSavedVehicle(userId!, listingId),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: queryKeys.savedVehicles(userId!),
  //     });
  //     setAlert?.({
  //       id: Date.now(),
  //       title: "Success",
  //       message: "Vehicle removed from saved list.",
  //       type: "success",
  //     });
  //   },
  //   onError: (error: any) => {
  //     setAlert?.({
  //       id: Date.now(),
  //       title: "Error",
  //       message: error?.response?.data?.message || "Failed to remove vehicle.",
  //       type: "error",
  //     });
  //   },
  // });

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

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Saved Vehicles
        </h1>
        <div className="text-center py-16 text-red-500">
          <p>Failed to load saved vehicles. Please try again later.</p>
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
