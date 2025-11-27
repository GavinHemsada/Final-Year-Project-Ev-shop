import { HeartIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";

export const SavedVehicles: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => (
  <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
    <h1 className="text-3xl font-bold mb-6 dark:text-white">Saved Vehicles</h1>
    <div className="text-center py-16 dark:bg-gray-800">
      <HeartIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-white">
        No Saved Vehicles
      </h2>
      <p className="text-gray-500 mt-2 dark:text-gray-400">
        Click the heart icon on a vehicle to save it here.
      </p>
    </div>
  </div>
);
