import { SwitchIcon } from "@/assets/icons/icons";
import { NotificationDropdown } from "../components/NotificationDropdown";
import type { FinancialActiveTab } from "@/types";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@/components/Loader";
import { useState } from "react";
import type { UserRole } from "@/types";

type HeaderProps = {
  institution: any;
  notifications: any[];
  setActiveTab: (tab: FinancialActiveTab) => void;
  onLogout: () => void;
};

export const Header: React.FC<HeaderProps> = ({
  institution,
  notifications,
  setActiveTab,
  onLogout,
}) => {
  const { setActiveRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchRoleAndNavigate = async (role: UserRole, path: string) => {
    setLoading(true);
    try {
      const result = await setActiveRole(role);
      if (result) {
        navigate(path);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold dark:text-white">
          Financial Institution Dashboard
        </h1>
      </div>
      {/* Right Actions */}
      <div className="flex items-center flex-shrink-0 space-x-3 ml-3">
        <button
          onClick={async () => switchRoleAndNavigate("user", "/user/dashboard")}
          className="flex items-center gap-2 px-4 py-2 
      bg-gray-200 text-gray-900 text-sm font-medium rounded-full 
      hover:bg-gray-300 active:scale-95 transition-all duration-200 shadow-sm
      dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          title="Switch to Buyer"
        >
          <SwitchIcon className="h-4 w-4 flex-shrink-0" />
          <span className="hidden md:inline whitespace-nowrap">
            Switch to Buyer
          </span>
        </button>

        {/* Visual separator */}
        <div className="h-6 w-px bg-gray-300 hidden sm:block dark:bg-gray-600" />

        {/* Notifications */}
        <NotificationDropdown
          notifications={notifications}
          setActiveTab={setActiveTab}
        />

        {/* Profile */}
        <ProfileDropdown
          institution={institution}
          onLogout={onLogout}
          setActiveTab={setActiveTab}
        />
      </div>
    </header>
  );
};

