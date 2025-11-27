import type { Order, AlertProps } from "@/types";

const getStatusChip = (status: Order["status"]): string => {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "Processing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const orders: Order[] = [
  {
    id: "ORD-2025-007",
    date: "2025-10-05",
    vehicle: "Pulse XR",
    status: "Delivered",
    total: "LKR 18,000,000",
  },
  {
    id: "ORD-2025-008",
    date: "2025-10-11",
    vehicle: "Charging Cable",
    status: "Processing",
    total: "LKR 25,000",
  },
  {
    id: "ORD-2025-009",
    date: "2025-09-20",
    vehicle: "Aura EV",
    status: "Cancelled",
    total: "LKR 12,500,000",
  },
];

export const OrderHistory: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => (
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
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {order.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {order.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {order.vehicle}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                {order.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);