import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CloseIcon } from "@/assets/icons/icons";
import type { CartItem } from "@/types";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useToast } from "@/context/ToastContext";

const apiURL = import.meta.env.VITE_API_URL;

const CartPage = () => {
  const userId = useAppSelector(selectUserId);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Use React Query hooks
  const { data: cart, isLoading, error } = useCart(userId);
  const removeCartItemMutation = useRemoveCartItem();
  const updateCartItemMutation = useUpdateCartItem();

  const cartItems: CartItem[] = cart?.items || [];

  const onRemove = useCallback(
    async (itemId: string) => {
      if (!userId) return;

      try {
        await removeCartItemMutation.mutateAsync({ itemId, userId });
        showToast({
          text: "Item removed from cart",
          type: "success",
        });
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        const errorMessage =
          error?.response?.data?.message || "Failed to remove item";
        showToast({
          text: errorMessage,
          type: "error",
        });
      }
    },
    [userId, removeCartItemMutation, showToast]
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (!userId || newQuantity < 1) return;

      try {
        await updateCartItemMutation.mutateAsync({
          itemId,
          quantity: newQuantity,
          userId,
        });
      } catch (error: any) {
        console.error("Failed to update quantity:", error);
        const errorMessage =
          error?.response?.data?.message || "Failed to update quantity";
        showToast({
          text: errorMessage,
          type: "error",
        });
      }
    },
    [userId, updateCartItemMutation, showToast]
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const vehicle = item.listing_id;
        return vehicle?.price ? total + vehicle.price * item.quantity : total;
      }, 0),
    [cartItems]
  );

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

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
        <div className="flex justify-center items-center py-16">
          <Loader size={40} color="#4f46e5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Failed to load cart items. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Your cart is empty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
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
                  {/* Vehicle Image */}
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={vehicle?.model_id?.model_name || "Vehicle"}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center dark:bg-gray-700">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg dark:text-white truncate">
                      {vehicle?.model_id?.brand_id?.brand_name}{" "}
                      {vehicle?.model_id?.model_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vehicle?.model_id?.year} •{" "}
                      {vehicle?.model_id?.category_id?.category_name}
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                      LKR {vehicle?.price?.toLocaleString("en-US")}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item._id, item.quantity - 1)
                          }
                          disabled={
                            item.quantity <= 1 ||
                            updateCartItemMutation.isPending
                          }
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border border-gray-300 rounded dark:border-gray-600 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item._id, item.quantity + 1)
                          }
                          disabled={updateCartItemMutation.isPending}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => onRemove(item._id)}
                      disabled={removeCartItemMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
                      title="Remove item"
                    >
                      <CloseIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 border border-gray-200 rounded-lg dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 dark:text-white">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formattedTotalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold dark:text-white">
                    <span>Total</span>
                    <span>{formattedTotalPrice}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/user/checkout")}
                disabled={cartItems.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
