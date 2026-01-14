import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaLeaf, FaBolt, FaDollarSign, FaTachometerAlt, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import {
  containerVariants,
  itemVariants,
} from "../components/animations/variants";
import { EvModelCard } from "@/components/EvModelCard";
import bgVideo from "@/assets/Video/bg_video.mp4";
import bgrevVideo from "@/assets/Video/bg_video_reversed.mp4";
import ReverseLoopVideo from "@/hooks/videoRevice";
import { useQuery } from "@tanstack/react-query";
import { welcomeService } from "./welcomeService";
import type { Vehicle } from "@/types";
import { PageLoader } from "@/components/Loader";
import { queryKeys } from "@/config/queryKeys";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom marker icon for service locations
const serviceLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RepairLocation {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// --- Benefits Data (static content) ---
const benefits = [
  {
    icon: <FaLeaf />,
    title: "Zero Emissions",
    description:
      "Drive clean and reduce your carbon footprint with every trip.",
  },
  {
    icon: <FaDollarSign />,
    title: "Lower Running Costs",
    description:
      "Save on fuel and maintenance. Electricity is cheaper than petrol.",
  },
  {
    icon: <FaBolt />,
    title: "Instant Torque",
    description:
      "Experience exhilarating acceleration the moment you press the pedal.",
  },
  {
    icon: <FaTachometerAlt />,
    title: "Cutting-Edge Tech",
    description: "Enjoy the latest in-car technology and autonomous features.",
  },
];

/**
 * HeroSection Component
 * This component renders the main hero section at the top of the homepage,
 * featuring a background video, an overlay, and animated text content with a call-to-action button.
 */
const HeroSection = () => (
  <motion.section
    className="relative h-screen flex items-center justify-center text-center overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.5 }}
  >
    {/* Gradient overlay for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10"></div>
    
    {/* Animated background elements */}
    <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>

    <ReverseLoopVideo forward={bgVideo} backward={bgrevVideo} />
    
    <motion.div
      className="relative z-20 p-4 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated main heading with gradient text */}
      <motion.h1
        variants={itemVariants}
        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight"
      >
        <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
          The Future is
        </span>
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Electric.
        </span>
      </motion.h1>
      
      <motion.p
        variants={itemVariants}
        className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-10 text-gray-200 leading-relaxed"
      >
        Discover a new era of driving. Unmatched performance, sustainable
        energy, and breathtaking design.
      </motion.p>
      
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        {/* Primary CTA button */}
        <Link
          to="/models"
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-blue-500/50 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Explore Models
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          />
        </Link>
        
        {/* Secondary CTA button */}
        <Link
          to="/services"
          className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 border border-white/20 hover:border-white/40"
        >
          Our Services
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  </motion.section>
);

/**
 * FeaturedModelsSection Component
 * This component displays a grid of featured car models fetched from the API.
 * It uses `whileInView` to trigger animations as the user scrolls down.
 */
const FeaturedModelsSection = () => {
  const { data: listingsData, isLoading, error } = useQuery({
    queryKey: ["featuredListings"],
    queryFn: () => welcomeService.getFeaturedListings(6),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it failed
  });

  // Transform Vehicle data to EvModelCard format
  // Handle both direct array response and wrapped response
  const listings = Array.isArray(listingsData) 
    ? listingsData 
    : listingsData?.listings || [];

  const featuredModels = listings.length > 0
    ? listings.map((vehicle: Vehicle) => {
        const modelName = vehicle.model_id?.model_name || "Unknown Model";
        const brandName = vehicle.model_id?.brand_id?.brand_name || "";
        const fullName = brandName ? `${brandName} ${modelName}` : modelName;
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
          ? `${vehicle.model_id.range_km} km Range`
          : undefined;
        const specs = vehicle.model_id?.motor_type || undefined;

        return {
          name: fullName,
          image,
          logo,
          price,
          range,
          specs,
          linkTo: `/user/vehicle/${vehicle._id}`,
        };
      })
    : [];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Our Signature Collection
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked electric vehicles that represent the pinnacle of innovation and performance
          </p>
        </motion.div>

        {/* Grid container for the model cards with staggered animations. */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <PageLoader />
            <p className="mt-4 text-gray-600">Loading featured vehicles...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg border border-red-200 max-w-2xl mx-auto"
          >
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Vehicles</h3>
            <p className="text-gray-600 mb-4">Please try again later.</p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            )}
          </motion.div>
        ) : featuredModels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-2xl mx-auto"
          >
            <div className="text-gray-400 text-5xl mb-4">🚗</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Featured Vehicles</h3>
            <p className="text-gray-600">Check back soon for new listings!</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {featuredModels.map((model: any, index: number) => (
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
                    specs={model.specs}
                    range={model.range}
                    linkTo={model.linkTo}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* View All CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Link
                to="/models"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                View All Vehicles
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

/**
 * WhyChooseUsSection Component
 * This component highlights the key benefits of owning an electric vehicle.
 * It displays a grid of benefit cards with icons, titles, and descriptions.
 */
const WhyChooseUsSection = () => {
  const benefitColors = [
    'from-green-500 to-emerald-600',
    'from-blue-500 to-cyan-600',
    'from-yellow-500 to-orange-600',
    'from-purple-500 to-pink-600',
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            The EV Advantage
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of transportation with cutting-edge technology and sustainable innovation
          </p>
        </motion.div>

        {/* Grid container for the benefit cards with staggered animations. */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Map through the `benefits` data to render each benefit card. */}
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`bg-gradient-to-r ${benefitColors[index]} w-16 h-16 rounded-full flex items-center justify-center text-white mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-2xl">
                  {benefit.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 text-center">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed text-center">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/**
 * ServiceMapSection Component
 * Displays a map with service locations. When a marker is clicked,
 * shows only the address and a "Show More" button that redirects to login.
 */
const ServiceMapSection = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<RepairLocation | null>(null);
  
  const { data: locationsData, isLoading, error } = useQuery({
    queryKey: queryKeys.activeRepairLocations,
    queryFn: () => welcomeService.getActiveRepairLocations(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    retryOnMount: false,
  });

  // Handle both direct array response and wrapped response
  const locations: RepairLocation[] = Array.isArray(locationsData)
    ? locationsData
    : locationsData?.locations || [];

  // Calculate map center based on locations or default to Sri Lanka center
  const defaultCenter: L.LatLngExpression = [7.8731, 80.7718]; // Center of Sri Lanka
  const mapCenter: L.LatLngExpression =
    locations.length > 0
      ? [
          locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length,
          locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length,
        ]
      : defaultCenter;

  const handleMarkerClick = (location: RepairLocation) => {
    setSelectedLocation(location);
  };

  const handleShowMore = () => {
    navigate("/auth/login");
  };

  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Find Service Locations Near You
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover authorized EV service centers across the country. Click on any location to see details.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[500px]">
            <PageLoader />
            <p className="mt-4 text-gray-600">Loading service locations...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg border border-red-200 max-w-2xl mx-auto"
          >
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Locations</h3>
            <p className="text-gray-600">Please try again later.</p>
          </motion.div>
        ) : locations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-2xl mx-auto"
          >
            <div className="text-gray-400 text-5xl mb-4">📍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Service Locations</h3>
            <p className="text-gray-600">Check back soon for new locations!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <div className="h-[500px] md:h-[600px] relative">
                <MapContainer
                  center={mapCenter}
                  zoom={locations.length > 1 ? 8 : 10}
                  scrollWheelZoom={true}
                  className="h-full w-full z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {locations.map((location) => (
                    <Marker
                      key={location._id}
                      position={[location.latitude, location.longitude]}
                      icon={serviceLocationIcon}
                      eventHandlers={{
                        click: () => handleMarkerClick(location),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <strong className="text-sm">{location.name}</strong>
                          <br />
                          <span className="text-xs text-gray-600">{location.address}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Custom Popup Modal for Selected Location */}
            <AnimatePresence>
              {selectedLocation && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClosePopup}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                  >
                    {/* Modal */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-200 relative"
                    >
                      {/* Close button */}
                      <button
                        onClick={handleClosePopup}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>

                      {/* Location Icon */}
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <FaMapMarkerAlt className="text-white text-2xl" />
                        </div>
                      </div>

                      {/* Location Name */}
                      <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">
                        {selectedLocation.name}
                      </h3>

                      {/* Address */}
                      <div className="bg-gray-100 rounded-lg p-4 mb-6">
                        <p className="text-gray-700 text-center text-sm md:text-base">
                          {selectedLocation.address}
                        </p>
                      </div>

                      {/* Show More Button */}
                      <button
                        onClick={handleShowMore}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Show More
                      </button>

                      <p className="text-xs text-gray-500 text-center mt-4">
                        Sign in to view full details and contact information
                      </p>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

/**
 * CTASection Component
 * Final call-to-action section at the bottom of the homepage
 */
const CTASection = () => (
  <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
    </div>
    <div className="container mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Make the Switch?
        </h2>
        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
          Join thousands of satisfied customers who have already made the transition to electric vehicles. Start your journey today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/models"
            className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Browse Vehicles
          </Link>
          <Link
            to="/contact"
            className="bg-blue-700/50 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            Get in Touch
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

/**
 * EVHomePage Component
 * This is the main component for the homepage. It assembles the Hero,
 * Featured Models, Why Choose Us, Service Map, and CTA sections into a single page layout.
 */
const EVHomePage = () => {
  return (
    <div className="bg-white font-sans min-h-screen">
      {/* ===== Hero Section ===== */}
      <HeroSection />

      {/* ===== Featured Models Section ===== */}
      <FeaturedModelsSection />

      {/* ===== Why Choose Electric Section ===== */}
      <WhyChooseUsSection />

      {/* ===== Service Map Section ===== */}
      <ServiceMapSection />

      {/* ===== CTA Section ===== */}
      <CTASection />
    </div>
  );
};

export default EVHomePage;
