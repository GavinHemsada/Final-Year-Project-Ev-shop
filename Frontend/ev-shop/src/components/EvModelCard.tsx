import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { itemVariants, cardHover } from "./animations/variants"; // Adjust path as needed
import { HeartIcon, StarIcon } from "@/assets/icons/icons";
import type { Vehicle } from "@/types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import React, { useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { buyerService } from "@/features/buyer/buyerService";
import { useAddToCart } from "@/hooks/useCart";
import { useToast } from "@/context/ToastContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { SellerDetailsModal } from "./SellerDetailsModal";

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
  style?: React.CSSProperties;// Keep for backward compatibility but prefer toast
}> = ({ vehicle, className, style}) => {
  const { model_id, images, seller_id } = vehicle;
  const userId = useAppSelector(selectUserId);
  const addToCartMutation = useAddToCart();
  const { showToast } = useToast();
  const [isSellerModalOpen, setIsSellerModalOpen] = React.useState(false);

  // Handle seller click
  const handleSellerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSellerModalOpen(true);
  };
  // React Query for Saved Status
  const { data: isSaved = false } = useQuery({
    queryKey: queryKeys.isVehicleSaved(userId || "", vehicle._id),
    queryFn: async () => {
      if (!userId) return false;
      const response = await buyerService.checkIfVehicleSaved(userId, vehicle._id);
      if (typeof response === "boolean") return response;
      return response?.isSaved || false;
    },
    enabled: !!userId && !!vehicle._id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const queryClient = useQueryClient();

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      if (isSaved) {
        return buyerService.removeSavedVehicle(userId, vehicle._id);
      } else {
        return buyerService.saveVehicle(userId, vehicle._id);
      }
    },
    onMutate: async () => {
        // Optimistic Update
        await queryClient.cancelQueries({ queryKey: queryKeys.isVehicleSaved(userId || "", vehicle._id) });
        const previousStatus = queryClient.getQueryData(queryKeys.isVehicleSaved(userId || "", vehicle._id));
        queryClient.setQueryData(queryKeys.isVehicleSaved(userId || "", vehicle._id), !isSaved);
        return { previousStatus };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.isVehicleSaved(userId || "", vehicle._id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedVehicles(userId || "") });
      
      showToast({
        text: isSaved ? "Vehicle removed from saved list!" : "Vehicle added to saved list!",
        type: "success",
      });
    },
    onError: (error: any, _, context) => {
        // Rollback
        if (context?.previousStatus !== undefined) {
             queryClient.setQueryData(queryKeys.isVehicleSaved(userId || "", vehicle._id), context.previousStatus);
        }
      console.error("Failed to toggle save:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update saved status";
      showToast({
        text: errorMessage,
        type: "error",
      });
    },
  });

  // Handle save/unsave
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showToast({
        text: "Please log in to save vehicles",
        type: "error",
      });
      return;
    }

    toggleSaveMutation.mutate();
  };

  const isSaving = toggleSaveMutation.isPending;

  // Fetch all reviews to calculate listing rating
  const { data: allReviews } = useQuery({
    queryKey: ["allReviews"],
    queryFn: buyerService.getAllReviews,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { listingRating, listingReviewCount } = useMemo(() => {
    if (!allReviews || !Array.isArray(allReviews)) return { listingRating: 0, listingReviewCount: 0 };
    
    // Filter reviews for this specific listing
    const listingReviews = allReviews.filter((review: any) => 
        review.order_id?.listing_id?._id === vehicle._id || 
        review.order_id?.listing_id === vehicle._id
    );

    if (listingReviews.length === 0) return { listingRating: 0, listingReviewCount: 0 };

    const total = listingReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    return {
        listingRating: total / listingReviews.length,
        listingReviewCount: listingReviews.length
    };
  }, [allReviews, vehicle._id]);

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
  // const sellerRating = seller_id?.rating || 0; // Removed unused variable

  // Star Rating Component
  const StarRating = ({ rating }: { rating: number }) => {
    const stars = [];
    
    // If rating is 0, show 5 empty stars
    if (rating === 0) {
      for (let i = 0; i < 5; i++) {
        stars.push(
          <span key={`empty-${i}`} className="text-gray-300 dark:text-gray-600">
            <StarIcon />
          </span>
        );
      }
      return <div className="flex items-center gap-0.5">{stars}</div>;
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars - gold color
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-400">
          <StarIcon />
        </span>
      );
    }
    
    // Half star - gradient gold/gray
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <span key="half" className="relative inline-block w-4 h-4">
          <span className="absolute inset-0 text-gray-300 dark:text-gray-600">
            <StarIcon />
          </span>
          <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <span className="text-yellow-400">
              <StarIcon />
            </span>
          </span>
        </span>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 dark:text-gray-600">
          <StarIcon />
        </span>
      );
    }
    
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  // Get seller logo (prefer shop_logo, fallback to user profile_image)
  const sellerLogo = `${apiURL}${seller_id.shop_logo}`;

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

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/user/vehicle/${vehicle._id}`);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700 cursor-pointer ${className}`}
      style={style}
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
      <div className="p-6" onClick={handleCardClick}>
        {/* Seller Info Section */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div 
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleSellerClick}
          >
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
            <div className="flex items-center gap-2">
              <p 
                className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={handleSellerClick}
              >
                {sellerShopName}
              </p>
              {/* Available EV Count */}
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                {vehicle.number_of_ev} available
              </span>
              <div className="flex items-center gap-1 text-xs">
                <StarRating rating={listingRating} />
                <span className="text-gray-600 dark:text-gray-400 ml-0.5">
                  ({listingReviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Details Modal */}
        <SellerDetailsModal 
          isOpen={isSellerModalOpen} 
          onClose={() => setIsSellerModalOpen(false)} 
          sellerId={seller_id._id} 
        />

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
          <button className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={handleBuyNowClick}
          >
            Buy Now
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
}> = ({ vehicle, className, style }) => {
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
        <VehicleCard vehicle={vehicle} />
      ) : (
        <SkeletonCard />
      )}
    </div>
  );
};
