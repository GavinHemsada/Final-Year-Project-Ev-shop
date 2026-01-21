import {
  CarIcon,
  ShoppingCartIcon,
  HeartIcon,
  ServiceIcon,
  ReviewsIcon,
  KeyIcon,
  BanknoteIcon,
} from "@/assets/icons/icons";
import { FaUsers } from "react-icons/fa";
import { BuyerActiveTabes, type ActiveTab } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { SunIcon, MoonIcon } from "@/assets/icons/icons";
import React from "react";

const links = [
  { text: "Dashboard", icon: <CarIcon />, tab: BuyerActiveTabes.Dashboard },
  { text: "My Orders", icon: <ShoppingCartIcon />, tab: BuyerActiveTabes.Orders },
  { text: "Saved Vehicles", icon: <HeartIcon />, tab: BuyerActiveTabes.Saved },
  { text: "Services", icon: <ServiceIcon />, tab: BuyerActiveTabes.Services },
  { text: "Financing", icon: <BanknoteIcon />, tab: BuyerActiveTabes.Financing },
  { text: "Test Drives", icon: <KeyIcon />, tab: BuyerActiveTabes.TestDrives },
  { text: "My Reviews", icon: <ReviewsIcon />, tab: BuyerActiveTabes.Reviews },
  { text: "Community", icon: <FaUsers />, tab: BuyerActiveTabes.Community },
];

type SidebarProps = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
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

  return (
    <aside
      className={`w-16 ${
        isExpanded ? "md:w-64" : "md:w-16"
      } flex-shrink-0 bg-white border-r border-gray-200 flex flex-col
         transition-all duration-300 relative
         {/* --- MODIFIED --- */}
         dark:bg-gray-800 dark:border-gray-700`}
      onMouseEnter={onExpand}
      onMouseLeave={onCollapse}
    >
      {/* --- Logo (not a button) --- */}
      <div
        className={`h-16 w-full flex items-center border-b border-gray-200
                   px-2 md:px-4 transition-all duration-300
                   justify-center ${
                     isExpanded ? "md:justify-start" : "md:justify-center"
                   }
                   {/* --- MODIFIED --- */}
                   dark:border-gray-700`}
      >
        <CarIcon className="h-8 w-8 text-blue-600 dark:text-blue-500 flex-shrink-0" />
        <span
          className={`hidden ${
            isExpanded ? "md:inline" : "hidden"
          } ml-2 text-xl font-bold whitespace-nowrap
           text-gray-900 dark:text-white`}
        >
          EV-Shop
        </span>
      </div>
      {/* --- END OF LOGO --- */}

      {/* Main navigation links */}
      <nav className="flex-1 px-2 md:px-4 py-6 space-y-2">
        {links.map(({ text, icon, tab }) => (
          <SidebarLink
            key={tab}
            text={text}
            icon={React.cloneElement(icon, { className: "h-5 w-5" })}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab as ActiveTab)}
            isExpanded={isExpanded}
          />
        ))}
      </nav>

      {/* Sidebar Footer section */}
      <div
        className="px-2 md:px-4 py-4 border-t border-gray-200
                   dark:border-gray-700"
      >
        <SidebarLink
          // --- MODIFIED: Shows the *action* now ---
          text={theme === "light" ? "Light Mode" : "Dark Mode"}
          icon={
            theme === "light" ? (
              // Show SunIcon (action: go to light mode)
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              // Show MoonIcon (action: go to dark mode)
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

// ... (SidebarLinkProps type remains the same)
type SidebarLinkProps = {
  text: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  isExpanded: boolean;
};

const SidebarLink = ({
  text,
  icon,
  active,
  onClick,
  isExpanded,
}: SidebarLinkProps) => (
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
        ? /* --- MODIFIED: Active State --- */
          "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        : /* --- MODIFIED: Inactive State --- */
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    }`}
  >
    <div className="flex-shrink-0" aria-hidden="true">
      {icon}
    </div>

    {/* This is the text label that shows when expanded */}
    <span
      className={`hidden ${
        isExpanded ? "md:inline" : "hidden"
      } ml-3 whitespace-nowrap`}
    >
      {text}
    </span>

    {/* --- This is the Tooltip --- */}
    {/* This dark tooltip works well on both light and dark backgrounds, no change needed */}
    {!isExpanded && (
      <span
        className="
          hidden md:block 
          absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 
          bg-gray-800 text-white text-xs font-medium rounded-md 
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 
          z-50 whitespace-nowrap
        "
      >
        {text}
        {/* Optional: Add a small triangle for styling */}
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-800"></span>
      </span>
    )}
  </a>
);