import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import "../style/buyer.css";
import { useNavigate, useLocation } from "react-router-dom";
import { CloseIcon, ChatBubbleIcon } from "@/assets/icons/icons";
import { Chatbot } from "../components/ChatBot";
import { Sidebar } from "../components/SideBar";
import { Header } from "../components/Header";
import { VehicleList } from "../components/VehicalList";
import type {
  User_Profile,
  Vehicle,
  Notification,
  ActiveTab,
  AlertProps,
  ConfirmAlertProps,
} from "@/types";
import { Alert, ConfirmAlert } from "@/components/MessageAlert";

const OrderHistory = lazy(() => import("./OrderHistoryPage"));
const UserProfile = lazy(() => import("./UserProfilePage"));
const Services = lazy(() => import("./ServicePage"));
const SavedVehicles = lazy(() => import("./SavedVehicalsPage"));
const NotificationPage = lazy(() => import("./NotificationPage"));
const CartPage = lazy(() => import("./CartPage"));
const MyReviewsPage = lazy(() => import("./MyReviewsPage"));
const TestDrivesPage = lazy(() => import("./TestDrivePage"));
const FinancingPage = lazy(() => import("./FinancingPage"));
const BecomeSellerPage = lazy(() => import("./becomeaSellerPage"));
const RegisterFinancialInstitutionPage = lazy(
  () => import("./becomeaFinancingPage")
);
const CommunityPage = lazy(() => import("./ComunityPage"));

