import { BellIcon } from "@/assets/icons/icons";
import type { Notification, AlertProps } from "@/types";

// --- End Mock Data ---

const NotificationPage: React.FC<{ notifications: Notification[]; setAlert?: (alert: AlertProps | null) => void }> = ({
  notifications,
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Notifications
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col">
          {notifications.map((notif, index) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors ${
                index !== notifications.length - 1 ? "border-b" : ""
              } border-gray-200 dark:border-gray-700 dark:hover:bg-gray-700`}
            >
              <div className="mt-1 flex-shrink-0 p-2 bg-blue-100 rounded-full dark:bg-blue-900/50">
                <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-gray-200">
                  {notif.message}
                </p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  {notif.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;