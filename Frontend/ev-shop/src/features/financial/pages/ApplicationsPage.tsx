import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { financialService } from "../financialService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";
import { CloseIcon, FileTextIcon } from "@/assets/icons/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosPrivate } from "@/config/config";
import { useToast } from "@/context/ToastContext";

// Eye icon for viewing
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// Download icon
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export const ApplicationsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const institutionId = useAppSelector(selectActiveRoleId);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (institutionId) {
      fetchApplications();
    }
  }, [institutionId]);

  const fetchApplications = async () => {
    if (!institutionId) return;
    try {
      setIsLoading(true);
      const response = await financialService.getApplicationsByInstitution(
        institutionId
      );
      const apps = response?.applications || [];
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error: any) {
      console.error("Failed to fetch applications:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load applications",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch selected application details
  const { data: selectedApplication, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["applicationDetails", selectedApplicationId],
    queryFn: async () => {
      if (!selectedApplicationId) return null;
      const response = await financialService.getApplicationById(
        selectedApplicationId
      );
      // Backend unwraps response, so it's the application object directly
      return response;
    },
    enabled: !!selectedApplicationId,
  });

  const getFileUrl = (filePath: string) => {
    // Files are served from /uploads route (static files at root level, not under /api/v1)
    // The backend serves static files at /uploads, so we need to use the server root URL
    const apiBaseURL = axiosPrivate.defaults.baseURL || "";
    // Extract the server base URL (remove /api/v1 if present)
    // e.g., "http://localhost:3000/api/v1" -> "http://localhost:3000"
    const serverBaseURL = apiBaseURL.replace(/\/api\/v1\/?$/, "");
    // Remove leading slash from filePath if present, then add it back
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    // Remove trailing slash from serverBaseURL if present
    const cleanBaseURL = serverBaseURL.endsWith("/") ? serverBaseURL.slice(0, -1) : serverBaseURL;
    return `${cleanBaseURL}${cleanPath}`;
  };

  const handleViewDocument = (filePath: string) => {
    const url = getFileUrl(filePath);
    window.open(url, "_blank");
  };

  const handleDownloadDocument = (filePath: string) => {
    const url = getFileUrl(filePath);
    const link = document.createElement("a");
    link.href = url;
    link.download = filePath.split("/").pop() || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      status,
      rejectionReason,
    }: {
      applicationId: string;
      status: string;
      rejectionReason?: string;
    }) => {
      return await financialService.updateApplicationStatus(
        applicationId,
        status,
        rejectionReason
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["applicationDetails", selectedApplicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["financialApplications", institutionId],
      });
      fetchApplications(); // Refresh applications list
      setShowRejectModal(false);
      setRejectionReason("");
      showToast({
        text: "Application status updated successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        text:
          error?.response?.data?.error || "Failed to update application status",
        type: "error",
      });
    },
  });

  const handleApprove = () => {
    if (!selectedApplicationId) return;
    updateStatusMutation.mutate({
      applicationId: selectedApplicationId,
      status: "approved",
    });
  };

  const handleReject = () => {
    if (!selectedApplicationId) return;
    if (!rejectionReason.trim()) {
      showToast({
        text: "Please provide a rejection reason",
        type: "error",
      });
      return;
    }
    updateStatusMutation.mutate({
      applicationId: selectedApplicationId,
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
    });
  };

  // Filter applications based on selected category
  const filteredApplications = applications.filter((app) => {
    if (filterCategory === "all") return true;
    const status = app.status?.toLowerCase() || "";
    if (filterCategory === "pending") {
      return status === "pending" || status === "under_review";
    }
    return status === filterCategory;
  });

  // Count applications by category
  const categoryCounts = {
    all: applications.length,
    pending: applications.filter(
      (app) =>
        app.status?.toLowerCase() === "pending" ||
        app.status?.toLowerCase() === "under_review"
    ).length,
    approved: applications.filter(
      (app) => app.status?.toLowerCase() === "approved"
    ).length,
    rejected: applications.filter(
      (app) => app.status?.toLowerCase() === "rejected"
    ).length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold dark:text-white">
        Financing Applications
      </h1>

      {/* Category Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All ({categoryCounts.all})
          </button>
          <button
            onClick={() => setFilterCategory("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === "pending"
                ? "bg-yellow-600 text-white dark:bg-yellow-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Pending ({categoryCounts.pending})
          </button>
          <button
            onClick={() => setFilterCategory("approved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === "approved"
                ? "bg-green-600 text-white dark:bg-green-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Approved ({categoryCounts.approved})
          </button>
          <button
            onClick={() => setFilterCategory("rejected")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === "rejected"
                ? "bg-red-600 text-white dark:bg-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Rejected ({categoryCounts.rejected})
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {applications.length === 0
              ? "No applications found. Applications will appear here once users submit financing requests."
              : `No ${
                  filterCategory !== "all" ? filterCategory : ""
                } applications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app: any) => (
            <div
              key={app._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold dark:text-white">
                    Application #{app._id.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {app.product_id?.product_name || "Unknown Product"} &middot;
                    Status: {app.status}
                  </p>
                  {app.user_id && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      User:{" "}
                      {typeof app.user_id === "object"
                        ? app.user_id.name || app.user_id.email
                        : "N/A"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      app.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : app.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {app.status}
                  </span>
                  <button
                    onClick={() => setSelectedApplicationId(app._id)}
                    className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                    title="View Details"
                    aria-label="View Application Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplicationId &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-2xl font-bold dark:text-white">
                  Application Details
                </h2>
                <button
                  onClick={() => setSelectedApplicationId(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <Loader size={60} color="#4f46e5" />
                </div>
              ) : selectedApplication ? (
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Application Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Application ID
                      </p>
                      <p className="font-semibold dark:text-white">
                        #{selectedApplication._id?.slice(-8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          selectedApplication.status === "APPROVED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : selectedApplication.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {selectedApplication.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Product
                      </p>
                      <p className="font-semibold dark:text-white">
                        {selectedApplication.product_id?.product_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted Date
                      </p>
                      <p className="font-semibold dark:text-white">
                        {selectedApplication.createdAt
                          ? new Date(
                              selectedApplication.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Application Data */}
                  {selectedApplication.application_data && (
                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">
                        Application Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          // Handle both Map and object formats
                          const appData = selectedApplication.application_data;
                          const getValue = (key: string) => {
                            if (appData && typeof appData === "object") {
                              // If it's a Map-like object with get method
                              if (typeof appData.get === "function") {
                                return appData.get(key);
                              }
                              // If it's a plain object
                              return appData[key];
                            }
                            return null;
                          };

                          const fullName = getValue("full_name");
                          const age = getValue("age");
                          const employmentStatus =
                            getValue("employment_status");
                          const monthlyIncome = getValue("monthly_income");
                          const requestedAmount = getValue("requested_amount");
                          const repaymentPeriod = getValue(
                            "repayment_period_months"
                          );

                          return (
                            <>
                              {fullName && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Full Name
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    {fullName}
                                  </p>
                                </div>
                              )}
                              {age && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Age
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    {age}
                                  </p>
                                </div>
                              )}
                              {employmentStatus && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Employment Status
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    {employmentStatus}
                                  </p>
                                </div>
                              )}
                              {monthlyIncome && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Monthly Income
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    LKR{" "}
                                    {typeof monthlyIncome === "number"
                                      ? monthlyIncome.toLocaleString()
                                      : monthlyIncome}
                                  </p>
                                </div>
                              )}
                              {requestedAmount && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Requested Amount
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    LKR{" "}
                                    {typeof requestedAmount === "number"
                                      ? requestedAmount.toLocaleString()
                                      : requestedAmount}
                                  </p>
                                </div>
                              )}
                              {repaymentPeriod && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Repayment Period
                                  </p>
                                  <p className="font-semibold dark:text-white">
                                    {repaymentPeriod} months
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {selectedApplication.message_text && (
                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">
                        Additional Message
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        {selectedApplication.message_text}
                      </p>
                    </div>
                  )}

                  {/* Documents */}
                  {(() => {
                    const appData = selectedApplication.application_data;
                    const getDocuments = () => {
                      if (!appData) return null;
                      // Handle both Map and object formats
                      if (typeof appData.get === "function") {
                        return appData.get("additional_documents");
                      }
                      return appData.additional_documents;
                    };

                    const documents = getDocuments();

                    if (
                      documents &&
                      Array.isArray(documents) &&
                      documents.length > 0
                    ) {
                      return (
                        <div className="border-t dark:border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">
                            Uploaded Documents
                          </h3>
                          <div className="space-y-2">
                            {documents.map((docPath: string, index: number) => {
                              const fileName =
                                docPath.split("/").pop() ||
                                `Document ${index + 1}`;
                              const fileExtension =
                                fileName.split(".").pop()?.toLowerCase() || "";
                              const isImage = [
                                "jpg",
                                "jpeg",
                                "png",
                                "gif",
                              ].includes(fileExtension);

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    <div>
                                      <p className="font-medium dark:text-white">
                                        {fileName}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {fileExtension.toUpperCase()} file
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isImage && (
                                      <button
                                        onClick={() =>
                                          handleViewDocument(docPath)
                                        }
                                        className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                                        title="View Document"
                                      >
                                        <EyeIcon className="h-5 w-5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleDownloadDocument(docPath)
                                      }
                                      className="p-2 text-green-600 rounded-lg hover:bg-green-50 transition-colors dark:text-green-400 dark:hover:bg-green-900/20"
                                      title="Download Document"
                                    >
                                      <DownloadIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* User Info */}
                  {selectedApplication.user_id && (
                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">
                        Applicant Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {typeof selectedApplication.user_id === "object" && (
                          <>
                            {selectedApplication.user_id.name && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Name
                                </p>
                                <p className="font-semibold dark:text-white">
                                  {selectedApplication.user_id.name}
                                </p>
                              </div>
                            )}
                            {selectedApplication.user_id.email && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Email
                                </p>
                                <p className="font-semibold dark:text-white">
                                  {selectedApplication.user_id.email}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {selectedApplication.rejection_reason && (
                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold mb-2 dark:text-white text-red-600 dark:text-red-400">
                        Rejection Reason
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        {selectedApplication.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons (only show for pending/under_review applications) */}
                  {selectedApplication.status &&
                    (selectedApplication.status.toLowerCase() === "pending" ||
                      selectedApplication.status.toLowerCase() ===
                        "under_review") && (
                      <div className="border-t dark:border-gray-700 pt-6 flex gap-4">
                        <button
                          onClick={handleApprove}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600 font-semibold transition-colors"
                        >
                          {updateStatusMutation.isPending
                            ? "Processing..."
                            : "Approve Application"}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600 font-semibold transition-colors"
                        >
                          Reject Application
                        </button>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Failed to load application details
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Rejection Reason Modal */}
      {showRejectModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-md"
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">
                Reject Application
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please provide a reason for rejecting this application. This
                reason will be visible to the applicant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={
                    updateStatusMutation.isPending || !rejectionReason.trim()
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {updateStatusMutation.isPending
                    ? "Rejecting..."
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
