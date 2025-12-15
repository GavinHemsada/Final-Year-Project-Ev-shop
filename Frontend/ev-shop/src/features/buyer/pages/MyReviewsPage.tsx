import React, { useState } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { CalendarIcon, ReviewsIcon, CloseIcon } from "@/assets/icons/icons";
import type { AlertProps, Review, ConfirmAlertProps } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { PageLoader } from "@/components/Loader";
import { useToast } from "@/context/ToastContext";

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
 * A page for users to view, edit, and delete their submitted reviews.
 */
export const MyReviewsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (alert: ConfirmAlertProps | null) => void;
}> = ({ setConfirmAlert }) => {
  const userId = useAppSelector(selectUserId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [activeTab, setActiveTab] = useState<'product' | 'service'>('product');

  const reviewsPerPage = 5;

  // Fetch reviews using React Query
  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userReviews", userId],
    queryFn: () => buyerService.getReviewsByReviewer(userId!),
    enabled: !!userId,
  });
  console.log(reviews);
  // Filter reviews by type
  const productReviews = reviews?.filter((r: Review) => r.target_type === 'product' || !r.target_type) || [];
  const serviceReviews = reviews?.filter((r: Review) => r.target_type === 'service') || [];
  
  // Get current tab reviews
  const currentTabReviews = activeTab === 'product' ? productReviews : serviceReviews;

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => buyerService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReviews", userId] });
      showToast({
        text: "Review deleted successfully",
        type: "success",
      });
    },
    onError: (err: any) => {
      showToast({
        text: err?.response?.data?.message || "Failed to delete review",
        type: "error",
      });
    },
  });

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      buyerService.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReviews", userId] });
      showToast({
        text: "Review updated successfully",
        type: "success",
      });
      handleCloseEditModal();
    },
    onError: (err: any) => {
      showToast({
        text: err?.response?.data?.message || "Failed to update review",
        type: "error",
      });
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    if (setConfirmAlert) {
      setConfirmAlert({
        title: "Delete Review",
        message: "Are you sure you want to delete this review? This action cannot be undone.",
        onConfirmAction: () => {
          deleteMutation.mutate(reviewId);
          setConfirmAlert(null);
        },
      });
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating || 0);
    setEditTitle(review.title || "");
    setEditComment(review.comment || "");
  };

  const handleCloseEditModal = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditHoverRating(0);
    setEditTitle("");
    setEditComment("");
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingReview) return;

    if (editRating === 0) {
      showToast({
        text: "Please select a rating",
        type: "error",
      });
      return;
    }

    if (!editTitle.trim()) {
      showToast({
        text: "Please enter a title",
        type: "error",
      });
      return;
    }

    const reviewData: any = {
      reviewer_id: userId,
      target_type: editingReview.target_type,
      target_id: typeof editingReview.target_id === 'object' && editingReview.target_id !== null 
        ? (editingReview.target_id as any)._id 
        : editingReview.target_id,
      rating: editRating,
      title: editTitle,
      comment: editComment || undefined,
    };

    if (editingReview.target_type === 'service') {
      const tdId = (editingReview as any).testDrive_id;
      reviewData.testDrive_id = typeof tdId === 'object' && tdId !== null ? tdId._id : tdId;
    } else {
      reviewData.order_id = typeof editingReview.order_id === 'object' && editingReview.order_id !== null
        ? (editingReview.order_id as any)._id 
        : editingReview.order_id;
    }

    updateMutation.mutate({ id: editingReview._id, data: reviewData });
  };

  // Pagination logic
  const totalPages = currentTabReviews ? Math.ceil(currentTabReviews.length / reviewsPerPage) : 0;
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = currentTabReviews ? currentTabReviews.slice(startIndex, endIndex) : [];

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">My Reviews</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your product and service reviews
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('product')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'product'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Product Reviews
              {productReviews.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                  {productReviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'service'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Service Reviews
              {serviceReviews.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                  {serviceReviews.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {currentTabReviews && currentTabReviews.length > 0 ? (
          <>
            <div className="space-y-6 animate-fadeIn">
              {currentReviews.map((review: Review) => (
                <div
                  key={review._id}
                  className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {review.title || "Review"}
                      </h3>
                      <div className="mt-1 mb-2">
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {(review.order_id as any)?.listing_id?.model_id?.model_name || 
                           (review.target_id as any)?.model_id?.model_name || // Fallback for service reviews
                           "Vehicle Model"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sold by: {(review.target_id as any)?.business_name || 
                                   (review.target_id as any)?.seller_id?.business_name || // Fallback
                                   "Seller"}
                        </p>
                        {activeTab === 'service' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                            Test Drive Service
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    {review.rating && <StarRating rating={review.rating} />}
                  </div>
                  <p className="text-gray-600 mt-4 dark:text-gray-300">
                    {review.comment || "No comment provided"}
                  </p>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => handleEditReview(review)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === index + 1
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <ReviewsIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">
              No Reviews Yet
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              You haven't submitted any {activeTab === 'product' ? 'product' : 'service'} reviews.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseIcon />
            </button>

            <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Review</h2>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      onMouseEnter={() => setEditHoverRating(star)}
                      onMouseLeave={() => setEditHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`h-8 w-8 ${
                          star <= (editHoverRating || editRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {editRating > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {editRating} out of 5 stars
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Review Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comment (Optional)
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  placeholder="Share details about your experience..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Review"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MyReviewsPage;