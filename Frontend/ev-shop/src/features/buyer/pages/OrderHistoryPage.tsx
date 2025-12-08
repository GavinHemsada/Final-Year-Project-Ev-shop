import type { Order, AlertProps } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { PageLoader } from "@/components/Loader";

const getStatusChip = (status: Order["order_status"]): string => {
  switch (status?.toLowerCase()) {
    case "delivered":
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "processing":
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const OrderHistory: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const { getUserID } = useAuth();
  const userId = getUserID();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["userOrders", userId],
    queryFn: () => buyerService.getUserOrders(userId!),
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><PageLoader /></div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        Failed to load orders. Please try again later.
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">My Orders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {(!orders || orders.length === 0) ? (
               <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order: Order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {order._id?.slice(-8).toUpperCase() || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                     {order.items && order.items.length > 0 
                      ? order.items[0].listing_id?.listing_title 
                      : "EV Purchase"}
                     {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                        order.order_status
                      )}`}
                    >
                      {order.order_status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                    {order.total_amount ? `LKR ${order.total_amount.toLocaleString()}` : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;