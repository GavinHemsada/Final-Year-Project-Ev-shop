import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { financialService } from "../financialService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/assets/icons/icons";

export const ProductsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const { getActiveRoleId } = useAuth();
  const institutionId = getActiveRoleId();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (institutionId) {
      fetchProducts();
    }
  }, [institutionId]);

  const fetchProducts = async () => {
    if (!institutionId) return;
    try {
      setIsLoading(true);
      const response = await financialService.getProductsByInstitution(
        institutionId
      );
      const prods = response?.products || [];
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load products",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Financial Products</h1>
        <button
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Add New Product
        </button>
      </div>
      {products.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No products found. Click "Add New Product" to create your first
            financial product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700"
            >
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {product.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {product.description}
              </p>
              <div className="flex justify-between items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    product.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {product.is_active ? "Active" : "Inactive"}
                </span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 dark:text-red-400">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

