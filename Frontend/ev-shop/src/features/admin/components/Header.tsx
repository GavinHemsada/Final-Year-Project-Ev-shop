import type { AdminActiveTab } from "@/types";
import { ProfileDropdown } from "./ProfileDropdown";

type HeaderProps = {
  admin: any;
  notifications: any[];
  setActiveTab: (tab: AdminActiveTab) => void;
  onLogout: () => void;
};

export const Header: React.FC<HeaderProps> = ({
  admin,
  // notifications,
  setActiveTab,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold dark:text-white">
          Admin Dashboard
        </h1>
      </div>
      {/* Right Actions */}
      <div className="flex items-center flex-shrink-0 space-x-3 ml-3">
        <ProfileDropdown
          admin={admin}
          onLogout={onLogout}
          setActiveTab={setActiveTab}
        />
      </div>
    </header>
  );
};

