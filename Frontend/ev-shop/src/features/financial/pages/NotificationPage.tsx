import React from "react";
import type { Notification, AlertProps } from "@/types";

export const NotificationPage: React.FC<{
  notifications: Notification[];
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ notifications }) => {
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
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700"
            >
              <p className="text-gray-700 dark:text-gray-300">{notif.message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {notif.time}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

