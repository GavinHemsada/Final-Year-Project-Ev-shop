import { ChatBubbleIcon, EditIcon, TrashIcon } from "@/assets/icons/icons";
import type { Post } from "@/types/post";
import React from "react";
import { motion } from "framer-motion";

const apiURL = import.meta.env.VITE_API_URL;

export const PostItem: React.FC<{
  post: Post;
  userId: string | null;
  userRole?: string | null;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onView: (post: Post) => void;
  showEditDelete?: boolean;
  formatDate: (dateString: string) => string;
}> = React.memo(
  ({
    post,
    userId,
    userRole,
    onEdit,
    onDelete,
    onView,
    showEditDelete = false,
    formatDate,
  }) => {
    // Only show as seller if user has seller role AND has seller info (business_name or shop_logo)
    const isSeller =
      post.seller_id &&
      (post.seller_id.business_name || post.seller_id.shop_logo);
    const isFinance = post.financial_id && post.financial_id.name;
    const isUser = !isSeller && !isFinance;

    let displayName = post.user_id?.name || "Unknown User";
    let displayImage = post.user_id?.profile_image;

    // If seller
    if (isSeller && post.seller_id) {
      displayName = post.seller_id.business_name || post.user_id?.name || "Unknown User";
      displayImage = post.seller_id.shop_logo || post.user_id?.profile_image;
    }

    // If finance (only apply if not seller)
    else if (isFinance) {
      displayName = post.financial_id?.name || post.user_id?.name || "Unknown User";
      displayImage = post.user_id?.profile_image;
    }

    const isPostByUser = post.user_id?._id === userId && userRole?.includes("user");
    const isPostBySeller = post.seller_id?._id === userId && userRole?.includes("seller");
    const isPostByFinance = post.financial_id?._id === userId && userRole?.includes("finance");

    // Check if current user can edit/delete this post
    // Only allow if: post belongs to user AND user has same role as post creator
    const canEditDelete =
      showEditDelete && (isPostByUser || isPostBySeller || isPostByFinance);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 group"
      >
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {displayImage ? (
              <img
                src={`${apiURL}${displayImage}`}
                alt={displayName}
                className={`h-14 w-14 ${
                  isSeller ? "rounded-lg" : "rounded-full"
                } object-cover ring-2 ring-blue-100 dark:ring-blue-900`}
              />
            ) : (
              <div
                className={`h-14 w-14 ${
                  isSeller ? "rounded-lg" : "rounded-full"
                } bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {displayName}

                {isSeller && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    Seller
                  </span>
                )}

                {isFinance && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    Finance
                  </span>
                )}

                {isUser && (
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700/40 px-2 py-0.5 rounded-full">
                    User
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          {canEditDelete && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(post)}
                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 dark:text-blue-400 dark:hover:bg-blue-900/30"
                title="Edit post"
              >
                <EditIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(post._id)}
                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 dark:text-red-400 dark:hover:bg-red-900/30"
                title="Delete post"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors hover:scale-99"
        onClick={() => onView(post)}
        >
          {post.title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
          {post.content}
        </p>

        {/* Post Stats */}
        <div className="flex justify-between items-center text-sm mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg
                className="h-4 w-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="font-semibold">{post.views}</span>
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <ChatBubbleIcon className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">{post.reply_count ?? 0}</span>
            </span>
            {post.last_reply_by && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                Last reply by {post.last_reply_by.name}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
