import React from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { CalendarIcon, ReviewsIcon } from "@/assets/icons/icons";
import type { AlertProps, Review } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { PageLoader } from "@/components/Loader";

/**
 * A star rating display component.
 */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`h-5 w-5 ${
            index < rating
              ? "text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.25 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

/**
 * A page for users to view their submitted reviews.
 */
export const MyReviewsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const userId = useAppSelector(selectUserId);
  const queryClient = useQueryClient();

  // Fetch reviews using React Query
  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userReviews", userId],
    queryFn: () => buyerService.getUserReviews(userId!),
    enabled: !!userId,
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => buyerService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReviews", userId] });
      setAlert?.({
        id: Date.now(),
        type: "success",
        message: "Review deleted successfully",
      });
    },
    onError: (err: any) => {
      console.error(err);
      setAlert?.({
        id: Date.now(),
        type: "error",
        message: err.message || "Failed to delete review",
      });
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteMutation.mutate(reviewId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">My Reviews</h1>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review: Review) => (
            <div
              key={review._id}
              className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {review.listing_id?.listing_title || "Unknown Vehicle"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Reviewed on{" "}
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                {review.rating && <StarRating rating={review.rating} />}
              </div>
              <p className="text-gray-600 mt-4 dark:text-gray-300">
                {review.comment}
              </p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <ReviewsIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">
            No Reviews Yet
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            You haven't submitted any reviews. After a test drive, you can share
            your feedback.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
