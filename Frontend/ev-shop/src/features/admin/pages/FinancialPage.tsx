import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const FinancialPage: React.FC<{
  setAlert: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const [activeTab, setActiveTab] = useState<
    "institutions" | "products" | "applications"
  >("institutions");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Institutions Data
  const { data: financials, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["adminAllFinancial"],
    queryFn: () => adminService.getAllFinancialInstitutions(),
  });

  // Products Data
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["adminAllFinancialProducts"],
    queryFn: () => adminService.getAllFinancialProducts(),
    enabled: activeTab === "products" || activeTab === "applications",
  });

  // Applications Data
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["adminAllFinancialApplications"],
    queryFn: () => adminService.getAllFinancialApplications(),
    enabled: activeTab === "applications",
  });

  // Mutations
  const deleteFinancialMutation = useMutation({
    mutationFn: (financialId: string) =>
      adminService.deleteFinancial(financialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllFinancial"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Financial institution deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message:
          error.response?.data?.error ||
          "Failed to delete financial institution",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) =>
      adminService.deleteFinancialProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminAllFinancialProducts"],
      });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete product",
      });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      rejectionReason,
    }: {
      applicationId: string;
      status: string;
      rejectionReason?: string;
    }) =>
      adminService.updateFinancialApplicationStatus(
        applicationId,
        status,
        rejectionReason
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminAllFinancialApplications"],
      });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Application status updated successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message:
          error.response?.data?.error || "Failed to update application status",
      });
    },
  });

  // Filtering
  const filteredFinancials = Array.isArray(financials)
    ? financials.filter((financial: any) => {
        const email =
          financial.contact_email ||
          financial.user_id?.email ||
          financial.email ||
          "";
        const phone =
          financial.contact_phone ||
          financial.user_id?.phone ||
          financial.phone ||
          "";
        const name = financial.name || financial.user_id?.name || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const filteredProducts = Array.isArray(products)
    ? products.filter((product: any) => {
        const productName = product.product_name || "";
        const institutionName =
          product.institution_id?.name ||
          product.institution_id?.business_name ||
          "";
        return (
          productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          institutionName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Helper function to extract values from application_data (handles both Map and object)
  const getApplicationDataValue = (application: any, key: string) => {
    if (!application.application_data) return null;
    const appData = application.application_data;
    if (typeof appData.get === "function") {
      return appData.get(key);
    }
    return appData[key];
  };

  const filteredApplications = Array.isArray(applications)
    ? applications.filter((application: any) => {
        const userName = application.user_id?.name || "";
        const productName = application.product_id?.product_name || "";
        const institutionName =
          application.product_id?.institution_id?.name ||
          application.product_id?.institution_id?.business_name ||
          "";
        const status = application.status || "";
        return (
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Report Data
  const reportData =
    activeTab === "institutions"
      ? filteredFinancials.map((financial) => ({
          name: financial.name || financial.user_id?.name || "N/A",
          email:
            financial.contact_email ||
            financial.user_id?.email ||
            financial.email ||
            "N/A",
          phone:
            financial.contact_phone ||
            financial.user_id?.phone ||
            financial.phone ||
            "N/A",
        }))
      : activeTab === "products"
      ? filteredProducts.map((product) => ({
          institution:
            product.institution_id?.name ||
            product.institution_id?.business_name ||
            "N/A",
          product_name: product.product_name || "N/A",
          product_type: product.product_type || "N/A",
          interest_rate: `${product.interest_rate_min || 0}% - ${
            product.interest_rate_max || 0
          }%`,
          down_payment: `LKR ${
            product.down_payment_min?.toLocaleString() || "0"
          }`,
        }))
      : filteredApplications.map((application) => {
          const approvalAmount = application.approval_amount;
          const requestedAmount = getApplicationDataValue(
            application,
            "requested_amount"
          );
          const amount = getApplicationDataValue(application, "amount");
          const loanAmount = approvalAmount || requestedAmount || amount || 0;
          return {
            user: application.user_id?.name || "N/A",
            institution:
              application.product_id?.institution_id?.name ||
              application.product_id?.institution_id?.business_name ||
              "N/A",
            product: application.product_id?.product_name || "N/A",
            amount: `LKR ${loanAmount.toLocaleString()}`,
            status: application.status || "N/A",
            date: application.createdAt
              ? new Date(application.createdAt).toLocaleDateString()
              : "N/A",
          };
        });

  const reportColumns =
    activeTab === "institutions"
      ? [
          { header: "Name", dataKey: "name" },
          { header: "Email", dataKey: "email" },
          { header: "Phone", dataKey: "phone" },
        ]
      : activeTab === "products"
      ? [
          { header: "Institution", dataKey: "institution" },
          { header: "Product Name", dataKey: "product_name" },
          { header: "Type", dataKey: "product_type" },
          { header: "Interest Rate", dataKey: "interest_rate" },
          { header: "Down Payment", dataKey: "down_payment" },
        ]
      : [
          { header: "User", dataKey: "user" },
          { header: "Institution", dataKey: "institution" },
          { header: "Product", dataKey: "product" },
          { header: "Amount", dataKey: "amount" },
          { header: "Status", dataKey: "status" },
          { header: "Date", dataKey: "date" },
        ];

  const isLoading =
    activeTab === "institutions"
      ? isLoadingInstitutions
      : activeTab === "products"
      ? isLoadingProducts
      : isLoadingApplications;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">
          Financial Institutions Management
        </h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={reportColumns}
            title={`Financial ${
              activeTab === "institutions"
                ? "Institutions"
                : activeTab === "products"
                ? "Products"
                : "Applications"
            } Report`}
            filename={`financial_${activeTab}_report`}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("institutions")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "institutions"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Institutions
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "products"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "applications"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Applications
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
          {/* Institutions Tab */}
          {activeTab === "institutions" && (
            <>
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
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No financial institutions found
                        </td>
                      </tr>
                    ) : (
                      filteredFinancials.map((financial: any) => (
                        <tr
                          key={financial._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {financial.name || financial.user_id?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {financial.contact_email ||
                              financial.user_id?.email ||
                              financial.email ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {financial.contact_phone ||
                              financial.user_id?.phone ||
                              financial.phone ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this financial institution?"
                                  )
                                ) {
                                  deleteFinancialMutation.mutate(financial._id);
                                }
                              }}
                              disabled={deleteFinancialMutation.isPending}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deleteFinancialMutation.isPending ? (
                                <Loader size={8} color="#dc2626" />
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Interest Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Down Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product: any) => (
                        <tr
                          key={product._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {product.institution_id?.name ||
                              product.institution_id?.business_name ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {product.product_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {product.product_type || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {product.interest_rate_min || 0}% -{" "}
                            {product.interest_rate_max || 0}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            LKR{" "}
                            {product.down_payment_min?.toLocaleString() || "0"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this product?"
                                  )
                                ) {
                                  deleteProductMutation.mutate(product._id);
                                }
                              }}
                              disabled={deleteProductMutation.isPending}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deleteProductMutation.isPending ? (
                                <Loader size={8} color="#dc2626" />
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Loan Amount
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
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((application: any) => (
                      <tr
                        key={application._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {application.user_id?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {application.product_id?.institution_id?.name ||
                            application.product_id?.institution_id
                              ?.business_name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {application.product_id?.product_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          LKR{" "}
                          {(() => {
                            const approvalAmount = application.approval_amount;
                            if (approvalAmount) {
                              return approvalAmount.toLocaleString();
                            }
                            const requestedAmount = getApplicationDataValue(
                              application,
                              "requested_amount"
                            );
                            if (requestedAmount) {
                              return requestedAmount.toLocaleString();
                            }
                            const amount = getApplicationDataValue(
                              application,
                              "amount"
                            );
                            if (amount) {
                              return amount.toLocaleString();
                            }
                            return "0";
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              application.status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : application.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {application.status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={application.status || "pending"}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === "rejected") {
                                const reason = window.prompt(
                                  "Enter rejection reason:"
                                );
                                if (reason) {
                                  updateApplicationStatusMutation.mutate({
                                    applicationId: application._id,
                                    status: newStatus,
                                    rejectionReason: reason,
                                  });
                                }
                              } else {
                                updateApplicationStatusMutation.mutate({
                                  applicationId: application._id,
                                  status: newStatus,
                                });
                              }
                            }}
                            disabled={updateApplicationStatusMutation.isPending}
                            className="px-3 py-1 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
