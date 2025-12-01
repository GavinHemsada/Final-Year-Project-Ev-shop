import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaLeaf, FaBolt, FaDollarSign, FaTachometerAlt } from "react-icons/fa";
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
import { Loader } from "@/components/Loader";

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
    className="relative h-screen flex items-center justify-center text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.5 }}
  >
    <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
    <ReverseLoopVideo forward={bgVideo} backward={bgrevVideo} />
    <motion.div
      className="relative z-20 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated main heading */}
      <motion.h1
        variants={itemVariants}
        className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
      >
        The Future is Electric.
      </motion.h1>
      <motion.p
        // Animated paragraph describing the vision.
        variants={itemVariants}
        className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300"
      >
        Discover a new era of driving. Unmatched performance, sustainable
        energy, and breathtaking design.
      </motion.p>
      <motion.div variants={itemVariants}>
        {/* Call-to-action button linking to the models page. */}
        <Link
          to="/models"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105"
        >
          Explore Models
        </Link>
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
            ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${vehicle.images[0]}`
            : "https://via.placeholder.com/400x300?text=No+Image";
        const logo = vehicle.model_id?.brand_id?.brand_logo
          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${vehicle.model_id.brand_id.brand_logo}`
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
    <section className="py-20 bg-slate-800">
      <div className="container mx-auto px-6">
        <motion.h2
          className="text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Our Signature Collection
        </motion.h2>
        {/* Grid container for the model cards with staggered animations. */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader size={50} color="#3b82f6" />
          </div>
        ) : error ? (
          <div className="text-center text-gray-400 py-12">
            <p>Unable to load featured vehicles. Please try again later.</p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs mt-2 text-red-400">
                Error: {error instanceof Error ? error.message : "Unknown error"}
              </p>
            )}
          </div>
        ) : featuredModels.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No featured vehicles available at the moment.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {featuredModels.map((model: any, index: number) => (
              <EvModelCard
                key={model.name + index}
                name={model.name}
                image={model.image}
                logo={model.logo}
                price={model.price}
                specs={model.specs}
                range={model.range}
                linkTo={model.linkTo}
              />
            ))}
          </motion.div>
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
const WhyChooseUsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-6">
      <motion.h2
        className="text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        The EV Advantage
      </motion.h2>
      {/* Grid container for the benefit cards with staggered animations. */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Map through the `benefits` data to render each benefit card. */}
        {benefits.map((benefit) => (
          <motion.div
            key={benefit.title}
            className="bg-slate-800 p-8 rounded-lg"
            variants={itemVariants}
          >
            <div className="text-blue-500 text-5xl mb-4 inline-block">
              {/* Benefit icon */}
              {benefit.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
            <p className="text-gray-400">{benefit.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/**
 * EVHomePage Component
 * This is the main component for the homepage. It assembles the Hero,
 * Featured Models, and Why Choose Us sections into a single page layout.
 */
const EVHomePage = () => {
  return (
    <div className="bg-slate-900 text-white font-sans min-h-screen">
      {/* ===== Hero Section ===== */}
      <HeroSection />

      {/* ===== Featured Models Section ===== */}
      <FeaturedModelsSection />

      {/* ===== Why Choose Electric Section ===== */}
      <WhyChooseUsSection />
    </div>
  );
};

export default EVHomePage;
