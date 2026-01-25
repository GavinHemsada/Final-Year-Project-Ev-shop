import React, { useState, useRef, useEffect } from "react";
import { BellIcon } from "@/assets/icons/icons";
import type { ActiveTab, Notification } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/config/queryKeys";
import { selectUserId } from "@/context/authSlice";

/**
 * Props for the NotificationDropdown component.
 */
export type NotificationDropdownProps = {
  /** An array of notification objects to display. */
  notifications: Notification[];
  /** Callback function to set the active tab in the parent component. */
  setActiveTab: (tab: ActiveTab) => void;
};

/**
 * A dropdown component that displays a list of notifications.
 * It includes a bell icon that shows a badge with the number of unread notifications.
 * Clicking on a notification or the "View all" button navigates the user to the main notifications tab.
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = React.memo(({
  notifications,
  setActiveTab,
}) => {
  // State to manage the visibility of the dropdown.
  const [isOpen, setIsOpen] = useState(false);
  // Ref to the dropdown's root element, used to detect clicks outside of it.
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userID = useAppSelector(selectUserId);

  const QueryClient = useQueryClient();

  const notificationIsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      buyerService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      QueryClient.invalidateQueries({
        queryKey: queryKeys.notifications(userID!),
      });
    },
  });
  // Effect hook to add and remove a mousedown event listener.
  // This is used to close the dropdown when a user clicks outside of it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the dropdown is open and the click is outside the dropdown's DOM node, close it.
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // Add the event listener when the component mounts.
    document.addEventListener("mousedown", handleClickOutside);
    // Clean up the event listener when the component unmounts.
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  /**
   * Handles the "View all notifications" action.
   * It closes the dropdown and sets the active tab to 'notification'.
   */
  const handleViewAll = () => {
    setIsOpen(false);
    setActiveTab("notification");
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  /**
   * Handles clicking on an individual notification.
   * It closes the dropdown and navigates to the 'notification' tab.
   * Marks notification as read if it's unread.
   */
  const handleView = async (notification: Notification) => {
    const notificationId = notification._id;
    const isRead = notification.is_read || false;
    
    // Only mark as read if it's currently unread
    if (!isRead && notificationId) {
      notificationIsReadMutation.mutate(notificationId);
    }
    setIsOpen(false);
    setActiveTab("notification");
  };

  return (
    // The main container for the dropdown, with a ref for detecting outside clicks.
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell icon button that toggles the dropdown's visibility. */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-500 dark:hover:text-gray-200"
      >
        <BellIcon className="h-6 w-6" />

        {/* Badge displaying the number of notifications. Only shown if there are notifications. */}
        {notifications.filter(n => !n.is_read).length > 0 && (
          <span className="absolute -top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
            {notifications.filter(n => !n.is_read).length}
          </span>
        )}
      </button>

      {/* The dropdown panel, conditionally rendered based on the `isOpen` state. */}
      {isOpen && (
        <div className="animate-popIn absolute right-0 mt-2 w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-300 z-50 dark:bg-gray-800 dark:border-gray-500">
          {/* Dropdown Header */}
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="font-bold text-lg dark:text-white">Notifications</h3>
          </div>

          {/* Scrollable list of notifications. */}
          <div className="flex flex-col max-h-96 overflow-y-auto">
            {/* Map over the notifications array to render each item. */}
            {notifications.slice(0, 5).map((notif) => {
              const notificationId = notif._id;
              const isRead = notif.is_read || false;

              return (
                <div
                  key={notificationId}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700 ${
                    !isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleView(notif)}
                >
                  <div className="flex items-start gap-2">
                    {!isRead && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {notif.title || "Notification"}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {formatTime(notif.createdAt || notif.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Message displayed when there are no notifications. */}
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center dark:text-gray-400">
                You have no new notifications.
              </p>
            )}
          </div>

          {/* Dropdown Footer with a "View all" button. */}
          <div className="p-2 bg-gray-50 rounded-b-lg dark:bg-gray-900/50">
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100 rounded dark:text-blue-400 dark:hover:bg-gray-700"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
