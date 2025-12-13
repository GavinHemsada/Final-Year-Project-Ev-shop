import React, { useMemo, useState, useEffect } from "react";
import {
  CarIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
} from "@/assets/icons/icons";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import type { AlertProps, BuyerTestDriveSlot } from "@/types";
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
  } = useQuery<BuyerTestDriveSlot[]>({
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
      if (data.success) {
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
      } else {
        throw new Error(data.message || "Failed to book slot");
      }
    },
    onError: (error: any) => {
      console.error("Error booking slot:", error);
      if (setAlert) {
        setAlert({
          id: Date.now(),
          title: "Error booking test drive",
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to book test drive. Please try again.",
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
    setShowBookingModal(false);
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

  if (isSlotsLoading || (userId && isBookingsLoading)) {
    return (
      <div className="text-center p-8 dark:text-gray-300">
        Loading test drive information...
      </div>
    );
  }

  if (isSlotsError || (userId && isBookingsError)) {
     // Optional: Render an error state UI or just keep the alert logic if handled globally
     // Since alerts are prop-based, we might want to ensure they are triggered or show inline error.
     // For now, let's show a friendly message.
     return (
        <div className="text-center p-8 text-red-500">
           Error loading data. Please try refreshing the page.
        </div>
     );
  }

  return (
    <div className="space-y-12">
      {/* Section for User's Existing Bookings */}
      <div>
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          My Test Drives
        </h1>
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          {bookings.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {bookings.map((booking: any) => (
                <li
                  key={booking._id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-lg dark:text-white">
                      {booking.model_name ||
                        booking.model_id?.name ||
                        "EV Model"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(
                        booking.booking_date || booking.scheduled_date
                      ).toLocaleDateString()}
                      <span className="text-gray-300 dark:text-gray-600">
                        |
                      </span>
                      <ClockIcon className="h-4 w-4" />
                      {booking.booking_time || booking.time_slot}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckIcon className="h-5 w-5" />
                    <span className="font-semibold">{booking.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              You have no upcoming test drives.
            </p>
          )}
        </div>
      </div>

      {/* Section for Available Slots */}
      <div>
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Available Test Drive Slots
        </h1>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by model name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]"
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
              return (
                <div
                  key={slot._id}
                  className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/50">
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
                    disabled={isBooked || scheduleMutation.isPending}
                    className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
                  >
                    {isBooked ? "Booked" : "Book Now"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              {slots.length === 0 
                ? "No test drive slots available at the moment."
                : "No slots match your search criteria. Try adjusting your filters."}
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
    </div>
  );
};

export default TestDrivesPage;
