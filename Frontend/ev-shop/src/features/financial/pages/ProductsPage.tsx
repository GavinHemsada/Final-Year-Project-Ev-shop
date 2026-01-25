import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectFinanceId } from "@/context/authSlice";
import { financialService } from "../financialService";
import type { AlertProps } from "@/types";
import { PageLoader, Loader } from "@/components/Loader";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/assets/icons/icons";

export const ProductsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  products?: any[];
}> = ({ setAlert, products: initialProducts }) => {
  const institutionId = useAppSelector(selectFinanceId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"myProducts" | "createProduct">(
    "myProducts"
  );
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    product_name: "",
    product_type: "",
    description: "",
    interest_rate_min: "",
    interest_rate_max: "",
    term_months_min: "",
    term_months_max: "",
    down_payment_min: "",
    is_active: true,
  });

  useEffect(() => {
    if (activeTab === "myProducts" && institutionId) {
      if (initialProducts && initialProducts.length > 0) {
        setProducts(initialProducts);
      } else {
        fetchProducts();
      }
    }
  }, [activeTab, institutionId, initialProducts]);

  // Sync with React Query cache when it updates
  useEffect(() => {
    if (institutionId && activeTab === "myProducts") {
      const queryData = queryClient.getQueryData(["financialProducts", institutionId]);
      if (queryData) {
        const prods = Array.isArray(queryData)
          ? queryData
          : (queryData as any)?.products || [];
        setProducts(prods);
      }
    }
  }, [institutionId, queryClient, activeTab]);

  // Fetch Product Types
  const { data: productTypesList } = useQuery({
    queryKey: ["financialProductTypes"],
    queryFn: () => financialService.getAllFinancialProductTypes(),
  });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    // Handle checkbox separately
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleEdit = (product: any) => {
    setEditingProductId(product._id);
    setFormData({
      product_name: product.product_name || "",
      product_type: product.product_type || "",
      description: product.description || "",
      interest_rate_min: product.interest_rate_min?.toString() || "",
      interest_rate_max: product.interest_rate_max?.toString() || "",
      term_months_min: product.term_months_min?.toString() || "",
      term_months_max: product.term_months_max?.toString() || "",
      down_payment_min: product.down_payment_min?.toString() || "",
      is_active: product.is_active !== undefined ? product.is_active : true,
    });
    setActiveTab("createProduct");
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setFormData({
      product_name: "",
      product_type: "",
      description: "",
      interest_rate_min: "",
      interest_rate_max: "",
      term_months_min: "",
      term_months_max: "",
      down_payment_min: "",
      is_active: true,
    });
    setActiveTab("myProducts");
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      // Optimistically update local state
      const updatedProducts = products.filter(p => p._id !== productId);
      setProducts(updatedProducts);

      await financialService.deleteProduct(productId);
      
      // Invalidate and refetch React Query cache
      if (institutionId) {
        await queryClient.invalidateQueries({
          queryKey: ["financialProducts", institutionId],
        });
      }

      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Product deleted successfully!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      // Revert optimistic update on error
      fetchProducts();
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to delete product",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) {
        setAlert?.({
            id: Date.now(),
            title: "Error",
            message: "Institution ID not found",
            type: "error",
        });
        return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        institution_id: institutionId,
        product_name: formData.product_name,
        product_type: formData.product_type,
        description: formData.description,
        interest_rate_min: Number(formData.interest_rate_min),
        interest_rate_max: Number(formData.interest_rate_max),
        term_months_min: Number(formData.term_months_min),
        term_months_max: Number(formData.term_months_max),
        down_payment_min: Number(formData.down_payment_min),
        is_active: formData.is_active
      };

      let updatedProduct;
      if (editingProductId) {
        // Update existing product
        const response = await financialService.updateProduct(editingProductId, payload);
        updatedProduct = response?.product || response;
        
        // Optimistically update local state
        const updatedProducts = products.map(p => 
          p._id === editingProductId ? { ...p, ...payload } : p
        );
        setProducts(updatedProducts);

        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Product updated successfully!",
          type: "success",
        });
      } else {
        // Create new product
        const response = await financialService.createProduct(payload);
        updatedProduct = response?.product || response;
        
        // Optimistically add to local state
        if (updatedProduct) {
          setProducts([...products, updatedProduct]);
        }

        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Product created successfully!",
          type: "success",
        });
      }
      
      // Invalidate and refetch React Query cache
      if (institutionId) {
        await queryClient.invalidateQueries({
          queryKey: ["financialProducts", institutionId],
        });
      }
      
      // Reset form and switch tab
      setEditingProductId(null);
      setFormData({
        product_name: "",
        product_type: "",
        description: "",
        interest_rate_min: "",
        interest_rate_max: "",
        term_months_min: "",
        term_months_max: "",
        down_payment_min: "",
        is_active: true,
      });
      setActiveTab("myProducts");
    } catch (error: any) {
      console.error("Failed to save product:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || `Failed to ${editingProductId ? 'update' : 'create'} product`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Financial Products</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("myProducts")}
            className={`${
              activeTab === "myProducts"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Products
          </button>
          <button
            onClick={() => {
              setEditingProductId(null);
              setFormData({
                product_name: "",
                product_type: "",
                description: "",
                interest_rate_min: "",
                interest_rate_max: "",
                term_months_min: "",
                term_months_max: "",
                down_payment_min: "",
                is_active: true,
              });
              setActiveTab("createProduct");
            }}
            className={`${
              activeTab === "createProduct"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <PlusCircleIcon className="h-4 w-4" />
            {editingProductId ? "Edit Product" : "Create Product"}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "myProducts" ? (
        isLoading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No products found.
            </p>
            <button
                onClick={() => setActiveTab("createProduct")}
                className="bg-indigo-600 dark:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
                Create your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700 relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-full dark:hover:bg-gray-700"
                    title="Edit Product"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-full dark:hover:bg-gray-700"
                    title="Delete Product"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold mb-2 dark:text-white pr-8">
                  {product.product_name}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                    {product.product_type}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                        <span>Interest Rate:</span>
                        <span className="font-semibold">{product.interest_rate_min}% - {product.interest_rate_max}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Term:</span>
                        <span className="font-semibold">{product.term_months_min} - {product.term_months_max} months</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Min Down Payment:</span>
                        <span className="font-semibold">LKR {product.down_payment_min?.toLocaleString() || product.down_payment_min}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">
            {editingProductId ? "Edit Product" : "Create New Product"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product Name *
                    </label>
                    <input
                        type="text"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g. Green Auto Loan"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product Type *
                    </label>
                    <select
                        name="product_type"
                        value={formData.product_type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select Type</option>
                        {productTypesList && Array.isArray(productTypesList) ? (
                          productTypesList.map((type: any) => (
                            <option key={type._id} value={type.name}>
                              {type.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Lease">Lease</option>
                            <option value="Loan">Loan</option>
                            <option value="Insurance">Insurance</option>
                          </>
                        )}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    placeholder="Describe the loan product features and benefits..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Interest Rate (%) *
                    </label>
                    <input
                        type="number"
                        name="interest_rate_min"
                        value={formData.interest_rate_min}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Interest Rate (%) *
                    </label>
                    <input
                        type="number"
                        name="interest_rate_max"
                        value={formData.interest_rate_max}
                        onChange={handleInputChange}
                        required
                         min="0"
                         step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Term (Months) *
                    </label>
                    <input
                        type="number"
                        name="term_months_min"
                        value={formData.term_months_min}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Term (Months) *
                    </label>
                    <input
                        type="number"
                        name="term_months_max"
                        value={formData.term_months_max}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Down Payment (LKR) *
                </label>
                <input
                    type="number"
                    name="down_payment_min"
                    value={formData.down_payment_min}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Product is Active (Visible to buyers)
                </label>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 dark:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                      <>
                        <Loader size={8} color="#ffffff" />
                        {editingProductId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingProductId ? "Update Product" : "Create Product"
                    )}
                </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
