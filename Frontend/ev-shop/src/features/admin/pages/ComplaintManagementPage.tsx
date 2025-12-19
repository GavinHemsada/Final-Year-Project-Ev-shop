import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import { TrashIcon, CheckCircleIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const ComplaintManagementPage: React.FC<{ setAlert: (alert: AlertProps | null) => void }> = ({
  setAlert,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["adminAllComplaints"],
    queryFn: () => adminService.getAllComplaints(),
  });

  const deleteComplaintMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllComplaints"] });
      setAlert({
        type: "success",
        message: "Complaint deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to delete complaint",
      });
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: (id: string) => adminService.resolveComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllComplaints"] });
      setAlert({
        type: "success",
        message: "Complaint resolved successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to resolve complaint",
      });
    },
  });

  const displayComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredComplaints = displayComplaints.filter((complaint: any) =>
    complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const reportData = filteredComplaints.map(complaint => ({
    user: complaint.user_id?.name || "Unknown User",
    subject: complaint.subject || "N/A",
    message: complaint.message || "N/A",
    status: complaint.status || "Pending",
    date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A"
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">User Complaints</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={[
              { header: "User", dataKey: "user" },
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No complaints found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint: any) => (
                  <tr key={complaint._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {complaint.user_id?.name || "Unknown User"}
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
                             if (window.confirm("Mark this complaint as resolved?")) {
                                resolveComplaintMutation.mutate(complaint._id);
                             }
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Resolve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this complaint?")) {
                            deleteComplaintMutation.mutate(complaint._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
