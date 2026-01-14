import React from "react";
import type { Notification, AlertProps } from "@/types";
import { PageLoader } from "@/components/Loader";
import { financialService } from "../financialService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { useQueryClient } from "@tanstack/react-query";

export const NotificationPage: React.FC<{
  notifications: Notification[];
  setAlert?: (alert: AlertProps | null) => void;
  isLoading?: boolean;
}> = ({ notifications, isLoading }) => {
  const institutionId = useAppSelector(selectActiveRoleId);
  const queryClient = useQueryClient();

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

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold dark:text-white">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            You have no notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif: any) => {
            const notificationId = notif._id || notif.id;
            const isRead = notif.is_read || false;

            return (
              <div
                key={notificationId}
                onClick={() => {
                  if (!isRead && notificationId) {
                    handleMarkAsRead(notificationId);
                  }
                }}
                className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700 cursor-pointer transition-all hover:shadow-lg ${
                  !isRead ? "border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg dark:text-white mb-1">
                      {notif.title || "Notification"}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {notif.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {formatTime(notif.createdAt || notif.time)}
                    </p>
                  </div>
                  {!isRead && (
                    <span className="ml-4 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
