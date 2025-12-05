import { motion } from "framer-motion";
import { containerVariants } from "@/components/animations/variants";
import { EvModelCard } from "@/components/EvModelCard";
import { useQuery } from "@tanstack/react-query";
import { welcomeService } from "./welcomeService";
import type { Vehicle } from "@/types";
import { Loader } from "@/components/Loader";
import { useState } from "react";

const ModelsPage = () => {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: listingsData, isLoading, error } = useQuery({
    queryKey: ["allListings", page],
    queryFn: () => welcomeService.getAllListings({ page, limit }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it failed
  });

  // Transform Vehicle data to EvModelCard format
  // Handle both direct array response and wrapped response
  const listings = Array.isArray(listingsData) 
    ? listingsData 
    : listingsData?.listings || [];

  const carModels = listings.length > 0
    ? listings.map((vehicle: Vehicle) => {
        const modelName = vehicle.model_id?.model_name || "Unknown Model";
        const brandName = vehicle.model_id?.brand_id?.brand_name || "";
        const fullName = brandName ? `${brandName} - ${modelName}` : modelName;
        const image =
          vehicle.images && vehicle.images.length > 0
            ? `${import.meta.env.VITE_API_URL}${vehicle.images[0]}`
            : "https://via.placeholder.com/400x300?text=No+Image";
        const logo = vehicle.model_id?.brand_id?.brand_logo
          ? `${import.meta.env.VITE_API_URL}${vehicle.model_id.brand_id.brand_logo}`
          : undefined;
        const price = vehicle.price
          ? `LKR ${vehicle.price.toLocaleString("en-US")}`
          : undefined;
        const range = vehicle.model_id?.range_km
          ? `${vehicle.model_id.range_km} km`
          : undefined;
        const acceleration = vehicle.model_id?.motor_type
          ? vehicle.model_id.motor_type
          : undefined;

        return {
          name: fullName,
          image,
          logo,
          price,
          range,
          acceleration,
          linkTo: `/user/vehicle/${vehicle._id}`,
        };
      })
    : [];

  const totalPages = listingsData?.totalPages || 1;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-gray-900">Our Electric Fleet</h1>
            <p className="text-lg text-gray-600 mt-2">
              Find the perfect vehicle to power your journey.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader size={50} color="#3b82f6" />
            </div>
          ) : error ? (
            <div className="text-center text-gray-600 py-12">
              <p>Unable to load vehicles. Please try again later.</p>
              <p className="text-sm mt-2 text-gray-500">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : carModels.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p>No vehicles available at the moment.</p>
            </div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {carModels.map((model: any, index: number) => (
                  <EvModelCard
                    key={model.name + index}
                    name={model.name}
                    image={model.image}
                    logo={model.logo}
                    price={model.price}
                    range={model.range}
                    acceleration={model.acceleration}
                    showLink={true}
                    linkTo={model.linkTo}
                  />
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModelsPage;
