import React from "react";

export const SettingsPage: React.FC<{ setAlert: (alert: any) => void }> = ({
  setAlert,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">System Settings</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">General Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              defaultValue="EV Shop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Description
            </label>
            <textarea
              rows={3}
              defaultValue="Electric Vehicle Marketplace"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={() =>
              setAlert({
                type: "success",
                message: "Settings saved successfully",
              })
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

