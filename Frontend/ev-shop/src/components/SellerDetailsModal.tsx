import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { buyerService } from "@/features/buyer/buyerService";
import { Loader } from "./Loader";

interface SellerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
}

const apiURL = import.meta.env.VITE_API_URL;

export const SellerDetailsModal: React.FC<SellerDetailsModalProps> = ({
  isOpen,
  onClose,
  sellerId,
}) => {
  const { data: seller, isLoading, error } = useQuery({
    queryKey: ["sellerProfile", sellerId],
    queryFn: () => buyerService.getUserProfile(sellerId),
    enabled: isOpen && !!sellerId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700 mx-4"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader size={12} color="#2563eb" />
                <p className="mt-4 text-blue-600 font-medium">Loading details...</p>
              </div>
            ) : error || !seller ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load</h3>
                <p className="text-gray-500 dark:text-gray-400">Could not fetch seller information.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Header / Cover Area */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-sky-500 relative">
                    <div className="absolute -bottom-16 left-8 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                        {seller.user.shop_logo || seller.user.profile_image ? (
                             <img 
                                src={`${apiURL}${seller.user.shop_logo || seller.user.profile_image}`} 
                                alt={seller.user.business_name || seller.user.name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800"
                             />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center border-4 border-white dark:border-gray-800">
                                <span className="text-4xl font-bold text-blue-600">
                                    {(seller.user.business_name || seller.user.name || "S").charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="pt-20 px-8 pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {seller.user.business_name || seller.user.name}
                    </h2>
                    <p className="text-blue-600 font-medium mb-6 flex items-center gap-2">
                        {seller.user.role === "seller" ? "Verified Seller" : "Community Member"}
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h4>
                             <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{seller.user.email}</span>
                                </div>
                                {seller.user.phone_number && (
                                     <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{seller.user.phone_number}</span>
                                    </div>
                                )}
                                {seller.user.address && (
                                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{seller.user.address}</span>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
