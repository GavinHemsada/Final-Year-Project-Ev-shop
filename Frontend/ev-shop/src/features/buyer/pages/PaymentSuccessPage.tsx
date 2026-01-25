import React, { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircleIcon } from "@/assets/icons/icons";
import { useToast } from "@/context/ToastContext";

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    if (orderId) {
      showToast({
        text: "Payment successful! Your order has been confirmed.",
        type: "success",
      });
    }
  }, [orderId, showToast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center dark:shadow-none dark:border dark:border-gray-700">
        <div className="mb-6 flex justify-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
            <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 dark:text-white">Payment Successful!</h1>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          Your payment has been processed successfully. Your order is being prepared.
        </p>

        {orderId && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
            <p className="font-semibold dark:text-white">{orderId}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            to="/user/dashboard"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/user/dashboard"
            state={{ activeTab: "orders" }}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
