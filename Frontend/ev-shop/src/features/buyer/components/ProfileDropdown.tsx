import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDownIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  LogoutIcon,
  ExclamationTriangleIcon,
} from "@/assets/icons/icons";
import type { ActiveTab } from "@/types";
import { motion } from "framer-motion";

const apiURL = import.meta.env.VITE_API_URL;

export const ProfileDropdown: React.FC<{
  user: any;
  onLogout: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  checkPassword: boolean;
}> = React.memo(
  ({ user, onLogout, setActiveTab, checkPassword }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    console.log(checkPassword);
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

    // Memoize toggle function
    const toggleDropdown = useCallback(() => {
      setIsDropdownOpen((prev) => !prev);
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

    const profileImageUrl = React.useMemo(() => {
      return user.profile_image ? `${apiURL}${user.profile_image}` : null;
    }, [user.profile_image]);

    return (
      <div className="relative" ref={dropdownRef}>
        {/* This is the button that toggles the dropdown */}
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 rounded-full p-1 transition-colors"
        >
          {/* This is your user snippet */}
          <div className="flex items-center space-x-2">
            {user.profile_image ? (
              <img
                src={profileImageUrl!}
                loading="lazy"
                alt="User Avatar"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n: any) => n[0]?.toUpperCase())
                      .slice(0, 2)
                      .join("")
                  : "?"}
              </div>
            )} 
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                {user.name}
                {checkPassword === true && isDropdownOpen == false && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                <span className="dark:text-gray-400">{user.email}</span>
              </p>
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
              {checkPassword === true && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  </motion.div>
                )}
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
  },
  (prevProps, nextProps) =>
    prevProps.user?.profile_image === nextProps.user?.profile_image
);
