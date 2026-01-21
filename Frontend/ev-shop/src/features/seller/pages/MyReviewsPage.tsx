import React from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSellerId } from "@/context/authSlice";
import { CalendarIcon, ReviewsIcon } from "@/assets/icons/icons";
import type { AlertProps, Review } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "../sellerService";
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
 * A page for sellers to view reviews targeting them.
 */
export const MyReviewsPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const sellerId = useAppSelector(selectSellerId);
  const [activeTab, setActiveTab] = React.useState<"order" | "test_drive">("order");
  
  const {
    data: reviews,
    isLoading,
  } = useQuery({
    queryKey: ["sellerReviews", sellerId],
    queryFn: () => sellerService.getAllReviews(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <PageLoader />
      </div>
    );
  }
  console.log("Reviews data:", reviews);

  // Robustly determine the reviews array
  let processedReviews: Review[] = [];
  if (Array.isArray(reviews)) {
    processedReviews = reviews;
  } else if (reviews && typeof reviews === "object" && Array.isArray((reviews as any).reviews)) {
    processedReviews = (reviews as any).reviews;
  }

  const sellerReviews = processedReviews.filter((review: Review) => {
    // Handle both populated and unpopulated target_id
    const targetId = (review.target_id as any)?._id || review.target_id;
    return targetId === sellerId;
  });

  const orderReviews = sellerReviews.filter((review) => review.order_id);
  const testDriveReviews = sellerReviews.filter((review) => review.testDrive_id);

  const displayedReviews = activeTab === "order" ? orderReviews : testDriveReviews;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">Customer Reviews</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "order"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("order")}
        >
          Order Reviews
          <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
            {orderReviews.length}
          </span>
          {activeTab === "order" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "test_drive"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("test_drive")}
        >
          Test Drive Reviews
          <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
            {testDriveReviews.length}
          </span>
          {activeTab === "test_drive" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
      </div>
      
      {displayedReviews && displayedReviews.length > 0 ? (
        <div className="space-y-6">
          {displayedReviews.map((review: Review) => (
            <div
              key={review._id}
              className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {review.reviewer_id?.name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Reviewed on{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Context Info */}
                  {review.order_id && (
                     <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Verified Purchase • {review.order_id.listing_id?.model_id?.model_name || "Vehicle"}
                     </p>
                  )}
                  {review.testDrive_id && (
                     <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Test Drive Experience • {review.testDrive_id.model_id?.model_name || "Vehicle"}
                     </p>
                  )}
                </div>
                {review.rating && (
                  <StarRating rating={review.rating} />
                )}
              </div>
              <h4 className="font-semibold mt-2 text-gray-800 dark:text-gray-200">
                  {review.title}
              </h4>
              <p className="text-gray-600 mt-2 dark:text-gray-300">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <ReviewsIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">
            No {activeTab === 'order' ? 'Order' : 'Test Drive'} Reviews Yet
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            You haven't received any reviews for {activeTab === 'order' ? 'orders' : 'test drives'} yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;