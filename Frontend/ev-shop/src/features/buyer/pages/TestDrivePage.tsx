import React, { useMemo, useState, useEffect } from "react";
import {
  CarIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
} from "@/assets/icons/icons";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import type { AlertProps, BuyerTestDriveSlot, BuyerBookingData } from "@/types";
import { buyerService } from "../buyerService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

/**
 * A page for users to view and book test drives.
 */
export const TestDrivesPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const userId = useAppSelector(selectUserId);
  const queryClient = useQueryClient();

  // State for search, filter, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    slotId: string;
    modelId: string;
    sellerId: string;
    modelName: string;
    availableDate: string;
  } | null>(null);
  const [bookingForm, setBookingForm] = useState({
    booking_date: "",
    booking_time: "",
    duration_minutes: 30,
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    booking_date: "",
    booking_time: "",
    duration_minutes: 30,
  });

  // Cancel confirmation state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<any>(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    comment: "",
  });

  // Fetch available slots
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
  } = useQuery<BuyerTestDriveSlot[]>({
    queryKey: queryKeys.activeTestDriveSlots,
    queryFn: buyerService.getTestDriveSlots,
  });

  // Fetch user bookings
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isError: isBookingsError,
  } = useQuery<BuyerBookingData[]>({
    queryKey: queryKeys.customerTestDrives(userId || ""),
    queryFn: () => buyerService.getTestDriveByCustomer(userId!),
    enabled: !!userId,
  });

  const slots = useMemo(() => {
    const result = slotsData || [];
    return result;
  }, [slotsData]);

  const bookings = useMemo(() => {
    if (!bookingsData) return [];
    if (Array.isArray(bookingsData)) return bookingsData;
    return [];
  }, [bookingsData]);

  // Optimize lookup for booked slots
  const bookedSlotIds = useMemo(() => {
    return new Set(bookings.map((b: any) => b.slot_id));
  }, [bookings]);
  // Filter and paginate slots
  const filteredSlots = useMemo(() => {
    let filtered = slots;

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out past dates - only show today and future slots
    filtered = filtered.filter((slot: any) => {
      const slotDate = new Date(slot.available_date);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate >= today;
    });

    // Filter by search query (model name)
    if (searchQuery.trim()) {
      filtered = filtered.filter((slot: any) => {
        const modelName = slot.model_id?.name || slot.model_name || "";
        return modelName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter((slot: any) => {
        const slotDate = new Date(slot.available_date).toISOString().split('T')[0];
        return slotDate === selectedDate;
      });
    }

    return filtered;
  }, [slots, searchQuery, selectedDate]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSlots.length / ITEMS_PER_PAGE);
  const paginatedSlots = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSlots.slice(startIndex, endIndex);
  }, [filteredSlots, currentPage, ITEMS_PER_PAGE]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDate]);

  const scheduleMutation = useMutation({
    mutationFn: buyerService.scheduleTestDrive,
    onSuccess: (data) => {
      console.log("Booking response:", data);
      console.log("Response type:", typeof data);
      console.log("Response keys:", data ? Object.keys(data) : "null");
      
      // If we got here, the API call was successful
      // Show success message regardless of the response structure
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Test drive scheduled successfully",
          type: "success",
          message: "Test drive scheduled successfully!",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTestDriveSlots });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerTestDrives(userId),
        });
      }
      
      // Close modal after successful booking
      setShowBookingModal(false);
    },
    onError: (error: any) => {
      console.error("Error booking slot:", error);
      console.error("Error response:", error.response);
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error booking test drive",
          type: "error",
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to book test drive. Please try again.",
        });
      }
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: buyerService.cancelTestDrive,
    onSuccess: () => {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Booking cancelled",
          type: "success",
          message: "Your test drive booking has been cancelled successfully.",
        });
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTestDriveSlots });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerTestDrives(userId),
        });
      }
      setShowCancelDialog(false);
      setBookingToCancel(null);
    },
    onError: (error: any) => {
      console.error("Error cancelling booking:", error);
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error cancelling booking",
          type: "error",
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to cancel booking. Please try again.",
        });
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      buyerService.updateTestDrive(id, data),
    onSuccess: () => {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Booking updated",
          type: "success",
          message: "Your test drive booking has been updated successfully.",
        });
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTestDriveSlots });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerTestDrives(userId),
        });
      }
      setShowEditModal(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      console.error("Error updating booking:", error);
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error updating booking",
          type: "error",
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to update booking. Please try again.",
        });
      }
    },
  });

  // Fetch reviews to check status
  const { data: userReviews } = useQuery({
    queryKey: ["userReviews", userId],
    queryFn: () => buyerService.getReviewsByReviewer(userId!),
    enabled: !!userId,
  });

  // Helper to check if rated
  const isRated = (bookingId: string) => {
    return userReviews?.some((r: any) => 
      r.target_type === 'service' && (
        r.testDrive_id === bookingId || 
        (typeof r.testDrive_id === 'object' && r.testDrive_id?._id === bookingId) ||
        r.target_id === bookingId || 
        (typeof r.target_id === 'object' && r.target_id?._id === bookingId)
      )
    );
  };
  console.log(isRated("67b6c0b3c4b3c4b3c4b3c4b3"));
  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: buyerService.createReview,
    onSuccess: () => {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Rating submitted",
          type: "success",
          message: "Thank you for rating your test drive experience!",
        });
      }
      // Invalidate queries to refresh data
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerTestDrives(userId),
        });
      }
      setShowRatingModal(false);
      setBookingToRate(null);
      setRatingForm({ rating: 0, comment: "" });
    },
    onError: (error: any) => {
      console.error("Error submitting rating:", error);
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error submitting rating",
          type: "error",
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to submit rating. Please try again.",
        });
      }
    },
  });

  const handleBookSlot = (slotId: string, modelId: string, sellerId: string, modelName: string, availableDate: string) => {
    if (!userId) {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error booking test drive",
          type: "error",
          message: "You must be logged in to book a test drive.",
        });
      }
      return;
    }

    // Format the date for date input (YYYY-MM-DD)
    const formattedDate = new Date(availableDate).toISOString().slice(0, 10);

    // Open modal with slot details
    setSelectedSlot({ slotId, modelId, sellerId, modelName, availableDate });
    setShowBookingModal(true);
    // Pre-fill form with slot's available date
    setBookingForm({
      booking_date: formattedDate,
      booking_time: "",
      duration_minutes: 30,
    });
  };

  const handleSubmitBooking = () => {
    if (!selectedSlot || !userId) return;

    // Validate form
    if (!bookingForm.booking_date || !bookingForm.booking_time) {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Validation Error",
          type: "error",
          message: "Please fill in all required fields.",
        });
      }
      return;
    }

    const bookingData = {
      customer_id: userId,
      slot_id: selectedSlot.slotId,
      booking_date: bookingForm.booking_date,
      booking_time: bookingForm.booking_time,
      duration_minutes: bookingForm.duration_minutes,
    };

    scheduleMutation.mutate(bookingData);
  };

  const handleTimeChange = (time: string) => {
    // Validate time is between 08:30 and 15:30
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const minTime = 8 * 60 + 30; // 08:30 = 510 minutes
      const maxTime = 15 * 60 + 30; // 15:30 = 930 minutes

      if (timeInMinutes < minTime || timeInMinutes > maxTime) {
        if (setAlert) {
          setAlert({
            id: Date.now(),
            title: "Invalid Time",
            type: "error",
            message: "Please select a time between 8:30 AM and 3:30 PM.",
          });
        }
        return; // Don't update the form
      }
    }
    setBookingForm({ ...bookingForm, booking_time: time });
  };

  const handleEditTimeChange = (time: string) => {
    // Validate time is between 08:30 and 15:30
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const minTime = 8 * 60 + 30;
      const maxTime = 15 * 60 + 30;

      if (timeInMinutes < minTime || timeInMinutes > maxTime) {
        if (setAlert) {
          setAlert({
            id: Date.now(),
            title: "Invalid Time",
            type: "error",
            message: "Please select a time between 8:30 AM and 3:30 PM.",
          });
        }
        return;
      }
    }
    setEditForm({ ...editForm, booking_time: time });
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    // Pre-fill the edit form with existing booking data
    const bookingDate = new Date(booking.booking_date || booking.scheduled_date).toISOString().slice(0, 10);
    setEditForm({
      booking_date: bookingDate,
      booking_time: booking.booking_time || booking.time_slot || "",
      duration_minutes: booking.duration_minutes || 30,
    });
    setShowEditModal(true);
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = () => {
    if (bookingToCancel) {
      cancelMutation.mutate(bookingToCancel);
    }
  };

  const handleSubmitEdit = () => {
    if (!selectedBooking) return;

    // Validate form
    if (!editForm.booking_date || !editForm.booking_time) {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Validation Error",
          type: "error",
          message: "Please fill in all required fields.",
        });
      }
      return;
    }

    const updateData = {
      booking_time: editForm.booking_time,
      duration_minutes: editForm.duration_minutes,
    };

    updateMutation.mutate({ id: selectedBooking._id, data: updateData });
  };

  const handleRateBooking = (booking: any) => {
    setBookingToRate(booking);
    setRatingForm({ rating: 0, comment: "" });
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (!bookingToRate || !userId) return;

    // Validate rating
    if (ratingForm.rating === 0) {
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Validation Error",
          type: "error",
          message: "Please select a rating.",
        });
      }
      return;
    }

    const ratingData = {
      reviewer_id: userId,
      target_id: bookingToRate.slot_id.seller_id,
      target_type: "service",
      testDrive_id: bookingToRate._id, // Using booking ID as order reference
      title: `Test Drive - ${bookingToRate.slot_id?.model_id?.model_name || "EV Model"}`,
      rating: ratingForm.rating,
      comment: ratingForm.comment,
    };
    console.log(ratingData);
    ratingMutation.mutate(ratingData);
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<'available' | 'my-drives' | 'history'>('available');

  // Filter bookings into active and history
  const activeBookings = useMemo(() => {
    return bookings.filter((b: any) => 
      !['completed', 'cancelled', 'rejected'].includes(b.status?.toLowerCase())
    );
  }, [bookings]);

  const historyBookings = useMemo(() => {
    return bookings.filter((b: any) => 
      ['completed', 'cancelled', 'rejected'].includes(b.status?.toLowerCase())
    );
  }, [bookings]);

  if (isSlotsLoading || (userId && isBookingsLoading)) {
    return (
      <div className="text-center p-8 dark:text-gray-300">
        Loading test drive information...
      </div>
    );
  }

  if (isSlotsError || (userId && isBookingsError)) {
     return (
        <div className="text-center p-8 text-red-500">
           Error loading data. Please try refreshing the page.
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Test Drives</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your test drives and explore available slots.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Available Slots
          </button>
          <button
            onClick={() => setActiveTab('my-drives')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'my-drives'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            My Test Drives
            {activeBookings.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                {activeBookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Available Slots Tab */}
      {activeTab === 'available' && (
      <div className="animate-fadeIn">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by model name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Date Filter */}
          <div className="sm:w-64">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:[color-scheme:dark] transition-all"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedSlots.length > 0 ? (
            paginatedSlots.map((slot: any) => {
              const isBooked = bookedSlotIds.has(slot._id);
              const isNotAvailable = slot.max_bookings === 0;
              return (
                <div
                  key={slot._id}
                  className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-all dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700 group"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <CarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold dark:text-white">
                        {slot.model_id?.model_name || "EV Model"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
                      With{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {slot.seller_id?.business_name || "Seller"}
                      </span>
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium dark:text-gray-300">
                          Date:
                        </span>
                        <span className="dark:text-gray-400">
                          {new Date(slot.available_date).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium dark:text-gray-300">
                          Time:
                        </span>
                        <span className="dark:text-gray-400">{`8.30 am - 3.30 pm`}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium dark:text-gray-300">
                          Available Slots:
                        </span>
                        <span className="dark:text-gray-400">{`${slot.max_bookings}`}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="h-4 w-4 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 border border-gray-400 rounded-full text-[10px]">
                          L
                        </span>
                        <span className="font-medium dark:text-gray-300">
                          Location:
                        </span>
                        <span className="dark:text-gray-400">
                          {slot.location || "Dealer Location"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleBookSlot(
                        slot._id,
                        slot.model_id?._id || slot.model_id,
                        slot.seller_id?._id || slot.seller_id,
                        slot.model_id?.model_name || "EV Model",
                        slot.available_date
                      )
                    }
                    disabled={isBooked || scheduleMutation.isPending || isNotAvailable}
                    className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-gray-600 shadow-sm"
                  >
                    {isBooked ? "Booked" : "Book Now"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
               <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-lg font-medium">No slots found</p>
               <p className="text-sm mt-1">
                {slots.length === 0 
                  ? "No test drive slots availble at the moment."
                  : "Try adjusting your search or date filter."}
               </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredSlots.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
      )}

      {/* My Test Drives (Active) Tab */}
      {activeTab === 'my-drives' && (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700 animate-fadeIn">
        {activeBookings.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeBookings.map((booking: any) => (
              <li
                key={booking._id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg dark:text-white">
                    {booking.slot_id?.model_id?.model_name || "EV Model"}
                  </p>
                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2 mt-1 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(
                      booking.booking_date || booking.scheduled_date
                    ).toLocaleDateString()}
                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                    <ClockIcon className="h-4 w-4 ml-2 sm:ml-0" />
                    {booking.booking_time}
                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                    <span className="font-medium ml-2 sm:ml-0">Duration:</span>
                    {booking.duration_minutes} min
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1 dark:text-gray-400">
                    <span className="h-4 w-4 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 border border-gray-400 rounded-full text-[10px]">
                      L
                    </span>
                    <span className="font-medium">Location:</span>
                    {booking.slot_id?.location || "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                     booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                     booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    <CheckIcon className="h-4 w-4" />
                    <span className="capitalize">{booking.status || 'Scheduled'}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {booking.status?.toLowerCase() !== 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-gray-700"
                          title="Edit booking"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancelMutation.isPending}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-gray-700"
                          title="Cancel booking"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
             <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <CarIcon className="w-8 h-8 text-gray-400" />
             </div>
            <p className="text-gray-500 text-lg dark:text-gray-400">
              You have no upcoming test drives.
            </p>
            <button 
              onClick={() => setActiveTab('available')}
              className="mt-4 text-blue-600 hover:underline dark:text-blue-400"
            >
              Browse available slots
            </button>
          </div>
        )}
      </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700 animate-fadeIn">
        {historyBookings.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {historyBookings.map((booking: any) => (
              <li
                key={booking._id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg dark:text-white">
                        {booking.slot_id?.model_id?.model_name || "EV Model"}
                      </p>
                       <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${
                         booking.status === 'completed' ? 'border-green-200 text-green-700 dark:text-green-400 dark:border-green-800' : 
                         'border-red-200 text-red-700 dark:text-red-400 dark:border-red-800'
                       }`}>
                         {booking.status}
                       </span>
                    </div>
                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2 mt-1 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(
                      booking.booking_date || booking.scheduled_date
                    ).toLocaleDateString()}
                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                    <ClockIcon className="h-4 w-4 ml-2 sm:ml-0" />
                    {booking.booking_time}
                  </p>
                </div>
                <div>
                   {booking.status === 'completed' && !isRated(booking._id) && (
                      <button
                        onClick={() => handleRateBooking(booking)}
                        disabled={ratingMutation.isPending}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-yellow-600 dark:hover:bg-yellow-500 flex items-center gap-2 shadow-sm text-sm"
                        title="Rate this test drive"
                      >
                        <span>⭐</span>
                        <span className="font-medium">Rate Experience</span>
                      </button>
                   )}
                   {booking.status === 'completed' && isRated(booking._id) && (
                      <span className="flex items-center gap-1 text-sm text-gray-500 font-medium px-4 py-2 bg-gray-100 rounded-lg dark:text-gray-400 dark:bg-gray-700">
                        <span>✓</span> Rated
                      </span>
                   )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No past test drive history found.</p>
          </div>
        )}
      </div>
      )}


      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">
                Book Test Drive
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Model: <span className="font-semibold text-gray-900 dark:text-white">{selectedSlot.modelName}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Booking Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booking Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={bookingForm.booking_date}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white dark:[color-scheme:dark] cursor-not-allowed opacity-75"
                  required
                />
              </div>

              {/* Booking Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booking Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={bookingForm.booking_time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  min="08:30"
                  max="15:30"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available time: 8:30 AM - 3:30 PM
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={bookingForm.duration_minutes}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: parseInt(e.target.value) || 30 })}
                  min="15"
                  max="60"
                  step="15"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={scheduleMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {scheduleMutation.isPending ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">
                Edit Test Drive
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Model: <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedBooking.model_name || selectedBooking.model_id?.name || "EV Model"}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Booking Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booking Date
                </label>
                <input
                  type="date"
                  value={editForm.booking_date}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white dark:[color-scheme:dark] cursor-not-allowed opacity-75"
                />
              </div>

              {/* Booking Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booking Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={editForm.booking_time}
                  onChange={(e) => handleEditTimeChange(e.target.value)}
                  min="08:30"
                  max="15:30"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available time: 8:30 AM - 3:30 PM
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) || 30 })}
                  min="15"
                  max="60"
                  step="15"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {updateMutation.isPending ? "Updating..." : "Update Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Cancel Booking
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to cancel this test drive booking? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setBookingToCancel(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && bookingToRate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">
                Rate Your Test Drive
              </h2>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Model: <span className="font-semibold text-gray-900 dark:text-white">
                  {bookingToRate.slot_id?.model_id?.model_name || "EV Model"}
                </span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                      className="text-4xl transition-all hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= ratingForm.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}>
                        ⭐
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {ratingForm.rating === 0 && "Click to rate"}
                  {ratingForm.rating === 1 && "Poor"}
                  {ratingForm.rating === 2 && "Fair"}
                  {ratingForm.rating === 3 && "Good"}
                  {ratingForm.rating === 4 && "Very Good"}
                  {ratingForm.rating === 5 && "Excellent"}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Comments (Optional)
                </label>
                <textarea
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                  rows={4}
                  placeholder="Share your experience with this test drive..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={ratingMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-yellow-600 dark:hover:bg-yellow-500"
              >
                {ratingMutation.isPending ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDrivesPage;
