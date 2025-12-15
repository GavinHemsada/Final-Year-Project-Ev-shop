import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { useCart } from "@/hooks/useCart";
import { buyerService } from "../buyerService";
import { PageLoader, Loader } from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { ArrowLeftIcon } from "@/assets/icons/icons";
import type { Vehicle } from "@/types";

const apiURL = import.meta.env.VITE_API_URL;
const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const PAYHERE_LIVE_URL = "https://www.payhere.lk/pay/checkout";

interface CartItem {
  _id: string;
  listing_id: Vehicle;
  quantity: number;
}

const CheckoutPage: React.FC = () => {
  const userId = useAppSelector(selectUserId);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: cart, isLoading: cartLoading } = useCart(userId);
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItems: CartItem[] = cart?.items || [];

  const totalPrice = cartItems.reduce((total, item) => {
    const vehicle = item.listing_id;
    if (vehicle && vehicle.price) {
      return total + vehicle.price * item.quantity;
    }
    return total;
  }, 0);

  useEffect(() => {
    if (!userId) {
      showToast({
        text: "Please log in to checkout",
        type: "error",
      });
      navigate("/user/dashboard");
      return;
    }

    if (cartItems.length === 0 && !cartLoading) {
      showToast({
        text: "Your cart is empty",
        type: "error",
      });
      navigate("/user/dashboard", { state: { activeTab: "cart" } });
    }
  }, [userId, cartItems.length, cartLoading, navigate, showToast]);

  const handleCheckout = async () => {
    if (!userId || cartItems.length === 0) return;

    setIsProcessing(true);

    try {
      // Create orders for each cart item (backend supports one listing per order)
      // For now, we'll create an order for the first item and sum the total
      // In a production system, you might want to create multiple orders or group by seller
      const firstItem = cartItems[0];
      const vehicle = firstItem.listing_id;
      
      if (!vehicle || !vehicle.seller_id?._id) {
        throw new Error("Invalid cart item: missing seller information");
      }

      // Create order for the first item (or you could create multiple orders)
      const orderData = {
        user_id: userId,
        listing_id: vehicle._id,
        seller_id: vehicle.seller_id._id,
        total_amount: 50000,
      };

      const order = await buyerService.placeOrder(orderData);

      if (!order || !order._id) {
        throw new Error("Failed to create order");
      }

      // Create payment session
      const paymentData = {
        order_id: order._id,
        payment_type: "purchase", // EV_PURCHASE
        amount: 50000,
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
      const payHereUrl = import.meta.env.VITE_PAYHERE_MODE === "live" 
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
      console.error("Checkout error:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Failed to process checkout";
      showToast({
        text: errorMessage,
        type: "error",
      });
      setIsProcessing(false);
    }
  };

  if (!userId) {
    return null;
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader/>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/user/dashboard", { state: { activeTab: "cart" } })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Cart</span>
        </button>

        <h1 className="text-3xl font-bold mb-8 dark:text-white">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:shadow-none dark:border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item) => {
                const vehicle = item.listing_id;
                const imageUrl = vehicle?.images?.[0]
                  ? `${apiURL}${vehicle.images[0]}`
                  : null;

                return (
                  <div
                    key={item._id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={vehicle?.model_id?.model_name || "Vehicle"}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold dark:text-white">
                        {vehicle?.model_id?.model_name || "Vehicle"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                        LKR {((vehicle?.price || 0) * item.quantity).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-4 dark:shadow-none dark:border dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Payment Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>LKR {totalPrice.toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold dark:text-white">
                    <span>Total</span>
                    <span>LKR {totalPrice.toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={20} color="#ffffff" />
                    Processing...
                  </span>
                ) : (
                  "Proceed to Payment"
                )}
              </button>

              {/* Advance Payment Notice */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> To secure the vehicle, you must make an advance payment
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

              <p className="text-xs text-gray-500 mt-2 text-center dark:text-gray-400">
                You will be redirected to PayHere to complete your payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

