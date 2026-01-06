import React, { useState, useEffect } from "react";
import { buyerService } from "@/features/buyer/buyerService";
import { Loader } from "@/components/Loader";
import { StarIcon, ChevronDownIcon, ChevronUpIcon } from "@/assets/icons/icons";
import type { Review } from "@/types/review";

const apiURL = import.meta.env.VITE_API_URL;

interface ReviewSectionProps {
  vehicleId: string;
  defaultOpen?: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ vehicleId, defaultOpen = false }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await buyerService.getReviewsByTargetId(vehicleId);
        if (Array.isArray(response)) {
          setReviews(response);
        } else if (response.success && response.reviews) {
          setReviews(response.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && reviews.length === 0) {
      fetchReviews();
    }
  }, [vehicleId, isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        <span>View Previous Reviews</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsOpen(false)}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-4"
      >
        <span>Hide Reviews</span>
        <ChevronUpIcon className="w-4 h-4" />
      </button>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader size={24} color="#3B82F6" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reviews yet for this vehicle.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-yellow-400">
              <span className="font-bold text-gray-900 dark:text-white mr-2">
                {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
                      ? "fill-current"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({reviews.length} reviews)
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {reviews.map((review) => (
              <div key={review._id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {review.reviewer_id.profile_image ? (
                      <img
                        src={`${apiURL}${review.reviewer_id.profile_image}`}
                        alt={review.reviewer_id.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs">
                        {review.reviewer_id.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium dark:text-gray-200">
                      {review.reviewer_id.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex text-yellow-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating ? "fill-current" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                {review.title && (
                  <p className="text-sm font-semibold dark:text-gray-200 mb-1">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
