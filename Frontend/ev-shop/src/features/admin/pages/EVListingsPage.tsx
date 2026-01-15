import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon, PencilIcon, PlusIcon } from "@/assets/icons/icons";
import type { AlertProps, ConfirmAlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

const apiURL = import.meta.env.VITE_API_URL;

type TabType = "listings" | "brands" | "categories";

export const EVListingsPage: React.FC<{
  setAlert: (alert: AlertProps | null) => void;
  setConfirmAlert: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const [activeTab, setActiveTab] = useState<TabType>("listings");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Brand states
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isBrandEditMode, setIsBrandEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [brandFormData, setBrandFormData] = useState({
    brand_name: "",
    description: "",
    brand_logo: null as File | null,
  });

  // Category states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    category_name: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // Listings queries
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["adminAllListings"],
    queryFn: () => adminService.getAllListings(),
  });

  // Brands queries
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["adminAllBrands"],
    queryFn: () => adminService.getAllBrands(),
    enabled: activeTab === "brands",
  });

  // Categories queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["adminAllCategories"],
    queryFn: () => adminService.getAllCategories(),
    enabled: activeTab === "categories",
  });

  // Listings mutations
  const deleteListingMutation = useMutation({
    mutationFn: (listingId: string) => adminService.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllListings"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Listing deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete listing",
      });
    },
  });

  // Brand mutations
  const createBrandMutation = useMutation({
    mutationFn: (data: FormData) => adminService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllBrands"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Brand created successfully",
      });
      setIsBrandModalOpen(false);
      resetBrandForm();
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to create brand",
      });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      adminService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllBrands"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Brand updated successfully",
      });
      setIsBrandModalOpen(false);
      resetBrandForm();
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to update brand",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (brandId: string) => adminService.deleteBrand(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllBrands"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Brand deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete brand",
      });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => adminService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllCategories"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Category created successfully",
      });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to create category",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllCategories"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Category updated successfully",
      });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to update category",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => adminService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllCategories"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete category",
      });
    },
  });

  // Form reset functions
  const resetBrandForm = () => {
    setBrandFormData({
      brand_name: "",
      description: "",
      brand_logo: null,
    });
    setIsBrandEditMode(false);
    setSelectedBrand(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      category_name: "",
      description: "",
    });
    setIsCategoryEditMode(false);
    setSelectedCategory(null);
  };

  // Brand handlers
  const handleOpenBrandModal = (brand?: any) => {
    if (brand) {
      setIsBrandEditMode(true);
      setSelectedBrand(brand);
      setBrandFormData({
        brand_name: brand.brand_name || "",
        description: brand.description || "",
        brand_logo: null,
      });
    } else {
      setIsBrandEditMode(false);
      resetBrandForm();
    }
    setIsBrandModalOpen(true);
  };

  const handleCloseBrandModal = () => {
    setIsBrandModalOpen(false);
    resetBrandForm();
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("brand_name", brandFormData.brand_name);
    if (brandFormData.description && brandFormData.description.trim() !== "") {
      formDataToSend.append("description", brandFormData.description);
    }
    if (brandFormData.brand_logo) {
      formDataToSend.append("brand_logo", brandFormData.brand_logo);
    }

    if (isBrandEditMode && selectedBrand) {
      updateBrandMutation.mutate({ id: selectedBrand._id, data: formDataToSend });
    } else {
      createBrandMutation.mutate(formDataToSend);
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (category?: any) => {
    if (category) {
      setIsCategoryEditMode(true);
      setSelectedCategory(category);
      setCategoryFormData({
        category_name: category.category_name || "",
        description: category.description || "",
      });
    } else {
      setIsCategoryEditMode(false);
      resetCategoryForm();
    }
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare data - only include description if it's not empty
    const dataToSend: any = {
      category_name: categoryFormData.category_name,
    };
    if (categoryFormData.description && categoryFormData.description.trim() !== "") {
      dataToSend.description = categoryFormData.description;
    }
    
    if (isCategoryEditMode && selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory._id, data: dataToSend });
    } else {
      createCategoryMutation.mutate(dataToSend);
    }
  };

  // Filtered data
  const filteredListings = Array.isArray(listings)
    ? listings.filter((listing: any) =>
        listing.model_id?.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_id?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredBrands = Array.isArray(brands)
    ? brands.filter((brand: any) =>
        brand.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredCategories = Array.isArray(categories)
    ? categories.filter((category: any) =>
        category.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Loading state
  const isLoading =
    (activeTab === "listings" && listingsLoading) ||
    (activeTab === "brands" && brandsLoading) ||
    (activeTab === "categories" && categoriesLoading);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">EV Listings Management</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          {activeTab === "listings" && (
            <ReportGeneratorButton
              data={filteredListings.map((listing: any) => ({
                model: listing.model_id?.model_name || "N/A",
                seller: listing.seller_id?.business_name || listing.seller_id?.name || "N/A",
                price: `LKR ${listing.price?.toLocaleString("en-US") || "0"}`,
                status: listing.status || "active",
              }))}
              columns={[
                { header: "Model", dataKey: "model" },
                { header: "Seller", dataKey: "seller" },
                { header: "Price", dataKey: "price" },
                { header: "Status", dataKey: "status" },
              ]}
              title="EV Listings Report"
              filename="ev_listings_report"
            />
          )}
          {activeTab === "brands" && (
            <button
              onClick={() => handleOpenBrandModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Brand
            </button>
          )}
          {activeTab === "categories" && (
            <button
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Category
            </button>
          )}
          <input
            type="text"
            placeholder={
              activeTab === "listings"
                ? "Search listings..."
                : activeTab === "brands"
                ? "Search brands..."
                : "Search categories..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("listings");
              setSearchTerm("");
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "listings"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => {
              setActiveTab("brands");
              setSearchTerm("");
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "brands"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Brands
          </button>
          <button
            onClick={() => {
              setActiveTab("categories");
              setSearchTerm("");
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "categories"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Categories
          </button>
        </nav>
      </div>

      {/* Listings Tab Content */}
      {activeTab === "listings" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((listing: any) => (
                    <tr key={listing._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {listing.model_id?.model_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {listing.seller_id?.business_name || listing.seller_id?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        LKR {listing.price?.toLocaleString("en-US") || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            listing.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {listing.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setConfirmAlert({
                              title: "Delete Listing",
                              message: "Are you sure you want to delete this listing? This action cannot be undone.",
                              confirmText: "Delete",
                              cancelText: "Cancel",
                              onConfirmAction: () => {
                                deleteListingMutation.mutate(listing._id);
                              },
                            });
                          }}
                          disabled={deleteListingMutation.isPending}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {deleteListingMutation.isPending ? (
                            <Loader size={8} color="#dc2626" />
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brands Tab Content */}
      {activeTab === "brands" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No brands found
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((brand: any) => (
                    <tr key={brand._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {brand.brand_logo ? (
                          <img
                            src={`${apiURL}${brand.brand_logo}`}
                            alt={brand.brand_name}
                            className="h-12 w-12 object-contain rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/48x48/cccccc/666666?text=${brand.brand_name?.charAt(0) || "?"}`;
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Logo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {brand.brand_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {brand.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenBrandModal(brand)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmAlert({
                                title: "Delete Brand",
                                message: "Are you sure you want to delete this brand? This action cannot be undone.",
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                onConfirmAction: () => {
                                  deleteBrandMutation.mutate(brand._id);
                                },
                              });
                            }}
                            disabled={deleteBrandMutation.isPending}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deleteBrandMutation.isPending ? (
                              <Loader size={8} color="#dc2626" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab Content */}
      {activeTab === "categories" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category: any) => (
                    <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {category.category_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {category.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenCategoryModal(category)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmAlert({
                                title: "Delete Category",
                                message: "Are you sure you want to delete this category? This action cannot be undone.",
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                onConfirmAction: () => {
                                  deleteCategoryMutation.mutate(category._id);
                                },
                              });
                            }}
                            disabled={deleteCategoryMutation.isPending}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deleteCategoryMutation.isPending ? (
                              <Loader size={8} color="#dc2626" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              {isBrandEditMode ? "Edit Brand" : "Create New Brand"}
            </h3>
            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={brandFormData.brand_name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={brandFormData.description}
                  onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter brand description"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Logo {!isBrandEditMode && "(Required)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={!isBrandEditMode}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBrandFormData({ ...brandFormData, brand_logo: file });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {isBrandEditMode && selectedBrand?.brand_logo && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Current logo will be replaced if a new file is selected
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseBrandModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBrandMutation.isPending || updateBrandMutation.isPending ? (
                    <Loader size={4} color="#ffffff" />
                  ) : isBrandEditMode ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              {isCategoryEditMode ? "Edit Category" : "Create New Category"}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.category_name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, category_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter category description"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                    <Loader size={4} color="#ffffff" />
                  ) : isCategoryEditMode ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
