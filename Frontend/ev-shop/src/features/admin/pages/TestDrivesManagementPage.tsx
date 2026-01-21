import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { CloseIcon, TrashIcon } from "@/assets/icons/icons";
import type { AlertProps, ConfirmAlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const TestDrivesManagementPage: React.FC<{
  setAlert: (alert: AlertProps | null) => void;
  setConfirmAlert: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const [activeTab, setActiveTab] = useState<"bookings" | "slots">("bookings");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // ----- Bookings Data -----
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["adminAllTestDriveBookings"],
    queryFn: () => adminService.getAllTestDriveBookings(),
  });

  // ----- Slots Data -----
  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["adminAllTestDriveSlots"],
    queryFn: () => adminService.getAllTestDriveSlots(),
    enabled: activeTab === "slots",
  });

  const bookings = Array.isArray(bookingsData) ? bookingsData : [];
  const slots = Array.isArray(slotsData) ? slotsData : [];

  // Mutations
  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => adminService.cancelTestDriveBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminAllTestDriveBookings"],
      });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Booking cancelled successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to cancel booking",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTestDriveSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllTestDriveSlots"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Slot deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete slot",
      });
    },
  });

  // Filtering
  const filteredBookings = bookings.filter((b: any) => {
    const userName = b.customer_id?.name || b.user_id?.name || "";
    const sellerName =
      b.slot_id?.seller_id?.business_name ||
      b.slot_id?.seller_id?.name ||
      b.seller_id?.business_name ||
      b.seller_id?.name ||
      "";
    const vehicleName =
      b.slot_id?.model_id?.model_name || b.model_id?.model_name || "";
    const status = b.status || "";
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredSlots = slots.filter((s: any) => {
    const sellerName = s.seller_id?.business_name || s.seller_id?.name || "";
    const location = s.location || "";
    const vehicleName = s.model_id?.model_name || "";
    return (
      sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Report Generation Data Preparation
  const reportData =
    activeTab === "bookings"
      ? filteredBookings.map((booking: any) => ({
          user: booking.customer_id?.name || booking.user_id?.name || "Unknown",
          seller:
            booking.slot_id?.seller_id?.business_name ||
            booking.slot_id?.seller_id?.name ||
            booking.seller_id?.business_name ||
            booking.seller_id?.name ||
            "Unknown Seller",
          vehicle:
            booking.slot_id?.model_id?.model_name ||
            booking.model_id?.model_name ||
            "Unknown Model",
          datetime: `${new Date(booking.booking_date).toLocaleDateString()} ${
            booking.booking_time
          }`,
          status: booking.status,
        }))
      : filteredSlots.map((slot: any) => ({
          seller:
            slot.seller_id?.business_name ||
            slot.seller_id?.name ||
            "Unknown Seller",
          location: slot.location,
          vehicle: slot.model_id?.model_name || "Unknown Model",
          date: new Date(slot.available_date).toLocaleDateString(),
          maxBookings: slot.max_bookings,
        }));

  const reportColumns =
    activeTab === "bookings"
      ? [
          { header: "User", dataKey: "user" },
          { header: "Seller", dataKey: "seller" },
          { header: "Vehicle", dataKey: "vehicle" },
          { header: "Date/Time", dataKey: "datetime" },
          { header: "Status", dataKey: "status" },
        ]
      : [
          { header: "Seller", dataKey: "seller" },
          { header: "Location", dataKey: "location" },
          { header: "Vehicle", dataKey: "vehicle" },
          { header: "Date", dataKey: "date" },
          { header: "Max Bookings", dataKey: "maxBookings" },
        ];

  const reportTitle =
    activeTab === "bookings"
      ? "Test Drive Bookings Report"
      : "Test Drive Slots Report";
  const reportFilename =
    activeTab === "bookings"
      ? "test_drive_bookings_report"
      : "test_drive_slots_report";

  const isLoading =
    activeTab === "bookings" ? isLoadingBookings : isLoadingSlots;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">
          Test Drive Management
        </h2>
        {/* Added flex-wrap and gap to prevent overflow */}
        <div className="flex gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <ReportGeneratorButton
            data={reportData}
            columns={reportColumns}
            title={reportTitle}
            filename={reportFilename}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "bookings"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          All Bookings
        </button>
        <button
          onClick={() => setActiveTab("slots")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "slots"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          All Slots
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {activeTab === "bookings" ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Max Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeTab === "bookings" ? (
                  filteredBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking: any) => (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {booking.customer_id?.name ||
                            booking.user_id?.name ||
                            "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {booking.slot_id?.seller_id?.business_name ||
                            booking.slot_id?.seller_id?.name ||
                            booking.seller_id?.business_name ||
                            booking.seller_id?.name ||
                            "Unknown Seller"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {booking.slot_id?.model_id?.model_name ||
                            booking.model_id?.model_name ||
                            "Unknown Model"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.booking_date).toLocaleDateString()}{" "}
                          {booking.booking_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${
                                          booking.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : booking.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.status !== "cancelled" && (
                            <button
                              onClick={() => {
                                setConfirmAlert({
                                  title: "Cancel Booking",
                                  message: "Are you sure you want to cancel this test drive booking?",
                                  confirmText: "Cancel Booking",
                                  cancelText: "Keep Booking",
                                  onConfirmAction: () => cancelBookingMutation.mutate(booking._id),
                                });
                              }}
                              disabled={cancelBookingMutation.isPending}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel Booking"
                            >
                              {cancelBookingMutation.isPending ? (
                                <Loader size={8} color="#dc2626" />
                              ) : (
                                <CloseIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                ) : filteredSlots.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No slots found
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map((slot: any) => (
                    <tr
                      key={slot._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {slot.seller_id?.business_name ||
                          slot.seller_id?.name ||
                          "Unknown Seller"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {slot.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {slot.model_id?.model_name || "Unknown Model"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(slot.available_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {slot.max_bookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setConfirmAlert({
                              title: "Delete Slot",
                              message: "Are you sure you want to delete this test drive slot? This will affect any existing bookings for this slot.",
                              confirmText: "Delete",
                              cancelText: "Cancel",
                              onConfirmAction: () => deleteSlotMutation.mutate(slot._id),
                            });
                          }}
                          disabled={deleteSlotMutation.isPending}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Slot"
                        >
                          {deleteSlotMutation.isPending ? (
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
      )}
    </div>
  );
};
