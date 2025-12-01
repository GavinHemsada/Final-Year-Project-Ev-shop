import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";

export const FinancialPage: React.FC<{ setAlert: (alert: AlertProps | null) => void }> = ({
  setAlert,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: financials, isLoading } = useQuery({
    queryKey: ["adminAllFinancial"],
    queryFn: () => adminService.getAllFinancialInstitutions(),
  });

  const deleteFinancialMutation = useMutation({
    mutationFn: (financialId: string) => adminService.deleteFinancial(financialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllFinancial"] });
      setAlert({
        type: "success",
        message: "Financial institution deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to delete financial institution",
      });
    },
  });

  const filteredFinancials = Array.isArray(financials)
    ? financials.filter((financial: any) =>
        financial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        financial.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Financial Institutions Management</h2>
        <input
          type="text"
          placeholder="Search financial institutions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFinancials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No financial institutions found
                  </td>
                </tr>
              ) : (
                filteredFinancials.map((financial: any) => (
                  <tr key={financial._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {financial.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {financial.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {financial.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this financial institution?")) {
                            deleteFinancialMutation.mutate(financial._id);
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

