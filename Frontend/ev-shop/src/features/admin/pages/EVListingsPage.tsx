import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const EVListingsPage: React.FC<{ setAlert: (alert: AlertProps | null) => void }> = ({
  setAlert,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["adminAllListings"],
    queryFn: () => adminService.getAllListings(),
  });

  const deleteListingMutation = useMutation({
    mutationFn: (listingId: string) => adminService.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllListings"] });
      setAlert({
        type: "success",
        message: "Listing deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to delete listing",
      });
    },
  });

  const filteredListings = Array.isArray(listings)
    ? listings.filter((listing: any) =>
        listing.model_id?.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_id?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const reportData = filteredListings.map(listing => ({
    model: listing.model_id?.model_name || "N/A",
    seller: listing.seller_id?.business_name || listing.seller_id?.name || "N/A",
    price: `LKR ${listing.price?.toLocaleString("en-US") || "0"}`,
    status: listing.status || "active"
  }));

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">EV Listings Management</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={[
              { header: "Model", dataKey: "model" },
              { header: "Seller", dataKey: "seller" },
              { header: "Price", dataKey: "price" },
              { header: "Status", dataKey: "status" },
            ]}
            title="EV Listings Report"
            filename="ev_listings_report"
          />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

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
                          if (window.confirm("Are you sure you want to delete this listing?")) {
                            deleteListingMutation.mutate(listing._id);
                          }
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
    </div>
  );
};
