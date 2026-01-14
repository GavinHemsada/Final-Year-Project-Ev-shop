import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/components/animations/variants";
import { EvModelCard } from "@/components/EvModelCard";
import { useQuery } from "@tanstack/react-query";
import { welcomeService } from "./welcomeService";
import type { Vehicle } from "@/types";
import { Loader } from "@/components/Loader";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCar } from "react-icons/fa";

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
  const totalVehicles = listingsData?.total || 0;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <FaCar className="text-5xl" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Our Electric Fleet
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              Discover the perfect electric vehicle to power your journey. Explore our curated collection of premium EVs.
            </p>
            {totalVehicles > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full"
              >
                <span className="text-lg font-semibold">{totalVehicles} Vehicles Available</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-16">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center min-h-[400px]">
              <Loader size={60} color="#6366f1" />
              <p className="mt-4 text-gray-600 text-lg">Loading vehicles...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl shadow-lg border border-red-200 max-w-2xl mx-auto"
            >
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Vehicles</h2>
              <p className="text-gray-600 mb-4">Please try again later.</p>
              {error instanceof Error && (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  {error.message}
                </p>
              )}
            </motion.div>
          ) : carModels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-2xl mx-auto"
            >
              <div className="text-gray-400 text-5xl mb-4">🚗</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Vehicles Available</h2>
              <p className="text-gray-600">Check back soon for new listings!</p>
            </motion.div>
          ) : (
            <>
              {/* Results Count */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 flex items-center justify-between flex-wrap gap-4"
              >
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {((page - 1) * limit) + 1}-{Math.min(page * limit, totalVehicles)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{totalVehicles}</span> vehicles
                </div>
              </motion.div>

              {/* Vehicles Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {carModels.map((model: any, index: number) => (
                  <motion.div
                    key={model.name + index}
                    variants={itemVariants}
                    className="transform transition-all duration-300 hover:scale-105"
                  >
                    <EvModelCard
                      name={model.name}
                      image={model.image}
                      logo={model.logo}
                      price={model.price}
                      range={model.range}
                      acceleration={model.acceleration}
                      showLink={true}
                      linkTo={model.linkTo}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
                  >
                    <FaChevronLeft className="text-sm" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md border border-gray-200">
                    <span className="text-gray-700 font-medium">
                      Page <span className="text-blue-600 font-bold">{page}</span> of{" "}
                      <span className="text-blue-600 font-bold">{totalPages}</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
                  >
                    Next
                    <FaChevronRight className="text-sm" />
                  </button>
                </motion.div>
              )}

              {/* Quick Stats */}
              {totalVehicles > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-2xl"
                >
                  <h3 className="text-2xl font-bold mb-4">Ready to Find Your Perfect EV?</h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Browse our extensive collection of electric vehicles. Each vehicle is carefully selected and verified for quality.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/services"
                      className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      View Services
                    </a>
                    <a
                      href="/contact"
                      className="bg-blue-700/50 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 border border-white/20"
                    >
                      Contact Us
                    </a>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModelsPage;
