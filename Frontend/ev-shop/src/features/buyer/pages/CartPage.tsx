import React, { useState, useEffect } from "react";
import { CloseIcon } from "@/assets/icons/icons";
import type { Vehicle, AlertProps } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { buyerService } from "../buyerService";
import { Loader } from "@/components/Loader";

const apiURL = import.meta.env.VITE_API_URL;

interface CartItem {
  _id: string;
  listing_id: Vehicle;
  quantity: number;
}

const CartPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = ({
  setAlert,
}) => {
  const { getUserID } = useAuth();
  const userId = getUserID();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchCart = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await buyerService.getUserCart(userId);

      // handleResult unwraps the response, so response is directly the cart object
      let cartData = null;
      if (response && response.items) {
        // Response has items array
        cartData = response;
      } else if (Array.isArray(response)) {
        // Response is directly an array (unlikely but handle it)
        cartData = { items: response };
      }

      if (cartData && cartData.items && Array.isArray(cartData.items)) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load cart items",
        type: "error",
      });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async (itemId: string) => {
    if (!userId) return;

    try {
      await buyerService.removeCartItem(itemId);
      // Remove from local state
      setCartItems((prev) => prev.filter((item) => item._id !== itemId));
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Item removed from cart",
        type: "success",
      });
      // Refresh cart to update totals
      await fetchCart();
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to remove item";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const totalPrice = cartItems.reduce((total, item) => {
    const vehicle = item.listing_id;
    if (vehicle && vehicle.price) {
      return total + vehicle.price * item.quantity;
    }
    return total;
  }, 0);

  // Format the total price back to LKR string
  const formattedTotalPrice = `LKR ${new Intl.NumberFormat("en-US").format(
    totalPrice
  )}`;

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Please log in to view your cart.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
        <div className="flex justify-center items-center py-16">
          <Loader size={40} color="#4f46e5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Your cart is empty.
        </p>
      ) : (
        <div>
          {/* Cart Items List */}
          <div className="space-y-4">
            {cartItems.map((item) => {
              const vehicle = item.listing_id;
              if (!vehicle) return null;

              const firstImage =
                vehicle.images && vehicle.images.length > 0
                  ? `${apiURL}${vehicle.images[0]}`
                  : "https://placehold.co/600x400/3498db/ffffff?text=No+Image";

              const vehiclePrice = vehicle.price
                ? `LKR ${vehicle.price.toLocaleString("en-US")}`
                : "Price on request";

              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={firstImage}
                      alt={vehicle.model_id?.model_name || "Vehicle"}
                      className="h-20 w-28 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold dark:text-white">
                        {vehicle.model_id?.brand_id?.brand_name || "Brand"}{" "}
                        {vehicle.model_id?.model_name || "Model"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.model_id?.year || ""} •{" "}
                        {vehicle.model_id?.category_id?.category_name || "EV"}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm font-medium text-blue-600">
                          {vehiclePrice}
                        </p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900"
                    title="Remove item"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Total:
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formattedTotalPrice}
              </span>
            </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
