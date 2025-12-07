import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { itemVariants, cardHover } from "./animations/variants"; // Adjust path as needed
import { HeartIcon } from "@/assets/icons/icons";
import type { Vehicle, AlertProps } from "@/types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import React, { useMemo, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/context/AuthContext";
import { buyerService } from "@/features/buyer/buyerService";
import { useAddToCart } from "@/hooks/useCart";
import { useToast } from "@/context/ToastContext";

const apiURL = import.meta.env.VITE_API_URL;

interface EvModelCardProps {
  // Required props
  name: string;
  image: string;

  // Optional props
  logo?: string;
  price?: string;
  specs?: string;
  range?: string;
  acceleration?: string;
  showLink?: boolean;
  linkTo?: string; // <-- New optional prop for the link
}

/**
 * EvModelCard Component
 * A flexible card for an EV model. Only `name` and `image` are required.
 * All other details are optional and will only be rendered if provided.
 * The link destination can be customized via the `linkTo` prop,
 * otherwise it defaults to a slug generated from the `name`.
 *
 * @param {EvModelCardProps} props - The properties for the model card.
 */
export const EvModelCard = React.memo(
  ({
    name,
    image,
    logo,
    price,
    specs,
    range,
    acceleration,
    showLink = true,
    linkTo, // <-- Destructured linkTo prop
  }: EvModelCardProps) => {
    // Generate a fallback URL slug if no `linkTo` prop is provided
    const modelSlug = name.toLowerCase().replace(/ /g, "-");

    // Use the provided `linkTo` prop if it exists, otherwise use the generated slug
    const destination = linkTo ? linkTo : `/models/${modelSlug}`;

    return (
      <motion.div
        className="bg-slate-800 rounded-lg overflow-hidden shadow-lg group"
        variants={itemVariants} // Assumes itemVariants is imported
        whileHover={cardHover} // Assumes cardHover is imported
      >
        {/* --- Image Section (Required) --- */}
        <div className="relative">
          <img src={image} alt={name} className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {logo && (
            <img
              src={logo}
              alt={`${name} logo`}
              loading="lazy"
              className="absolute top-4 right-4 h-12 w-auto"
            />
          )}

          <h2 className="absolute bottom-4 left-4 text-3xl font-bold text-white z-10">
            {name}
          </h2>
        </div>

        {/* --- Content & Specs Section (All Optional) --- */}
        <div className="p-6">
          {price && (
            <p className="text-lg text-blue-400 font-semibold mb-4">{price}</p>
          )}

          {specs && <p className="text-gray-400 mb-4">{specs}</p>}

          {(range || acceleration) && (
            <div className="flex justify-between text-gray-300 mb-6">
              {range && (
                <div className="text-center">
                  <p className="font-bold text-xl">{range}</p>
                  <p className="text-sm text-gray-500">Range</p>
                </div>
              )}

              {acceleration && (
                <div className="text-center">
                  <p className="font-bold text-xl">{acceleration}</p>
                  <p className="text-sm text-gray-500">0-100 km/h</p>
                </div>
              )}
            </div>
          )}

          {/* --- Conditionally Rendered Link Button --- */}
          {showLink && (
            <Link
              to={destination} // <-- Uses the dynamic destination URL
              className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-300 transform group-hover:scale-105"
            >
              Learn More
            </Link>
          )}
        </div>
      </motion.div>
    );
  }
);

const SkeletonCard: React.FC = () => (
  <div
    className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700"
    style={{ minHeight: "434px" }} // <-- CRITICAL: Set explicit min-height
  >
    {/* Simple skeleton animation */}
    <div className="h-56 w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    <div className="p-6">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4 animate-pulse"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4 animate-pulse"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full mt-6 animate-pulse"></div>
    </div>
  </div>
);

const swiperModules = [Navigation, Autoplay, Pagination];

