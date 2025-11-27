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
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null, handler?: () => void) => void;
}> = ({ sellerid, setActiveTab, listings, setAlert, setConfirmAlert }) => {
  const [selectedListing, setSelectedListing] = useState<{
    listingId: string;
    modelId: string;
  } | null>(null);
  const queryClient = useQueryClient();

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
      id: Date.now(),
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
        <h2 className="text-xl font-bold">My Vehicle Listings</h2>
        <button
          onClick={() => setActiveTab("evList")}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Add New Listing
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listing Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {listings.map((listing) => (
              <tr
                key={listing._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={`${apiURL}${listing.images[0]}`}
                    alt={listing.model_id?.model_name}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {listing.model_id?.model_name}
                    </div>
                    <div className="text-sm text-gray-500">
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
                <td className="px-6 py-4 text-sm text-gray-600">
                  {listing.price}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {listing.listing_type}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => console.log(listing._id)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => askDelete(listing._id, listing.model_id._id)}
                    className="text-red-600 hover:text-red-900 p-1"
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