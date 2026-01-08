import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import type { ActiveTab } from "@/types";

/**
 * Custom hook for managing buyer dashboard active tab state.
 * Handles tab state management and reading from navigation state.
 *
 * @param defaultTab - The default tab to show if no tab is specified in location state
 * @returns Object containing activeTab state and setActiveTab function
 */
export const useBuyerTab = (defaultTab: ActiveTab = "dashboard") => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>(defaultTab);

  // Handle navigation state for active tab
  useEffect(() => {
    const state = location.state as { activeTab?: ActiveTab } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  // Memoized setter function
  const handleSetActiveTab = useCallback(
    (tab: ActiveTab) => setActiveTab(tab),
    []
  );

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
  };
};
