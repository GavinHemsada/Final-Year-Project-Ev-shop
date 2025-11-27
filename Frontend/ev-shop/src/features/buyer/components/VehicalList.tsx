import { LazyVehicleCard } from "@/components/EvModelCard";
import { Pagination } from "@/components/PaginationBar";
import type { Vehicle, AlertProps } from "@/types";
import React, { useCallback } from "react";

/**
 * Props for the VehicleList component.
 */
type VehicleListProps = {
  vehicles: Vehicle[];
  totalVehicles: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  setAlert?: (alert: AlertProps | null) => void;
};

/**
 * A component that displays a list of vehicles in a responsive grid
 * with pagination controls at the bottom.
 */
export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  totalVehicles,
  currentPage,
  itemsPerPage,
  onPageChange,
  setAlert,
}) => {
  const totalPages = Math.ceil(totalVehicles / itemsPerPage);

  // Scroll to top on page change
  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onPageChange]
  );

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">
          No Vehicles Found
        </h2>
        <p className="text-gray-500 mt-2 dark:text-gray-400">
          Try adjusting your search term.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Main title */}
      <h1 className="text-3xl font-bold mb-8 dark:text-white">
        Explore Our Vehicles
      </h1>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
        {vehicles.map((v, index) => (
          <LazyVehicleCard key={v._id} vehicle={v} setAlert={setAlert} />
        ))}
      </div>

      {/* Pagination Controls */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};
