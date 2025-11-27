import { ArrowUpCircle } from "lucide-react";
import { ShoppingCartIcon, SearchIcon, SwitchIcon } from "@/assets/icons/icons";
import { NotificationDropdown } from "./NotificationDropdown";
import type { UserRole, ActiveTab } from "@/types";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@/components/Loader";
import { useState, useCallback, useEffect } from "react";
import RoleButton from "./RoleButton";
import React from "react";
import { buyerService } from "../buyerService";

type HeaderProps = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userRole: UserRole[];
  user: any;
  notifications: any[];
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onBecomeSellerClick: () => void;
  onBecomeFinancerClick: () => void;
};

export const Header = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    userRole,
    user,
    notifications,
    setActiveTab,
    onLogout,
    onBecomeSellerClick,
    onBecomeFinancerClick,
  }: HeaderProps) => {
    console.log(userRole);
    const { setActiveRole, getUserID } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();
    const userId = getUserID();

    const switchRoleAndNavigate = useCallback(
      async (role: UserRole, path: string) => {
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
      },
      [setActiveRole, navigate]
    );

    // Fetch cart item count
    useEffect(() => {
      const fetchCartCount = async () => {
        if (!userId) {
          setCartItemCount(0);
          return;
        }
        try {
          const response = await buyerService.getUserCart(userId);
          // handleResult unwraps the response, so response is directly the cart object
          if (response && response.items && Array.isArray(response.items)) {
            const totalCount = response.items.reduce(
              (sum: number, item: any) => sum + (item.quantity || 0),
              0
            );
            setCartItemCount(totalCount);
          } else {
            setCartItemCount(0);
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error);
          setCartItemCount(0);
        }
      };

      fetchCartCount();
      // Refresh cart count every 5 seconds to keep it updated
      const interval = setInterval(fetchCartCount, 5000);
      return () => clearInterval(interval);
    }, [userId]);

    const newUser =
      userRole.includes("user") &&
      !userRole.includes("seller") &&
      !userRole.includes("finance");
    const switchUserSeller =
      userRole.includes("user") && userRole.includes("seller");
    const switchUserFinancer =
      userRole.includes("user") && userRole.includes("finance");

    if (loading) {
      return <PageLoader />;
    }
    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0 lg:flex-none lg:w-full lg:max-w-xs xl:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center flex-shrink-0 space-x-3 ml-3">
          {/* Show "become" buttons only if user doesn't have that role */}
          {newUser && (
            <>
              <RoleButton
                onClick={onBecomeSellerClick}
                title="Become a Seller"
                icon={<ArrowUpCircle className="h-4 w-4 flex-shrink-0" />}
                label="Become a Seller"
              />
              <RoleButton
                onClick={onBecomeFinancerClick}
                title="Become a Financial Contributor"
                icon={<ArrowUpCircle className="h-4 w-4 flex-shrink-0" />}
                label="Become a Financial Contributor"
              />
            </>
          )}
          {switchUserSeller && (
            <RoleButton
              onClick={async () =>
                switchRoleAndNavigate("seller", "/seller/dashboard")
              }
              title="Switch to Seller"
              icon={<SwitchIcon className="h-4 w-4 flex-shrink-0" />}
              label="Switch to Seller"
              color="bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            />
          )}
          {switchUserFinancer && (
            <RoleButton
              onClick={() =>
                switchRoleAndNavigate("finance", "/finance/dashboard")
              }
              title="Switch to Financial Contributor"
              icon={<SwitchIcon className="h-4 w-4 flex-shrink-0" />}
              label="Switch to Financial Contributor"
              color="bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            />
          )}

          {/* Visual separator */}
          <div className="h-6 w-px bg-gray-300 hidden sm:block dark:bg-gray-600" />

          {/* Shopping Cart */}
          <button
            className="relative rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none transition-colors p-2 dark:text-gray-400 dark:hover:bg-gray-500 dark:hover:text-gray-200"
            onClick={() => setActiveTab("cart")}
            title="Shopping Cart"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown
            notifications={notifications}
            setActiveTab={setActiveTab}
          />

          {/* Profile */}
          <ProfileDropdown
            user={user}
            onLogout={onLogout}
            setActiveTab={setActiveTab}
          />
        </div>
      </header>
    );
  }
);
