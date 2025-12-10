import React, { useMemo } from "react";
import {
  CarIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
} from "@/assets/icons/icons";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import type { AlertProps } from "@/types";
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

  // Fetch available slots
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
  } = useQuery({
    queryKey: queryKeys.activeTestDriveSlots,
    queryFn: buyerService.getTestDriveSlots,
  });

  // Fetch user bookings
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isError: isBookingsError,
  } = useQuery({
    queryKey: queryKeys.customerTestDrives(userId || ""),
    queryFn: () => buyerService.getTestDriveByCustomer(userId!),
    enabled: !!userId,
  });

  const slots = useMemo(() => {
    return slotsData?.success ? slotsData.slots || [] : slotsData || [];
  }, [slotsData]);

  const bookings = useMemo(() => {
    if (!bookingsData) return [];
    if (bookingsData.success && bookingsData.bookings) return bookingsData.bookings;
    if (Array.isArray(bookingsData)) return bookingsData;
    return [];
  }, [bookingsData]);

  // Optimize lookup for booked slots
  const bookedSlotIds = useMemo(() => {
    return new Set(bookings.map((b: any) => b.slot_id));
  }, [bookings]);

  const scheduleMutation = useMutation({
    mutationFn: buyerService.scheduleTestDrive,
    onSuccess: (data) => {
      if (data.success || data.message === "Test drive scheduled successfully") {
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

  const handleBookSlot = (slotId: string, modelId: string, sellerId: string) => {
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

    const bookingData = {
      customer_id: userId,
      slot_id: slotId,
      model_id: modelId,
      seller_id: sellerId,
      status: "Pending",
    };

    scheduleMutation.mutate(bookingData);
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {slots.length > 0 ? (
            slots.map((slot: any) => {
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
                        {slot.model_id?.name || slot.model_name || "EV Model"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
                      With{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {slot.seller_id?.business_name ||
                          slot.seller_name ||
                          "Seller"}
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
                        <span className="dark:text-gray-400">{`${slot.start_time} - ${slot.end_time}`}</span>
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
                        slot.seller_id?._id || slot.seller_id
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
              No test drive slots available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDrivesPage;
