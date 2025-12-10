import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBubbleIcon, SearchIcon } from "@/assets/icons/icons";
import type { AlertProps, Post, PostReply, ConfirmAlertProps } from "@/types";
import { sellerService } from "../sellerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRole, selectActiveRoleId } from "@/context/authSlice";
import { Loader, PageLoader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { FaUser, FaUsers, FaPlusCircle } from "react-icons/fa";
import { PostItem } from "@/components/PostItems";

const apiURL = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

export const CommunityPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
  setConfirmAlert?: (confirmAlert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const sellerId = useAppSelector(selectActiveRoleId);
  const userRole = useAppSelector(selectActiveRole);
  const [activeTab, setActiveTab] = useState<"community" | "myPosts">(
    "community"
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<PostReply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const queryClient = useQueryClient();

  // Fetch all community posts with search
  const { data: postsData, isLoading: isLoadingCommunity } = useQuery({
    queryKey: queryKeys.communityPosts(searchQuery),
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await sellerService.getCommunityPosts(params);
      return response?.posts || response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab === "community", // Only fetch when this tab is active
  });

  // Fetch user's own posts
  const { data: myPostsData, isLoading: isLoadingMyPosts } = useQuery({
    queryKey: queryKeys.myPosts(sellerId!),
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await sellerService.getCommunityPostbySeller(sellerId);
      return response?.posts || response || [];
    },
    enabled: !!sellerId && activeTab === "myPosts",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allPosts: Post[] = useMemo(() => postsData || [], [postsData]);
  const myPosts: Post[] = useMemo(() => myPostsData || [], [myPostsData]);

  const isLoading =
    activeTab === "community" ? isLoadingCommunity : isLoadingMyPosts;
  const displayedPosts = activeTab === "community" ? allPosts : myPosts;

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: (postData: {
      seller_id: string;
      title: string;
      content: string;
    }) => sellerService.createCommunityPost(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(sellerId!) });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post created successfully!",
        type: "success",
      });
      setFormData({ title: "", content: "" });
      setShowPostForm(false);
    },
    onError: (error: any) => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to create post",
        type: "error",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({
      postId,
      postData,
    }: {
      postId: string;
      postData: { seller_id: string; title: string; content: string };
    }) => sellerService.updateCommunityPost(postId, postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(sellerId!) });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post updated successfully!",
        type: "success",
      });
      setFormData({ title: "", content: "" });
      setEditingPost(null);
      setShowPostForm(false);
    },
    onError: (error: any) => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to update post",
        type: "error",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => sellerService.deleteCommunityPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(sellerId!) });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post deleted successfully!",
        type: "success",
      });
    },
    onError: () => {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete post",
        type: "error",
      });
    },
  });

  const handlePostSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!sellerId) return;

      if (editingPost) {
        updatePostMutation.mutate({
          postId: editingPost._id,
          postData: {
            seller_id: sellerId,
            title: formData.title,
            content: formData.content,
          },
        });
      } else {
        createPostMutation.mutate({
          seller_id: sellerId,
          title: formData.title,
          content: formData.content,
        });
      }
    },
    [sellerId, editingPost, formData, createPostMutation, updatePostMutation]
  );

  const handleDeletePost = useCallback(
    (id: string) => {
      setConfirmAlert?.({
        title: "Delete Post",
        message: "Are you sure you want to delete this post?",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirmAction: () => {
          deletePostMutation.mutate(id);
        },
      });
    },
    [deletePostMutation, setConfirmAlert]
  );

  const handleViewPost = useCallback(
    async (post: Post) => {
      setSelectedPost(post);
      setShowReplies(true);

      // Update view count on server (only increments if user hasn't viewed today)
      try {
        await sellerService.postView(post._id);
        // Invalidate queries to refetch the latest post data including view count
        queryClient.invalidateQueries({
          queryKey: queryKeys.communityPosts(searchQuery),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.myPosts(sellerId!),
        });
      } catch (error) {
        console.error("Failed to update view count:", error);
      }

      // Fetch replies
      try {
        const response = await sellerService.getPostReplies(post._id);
        const repliesData = response?.replies || response || [];
        setReplies(Array.isArray(repliesData) ? repliesData : []);
      } catch (error) {
        console.error("Failed to fetch replies:", error);
        setReplies([]);
      }
    },
    [queryClient, sellerId, searchQuery]
  );

  const handleCreateReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPost || !sellerId || !newReply.trim()) return;

      try {
        setIsSubmittingReply(true);
        await sellerService.createPostReply({
          seller_id: sellerId,
          post_id: selectedPost._id,
          content: newReply,
        });

        // Refetch replies and posts
        const updatedReplies = await sellerService.getPostReplies(
          selectedPost._id
        );
        setReplies(updatedReplies?.replies || updatedReplies || []);
        queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.myPosts(sellerId),
        });

        setNewReply("");
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Reply added successfully!",
          type: "success",
        });
      } catch (error: any) {
        console.error("Failed to create reply:", error);
        setAlert?.({
          id: Date.now(),
          title: "Error",
          message: error?.response?.data?.message || "Failed to add reply",
          type: "error",
        });
      } finally {
        setIsSubmittingReply(false);
      }
    },
    [selectedPost, sellerId, newReply, queryClient, setAlert]
  );

  const handleEditClick = useCallback(
    (post: Post) => {
      if (post.seller_id?._id !== sellerId) {
        setAlert?.({
          id: Date.now(),
          title: "Error",
          message: "You can only edit your own posts",
          type: "error",
        });
        return;
      }
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
      });
      setShowPostForm(true);
    },
    [sellerId, setAlert]
  );

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700 overflow-hidden"
      >
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab("community");
              setSearchInput("");
              setSearchQuery("");
            }}
            className={`flex-1 px-6 py-5 font-semibold transition-all duration-300 relative ${
              activeTab === "community"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaUsers className="text-xl" />
              <span>Community Posts</span>
            </div>
            {activeTab === "community" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("myPosts")}
            className={`flex-1 px-6 py-5 font-semibold transition-all duration-300 relative ${
              activeTab === "myPosts"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaUser className="text-xl" />
              <span>My Posts</span>
            </div>
            {activeTab === "myPosts" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Search Bar for Community Posts */}
      {activeTab === "community" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setSearchQuery(searchInput)
                }
                placeholder="Search posts by title or content..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              />
            </div>
            <button
              onClick={() => setSearchQuery(searchInput)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2"
              aria-label="Search"
            >
              <SearchIcon className="h-5 w-5" />
              <span className="font-semibold">Search</span>
            </button>
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-gray-600 dark:text-gray-400"
            >
              Showing results for:{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                "{searchQuery}"
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Create/Edit Post Section */}
      <AnimatePresence>
        {showPostForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-xl dark:bg-gray-800 dark:border dark:border-gray-700 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FaPlusCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">
                {editingPost ? "Edit Post" : "Create New Post"}
              </h2>
            </div>
            <form onSubmit={handlePostSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  minLength={5}
                  placeholder="Enter post title (min 5 characters)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={5}
                  placeholder="What's on your mind? Share your thoughts with the community..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createPostMutation.isPending || updatePostMutation.isPending
                  }
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {createPostMutation.isPending ||
                  updatePostMutation.isPending ? (
                    <Loader size={10} color="#ffffff" />
                  ) : editingPost ? (
                    "Update Post"
                  ) : (
                    "Create Post"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPostForm(false);
                    setEditingPost(null);
                    setFormData({ title: "", content: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Button */}
      {!showPostForm && activeTab === "myPosts" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700"
        >
          <button
            onClick={() => setShowPostForm(true)}
            className="w-full text-left p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 dark:border-gray-600 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaPlusCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                What's on your mind? Create a new post...
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <PageLoader />
          </div>
        ) : displayedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-2xl shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <ChatBubbleIcon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {activeTab === "community"
                  ? searchQuery
                    ? "No posts found"
                    : "No posts yet"
                  : "No posts yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === "community"
                  ? searchQuery
                    ? "Try adjusting your search terms or browse all posts."
                    : "Be the first to share something with the community!"
                  : "Start sharing your thoughts with the community!"}
              </p>
              {activeTab === "myPosts" && !showPostForm && (
                <button
                  onClick={() => setShowPostForm(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <FaPlusCircle className="h-5 w-5" />
                  Create Your First Post
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {displayedPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PostItem
                  post={post}
                  userId={sellerId}
                  userRole={userRole}
                  onEdit={handleEditClick}
                  onDelete={handleDeletePost}
                  onView={handleViewPost}
                  showEditDelete={activeTab === "myPosts"}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Replies Modal/Drawer */}
      <AnimatePresence>
        {showReplies && selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowReplies(false);
              setSelectedPost(null);
              setReplies([]);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold dark:text-white mb-2">
                      {selectedPost.title}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {selectedPost.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">
                        <svg
                          className="h-4 w-4"
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
                        {selectedPost.views} Views
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">
                        <ChatBubbleIcon className="h-4 w-4" />
                        {selectedPost.reply_count ?? 0} Replies
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReplies(false);
                      setSelectedPost(null);
                      setReplies([]);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Replies List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
                {replies.length === 0 ? (
                  <div className="text-center py-12">
                    <ChatBubbleIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      No replies yet. Be the first to reply!
                    </p>
                  </div>
                ) : (
                  replies.map((reply, index) => {
                    // Determine author info - handle user, seller, or financial
                    const isSeller = reply.seller_id && reply.seller_id.business_name;
                    const isFinancial = reply.financial_id && reply.financial_id.name;
                    
                    let authorName = "";
                    let authorImage: string | undefined = undefined;
                    let authorInitial = "";
                    
                    if (isSeller && reply.seller_id) {
                      authorName = reply.seller_id.business_name || "Seller";
                      authorImage = reply.seller_id.shop_logo;
                      authorInitial = authorName.charAt(0).toUpperCase();
                    } else if (isFinancial && reply.financial_id) {
                      authorName = reply.financial_id.name;
                      authorInitial = authorName.charAt(0).toUpperCase();
                    } else if (reply.user_id) {
                      authorName = reply.user_id.name;
                      authorImage = reply.user_id.profile_image;
                      authorInitial = authorName.charAt(0).toUpperCase();
                    } else {
                      authorName = "Unknown";
                      authorInitial = "?";
                    }

                    return (
                      <motion.div
                        key={reply._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 pl-5 py-4 rounded-r-xl shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {authorImage ? (
                            <img
                              src={`${apiURL}${authorImage}`}
                              alt={authorName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                              {authorInitial}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {authorName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {reply.content}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              {sellerId && (
                <div className="p-6 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleCreateReply} className="space-y-3">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      required
                      rows={3}
                      placeholder="Write a reply..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none transition-all"
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isSubmittingReply || !newReply.trim()}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmittingReply ? "Posting..." : "Post Reply"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPage;
