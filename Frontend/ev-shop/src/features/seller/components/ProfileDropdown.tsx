import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  LogoutIcon,
} from "@/assets/icons/icons";
import type { SellerActiveTab, Seller } from "@/types";

const apiURL = import.meta.env.VITE_API_URL;

export const ProfileDropdown: React.FC<{
  seller?: Seller;
  onLogout: () => void;
  setActiveTab: (tab: SellerActiveTab) => void;
}> = ({ seller, onLogout, setActiveTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleDropdownItemClick = (action: "profile" | "help" | "logout") => {
    setIsDropdownOpen(false); // Close dropdown on click
    switch (action) {
      case "profile":
        setActiveTab("profile");
        break;
      case "help":
        // Add your help logic here (e.g., open modal, navigate to /help)
        console.log("Help clicked");
        break;
      case "logout":
        onLogout();
        break;
    }
  };
  return (
    <div className="relative" ref={dropdownRef}>
      {/* This is the button that toggles the dropdown */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 rounded-full p-1 transition-colors"
      >
        {/* This is your user snippet */}
        <div className="flex items-center space-x-2">
          {seller?.shop_logo ? (
            <img
              src={`${apiURL}${seller.shop_logo}`}
              alt="Shop Logo"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold">
              {seller?.business_name
                ? seller.business_name.charAt(0).toUpperCase()
                : "?"}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="font-semibold text-sm truncate max-w-[150px]">
              <span className="dark:text-white">{seller?.business_name}</span>
            </p>
            {/* <p className="text-xs text-gray-500 truncate max-w-[150px]">
              <span className="dark:text-gray-400">{seller.email}</span>
            </p> */}
          </div>
        </div>

        {/* End of your user snippet */}
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-800 transition-transform dark:text-gray-200 ${
            isDropdownOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* --- The Dropdown Menu --- */}
      {isDropdownOpen && (
        <div className="animate-popIn absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 ring-1 ring-gray-300 ring-opacity-5 dark:bg-gray-800 dark:ring-gray-500">
          <button
            onClick={() => handleDropdownItemClick("profile")}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            User Profile
          </button>
          <button
            onClick={() => handleDropdownItemClick("help")}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            Help Center
          </button>
          <div className="border-t border-gray-100 my-1 dark:border-gray-700"></div>
          <button
            onClick={() => handleDropdownItemClick("logout")}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 dark:text-red-400 dark:hover:bg-red-900"
          >
            <LogoutIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};
