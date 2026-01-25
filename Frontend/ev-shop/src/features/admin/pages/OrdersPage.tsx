import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";
import { TrashIcon, PencilIcon } from "@/assets/icons/icons";
import { ConfirmAlert } from "@/components/MessageAlert";

interface OrdersPageProps {
  setAlert: (alert: AlertProps | null) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ setAlert }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["adminAllOrders"],
    queryFn: () => adminService.getAllOrders(),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllOrders"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Order status updated successfully",
      });
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to update order",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => adminService.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllOrders"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Order deleted successfully",
      });
      setIsDeleteAlertOpen(false);
      setOrderToDelete(null);
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete order",
      });
    },
  });

  const [newStatus, setNewStatus] = useState("");

  const handleEditClick = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status || "pending");
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete);
    }
  };

  const handleSaveStatus = () => {
    if (selectedOrder && newStatus) {
      updateOrderMutation.mutate({ orderId: selectedOrder._id, status: newStatus });
    }
  };

  const filteredOrders = Array.isArray(orders)
    ? orders.filter((order: any) => {
        const modelName = order.listing_id?.model_id?.model_name || "";
        const orderId = order._id?.toString() || "";
        const status = order.order_status || "";
        return (
          orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          modelName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const reportData = filteredOrders.map((order: any) => ({
    id: order._id,
    date: order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A",
    status: order.order_status || "pending",
    amount: `LKR ${order.total_amount?.toLocaleString("en-US") || "0"}`,
    customer: order.user_id?.name || "N/A",
    model: order.listing_id?.model_id?.model_name || "N/A",
  }));

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">Orders Management</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={[
              { header: "Order ID", dataKey: "id" },
              { header: "Customer", dataKey: "customer" },
              { header: "Model", dataKey: "model" },
              { header: "Date", dataKey: "date" },
              { header: "Status", dataKey: "status" },
              { header: "Amount", dataKey: "amount" },
            ]}
            title="Orders Management Report"
            filename="orders_report"
          />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order._id?.slice(-8) || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.listing_id?.model_id?.model_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.order_status === "confirmed" || order.order_status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : order.order_status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {order.order_status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      LKR {order.total_amount?.toLocaleString("en-US") || "0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEditClick(order)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Status"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Order"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Update Order Status</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update status for Order ID: <span className="font-semibold text-gray-900 dark:text-white">{selectedOrder._id?.slice(-8)}</span>
              </p>
              <div>
                <label htmlFor="modal-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Status
                </label>
                <select
                  id="modal-status-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  onClick={handleSaveStatus}
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <Loader size={16} color="white" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmAlert
        alert={
          isDeleteAlertOpen
            ? {
                title: "Delete Order",
                message:
                  "Are you sure you want to delete this order? This action cannot be undone.",
                confirmText: deleteOrderMutation.isPending
                  ? "Deleting..."
                  : "Delete",
              }
            : null
        }
        onCancel={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
