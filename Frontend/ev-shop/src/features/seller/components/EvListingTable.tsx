import { useCallback, useState } from "react";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/assets/icons/icons";
import type { SellerActiveTab, Vehicle, AlertProps, ConfirmAlertProps } from "@/types";
import { sellerService } from "../sellerService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import React from "react";
import { useToast } from "@/context/ToastContext";

const apiURL = import.meta.env.VITE_API_URL;

export const ListingsTable: React.FC<{
  sellerid: string;
  listings: Vehicle[];
  setActiveTab: (tab: SellerActiveTab) => void;
  setEditListingId?: (id: string | null) => void;
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null) => void;
}> = ({ sellerid, setActiveTab, listings, setEditListingId, setAlert, setConfirmAlert }) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceMinFilter, setPriceMinFilter] = useState<string>("");
  const [priceMaxFilter, setPriceMaxFilter] = useState<string>("");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all");
  const [quantityFilter, setQuantityFilter] = useState<string>("");
  
  // Inline editing state
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  
  const { showToast } = useToast();
  // Quick update mutation
  const quickUpdateMutation = useMutation({
    mutationFn: async ({
      listingId,
      data,
    }: {
      listingId: string;
      data: { status?: string; number_of_ev?: number };
    }) => {
      return sellerService.quickUpdateListing(listingId, data);
    },
    onSuccess: async () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.sellerEvlist(sellerid),
      });
      
      showToast({
        text: "Listing updated successfully",
        type: "success",
      });
      
      // Reset editing state
      setEditingRow(null);
      setEditStatus("");
      setEditQuantity("");
    },
    onError: () => {
      showToast({
        text: "Failed to update listing",
        type: "error",
      });
    },
  });
  
  // Apply filters to listings
  const filteredListings = listings.filter((listing) => {
    // Status filter
    if (statusFilter !== "all" && listing.status !== statusFilter) {
      return false;
    }
    
    // Price range filter
    if (priceMinFilter && listing.price < Number(priceMinFilter)) {
      return false;
    }
    if (priceMaxFilter && listing.price > Number(priceMaxFilter)) {
      return false;
    }
    
    // Listing type filter
    if (listingTypeFilter !== "all" && listing.listing_type !== listingTypeFilter) {
      return false;
    }
    
    // Quantity filter
    if (quantityFilter && listing.number_of_ev < Number(quantityFilter)) {
      return false;
    }
    
    return true;
  });
  
  // Calculate pagination based on filtered results
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priceMinFilter, priceMaxFilter, listingTypeFilter, quantityFilter]);
  
  console.log(listings);

  const deleteEVMutation = useMutation({
    mutationFn: async ({
      listingId,
      modelId,
    }: {
      listingId: string;
      modelId: string;
    }) => {
      await sellerService.deleteModel(modelId);
      return sellerService.deleteListing(listingId);
    },
    onSuccess: async (_, variables) => {
      // Invalidate the seller's EV list
      queryClient.invalidateQueries({
        queryKey: queryKeys.sellerEvlist(sellerid),
      });
      
      // Invalidate the specific listing edit query if it exists
      queryClient.invalidateQueries({
        queryKey: queryKeys.listingForEdit(variables.listingId),
      });
      
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Successfully deleted listing",
        type: "success",
      });
    },

    onError: () => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete listing",
        type: "error",
      });
    },
  });

   const askDelete = useCallback((listingId: string, modelId: string) => {
    setConfirmAlert?.({
      title: "Confirm",
      message: "Are you sure you want to delete this listing?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirmAction: () =>{
        deleteEVMutation.mutate({ listingId, modelId });
      },
    });
  }, [deleteEVMutation, setConfirmAlert]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  
  const clearFilters = () => {
    setStatusFilter("all");
    setPriceMinFilter("");
    setPriceMaxFilter("");
    setListingTypeFilter("all");
    setQuantityFilter("");
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold dark:text-white">My Vehicle Listings</h2>
        <button
          onClick={() => setActiveTab("evList")}
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Add New Listing
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* Price Min Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Price (LKR)
            </label>
            <input
              type="number"
              min={0}
              value={priceMinFilter}
              onChange={(e) => setPriceMinFilter(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Price Max Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Price (LKR)
            </label>
            <input
              type="number"
              min={0}
              value={priceMaxFilter}
              onChange={(e) => setPriceMaxFilter(e.target.value)}
              placeholder="999999999"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Listing Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Listing Type
            </label>
            <select
              value={listingTypeFilter}
              onChange={(e) => setListingTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="sale">Sale</option>
              <option value="lease">Lease</option>
            </select>
          </div>

          {/* Quantity Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Quantity
            </label>
            <input
              type="number"
              min={0}
              value={quantityFilter}
              onChange={(e) => setQuantityFilter(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          Showing {filteredListings.length} of {listings.length} listings
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Listing Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Available Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedListings?.map((listing) => (
              <tr
                key={listing._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={`${apiURL}${listing?.images[0]}`}
                    alt={listing.model_id?.model_name}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {listing.model_id?.model_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {listing.model_id?.model_name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {editingRow === listing._id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="sold">Sold</option>
                      </select>
                    ) : (
                      <>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRow(listing._id);
                            setEditStatus(listing.status);
                            setEditQuantity(listing.number_of_ev.toString());
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="Quick edit status/quantity"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {listing.price}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {listing.listing_type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {editingRow === listing._id ? (
                    <input
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <>
                        <span
                          className={`px-2`}
                        >
                          {listing.number_of_ev}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRow(listing._id);
                            setEditStatus(listing.status);
                            setEditQuantity(listing.number_of_ev.toString());
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="Quick edit status/quantity"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  {editingRow === listing._id ? (
                    <>
                      <button
                        onClick={() => {
                          const updateData: { status?: string; number_of_ev?: number } = {};
                          if (editStatus !== listing.status) {
                            updateData.status = editStatus;
                          }
                          if (editQuantity !== listing.number_of_ev.toString()) {
                            updateData.number_of_ev = parseInt(editQuantity);
                          }
                          
                          if (Object.keys(updateData).length > 0) {
                            quickUpdateMutation.mutate({
                              listingId: listing._id,
                              data: updateData,
                            });
                          } else {
                            setEditingRow(null);
                          }
                        }}
                        disabled={quickUpdateMutation.isPending}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {quickUpdateMutation.isPending ? "..." : "✓"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingRow(null);
                          setEditStatus("");
                          setEditQuantity("");
                        }}
                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditListingId?.(listing._id);
                          setActiveTab("editEvlist");
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1"
                        title="Edit full listing"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => askDelete(listing._id, listing.model_id._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, filteredListings.length)}</span> of{" "}
            <span className="font-medium">{filteredListings.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const getStatusChip = (status: Vehicle["status"]) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "sold":
      return "bg-red-100 text-red-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
  }
};