import { PageLoader } from "@/components/Loader";
import { buyerService } from "../buyerService";
import {
  useQueries,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppSelector";
import { selectRoles, selectUserId, logout } from "@/context/authSlice";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isBecomeSellerModalOpen, setIsBecomeSellerModalOpen] = useState(false);
  const [isBecomFinancer, setIsBecomeFinancer] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(
    null
  );

  const navigate = useNavigate();
  const location = useLocation();
  const userID = useAppSelector(selectUserId);
  const roles = useAppSelector(selectRoles);
  const userRole = useMemo(() => roles || [], [roles]);
  const itemsPerPage = 9;
  console.log(userID);
  const dispatch = useAppDispatch();
  // Page load state
  useEffect(() => {
    if (document.readyState === "complete") setLoading(false);
    else {
      const handleLoad = () => setLoading(false);
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  const result = useQueries({
    queries: [
      {
        queryKey: queryKeys.evlist,
        queryFn: () => buyerService.getEVList(),
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      } satisfies UseQueryOptions<Vehicle[]>,
      {
        queryKey: queryKeys.userProfile(userID!),
        queryFn: () => buyerService.getUserProfile(userID!),
        enabled: !!userID,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      } satisfies UseQueryOptions<User_Profile>,
      {
        queryKey: queryKeys.notifications(userID!),
        queryFn: () => buyerService.getUserNotifications(userID!),
        enabled: !!userID,
        staleTime: 10000,
        refetchInterval: 10000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      } satisfies UseQueryOptions<Notification[]>,
    ],
  }) as [
    UseQueryResult<Vehicle[], Error>,
    UseQueryResult<User_Profile, Error>,
    UseQueryResult<Notification[], Error>
  ];

  const [evlistQuery, userProfileQuery, notificationQuery] = result;

  const vehicles = evlistQuery.data || [];
  const user = userProfileQuery.data;
  const notifications = notificationQuery.data || [];
  const isPasswordNull = user?.isPasswordNull;

  const isLoading =
    evlistQuery.isLoading ||
    userProfileQuery.isLoading ||
    notificationQuery.isLoading;

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        vehicle.model_id?.model_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),  
    [vehicles, searchTerm]
  ); 

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVehicles.slice(startIndex, endIndex);
  }, [filteredVehicles, currentPage]);

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

  const handleConfirm = useCallback(() => {
    if (confirmAlert?.onConfirmAction) {
      confirmAlert.onConfirmAction();
    }
    setConfirmAlert(null);
  }, [confirmAlert]);

  const handleCloseConfirmAlert = useCallback(() => {
    setConfirmAlert(null);
  }, []);

  // Tabs with memoized components
  const tabs = useMemo(
    () => ({
      dashboard: (
        <VehicleList
          vehicles={paginatedVehicles}
          totalVehicles={filteredVehicles.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          setAlert={handleSetAlert}
        />
      ),
      profile: <UserProfile user={user!} setAlert={handleSetAlert} checkPassword={isPasswordNull!} />,
      orders: <OrderHistory setAlert={handleSetAlert} />,
      services: <Services setAlert={handleSetAlert} />,
      financing: <FinancingPage setAlert={handleSetAlert} />,
      saved: <SavedVehicles />,
      notification: (
        <NotificationPage
          notifications={notifications}
          setAlert={handleSetAlert}
        />
      ),
      cart: <CartPage />,
      testDrives: <TestDrivesPage setAlert={handleSetAlert} />,
      reviews: <MyReviewsPage setAlert={handleSetAlert} />,
      community: (
        <CommunityPage
          setAlert={handleSetAlert}
          setConfirmAlert={handleSetConfirmAlert}
        />
      ),
    }),
    [
      filteredVehicles,
      user,
      notifications,
      paginatedVehicles,
      currentPage,
      itemsPerPage,
      handleSetAlert,
    ]
  );

  // Callbacks
  const toggleChat = useCallback(() => setIsChatOpen((prev) => !prev), []);
  const setSellermodeOpen = useCallback(
    () => setIsBecomeSellerModalOpen((prev) => !prev),
    []
  );
  const setFinancerModeOpen = useCallback(
    () => setIsBecomeFinancer((prev) => !prev),
    []
  );
  const expandSidebar = useCallback(() => setIsSidebarExpanded(true), []);
  const collapseSidebar = useCallback(() => setIsSidebarExpanded(false), []);
  // Handle navigation state for active tab
  useEffect(() => {
    const state = location.state as { activeTab?: ActiveTab } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  const handleSetActiveTab = useCallback(
    (tab: ActiveTab) => setActiveTab(tab),
    []
  );
  const handleSearchTermChange = useCallback(
    (term: string) => setSearchTerm(term),
    []
  );
  const handleSidebarTabClick = useCallback((tab: ActiveTab) => {
    if (tab !== "profile") setActiveTab(tab);
  }, []);
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout());
      navigate("/auth/login");
    } catch (err) {
      console.error(err);
    }
  }, [dispatch, navigate]);

  if (loading || isLoading) return <PageLoader />;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <>
      <div className="flex h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSidebarTabClick}
          isExpanded={isSidebarExpanded}
          onExpand={expandSidebar}
          onCollapse={collapseSidebar}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            searchTerm={searchTerm}
            setSearchTerm={handleSearchTermChange}
            userRole={userRole}
            user={user}
            notifications={notifications}
            checkPassword={isPasswordNull!}
            onLogout={handleLogout}
            setActiveTab={handleSetActiveTab}
            onBecomeSellerClick={setSellermodeOpen}
            onBecomeFinancerClick={setFinancerModeOpen}
          />

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-100 dark:bg-gray-900">
            {activeTab !== "dashboard" && userRole.includes("user") && (
              <nav
                className="mb-4 text-sm font-medium text-gray-500 animate-fadeIn"
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
                    <span className="text-gray-700 font-semibold dark:text-gray-300">
                      {capitalize(activeTab)}
                    </span>
                  </li>
                </ol>
              </nav>
            )}
            <div className="animate-fadeIn">
              <Suspense fallback={<PageLoader />}>{tabs[activeTab]}</Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          aria-label={isChatOpen ? "Close chat" : "Open chat"}
        >
          {isChatOpen ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <ChatBubbleIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {isChatOpen && <Chatbot onClose={toggleChat} />}
      {isBecomeSellerModalOpen && (
        <BecomeSellerPage
          onClose={setSellermodeOpen}
          setAlert={handleSetAlert}
        />
      )}
      {isBecomFinancer && (
        <RegisterFinancialInstitutionPage
          onClose={setFinancerModeOpen}
          setAlert={handleSetAlert}
        />
      )}
      <Alert
        alert={
          alert
            ? {
                title: alert.title,
                message: alert.message,
                type: alert.type,
                duration: alert.duration,
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
    </>
  );
};

export default App;
