import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { CalendarIcon, ReviewsIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";

// --- Mock Data (replace with API calls) ---
// This data simulates bookings that have feedback attached.
const mockBookingsWithReviews: (any & {
  model_name: string;
  slot_id: { model_id: string };
})[] = [
  {
    _id: "booking1",
    customer_id: "user123",
    slot_id: { model_id: "Aura EV" },
    booking_date: new Date("2024-09-15T00:00:00.000Z"),
    booking_time: "10:00",
    status: "Completed",
    duration_minutes: 60,
    model_name: "Aura EV",
    feedback_rating: 5,
    feedback_comment:
      "The Aura EV was incredibly smooth and silent. The interior felt premium and the range was more than enough for my daily commute. The booking process was seamless.",
  },
  {
    _id: "booking2",
    customer_id: "user123",
    slot_id: { model_id: "Pulse XR" },
    booking_date: new Date("2024-09-28T00:00:00.000Z"),
    booking_time: "14:00",
    status: "Completed",
    duration_minutes: 60,
    model_name: "Pulse XR",
    feedback_rating: 4,
    feedback_comment:
      "A powerful and spacious SUV. It handled surprisingly well for its size. I'm giving it 4 stars because the infotainment system was a bit slow to respond at times.",
  },
];

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
export const MyReviewsPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const [reviews, setReviews] = useState<
    (any & { model_name: string; slot_id: { model_id: string } })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getUserID } = useAuth();

  useEffect(() => {
    // In a real app, you would fetch the user's bookings and filter for those with reviews.
    // const fetchMyReviews = async () => {
    //   try {
    //     const userId = getUserID();
    //     const response = await fetch(`/api/test-drive/bookings/customer/${userId}`);
    //     const data = await response.json();
    //     if (data.success) {
    //       const userReviews = data.bookings.filter(b => b.feedback_rating || b.feedback_comment);
    //       setReviews(userReviews);
    //     }
    //   } catch (error) {
    //     console.error("Failed to fetch reviews:", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchMyReviews();

    // Using mock data for now
    setReviews(mockBookingsWithReviews);
    setIsLoading(false);
  }, [getUserID]);

  const handleDeleteReview = (bookingId: string) => {
    // This would call DELETE /api/test-drive/ratings/{bookingId}
    console.log(`Deleting review for booking ${bookingId}`);
    alert(`Review for booking ${bookingId} deleted!`);
    // You would then re-fetch reviews or remove it from the state
    setReviews((prev) => prev.filter((r) => r._id !== bookingId));
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading your reviews...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">My Reviews</h1>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {review.slot_id.model_id}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Reviewed on{" "}
                      {new Date(review.booking_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.feedback_rating && (
                  <StarRating rating={review.feedback_rating} />
                )}
              </div>
              <p className="text-gray-600 mt-4 dark:text-gray-300">
                {review.feedback_comment}
              </p>
              <div className="flex justify-end gap-3 mt-4">
                <button className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
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
