import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, Thumbs } from "swiper/modules";
import { HeartIcon, ArrowLeftIcon, InfoIcon } from "@/assets/icons/icons";
import { buyerService } from "../buyerService";
import { useAddToCart } from "@/hooks/useCart";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { useToast } from "@/context/ToastContext";
import type { Vehicle } from "@/types";

import { ReviewSection } from "@/components/ReviewSection";

const apiURL = import.meta.env.VITE_API_URL;
const swiperModules = [Navigation, Autoplay, Pagination, Thumbs];

const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAppSelector(selectUserId);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const addToCartMutation = useAddToCart();
  const { showToast } = useToast();

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;
      try {
        const response = await buyerService.getVehicleById(id);
        // handleResult unwraps the response, so response is directly the listing object
        if (response && response._id) {
          setVehicle(response);
        } else {
          showToast({
            text: "Vehicle not found",
            type: "error",
          });
          setTimeout(() => navigate("/user/dashboard"), 2000);
        }
      } catch (error: any) {
        console.error("Failed to fetch vehicle:", error);
        showToast({
          text: "Failed to load vehicle details",
          type: "error",
        });
        setTimeout(() => navigate("/user/dashboard"), 2000);
      }
    };

    fetchVehicle();
  }, [id, navigate]);

  // Check if vehicle is saved
  useEffect(() => {
    if (userId && vehicle?._id) {
      buyerService
        .checkIfVehicleSaved(userId, vehicle._id)
        .then((response) => {
          if (typeof response === "boolean") {
            setIsSaved(response);
          } else if (response && typeof response.isSaved === "boolean") {
            setIsSaved(response.isSaved);
          }
        })
        .catch((error) => {
          console.error("Error checking saved status:", error);
        });
    }
  }, [userId, vehicle?._id]);

  // Handle save/unsave
  const handleSaveToggle = async () => {
    if (!userId || !vehicle) return;

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

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!userId || !vehicle) {
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
        error?.response?.data?.message || "Failed to add item to cart";
      showToast({
        text: errorMessage,
        type: "error",
      });
    }
  };

  // Handle buy now - go directly to checkout
  const handleBuyNow = async () => {
    if (!userId || !vehicle) {
      showToast({
        text: "Please log in to purchase",
        type: "error",
      });
      return;
    }

    if (!vehicle.seller_id?._id) {
      showToast({
        text: "Invalid vehicle: missing seller information",
        type: "error",
      });
      return;
    }

    try {
      // Create order directly
      const orderData = {
        user_id: userId,
        listing_id: vehicle._id,
        seller_id: vehicle.seller_id._id,
        total_amount: 50000, // Advance payment amount
      };

      const order = await buyerService.placeOrder(orderData);

      if (!order || !order._id) {
        throw new Error("Failed to create order");
      }

      // Create payment session
      const paymentData = {
        order_id: order._id,
        payment_type: "purchase",
        amount: 50000, // Charge only the advance payment
        returnUrl: `${apiURL}api/v1/payment/payment-return`,
        cancelUrl: `${apiURL}api/v1/payment/payment-cancel`,
      };

      const paymentResponse = await buyerService.createPayment(paymentData);

      // handleResult unwraps the response, so paymentResponse is the requestObject directly
      // or it could be { requestObject } depending on the structure
      const requestObject = paymentResponse?.requestObject || paymentResponse;

      if (!requestObject || typeof requestObject !== "object") {
        console.error("Payment response:", paymentResponse);
        throw new Error(
          paymentResponse?.error || "Failed to create payment session"
        );
      }

      // Submit form to PayHere
      const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
      const PAYHERE_LIVE_URL = "https://www.payhere.lk/pay/checkout";
      const payHereUrl =
        import.meta.env.VITE_PAYHERE_MODE === "live"
          ? PAYHERE_LIVE_URL
          : PAYHERE_SANDBOX_URL;

      const form = document.createElement("form");
      form.method = "POST";
      form.action = payHereUrl;
      form.style.display = "none";

      // Add all fields from payment request object
      Object.entries(requestObject).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error("Buy now error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to process purchase";
      showToast({
        text: errorMessage,
        type: "error",
      });
    }
  };

  // Memoize image URLs
  const imageUrls = useMemo(
    () => vehicle?.images?.map((img) => `${apiURL}${img}`) || [],
    [vehicle?.images]
  );

  // Get brand logo URL
  const brandLogoUrl = vehicle?.model_id?.brand_id?.brand_logo
    ? `${apiURL}${vehicle.model_id.brand_id.brand_logo}`
    : null;

  // Format price with LKR
  const formattedPrice = vehicle?.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on request";

  // Get seller info
  const sellerShopName = vehicle?.seller_id?.business_name || "Seller";
  const sellerProfileImage = vehicle?.seller_id?.shop_logo
    ? `${apiURL}${vehicle.seller_id.shop_logo}`
    : null;

  const sellerAddress = vehicle?.seller_id?.street_address;
  console.log(vehicle)
  if (!vehicle) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Vehicle not found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <button
          onClick={() => navigate("/user/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="p-6">
        {/* Image Gallery */}
        <div className="mb-8">
          {imageUrls.length > 0 ? (
            <Swiper
              modules={swiperModules}
              navigation
              pagination={{ clickable: true }}
              autoplay={false}
              loop
              className="h-96 w-full rounded-lg overflow-hidden"
            >
              {imageUrls.map((url, i) => (
                <SwiperSlide key={url}>
                  <div className="relative h-96 w-full">
                    <img
                      className="h-96 w-full object-cover"
                      src={url}
                      alt={`${vehicle.model_id?.model_name} image ${i + 1}`}
                      loading="lazy"
                    />
                    {brandLogoUrl && i === 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                        <img
                          src={brandLogoUrl}
                          alt={`${
                            vehicle.model_id?.brand_id?.brand_name || "Brand"
                          } logo`}
                          className="h-12 w-auto max-w-[120px] object-contain"
                        />
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="h-96 w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                No images available
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {vehicle.model_id?.brand_id?.brand_name || "Brand"}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {vehicle.model_id?.model_name || "Model"}
                  </h1>
                  <div className="text-lg text-gray-600 dark:text-gray-400">
                    {vehicle.model_id?.year} •{" "}
                    {vehicle.model_id?.category_id?.category_name || "EV"}
                  </div>
                </div>
                {userId && (
                  <button
                    onClick={handleSaveToggle}
                    disabled={isSaving}
                    className={`p-3 rounded-full transition-colors ${
                      isSaved
                        ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20"
                        : "text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-700"
                    } dark:text-gray-500 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isSaved ? "Remove from saved" : "Save vehicle"}
                  >
                    <HeartIcon
                      className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                {formattedPrice}
              </div>
            </div>

            {/* Seller Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Sold by
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sellerProfileImage ? (
                    <img
                      src={sellerProfileImage}
                      alt={sellerShopName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                      {sellerShopName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sellerShopName}
                    </p>
                    {vehicle.seller_id?.user_id?.name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.seller_id.user_id.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Address
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    {sellerAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Range
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vehicle.model_id?.range_km || "N/A"} km
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Battery Capacity
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vehicle.model_id?.battery_capacity_kwh || "N/A"} kWh
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Condition
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vehicle.condition || "N/A"}
                  </p>
                </div>
                {vehicle.battery_health && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Battery Health
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.battery_health}%
                    </p>
                  </div>
                )}
                {vehicle.color && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Color
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.color}
                    </p>
                  </div>
                )}
                {vehicle.registration_year && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Registration Year
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.registration_year}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            {vehicle.model_id?.brand_id?.description && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  About {vehicle.model_id.brand_id.brand_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {vehicle.model_id.brand_id.description}
                </p>
              </div>
            )}

            {/* Reviews Section */}
            {vehicle._id && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Reviews
                </h2>
                <ReviewSection vehicleId={vehicle._id} defaultOpen={true} />
              </div>
            )}
          </div>

          {/* Sidebar - Action Buttons */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {formattedPrice}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {vehicle.listing_type === "ForSale"
                      ? "For Sale"
                      : "For Rent"}
                  </p>
                </div>

                {/* Advance Payment Info Box */}
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg dark:bg-blue-900/20 dark:border-blue-400">
                  <div className="flex items-start gap-3">
                    <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                        Advance Payment Required
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        <strong>Address:{sellerAddress} </strong>
                        <br />
                        To secure the vehicle, you must make an advance payment
                        of <strong>LKR 50,000</strong>. After this payment, you
                        must complete the full payment and collect the vehicle
                        within <strong>14 days</strong>. Failure to do so will
                        result in the cancellation of the advance payment.
                        <br /><br />
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ⚠️ Important: The LKR 50,000 advance payment is non-refundable 
                          and will be deducted from the total vehicle cost.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={!userId || addToCartMutation.isPending}
                    className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={!userId || addToCartMutation.isPending}
                    className="w-full bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg hover:bg-gray-300 transition-all duration-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    disabled={vehicle?.listing_type === "sale"}
                    className="w-full bg-white border-2 border-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply for Lease
                  </button>

                </div>

                {!userId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Please log in to purchase or add to cart
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Component */}
    </div>
  );
};

export default VehicleDetailsPage;
