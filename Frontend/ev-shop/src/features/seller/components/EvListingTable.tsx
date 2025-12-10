import { useState } from "react";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/assets/icons/icons";
import type { SellerActiveTab, Vehicle, AlertProps, ConfirmAlertProps } from "@/types";
import { sellerService } from "../sellerService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import React from "react";

const apiURL = import.meta.env.VITE_API_URL;
export const ListingsTable: React.FC<{
  sellerid: string;
  listings: Vehicle[];
  setActiveTab: (tab: SellerActiveTab) => void;
  setEditListingId?: (id: string | null) => void;
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null, handler?: () => void) => void;
}> = ({ sellerid, setActiveTab, listings, setEditListingId, setAlert, setConfirmAlert }) => {
  const [selectedListing, setSelectedListing] = useState<{
    listingId: string;
    modelId: string;
  } | null>(null);
  const queryClient = useQueryClient();
  console.log(listings);
  const handleConfirmDelete = async () => {
    if (!selectedListing) return;

    const { listingId, modelId } = selectedListing;
    await deleteEVMutation.mutateAsync({ listingId, modelId });
    setSelectedListing(null);
    setConfirmAlert?.(null);
  };

  const askDelete = (listingId: string, modelId: string) => {
    setSelectedListing({ listingId, modelId });

    setConfirmAlert?.({
      title: "Confirm",
      message: "Are you sure you want to delete this listing?",
      confirmText: "Delete",
      cancelText: "Cancel",
    }, handleConfirmDelete);
  };

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
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sellerEvlist(sellerid),
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

  const handleCancelDelete = () => {
    setSelectedListing(null);
    setConfirmAlert?.(null);
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {listings.map((listing) => (
              <tr
                key={listing._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={`${apiURL}${listing.images[0]}`}
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
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                      listing.status
                    )}`}
                  >
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {listing.price}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {listing.listing_type}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => {
                      setEditListingId?.(listing._id);
                      setActiveTab("editEvlist");
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1"
                    title="Edit listing"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => askDelete(listing._id, listing.model_id._id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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