export const VehicleCard: React.FC<{
  vehicle: Vehicle;
  className?: string;
  style?: React.CSSProperties;
  setAlert?: (alert: AlertProps | null) => void; // Keep for backward compatibility but prefer toast
}> = ({ vehicle, className, style, setAlert }) => {
  const { model_id, images, seller_id } = vehicle;
  const { getUserID } = useAuth();
  const userId = getUserID();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const addToCartMutation = useAddToCart();
  const { showToast } = useToast();

  // Check if vehicle is saved on mount
  useEffect(() => {
    if (userId && vehicle._id) {
      buyerService
        .checkIfVehicleSaved(userId, vehicle._id)
        .then((response) => {
          // handleResult unwraps the response and returns just the isSaved boolean
          // So response is directly the boolean value
          if (typeof response === "boolean") {
            setIsSaved(response);
          } else if (response && typeof response.isSaved === "boolean") {
            // Fallback in case response is still wrapped
            setIsSaved(response.isSaved);
          }
        })
        .catch((error) => {
          console.error("Error checking saved status:", error);
          // Silently fail - user might not be logged in
        });
    }
  }, [userId, vehicle._id]);

  // Handle save/unsave
  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showToast({
        text: "Please log in to save vehicles",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await buyerService.removeSavedVehicle(userId, vehicle._id);
        setIsSaved(false);
        showToast({
          text: "Vehicle removed from saved list!",
          type: "success",
        });
      } else {
        await buyerService.saveVehicle(userId, vehicle._id);
        setIsSaved(true);
        showToast({
          text: "Vehicle added to saved list!",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle save:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update saved status";
      showToast({
        text: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Memoize image URLs to prevent recreation
  const imageUrls = useMemo(
    () => images?.map((img) => `${apiURL}${img}`) || [],
    [images]
  );

  // Get brand logo URL
  const brandLogoUrl = model_id?.brand_id?.brand_logo
    ? `${apiURL}${model_id.brand_id.brand_logo}`
    : null;

  // Get vehicle type/category name
  const vehicleType = model_id?.category_id?.category_name || "EV";

  // Format price with LKR
  const formattedPrice = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on request";

  // Get seller shop name
  const sellerShopName = seller_id?.business_name || "Seller";

  // Get seller logo (prefer shop_logo, fallback to user profile_image)
  const sellerLogo = seller_id?.shop_logo
    ? `${apiURL}${seller_id.shop_logo}`
    : seller_id?.user_id?.profile_image
    ? `${apiURL}${seller_id.user_id.profile_image}`
    : null;

  // Memoize image slides
  const imageSlides = useMemo(
    () =>
      imageUrls.map((url, i) => (
        <SwiperSlide key={url}>
          <div className="relative h-56 w-full">
            <img
              className="h-56 w-full object-cover"
              src={url}
              alt={`${model_id.model_name} image ${i + 1}`}
              loading="lazy"
              decoding="async"
            />
            {/* Brand Logo Overlay */}
            {brandLogoUrl && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                <img
                  src={brandLogoUrl}
                  alt={`${model_id?.brand_id?.brand_name || "Brand"} logo`}
                  className="h-8 w-auto max-w-[80px] object-contain"
                  loading="lazy"
                />
              </div>
            )}
            {/* Vehicle Type Badge */}
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              {vehicleType}
            </div>
          </div>
        </SwiperSlide>
      )),
    [imageUrls, model_id.model_name, brandLogoUrl, vehicleType]
  );

  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest(".swiper-button") ||
      target.closest(".swiper-pagination")
    ) {
      return;
    }
    navigate(`/user/vehicle/${vehicle._id}`);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700 cursor-pointer ${className}`}
      style={style}
      onClick={handleCardClick}
    >
      {/* 🔹 Image Slider */}
      <Swiper
        modules={swiperModules}
        navigation
        pagination={{ clickable: true }}
        autoplay={false} // initially disabled for performance
        loop
        className="h-56 w-full"
        lazyPreloadPrevNext={1}
        watchSlidesProgress
      >
        {imageSlides}
      </Swiper>

      {/* 🔹 Card Body */}
      <div className="p-6">
        {/* Seller Info Section */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0">
            {/* Seller Logo/Profile Image */}
            {sellerLogo ? (
              <img
                src={sellerLogo}
                alt={sellerShopName}
                className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                loading="lazy"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {sellerShopName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Sold by
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {sellerShopName}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="uppercase tracking-wide text-xs text-gray-500 dark:text-gray-400 mb-1">
              {model_id?.brand_id?.brand_name || "Brand"}
            </div>
            <div className="uppercase tracking-wide text-sm text-blue-600 font-bold dark:text-blue-400">
              {vehicle.model_id.model_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {vehicle.model_id.year} • {vehicleType}
            </div>
          </div>
          <button
            onClick={handleSaveToggle}
            disabled={isSaving || !userId}
            className={`p-2 -mr-2 -mt-2 transition-colors ${
              isSaved
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500"
            } dark:text-gray-500 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isSaved ? "Remove from saved" : "Save vehicle"}
          >
            <HeartIcon className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
          {formattedPrice}
        </p>

        <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            <strong>Range:</strong> {vehicle.model_id.range_km} km
          </span>
          <span>
            <strong className="dark:text-gray-300">Battery:</strong>{" "}
            {vehicle.model_id.battery_capacity_kwh} kWh
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!userId) {
                showToast({
                  text: "Please log in to add items to your cart",
                  type: "error",
                });
                return;
              }
              try {
                await addToCartMutation.mutateAsync({
                  userId,
                  listingId: vehicle._id,
                  quantity: 1,
                });
                showToast({
                  text: "Item added to cart successfully!",
                  type: "success",
                });
              } catch (error: any) {
                console.error("Failed to add to cart:", error);
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.message ||
                  "Failed to add item to cart";
                showToast({
                  text: errorMessage,
                  type: "error",
                });
              }
            }}
            disabled={!userId || addToCartMutation.isPending}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
          </button>
          <button className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            Book Test Drive
          </button>
        </div>
      </div>
    </div>
  );
};

// This wrapper component does the magic
export const LazyVehicleCard: React.FC<{
  vehicle: Vehicle;
  className?: string;
  style?: React.CSSProperties;
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ vehicle, className, style, setAlert }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only load the card once
    rootMargin: "200px 0px", // Start loading 200px *before* it enters the screen
  });

  return (
    <div ref={ref} className={className} style={style}>
      {/* Render the real, expensive VehicleCard only when inView is true.
        Otherwise, render the cheap, lightweight SkeletonCard.
      */}
      {inView ? (
        <VehicleCard vehicle={vehicle} setAlert={setAlert} />
      ) : (
        <SkeletonCard />
      )}
    </div>
  );
};
