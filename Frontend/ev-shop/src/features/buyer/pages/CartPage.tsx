import React, { useState } from "react";
import { CloseIcon } from "@/assets/icons/icons"; // Assuming CloseIcon is in icons
import type { Vehicle, AlertProps } from "@/types";

// --- Mock Data (replace with actual cart logic, e.g., from context) ---
const mockCartItems: Vehicle[] = [
  {
    id: 1,
    name: "Aura EV",
    model: "Sedan",
    price: "LKR 12,500,000",
    range: "450 km",
    image: "https://placehold.co/600x400/3498db/ffffff?text=Aura+EV",
    topSpeed: "180 km/h",
  },
  {
    id: 6,
    name: "Velocity S",
    model: "Sports",
    price: "LKR 28,500,000",
    range: "520 km",
    image: "https://placehold.co/600x400/1abc9c/ffffff?text=Velocity+S",
    topSpeed: "250 km/h",
  },
];

const CartPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const [cart, setCart] = useState<Vehicle[]>(mockCartItems);
  const onRemove = (id: number) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };
  const totalPrice = cart.reduce((total, vehicle) => {
    // Clean the price string ("LKR 12,500,000" -> 12500000)
    const price = Number(vehicle.price.replace(/[^0-9.-]+/g, ""));
    return total + price;
  }, 0);

  // Format the total price back to LKR string
  const formattedTotalPrice = `LKR ${new Intl.NumberFormat("en-US").format(
    totalPrice
  )}`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Cart</h1>
      {cart.length === 0 ? (
        <p className="text-gray-500 text-center py-10 dark:text-gray-400">
          Your cart is empty.
        </p>
      ) : (
        <div>
          {/* Cart Items List */}
          <div className="space-y-4">
            {cart.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between border-b pb-4 last:border-b-0 dark:border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-20 w-28 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold dark:text-white">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vehicle.model}
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                      {vehicle.price}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900"
                  title="Remove item"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
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
