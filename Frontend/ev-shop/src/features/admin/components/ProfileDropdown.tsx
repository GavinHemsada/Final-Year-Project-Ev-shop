import { UserCircleIcon, LogoutIcon } from "@/assets/icons/icons";
import { ChevronDownIcon } from "@/assets/icons/icons";
import type { AdminActiveTab } from "@/types";
import { useState, useRef, useEffect } from "react";

type ProfileDropdownProps = {
  admin: any;
  onLogout: () => void;
  setActiveTab: (tab: AdminActiveTab) => void;
};

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  admin,
  onLogout,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {admin?.name || "Admin"}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <LogoutIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

