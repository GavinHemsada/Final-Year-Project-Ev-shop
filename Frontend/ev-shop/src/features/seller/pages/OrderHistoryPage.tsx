import type { Order, AlertProps } from "@/types";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSellerId } from "@/context/authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "../sellerService";
import { useToast } from "@/context/ToastContext";
import { useState, useMemo } from "react";

const getStatusChip = (status: Order["order_status"]): string => {
  switch (status?.toLowerCase()) {
    case "delivered":
    case "confirmed":
    case "completed":
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

type TabType = "orders" | "completed" | "cancelled";

export const OrderHistory: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const sellerId = useAppSelector(selectSellerId);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const { data: orders, error, refetch } = useQuery({
    queryKey: ["sellerOrders", sellerId],
    queryFn: () => sellerService.getSellerOrders(sellerId!),
    enabled: !!sellerId,
  });

  const approveOrderMutation = useMutation({
    mutationFn: (orderId: string) => sellerService.updateOrderStatus(orderId, "completed"),
    onSuccess: async () => {
      // Refetch orders to get updated data
      await queryClient.invalidateQueries({ queryKey: ["sellerOrders", sellerId] });
      await refetch();
      
      // Switch to completed tab to show the approved order
      setActiveTab("completed");
      setCurrentPage(1);
      
      showToast({
        text: "Order approved successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text: error?.response?.data?.message || "Failed to approve order",
        type: "error",
      });
    },
  });

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    switch (activeTab) {
      case "orders":
        return orders.filter((order: Order) => 
          order.order_status?.toLowerCase() === "pending" || 
          order.order_status?.toLowerCase() === "confirmed"
        );
      case "completed":
        return orders.filter((order: Order) => 
          order.order_status?.toLowerCase() === "completed" ||
          order.order_status?.toLowerCase() === "delivered"
        );
      case "cancelled":
        return orders.filter((order: Order) => 
          order.order_status?.toLowerCase() === "cancelled"
        );
      default:
        return orders;
    }
  }, [orders, activeTab]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Reset to page 1 when changing tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  console.log(orders);

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        Failed to load orders. Please try again later.
      </div>
    );
  }

  const handleApprove = (orderId: string) => {
    approveOrderMutation.mutate(orderId);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">My Orders</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange("orders")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "orders"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Orders
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
              {orders?.filter((o: Order) => o.order_status?.toLowerCase() === "pending" || o.order_status?.toLowerCase() === "confirmed").length || 0}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("completed")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "completed"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Completed
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              {orders?.filter((o: Order) => o.order_status?.toLowerCase() === "completed" || o.order_status?.toLowerCase() === "delivered").length || 0}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("cancelled")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "cancelled"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Cancelled
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
              {orders?.filter((o: Order) => o.order_status?.toLowerCase() === "cancelled").length || 0}
            </span>
          </button>
        </nav>
      </div>

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
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Price
              </th>
              {activeTab === "orders" && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "orders" ? 7 : 6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order: Order) => {
                const modelName = order.listing_id?.model_id?.model_name || "N/A";
                const listingPrice = order.listing_id?.price || order.total_amount;
                const buyerName = order.user_id?.name || "N/A";
                const canApprove = activeTab === "orders";

                return (
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
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{modelName}</div>
                      {order.listing_id?.color && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.listing_id.color}
                          {order.listing_id.registration_year && ` • ${order.listing_id.registration_year}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {buyerName}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {listingPrice ? `LKR ${listingPrice.toLocaleString()}` : "N/A"}
                    </td>
                    {canApprove && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => handleApprove(order._id)}
                          disabled={approveOrderMutation.isPending}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approveOrderMutation.isPending ? "Approving..." : "Approve"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * ordersPerPage, filteredOrders.length)}
            </span>{" "}
            of <span className="font-medium">{filteredOrders.length}</span> orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === page
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};