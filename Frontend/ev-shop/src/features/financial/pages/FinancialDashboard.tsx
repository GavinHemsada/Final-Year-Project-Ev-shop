import React, { useEffect, useState, useCallback, useMemo } from "react";
import type {
  FinancialActiveTab,
  UserRole,
  AlertProps,
  ConfirmAlertProps,
} from "@/types";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  selectUserId,
  logout,
  selectRoles,
  setFinanceId,
} from "@/context/authSlice";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { NotificationPage } from "./NotificationPage";
import { ApplicationsPage } from "./ApplicationsPage";
import { ProductsPage } from "./ProductsPage";
import { ProfilePage } from "./ProfilePage";
import { CommunityPage } from "./ComunityPage";
import { HelpCenterPage } from "./HelpCenterPage";
import { Alert, ConfirmAlert } from "@/components/MessageAlert";
import {
  DollarSignIcon,
  FileTextIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@/assets/icons/icons";
import { StatCard } from "../components/StatsCards";
import { financialService } from "../financialService";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { PageLoader } from "@/components/Loader";

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

  const queryResult = useQuery({
    queryKey: ["financialInstitution", userID],
    queryFn: () => financialService.getFinancialInstitutionProfile(userID!),
    enabled: !!userID,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const institution = queryResult.data;
  const isInstitutionLoading = queryResult.isLoading;

  const institutionId = institution?._id;

  const results = useQueries({
    queries: [
      {
        queryKey: ["financialProducts", institutionId],
        queryFn: () =>
          financialService.getProductsByInstitution(institutionId!),
        enabled: !!institutionId,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ["financialApplications", institutionId],
        queryFn: () =>
          financialService.getApplicationsByInstitution(institutionId!),
        enabled: !!institutionId,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      {
        queryKey: ["financialNotifications", institutionId],
        queryFn: () => financialService.getUserNotifications(institutionId!),
        enabled: !!institutionId,
        staleTime: 10000, // 10 seconds
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: 30000, // Refetch every 30 seconds
      },
    ],
  });

  useEffect(() => {
    if (institution && institution._id) {
      dispatch(setFinanceId(institution._id));
    }
  }, [institution, dispatch]);

  useEffect(() => {
    if (roles) setUserRole(roles);
  }, [roles]);

  const [productsQuery, applicationsQuery, notificationsQuery] = results;

  // Backend unwraps responses via handleResult, so data is directly the array/object
  // Products: backend returns { success: true, products: [...] } -> unwrapped to products array
  const products = Array.isArray(productsQuery.data)
    ? productsQuery.data
    : productsQuery.data?.products || [];

  // Applications: frontend service returns { success: true, applications: [...] } (not unwrapped)
  const applications =
    applicationsQuery.data?.applications ||
    (Array.isArray(applicationsQuery.data) ? applicationsQuery.data : []);

  // Notifications: backend returns { success: true, notifications: [...] } -> unwrapped to notifications array
  const notifications = Array.isArray(notificationsQuery.data)
    ? notificationsQuery.data
    : notificationsQuery.data?.notifications || [];

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
        return <ProductsPage setAlert={handleSetAlert} products={products} />;
      case "profile":
        return (
          <ProfilePage setAlert={handleSetAlert} institution={institution} />
        );
      case "notification":
        return (
          <NotificationPage
            notifications={notifications}
            setAlert={handleSetAlert}
            isLoading={notificationsQuery.isLoading}
          />
        );
      case "community":
        return (
          <CommunityPage
            setAlert={handleSetAlert}
            setConfirmAlert={handleSetConfirmAlert}
            financialId={institution?._id}
          />
        );
      case "helpCenter":
        return <HelpCenterPage setAlert={handleSetAlert} />;
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

  if (isInstitutionLoading) {
    return <PageLoader />;
  }

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
}> = ({ products, applications, setActiveTab }) => {
  const totalProducts = products.length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(
    (app) => app.status?.toUpperCase() === "PENDING" || app.status?.toUpperCase() === "UNDER_REVIEW"
  ).length;
  const approvedApplications = applications.filter(
    (app) => app.status?.toUpperCase() === "APPROVED"
  ).length;

  // Process application data for trends chart
  const applicationTrendsData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Get last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      last6Months.push(date.toLocaleDateString("en-US", { month: "short" }));
    }

    // Group applications by month
    const monthlyData: { [key: string]: number } = {};
    last6Months.forEach((month) => {
      monthlyData[month] = 0;
    });

    applications.forEach((app: any) => {
      if (app.createdAt || app.submitted_date) {
        const date = new Date(app.createdAt || app.submitted_date);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      }
    });

    return last6Months.map((month) => ({
      month,
      applications: monthlyData[month] || 0,
    }));
  }, [applications]);

  // Process product data for distribution chart
  const productDistributionData = useMemo(() => {
    if (products.length === 0) return [];
    
    const distribution: { [key: string]: number } = {};
    products.forEach((product: any) => {
      const name = product.product_name || "Unknown Product";
      distribution[name] = (distribution[name] || 0) + 1;
    });

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
    return Object.entries(distribution).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [products]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Get recent applications (sorted by date, most recent first)
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.submitted_date || 0).getTime();
        const dateB = new Date(b.createdAt || b.submitted_date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [applications]);

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === "APPROVED") return "text-green-600 dark:text-green-400";
    if (statusUpper === "PENDING" || statusUpper === "UNDER_REVIEW") return "text-yellow-600 dark:text-yellow-400";
    if (statusUpper === "REJECTED") return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trends Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            Application Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={applicationTrendsData}>
              <defs>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                tick={{ fill: "#6b7280" }}
              />
              <YAxis
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                tick={{ fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorApplications)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            Product Distribution
          </h3>
          {productDistributionData.length === 0 ? (
            <div className="flex justify-center items-center h-[300px] text-gray-500 dark:text-gray-400">
              No products available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={productDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {productDistributionData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Recent Applications
        </h2>
        {recentApplications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No applications yet. Applications will appear here once users submit
            financing requests.
          </p>
        ) : (
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div
                key={app._id}
                className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold dark:text-white">
                      Application #{app._id?.slice(-8)?.toUpperCase() || "N/A"}
                    </p>
                    <p className={`text-sm font-medium ${getStatusColor(app.status || "")}`}>
                      Status: {app.status?.toUpperCase() || "PENDING"}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("applications")}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;
