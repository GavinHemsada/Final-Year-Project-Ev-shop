import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import "../style/buyer.css";
import { useNavigate } from "react-router-dom";
import {
  CloseIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
} from "@/assets/icons/icons";
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
import { ListingType } from "@/types/enum";
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
import { useBuyerTab } from "@/hooks/useBuyerTab";

const App: React.FC = () => {
  const { activeTab, setActiveTab } = useBuyerTab("dashboard");
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

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [selectedModel, setSelectedModel] = useState<string>("All");
  const [listingType, setListingType] = useState<ListingType | "All">("All");
  const [sellerSearch, setSellerSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  const navigate = useNavigate();
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
      {
        queryKey: ["allReviews"],
        queryFn: buyerService.getAllReviews,
        staleTime: 1000 * 60 * 5,
      } satisfies UseQueryOptions<any[]>,
    ],
  }) as [
    UseQueryResult<Vehicle[], Error>,
    UseQueryResult<User_Profile, Error>,
    UseQueryResult<Notification[], Error>,
    UseQueryResult<any[], Error>
  ];

  const [evlistQuery, userProfileQuery, notificationQuery, reviewsQuery] =
    result;

  const vehicles = evlistQuery.data || [];
  const user = userProfileQuery.data;
  const notifications = notificationQuery.data || [];
  const allReviews = reviewsQuery.data || [];
  const isPasswordNull = user?.isPasswordNull;

  const isLoading =
    evlistQuery.isLoading ||
    userProfileQuery.isLoading ||
    notificationQuery.isLoading;

  // Extract unique models for dropdown
  const availableModels = useMemo(() => {
    const models = new Set(
      vehicles.map((v) => v.model_id?.model_name).filter(Boolean)
    );
    return ["All", ...Array.from(models)];
  }, [vehicles]);

  // Helper to get review count for sorting
  const getReviewCount = useCallback(
    (listingId: string) => {
      if (!allReviews) return 0;
      return allReviews.filter(
        (r: any) =>
          r.order_id?.listing_id?._id === listingId ||
          r.order_id?.listing_id === listingId
      ).length;
    },
    [allReviews]
  );

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter((vehicle) => {
      // Search Term
      if (
        searchTerm &&
        !vehicle.model_id?.model_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Model Filter
      if (
        selectedModel !== "All" &&
        vehicle.model_id?.model_name !== selectedModel
      ) {
        return false;
      }
      // Listing Type Filter
      if (listingType !== "All" && vehicle.listing_type !== listingType) {
        return false;
      }
      // Price Filter
      if (priceMin !== "" && vehicle.price < priceMin) return false;
      if (priceMax !== "" && vehicle.price > priceMax) return false;
      // Seller Filter
      if (
        sellerSearch &&
        !vehicle.seller_id?.business_name
          ?.toLowerCase()
          .includes(sellerSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        case "most_reviewed":
          return getReviewCount(b._id) - getReviewCount(a._id);
        default:
          return 0;
      }
    });
  }, [
    vehicles,
    searchTerm,
    listingType,
    selectedModel,
    priceMin,
    priceMax,
    sellerSearch,
    sortBy,
    getReviewCount,
  ]);

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

  // Tabs components
  const tabs = {
    dashboard: (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header Row: Title & Filter Button */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative z-20">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">
              Explore Our Vehicles
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Showing {filteredVehicles.length} vehicles
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 text-sm font-semibold select-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters & Sort
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Filters Panel (Absolute Dropdown) */}
          {showFilters && (
            <div className="absolute top-12 right-0 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 z-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sort By */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white"
                  >
                    <option value="default">Default</option>
                    <option value="most_reviewed">Most Reviewed</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>

                {/* Model Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white"
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seller Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Seller
                  </label>
                  <input
                    type="text"
                    placeholder="Shop name..."
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white"
                  />
                </div>

                {/* Listing Type Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Listing Type
                  </label>
                  <select
                    value={listingType}
                    onChange={(e) =>
                      setListingType(e.target.value as ListingType | "All")
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white"
                  >
                    <option value="All">All Types</option>
                    <option value={ListingType.SALE}>For Sale</option>
                    <option value={ListingType.LEASE}>For Lease</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Price (LKR)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) =>
                        setPriceMin(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) =>
                        setPriceMax(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:text-white pb-2"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <VehicleList
          vehicles={paginatedVehicles}
          totalVehicles={filteredVehicles.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          setAlert={handleSetAlert}
        />
      </div>
    ),
    profile: (
      <UserProfile
        user={user!}
        setAlert={handleSetAlert}
        checkPassword={isPasswordNull!}
      />
    ),
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
    reviews: (
      <MyReviewsPage
        setAlert={handleSetAlert}
        setConfirmAlert={handleSetConfirmAlert}
      />
    ),
    community: (
      <CommunityPage
        setAlert={handleSetAlert}
        setConfirmAlert={handleSetConfirmAlert}
      />
    ),
  };

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

  const handleSetActiveTab = useCallback(
    (tab: ActiveTab) => setActiveTab(tab),
    [setActiveTab]
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

      {isChatOpen && <Chatbot onClose={toggleChat} userName={user?.name} />}
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
