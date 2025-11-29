import React from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@/assets/icons/icons";

const PaymentErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center dark:shadow-none dark:border dark:border-gray-700">
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 dark:text-white">Payment Error</h1>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          An error occurred while processing your payment. Please contact support if the issue persists.
        </p>

        <div className="flex gap-4">
          <Link
            to="/user/dashboard"
            state={{ activeTab: "cart" }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Return to Cart
          </Link>
          <Link
            to="/user/dashboard"
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentErrorPage;

