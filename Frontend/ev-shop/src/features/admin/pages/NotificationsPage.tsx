import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader } from "@/components/Loader";
import {
  BellIcon,
  SearchIcon,
  UserIcon,
  CheckIcon,
  BanknoteIcon,
  CarIcon,
} from "@/assets/icons/icons";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  createdAt: string;
  user_id?: string;
  seller_id?: string;
  financial_id?: string;
}

export const NotificationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "buyer" | "seller" | "financial">("all");

  // Fetch all data in parallel
  const { data: notifications = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: () => adminService.getAllNotifications(),
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminService.getAllUsers(),
  });

  const { data: sellers = [], isLoading: isLoadingSellers } = useQuery({
    queryKey: ["adminSellers"],
    queryFn: () => adminService.getAllSellers(),
  });

  const { data: financialInsts = [], isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["adminFinancial"],
    queryFn: () => adminService.getAllFinancialInstitutions(),
  });

  const isLoading = isLoadingNotes || isLoadingUsers || isLoadingSellers || isLoadingFinancial;

  // Create lookup maps for quick name resolution
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(users)) {
       users.forEach((u: any) => map[u._id] = u.name);
    }
    return map;
  }, [users]);

  const sellerMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(sellers)) {
        sellers.forEach((s: any) => map[s._id] = s.user_id?.name || s.business_name || "Unknown Seller");
    }
    return map;
  }, [sellers]);

  const financialMap = useMemo(() => {
    const map: Record<string, string> = {};
     if (Array.isArray(financialInsts)) {
        financialInsts.forEach((f: any) => map[f._id] = f.name);
     }
    return map;
  }, [financialInsts]);

  // Enrich notifications with user names and roles
  const enrichedNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    return notifications.map((note: Notification) => {
      let involvedUser = "System";
      let role = "System";
      
      if (note.user_id) {
        involvedUser = userMap[note.user_id] || "Unknown Buyer";
        role = "Buyer";
      } else if (note.seller_id) {
        involvedUser = sellerMap[note.seller_id] || "Unknown Seller";
        role = "Seller";
      } else if (note.financial_id) {
        involvedUser = financialMap[note.financial_id] || "Unknown Institution";
        role = "Financial";
      }

      return { ...note, involvedUser, role };
    });
  }, [notifications, userMap, sellerMap, financialMap]);

  // Filter logic
  const filteredNotifications = enrichedNotifications.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.involvedUser.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "buyer") return matchesSearch && note.role === "Buyer";
    if (activeTab === "seller") return matchesSearch && note.role === "Seller";
    if (activeTab === "financial") return matchesSearch && note.role === "Financial";
    return matchesSearch;
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <BellIcon className="w-6 h-6" />
          Notification Management
        </h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search user or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(["all", "buyer", "seller", "financial"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === tab
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
          </div>
        ) : (
          filteredNotifications.map((note) => (
            <div
              key={note._id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`p-2 rounded-full shrink-0 ${
                      note.role === 'Buyer' ? 'bg-blue-100 text-blue-600' :
                      note.role === 'Seller' ? 'bg-purple-100 text-purple-600' :
                      note.role === 'Financial' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                    {note.role === 'Buyer' && <UserIcon className="w-5 h-5" />}
                    {note.role === 'Seller' && <CarIcon className="w-5 h-5" />}
                    {note.role === 'Financial' && <BanknoteIcon className="w-5 h-5" />}
                    {note.role === 'System' && <BellIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {note.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          note.role === 'Buyer' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          note.role === 'Seller' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                          note.role === 'Financial' ? 'bg-green-50 border-green-200 text-green-700' :
                          'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                        {note.role}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {note.involvedUser}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {note.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {note.is_read && (
                    <span className="text-green-500" title="Read">
                        <CheckIcon className="w-5 h-5" />
                    </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
