import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const ReviewsPage: React.FC<{ setAlert: (alert: AlertProps | null) => void }> = ({
  setAlert,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["adminAllReviews"],
    queryFn: () => adminService.getAllReviews(),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => adminService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllReviews"] });
      setAlert({
        type: "success",
        message: "Review deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to delete review",
      });
    },
  });

  const filteredReviews = Array.isArray(reviews)
    ? reviews.filter((review: any) => {
        const reviewerName = review.reviewer_id?.name || review.user_id?.name || "";
        const comment = review.comment || "";
        const productName = review.order_id?.listing_id?.model_id?.model_name || "";
        return (
          reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const reportData = filteredReviews.map(review => ({
    reviewer: review.reviewer_id?.name || review.user_id?.name || "Anonymous",
    product: review.order_id?.listing_id?.model_id?.model_name || "N/A",
    rating: review.rating || "N/A",
    comment: review.comment || "N/A"
  }));

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">Reviews Management</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={[
              { header: "Reviewer", dataKey: "reviewer" },
              { header: "Product", dataKey: "product" },
              { header: "Rating", dataKey: "rating" },
              { header: "Comment", dataKey: "comment" },
            ]}
            title="Reviews Management Report"
            filename="reviews_report"
          />
          <input
            type="text"
            placeholder="Search reviews..."
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
                  Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review: any) => (
                  <tr key={review._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {review.reviewer_id?.name || review.user_id?.name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {review.order_id?.listing_id?.model_id?.model_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Array.from({ length: review.rating || 0 })
                        .fill("⭐")
                        .join("")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                      {review.comment || "No comment"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this review?")) {
                            deleteReviewMutation.mutate(review._id);
                          }
                        }}
                        disabled={deleteReviewMutation.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        {deleteReviewMutation.isPending ? (
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
