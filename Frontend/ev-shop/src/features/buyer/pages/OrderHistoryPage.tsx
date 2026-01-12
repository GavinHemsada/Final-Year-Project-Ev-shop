import type { Order, AlertProps } from "@/types";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { StarIcon, CloseIcon } from "@/assets/icons/icons";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useNavigate } from "react-router-dom";
import { type Application } from "@/types";

const getStatusChip = (status: Order["order_status"]): string => {
  switch (status?.toLowerCase()) {
    case "delivered":
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "processing":
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const OrderHistory: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = () => {
  const userId = useAppSelector(selectUserId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const { data: orders, error } = useQuery({
    queryKey: ["userOrders", userId],
    queryFn: () => buyerService.getUserOrders(userId!),
    enabled: !!userId,
  });

  // Fetch user's reviews
  const { data: userReviews } = useQuery({
    queryKey: ["userReviews", userId],
    queryFn: () => buyerService.getReviewsByReviewer(userId!),
    enabled: !!userId,
  });

  // Fetch user's financing applications
  const { data: financingApplications } = useQuery({
    queryKey: ["userFinancingApplications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await buyerService.getUserFinancingApplications(userId);
      if (response.success && response.applications) {
        return response.applications;
      }
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: any) => buyerService.createReview(reviewData),
    onSuccess: () => {
      showToast({
        text: "Review submitted successfully!",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["userOrders", userId] });
      queryClient.invalidateQueries({ queryKey: ["userReviews", userId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to submit review",
        type: "error",
      });
    },
  });

  // Helper function to find review for an order
  const getOrderReview = (orderId: string) => {
    if (!userReviews) return null;
    return userReviews.find((review: any) => {
      const revOrderId =
        typeof review.order_id === "object" && review.order_id !== null
          ? (review.order_id as any)._id
          : review.order_id;
      return revOrderId === orderId;
    });
  };

  // Helper function to find financing application for an order
  const getOrderFinancingApplication = (orderId: string) => {
    if (!financingApplications) return null;
    return financingApplications.find((app: any) => {
      const appOrderId =
        typeof app.order_id === "object" && app.order_id !== null
          ? (app.order_id as any)._id
          : app.order_id;
      return appOrderId === orderId;
    });
  };

  const filteredOrders = orders?.filter((order: Order) => {
    if (filterStatus === "All") return true;
    return order.order_status?.toLowerCase() === filterStatus.toLowerCase();
  });

  console.log(orders);

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        Failed to load orders. Please try again later.
      </div>
    );
  }

  const handleRate = (order: Order) => {
    setSelectedOrder(order);
    setShowRatingModal(true);
    setRating(0);
    setTitle("");
    setComment("");
  };

  const handleCloseModal = () => {
    setShowRatingModal(false);
    setSelectedOrder(null);
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setComment("");
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder || !userId) return;

    if (rating === 0) {
      showToast({
        text: "Please select a rating",
        type: "error",
      });
      return;
    }

    const reviewData = {
      reviewer_id: userId,
      target_type: "product",
      target_id:
        (selectedOrder.seller_id as any)?._id || selectedOrder.seller_id,
      order_id: selectedOrder._id,
      rating,
      title,
      comment: comment || undefined,
    };

    submitReviewMutation.mutate(reviewData);
  };

  return (
    <>
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold dark:text-white">My Orders</h1>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 pr-8"
            >
              <option value="All">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Vehicle Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {!filteredOrders || filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: Order) => {
                  const modelName =
                    order.listing_id?.model_id?.model_name || "N/A";
                  const listingPrice =
                    order.listing_id?.price || order.total_amount;
                  const sellerLocation =
                    order.seller_id?.street_address || "N/A";
                  const canRate =
                    order.order_status?.toLowerCase() === "completed";

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order._id?.slice(-8).toUpperCase() || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.order_date
                          ? new Date(order.order_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{modelName}</div>
                        {order.listing_id?.color && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.listing_id.color}
                            {order.listing_id.registration_year &&
                              ` • ${order.listing_id.registration_year}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {sellerLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                            order.order_status
                          )}`}
                        >
                          {order.order_status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {listingPrice
                          ? `LKR ${listingPrice.toLocaleString()}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const financingApp: Application | null =
                              getOrderFinancingApplication(order._id);
                            // const hasLoanApplication = financingApp !== null;
                            const hasLoanApplication = financingApp?.order_id === order._id;
                            const isPendingLease =
                              order.order_status?.toLowerCase() === "confirmed" &&
                              (order.listing_id?.listing_type?.toLowerCase() ===
                                "lease" ||
                                order.listing_id?.listing_type?.toLowerCase() ===
                                  "forlease") && !hasLoanApplication;

                            // If order has loan application and is pending, show disabled button
                            if (
                              hasLoanApplication &&
                              financingApp?.status?.toLowerCase() === "pending"
                            ) {
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white text-xs font-medium rounded-lg cursor-not-allowed opacity-60 dark:bg-gray-600"
                                >
                                  Loan is Pending
                                </button>
                              );
                            }

                            if(financingApp?.status?.toLowerCase() === "approved"){
                              return (
                              <button
                              disabled
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-400 text-white text-xs font-medium rounded-lg cursor-not-allowed opacity-60 dark:bg-blue-600"
                            >
                              Loan is Approved
                            </button>
                            );
                            }
                            if(financingApp?.status?.toLowerCase() === "rejected"){
                              return (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-400 text-white text-xs font-medium rounded-lg cursor-not-allowed opacity-60 dark:bg-red-600"
                                >
                                  Loan is Rejected
                                </button>
                              );
                            }
                            // If order has loan application and is completed, show rating button
                            if (financingApp?.status?.toLowerCase() === "approved" && canRate) {
                              const existingReview = getOrderReview(order._id);
                              if (existingReview) {
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <svg
                                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {existingReview.rating}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={() => handleRate(order)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                  <StarIcon />
                                  Rate
                                </button>
                              );
                            }

                            // Original logic for pending lease orders without loan application
                            if (isPendingLease) {
                              return (
                                <button
                                  onClick={() => {
                                    if (order._id) {
                                      navigate(
                                        `/user/financing/apply/${order._id}`
                                      );
                                    } else {
                                      showToast({
                                        text: "Order information not available",
                                        type: "error",
                                      });
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-600"
                                >
                                  Apply Lease
                                </button>
                              );
                            }

                            // Original logic for completed orders without loan application
                            if (canRate) {
                              const existingReview = getOrderReview(order._id);
                              if (existingReview) {
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <svg
                                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {existingReview.rating}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={() => handleRate(order)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                  <StarIcon />
                                  Rate
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseIcon />
            </button>

            <h2 className="text-2xl font-bold mb-4 dark:text-white">
              Rate Your Purchase
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Order: {selectedOrder._id?.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedOrder.listing_id?.model_id?.model_name || "N/A"}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
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
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
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
                {rating > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {rating} out of 5 stars
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share details about your experience..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitReviewMutation.isPending
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
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

export default OrderHistory;
