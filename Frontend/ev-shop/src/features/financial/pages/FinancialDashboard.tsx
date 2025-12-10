import React, { useEffect, useState, useCallback } from "react";
import type {
  FinancialActiveTab,
  UserRole,
  Notification,
  AlertProps,
  ConfirmAlertProps,
} from "@/types";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId, logout, selectRoles, setFinanceId, selectActiveRoleId } from "@/context/authSlice";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { NotificationPage } from "./NotificationPage";
import { ApplicationsPage } from "./ApplicationsPage";
import { ProductsPage } from "./ProductsPage";
import { ProfilePage } from "./ProfilePage";
import { Alert, ConfirmAlert } from "@/components/MessageAlert";
import {
  DollarSignIcon,
  FileTextIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@/assets/icons/icons";
import { StatCard } from "../components/StatsCards";
import { financialService } from "../financialService";
import { useQueries, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

const notifications: Notification[] = [
  { id: 1, message: "New application received", time: "2 hours ago" },
  { id: 2, message: "Product approval pending", time: "1 day ago" },
];

const FinancialDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialActiveTab>("dashboard");
  const [userRole, setUserRole] = useState<UserRole[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(
    null
  );
  const [confirmHandler, setConfirmHandler] = useState<(() => void) | null>(
    null
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const roles = useAppSelector(selectRoles);

  const userID = useAppSelector(selectUserId);

  const results = useQueries({
    queries: [
      {
        queryKey: ["financialInstitution", userID],
        queryFn: () => financialService.getFinancialInstitutionProfile(userID!),
        enabled: !!userID,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ["financialProducts", useAppSelector(selectActiveRoleId)],
        queryFn: () =>
          financialService.getProductsByInstitution(useAppSelector(selectActiveRoleId)!),
        enabled: !!useAppSelector(selectActiveRoleId),
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ["financialApplications", useAppSelector(selectActiveRoleId)],
        queryFn: () =>
          financialService.getApplicationsByInstitution(useAppSelector(selectActiveRoleId)!),
        enabled: !!useAppSelector(selectActiveRoleId),
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    ],
  });

  useEffect(() => {
    const institutionProfile = results[0].data;
    if (institutionProfile && institutionProfile.institution?._id) {
      dispatch(setFinanceId(institutionProfile.institution._id));
    }
  }, [results[0].data, dispatch]);

  useEffect(() => {
    if (roles) setUserRole(roles);
  }, [roles]);

  const [institutionQuery, productsQuery, applicationsQuery] = results;

  const institution = institutionQuery.data?.institution;
  const products = productsQuery.data?.products || [];
  const applications = applicationsQuery.data?.applications || [];

  const handleSetAlert = useCallback((alertData: AlertProps | null) => {
    setAlert(alertData);
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const handleSetConfirmAlert = useCallback(
    (confirmData: ConfirmAlertProps | null, handler?: () => void) => {
      setConfirmAlert(confirmData);
      setConfirmHandler(handler || null);
    },
    []
  );

  const handleCloseConfirmAlert = useCallback(() => {
    setConfirmAlert(null);
    setConfirmHandler(null);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <FinancialDashboardPage
            institutionId={institution?._id}
            products={products}
            applications={applications}
            setActiveTab={setActiveTab}
            setAlert={handleSetAlert}
            setConfirmAlert={handleSetConfirmAlert}
          />
        );
      case "applications":
        return <ApplicationsPage setAlert={handleSetAlert} />;
      case "products":
        return <ProductsPage setAlert={handleSetAlert} />;
      case "profile":
        return <ProfilePage setAlert={handleSetAlert} />;
      case "notification":
        return (
          <NotificationPage
            notifications={notifications}
            setAlert={handleSetAlert}
          />
        );
      default:
        return (
          <FinancialDashboardPage
            institutionId={institution?._id}
            products={products}
            applications={applications}
            setActiveTab={setActiveTab}
            setAlert={handleSetAlert}
            setConfirmAlert={handleSetConfirmAlert}
          />
        );
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate("/auth/login");
  };

  return (
    <>
      <Alert
        alert={
          alert
            ? {
                title: alert.title,
                message: alert.message,
                type: alert.type,
              }
            : null
        }
        onClose={handleCloseAlert}
      />
      {confirmAlert && (
        <ConfirmAlert
          alert={{
            title: confirmAlert.title,
            message: confirmAlert.message,
            confirmText: confirmAlert.confirmText,
            cancelText: confirmAlert.cancelText,
          }}
          onConfirm={() => {
            if (confirmHandler) {
              confirmHandler();
            }
            handleCloseConfirmAlert();
          }}
          onCancel={handleCloseConfirmAlert}
        />
      )}
      <style>{`
        body { font-family: 'Inter', sans-serif; background-color: #f9fafb; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isExpanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            institution={institution}
            notifications={notifications}
            onLogout={handleLogout}
            setActiveTab={setActiveTab}
          />

          <main className="flex-1 overflow-y-auto p-8 animate-fadeIn bg-gray-50 dark:bg-gray-900">
            {activeTab !== "dashboard" && userRole?.includes("finance") && (
              <nav
                className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400 animate-fadeIn"
                aria-label="Breadcrumb"
              >
                <ol className="list-none p-0 inline-flex">
                  <li className="flex items-center">
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li className="flex items-center">
                    <span className="mx-2 dark:text-gray-500">/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </span>
                  </li>
                </ol>
              </nav>
            )}
            <div key={activeTab} className="animate-fadeIn">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

const FinancialDashboardPage: React.FC<{
  institutionId: string;
  products: any[];
  applications: any[];
  setActiveTab: (tab: FinancialActiveTab) => void;
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (
    alert: ConfirmAlertProps | null,
    handler?: () => void
  ) => void;
}> = ({ institutionId, products, applications, setActiveTab }) => {
  const totalProducts = products.length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(
    (app) => app.status === "PENDING"
  ).length;
  const approvedApplications = applications.filter(
    (app) => app.status === "APPROVED"
  ).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Total Applications"
          value={totalApplications.toString()}
          icon={<FileTextIcon className="h-6 w-6 text-indigo-600" />}
          bgColor="bg-indigo-100"
        />
        <StatCard
          title="Pending Applications"
          value={pendingApplications.toString()}
          icon={<UserIcon className="h-6 w-6 text-yellow-600" />}
          bgColor="bg-yellow-100"
        />
        <StatCard
          title="Approved Applications"
          value={approvedApplications.toString()}
          icon={<DollarSignIcon className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-100"
        />
      </div>
      <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Recent Applications
        </h2>
        {applications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No applications yet. Applications will appear here once users submit
            financing requests.
          </p>
        ) : (
          <div className="space-y-4">
            {applications.slice(0, 5).map((app) => (
              <div
                key={app._id}
                className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold dark:text-white">
                      Application #{app._id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status: {app.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("applications")}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FinancialDashboard;

