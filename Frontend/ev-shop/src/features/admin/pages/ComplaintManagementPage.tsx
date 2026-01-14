import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon, CheckCircleIcon } from "@/assets/icons/icons";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";
import { TopMessageAlerts, ConfirmAlert } from "@/components/MessageAlert";
import type { ConfirmAlertProps } from "@/types";

type ComplaintTab = "all" | "buyer" | "seller" | "financial";

export const ComplaintManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ComplaintTab>("all");
  const [message, setMessage] = useState<{
    id: string;
    text: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch all complaints for counts
  const { data: allComplaints } = useQuery({
    queryKey: ["adminAllComplaints", "all"],
    queryFn: () => adminService.getAllComplaints(undefined),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch filtered complaints for current tab
  const { data: complaints, isLoading } = useQuery({
    queryKey: ["adminAllComplaints", activeTab],
    queryFn: async () => {
      const userType = activeTab === "all" ? undefined : activeTab;
      const result = await adminService.getAllComplaints(userType);
      return result;
    },
    staleTime: 0, // Always refetch when tab changes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const deleteComplaintMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllComplaints"] });
      setMessage({
        id: Date.now().toString(),
        text: "Complaint deleted successfully",
        type: "success",
      });
    },
    onError: (error: any) => {
      setMessage({
        id: Date.now().toString(),
        text: error.response?.data?.error || "Failed to delete complaint",
        type: "error",
      });
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: (id: string) => adminService.resolveComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllComplaints"] });
      setMessage({
        id: Date.now().toString(),
        text: "Complaint resolved successfully",
        type: "success",
      });
    },
    onError: (error: any) => {
      setMessage({
        id: Date.now().toString(),
        text: error.response?.data?.error || "Failed to resolve complaint",
        type: "error",
      });
    },
  });

  const displayComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredComplaints = displayComplaints.filter((complaint: any) => {
    const matchesSearch =
      complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Note: Backend already filters by user_type, but we keep this as a safety check
    // and for search functionality
    const matchesType =
      activeTab === "all" || complaint.user_type === activeTab;

    return matchesSearch && matchesType;
  });

  const reportData = filteredComplaints.map((complaint) => {
    // Get the correct name based on user_type
    const getComplaintSenderName = () => {
      if (complaint.user_type === "seller") {
        return (
          complaint.seller_data?.business_name ||
          complaint.seller_data?.name ||
          complaint.user_id?.name ||
          "Unknown Seller"
        );
      } else if (complaint.user_type === "financial") {
        return (
          complaint.financial_data?.name ||
          complaint.financial_data?.business_name ||
          complaint.user_id?.name ||
          "Unknown Financial Institution"
        );
      } else {
        // buyer
        return complaint.user_id?.name || "Unknown Buyer";
      }
    };

    return {
      user: getComplaintSenderName(),
      userType: complaint.user_type || "N/A",
      subject: complaint.subject || "N/A",
      message: complaint.message || "N/A",
      status: complaint.status || "Pending",
      date: complaint.createdAt
        ? new Date(complaint.createdAt).toLocaleDateString()
        : "N/A",
    };
  });

  if (isLoading) {
    return <PageLoader />;
  }

  // Count complaints by type using all complaints (for accurate counts)
  const allComplaintsForCount = Array.isArray(allComplaints)
    ? allComplaints
    : [];
  const buyerCount = allComplaintsForCount.filter(
    (c: any) => !c.user_type || c.user_type === "buyer" || c.user_type === null
  ).length;
  const sellerCount = allComplaintsForCount.filter(
    (c: any) => c.user_type === "seller"
  ).length;
  const financialCount = allComplaintsForCount.filter(
    (c: any) => c.user_type === "financial"
  ).length;
  const allCount = allComplaintsForCount.length;

  return (
    <>
      <TopMessageAlerts
        message={message}
        onClose={() => setMessage(null)}
        position="top"
        positionValue="20px"
        right="20px"
        width="400px"
      />
      {confirmAlert && (
        <ConfirmAlert
          alert={{
            title: confirmAlert.title,
            message: confirmAlert.message,
            confirmText: confirmAlert.confirmText,
            cancelText: confirmAlert.cancelText,
            onConfirmAction: confirmAlert.onConfirmAction,
          }}
          onConfirm={() => {
            if (confirmAlert.onConfirmAction) {
              confirmAlert.onConfirmAction();
            }
            setConfirmAlert(null);
          }}
          onCancel={() => setConfirmAlert(null)}
        />
      )}
      <div className="space-y-6">
        <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
          <h2 className="text-2xl font-bold dark:text-white">
            User Complaints
          </h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <ReportGeneratorButton
              data={reportData}
              columns={[
                { header: "User", dataKey: "user" },
                { header: "User Type", dataKey: "userType" },
                { header: "Subject", dataKey: "subject" },
                { header: "Message", dataKey: "message" },
                { header: "Status", dataKey: "status" },
                { header: "Date", dataKey: "date" },
              ]}
              title="User Complaints Report"
              filename="complaints_report"
            />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              All Complaints
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {allCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("buyer")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "buyer"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Buyer Complaints
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {buyerCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("seller")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "seller"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Seller Complaints
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                {sellerCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("financial")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "financial"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Financial Complaints
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                {financialCount}
              </span>
            </button>
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
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
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint: any) => {
                    // Get the correct name based on user_type
                    const getComplaintSenderName = () => {
                      if (complaint.user_type === "seller") {
                        return (
                          complaint.seller_data?.business_name ||
                          complaint.seller_data?.name ||
                          complaint.user_id?.name ||
                          "Unknown Seller"
                        );
                      } else if (complaint.user_type === "financial") {
                        return (
                          complaint.financial_data?.name ||
                          complaint.financial_data?.business_name ||
                          complaint.user_id?.name ||
                          "Unknown Financial Institution"
                        );
                      } else {
                        // buyer
                        return complaint.user_id?.name || "Unknown Buyer";
                      }
                    };

                    return (
                      <tr
                        key={complaint._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {getComplaintSenderName()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              complaint.user_type === "buyer"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : complaint.user_type === "seller"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : complaint.user_type === "financial"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {complaint.user_type || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {complaint.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                          {complaint.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              complaint.status === "resolved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {complaint.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                          {complaint.status !== "resolved" && (
                            <button
                              onClick={() => {
                                setConfirmAlert({
                                  title: "Resolve Complaint",
                                  message:
                                    "Are you sure you want to mark this complaint as resolved?",
                                  confirmText: "Resolve",
                                  cancelText: "Cancel",
                                  onConfirmAction: () => {
                                    resolveComplaintMutation.mutate(
                                      complaint._id
                                    );
                                    setConfirmAlert(null);
                                  },
                                });
                              }}
                              disabled={resolveComplaintMutation.isPending}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Resolve"
                            >
                              {resolveComplaintMutation.isPending ? (
                                <Loader size={8} color="#16a34a" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setConfirmAlert({
                                title: "Delete Complaint",
                                message:
                                  "Are you sure you want to delete this complaint? This action cannot be undone.",
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                onConfirmAction: () => {
                                  deleteComplaintMutation.mutate(complaint._id);
                                  setConfirmAlert(null);
                                },
                              });
                            }}
                            disabled={deleteComplaintMutation.isPending}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deleteComplaintMutation.isPending ? (
                              <Loader size={8} color="#dc2626" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
