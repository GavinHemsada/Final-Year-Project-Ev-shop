import React, { useState, useRef, useEffect } from "react";
import { BellIcon } from "@/assets/icons/icons";
import type { FinancialActiveTab, Notification } from "@/types";
import { financialService } from "../financialService";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";

export type NotificationDropdownProps = {
  notifications: Notification[];
  setActiveTab: (tab: FinancialActiveTab) => void;
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const institutionId = useAppSelector(selectActiveRoleId);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await financialService.markNotificationAsRead(notificationId);
      // Invalidate and refetch notifications immediately
      await queryClient.invalidateQueries({
        queryKey: ["financialNotifications", institutionId],
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setActiveTab("notification");
  };

  const handleView = async (notificationId: string, isRead: boolean) => {
    if (!isRead && notificationId) {
      await handleMarkAsRead(notificationId);
    }
    setIsOpen(false);
    setActiveTab("notification");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-500 dark:hover:text-gray-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-popIn absolute right-0 mt-2 w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-300 z-50 dark:bg-gray-800 dark:border-gray-500">
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="font-bold text-lg dark:text-white">Notifications</h3>
          </div>

          <div className="flex flex-col max-h-96 overflow-y-auto">
            {notifications.slice(0, 5).map((notif: any) => {
              const notificationId = notif._id || notif.id;
              const isRead = notif.is_read || false;

              return (
                <div
                  key={notificationId}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700 ${
                    !isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleView(notificationId, isRead)}
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

            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center dark:text-gray-400">
                You have no new notifications.
              </p>
            )}
          </div>

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
};
