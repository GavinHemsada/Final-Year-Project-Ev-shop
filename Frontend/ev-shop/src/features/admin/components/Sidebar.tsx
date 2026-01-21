import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../adminService";
import {
  BellIcon,
  CarIcon,
  UserIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  ReviewsIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
  BarChartIcon,
  CommunityIcon,
  BanknoteIcon,
  EnvelopeIcon,
} from "@/assets/icons/icons";
import type { AdminActiveTab } from "@/types";
import { useTheme } from "@/context/ThemeContext";

type SidebarProps = {
  activeTab: AdminActiveTab;
  setActiveTab: (tab: AdminActiveTab) => void;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isExpanded,
  onExpand,
  onCollapse,
}) => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Fetch unread contact messages count
  const { data: unreadContactMessages = [] } = useQuery({
    queryKey: ["adminContactMessages"],
    queryFn: () => adminService.getAllContactMessages(false), // Fetch unread only (implied by service or we filter)
    refetchInterval: 20000,
  });

  // Fetch pending complaints count
  const { data: allComplaints = [] } = useQuery({
    queryKey: ["adminComplaints"],
    queryFn: () => adminService.getAllComplaints(),
    refetchInterval: 20000,
  });

  // Calculate counts
  // Note: getAllContactMessages(false) might return all or just unread depending on backend implementation.
  // Based on service it takes isRead param.
  const unreadMessagesCount = Array.isArray(unreadContactMessages) 
    ? unreadContactMessages.filter((msg: any) => !msg.isRead).length 
    : 0;

  const pendingComplaintsCount = Array.isArray(allComplaints)
    ? allComplaints.filter((c: any) => c.status === "Pending").length
    : 0;


  return (
    <aside
      className={`w-16 ${
        isExpanded ? "md:w-64" : "md:w-16"
      } flex-shrink-0 bg-white border-r border-gray-200 flex flex-col
         transition-all duration-300 relative z-50
         dark:bg-gray-800 dark:border-gray-700`}
    >
      {/* Logo */}
      <div
        className={`h-16 w-full flex items-center border-b border-gray-200
                   px-2 md:px-4 transition-all duration-300
                   justify-center ${
                     isExpanded ? "md:justify-start" : "md:justify-center"
                   }
                   dark:border-gray-700`}
      >
        <CarIcon className="h-8 w-8 text-blue-600 dark:text-blue-500 flex-shrink-0" />
        <span
          className={`hidden ${
            isExpanded ? "md:inline" : "hidden"
          } ml-2 text-xl font-bold whitespace-nowrap
           text-gray-900 dark:text-white`}
        >
          Admin Panel
        </span>
      </div>

      <button
        onClick={() => (isExpanded ? onCollapse() : onExpand())}
        className="absolute top-1/9 -right-3 transform -translate-y-1/2
               w-8 h-8 rounded-full flex items-center justify-center
               bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
               shadow-md transition-all duration-300 z-50"
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Main navigation links */}
      <nav className={`flex-1 px-2 md:px-4 py-6 space-y-2 scrollbar-hide ${
        isExpanded ? "overflow-y-auto" : "overflow-visible"
      }`}>
        <SidebarLink
          text="Dashboard"
          icon={<CarIcon className="h-5 w-5" />}
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Users"
          icon={<UserIcon className="h-5 w-5" />}
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Orders"
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="EV Listings"
          icon={<CarIcon className="h-5 w-5" />}
          active={activeTab === "evListings"}
          onClick={() => setActiveTab("evListings")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Notifications"
          icon={<BellIcon className="h-5 w-5" />}
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Sellers"
          icon={<UserIcon className="h-5 w-5" />}
          active={activeTab === "sellers"}
          onClick={() => setActiveTab("sellers")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Financial"
          icon={<BanknoteIcon className="h-5 w-5" />}
          active={activeTab === "financial"}
          onClick={() => setActiveTab("financial")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Reviews"
          icon={<ReviewsIcon />}
          active={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Payments"
          icon={<DollarSignIcon className="h-5 w-5" />}
          active={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Community"
          icon={<CommunityIcon className="h-5 w-5" />}
          active={activeTab === "community"}
          onClick={() => setActiveTab("community")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="Complaints"
          icon={<ReviewsIcon />} // Using ReviewsIcon as closest match
          active={activeTab === "complaints"}
          onClick={() => setActiveTab("complaints")}
          isExpanded={isExpanded}
          alertCount={pendingComplaintsCount}
        />
        <SidebarLink
          text="Contact Messages"
          icon={<EnvelopeIcon className="h-5 w-5" />}
          active={activeTab === "contactMessages"}
          onClick={() => setActiveTab("contactMessages")}
          isExpanded={isExpanded}
          alertCount={unreadMessagesCount}
        />
        <SidebarLink
          text="Test Drives"
          icon={<CarIcon className="h-5 w-5" />}
          active={activeTab === "testDrives"}
          onClick={() => setActiveTab("testDrives")}
          isExpanded={isExpanded}
        />
        <SidebarLink
          text="ML Pipeline"
          icon={<BarChartIcon className="h-5 w-5" />}
          active={activeTab === "mlPipeline"}
          onClick={() => setActiveTab("mlPipeline")}
          isExpanded={isExpanded}
        />
      </nav>

      {/* Sidebar Footer section */}
      <div
        className="px-2 md:px-4 py-4 border-t border-gray-200
                   dark:border-gray-700"
      >
        <SidebarLink
          text={theme === "light" ? "Light Mode" : "Dark Mode"}
          icon={
            theme === "light" ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-200" />
            )
          }
          onClick={toggleTheme}
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  );
};

type SidebarLinkProps = {
  text: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  isExpanded: boolean;
  alertCount?: number;
};

const SidebarLink: React.FC<SidebarLinkProps> = ({
  text,
  icon,
  active,
  onClick,
  isExpanded,
  alertCount,
}) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    aria-label={text}
    className={`group relative flex items-center justify-center ${
      isExpanded ? "md:justify-start" : "md:justify-center"
    } px-2 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    }`}
  >
    <div className="flex-shrink-0 relative" aria-hidden="true">
      {icon}
      {!isExpanded && alertCount !== undefined && alertCount > 0 && (
         <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
      )}
    </div>

    <span
      className={`hidden ${
        isExpanded ? "md:inline" : "hidden"
      } ml-3 whitespace-nowrap flex-1`}
    >
      {text}
    </span>
    
    {isExpanded && alertCount !== undefined && alertCount > 0 && (
        <span className="hidden md:inline-flex items-center justify-center px-2 py-0.5 ml-auto text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {alertCount > 99 ? '99+' : alertCount}
        </span>
    )}

    {!isExpanded && (
      <span
        className="
          hidden md:block 
          absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 
          bg-gray-800 text-white text-xs font-medium rounded-md 
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 
          z-50 whitespace-nowrap shadow-lg
        "
      >
        {text}
         {alertCount !== undefined && alertCount > 0 && ` (${alertCount})`}
        <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-800"></span>
      </span>
    )}
  </a>
);

