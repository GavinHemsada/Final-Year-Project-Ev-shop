import React, { useEffect, useState, useCallback } from "react";
import type {
  SellerActiveTab,
  UserRole,
  Notification,
  AlertProps,
  ConfirmAlertProps,
} from "@/types";
import { authService } from "@/features/auth/authService"
import { useAppSelector, useAppDispatch } from "@/hooks/useAppSelector";
import { logout, selectUserId, selectRoles, setSellerId  } from "@/context/authSlice";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { NotificationPage } from "./NotificationPage";
import { TestDrivesPage } from "./TestDrivePage";
import { MyReviewsPage } from "./MyReviewsPage";
import { CommunityPage } from "./ComunityPage";
import { SavedVehicles } from "./SavedVehicalsPage";
import { OrderHistory } from "./OrderHistoryPage";
import SellerProfilePage from "./SellerProfilePage";
import RepairLocationsPage from "./RepairLocationsPage";
import { ListingsTable } from "../components/EvListingTable";
import { AnalyticsChart } from "../components/AnalyticsChart";
import { Alert, ConfirmAlert } from "@/components/MessageAlert";
import {
  CarIcon,
  UserIcon,
  ShoppingCartIcon,
  DollarSignIcon,
} from "@/assets/icons/icons";
import EvListingStepper from "./EvNewList";
import EvListingEditStepper from "./EvEditList";
import { StatCard } from "../components/StatsCards";
import { sellerService } from "../sellerService";
import type { Vehicle } from "@/types/ev";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

const notifications: Notification[] = [
  { id: 1, message: "Aura EV", time: "Sedan" },
  { id: 2, message: "Pulse XR", time: "SUV" },
];

// --- Main Seller Dashboard Component ---
const SellerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SellerActiveTab>("dashboard");
  const [editListingId, setEditListingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(
    null
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const roles = useAppSelector(selectRoles);
  const userID = useAppSelector(selectUserId);

  const sellerProfile = useQuery({
    queryKey: queryKeys.sellerProfile(userID!),
    queryFn: () => sellerService.getSellerProfile(userID!),
    enabled: !!userID,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const seller = sellerProfile.data;
  const sellerId = seller?._id;
  useEffect(() => {
    if (seller && seller._id) {
      dispatch(setSellerId(seller._id));
    }
  }, [seller]);

  const sellerEvList = useQuery({
  queryKey: queryKeys.sellerEvlist(sellerId!),
  queryFn: () => sellerService.getSellerEvList(sellerId!),
  enabled: !!sellerId, // DEPENDENT QUERY
  staleTime: 10 * 60 * 1000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

  useEffect(() => {
    if (roles) setUserRole(roles);
  }, [roles]);

  const listings = sellerEvList.data || [];
  console.log(listings);
  // Callback to handle alerts from child components
  const handleSetAlert = useCallback((alertData: AlertProps | null) => {
    setAlert(alertData);
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlert(null);
  }, []);

 const handleSetConfirmAlert = useCallback(
     (confirmAlertData: ConfirmAlertProps | null) => {
       setConfirmAlert(confirmAlertData);
     },
     []
   );

  const handleCloseConfirmAlert = useCallback(() => {
    setConfirmAlert(null);
  }, []);

  const handleConfirm = useCallback(() => {
      if (confirmAlert?.onConfirmAction) {
        confirmAlert.onConfirmAction();
      }
      setConfirmAlert(null);
    }, [confirmAlert]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <SellerDashboardPage
            sellerid={seller?._id}
            listing={listings}
            setActiveTab={setActiveTab}
            setEditListingId={setEditListingId}
            setAlert={handleSetAlert}
            setConfirmAlert={handleSetConfirmAlert}
          />
        );
      case "orders":
        return <OrderHistory setAlert={handleSetAlert} />;
      case "profile":
        return <SellerProfilePage setAlert={handleSetAlert} />;
      case "evList":
        return <EvListingStepper setAlert={handleSetAlert} />;
      case "saved":
        return <SavedVehicles setAlert={handleSetAlert} />;
      case "notification":
        return (
          <NotificationPage
            notifications={notifications}
            setAlert={handleSetAlert}
          />
        );
      case "testDrives":
        return <TestDrivesPage setAlert={handleSetAlert} setConfirmAlert={handleSetConfirmAlert} />;
      case "reviews":
        return <MyReviewsPage setAlert={handleSetAlert} />;
      case "community":
        return <CommunityPage setAlert={handleSetAlert} setConfirmAlert={handleSetConfirmAlert} />;
      case "repairLocations":
        return <RepairLocationsPage setAlert={handleSetAlert} setConfirmAlert={handleSetConfirmAlert} />;
      case "editEvlist":
        return (
          <EvListingEditStepper
            listingId={editListingId}
          />
        );
      default:
        return (
          <SellerDashboardPage
            sellerid={seller?._id}
            listing={listings}
            setActiveTab={setActiveTab}
            setEditListingId={setEditListingId}
            setAlert={handleSetAlert}
            setConfirmAlert={handleSetConfirmAlert}
          />
        );
    }
  };

  const handleLogout = async() => {
    await authService.logOut();
    dispatch(logout());
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
            onConfirmAction: confirmAlert.onConfirmAction,
          }}
          onConfirm={handleConfirm}
          onCancel={handleCloseConfirmAlert}
        />
      )}
      <style>{`
        body { font-family: 'Inter', sans-serif; background-color: #f9fafb; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isExpanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            seller={seller}
            notifications={notifications}
            onLogout={handleLogout}
            setActiveTab={setActiveTab}
          />

          <main className="flex-1 overflow-y-auto p-8 animate-fadeIn bg-gray-50 dark:bg-gray-900">
            {activeTab !== "dashboard" && userRole?.includes("seller") && (
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

const SellerDashboardPage: React.FC<{
  sellerid: string;
  listing: Vehicle[];
  setActiveTab: (tab: SellerActiveTab) => void;
  setEditListingId?: (id: string | null) => void;
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (
    alert: ConfirmAlertProps | null,
    handler?: () => void
  ) => void;
}> = ({ sellerid, setActiveTab, listing, setEditListingId, setAlert, setConfirmAlert }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value="LKR 9,800,000"
        icon={<DollarSignIcon className="h-6 w-6 text-green-600" />}
        bgColor="bg-green-100"
      />
      <StatCard
        title="Vehicles Sold"
        value="1"
        icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />}
        bgColor="bg-blue-100"
      />
      <StatCard
        title="Active Listings"
        value="2"
        icon={<CarIcon className="h-6 w-6 text-indigo-600" />}
        bgColor="bg-indigo-100"
      />
      <StatCard
        title="Total Views"
        value="4,050"
        icon={<UserIcon className="h-6 w-6 text-yellow-600" />}
        bgColor="bg-yellow-100"
      />
    </div>
    <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
      <ListingsTable
        sellerid={sellerid}
        listings={listing}
        setActiveTab={setActiveTab}
        setEditListingId={setEditListingId}
        setAlert={setAlert}
        setConfirmAlert={setConfirmAlert}
      />
    </div>
    <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700">
      <AnalyticsChart />
    </div>
  </>
);

export default SellerDashboard;
