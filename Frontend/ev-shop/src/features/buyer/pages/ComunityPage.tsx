import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBubbleIcon, SearchIcon } from "@/assets/icons/icons";
import type { AlertProps, Post, PostReply, ConfirmAlertProps } from "@/types";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId, selectActiveRole } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
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
  const userId = useAppSelector(selectUserId);
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
  const [editingReply, setEditingReply] = useState<PostReply | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [replyMenuOpen, setReplyMenuOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const queryClient = useQueryClient();
  console.log(replies)
  // Fetch all community posts with search
  const { 
    data: postsData, 
    isLoading: isLoadingCommunity,
    error: communityError 
  } = useQuery({
    queryKey: queryKeys.communityPosts(searchQuery),
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await buyerService.getCommunityPosts(params);
      return response?.posts || response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: activeTab === "community",
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch user's own posts
  const { 
    data: myPostsData,
    isLoading: isLoadingMyPosts,
    error: myPostsError
  } = useQuery({
    queryKey: queryKeys.myPosts(userId!),
    queryFn: async () => {
      if (!userId) return [];
      const response = await buyerService.getCommunityPostbyUser(userId);
      return response?.posts || response || [];
    },
    enabled: !!userId && activeTab === "myPosts",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allPosts: Post[] = useMemo(() => postsData || [], [postsData]);
  const myPosts: Post[] = useMemo(() => myPostsData || [], [myPostsData]);

  // Determine loading and error states based on active tab
  const isLoading = 
    activeTab === "community" ? isLoadingCommunity :
    isLoadingMyPosts

  const error = 
    activeTab === "community" ? communityError :
    myPostsError

  const displayedPosts = 
    activeTab === "community" ? allPosts : 
    myPosts 

  // Pagination logic
  const POSTS_PER_PAGE = 5;
  const totalPages = Math.ceil(displayedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = displayedPosts.slice(startIndex, endIndex);

  // Reset to page 1 when changing tabs or search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: (postData: {
      user_id: string;
      title: string;
      content: string;
    }) => buyerService.createCommunityPost(postData),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
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
      console.error("Create post error:", error);
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
      postData: { user_id: string; title: string; content: string };
    }) => buyerService.updateCommunityPost(postId, postData),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
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
      console.error("Update post error:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to update post",
        type: "error",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => buyerService.deleteCommunityPost(postId),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Delete post error:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete post",
        type: "error",
      });
    },
  });

  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, content }: { replyId: string; content: string }) =>
      buyerService.updatePostReply(replyId, { content }),
    onSuccess: async () => {
      // Refetch replies for the current post
      if (selectedPost) {
        try {
          const response = await buyerService.getPostReplies(selectedPost._id);
          setReplies(response?.replies || response || []);
        } catch (error) {
          console.error("Failed to refetch replies:", error);
        }
      }
      // Invalidate all post queries to update reply counts
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
      
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Reply updated successfully!",
        type: "success",
      });
      setEditingReply(null);
      setEditReplyContent("");
    },
    onError: (error: any) => {
      console.error("Update reply error:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to update reply",
        type: "error",
      });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => buyerService.deletePostReply(replyId),
    onSuccess: async () => {
      // Refetch replies for the current post
      if (selectedPost) {
        try {
          const response = await buyerService.getPostReplies(selectedPost._id);
          setReplies(response?.replies || response || []);
        } catch (error) {
          console.error("Failed to refetch replies:", error);
        }
      }
      // Invalidate all post queries to update reply counts
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
      
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Reply deleted successfully!",
        type: "success",
      });
    },
    onError: (error: any) => {
      console.error("Delete reply error:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete reply",
        type: "error",
      });
    },
  });

  const handlePostSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) return;

      if (editingPost) {
        updatePostMutation.mutate({
          postId: editingPost._id,
          postData: {
            user_id: userId,
            title: formData.title,
            content: formData.content,
          },
        });
      } else {
        createPostMutation.mutate({
          user_id: userId,
          title: formData.title,
          content: formData.content,
        });
      }
    },
    [userId, editingPost, formData, createPostMutation, updatePostMutation]
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
        await buyerService.postView(post._id);
        // Invalidate queries to refetch the latest post data including view count
        queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
        queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId!) });
      } catch (error) {
        console.error("Failed to update view count:", error);
      }

      // Fetch replies
      try {
        const response = await buyerService.getPostReplies(post._id);
        const repliesData = response?.replies || response || [];
        setReplies(Array.isArray(repliesData) ? repliesData : []);
      } catch (error) {
        console.error("Failed to fetch replies:", error);
        setReplies([]);
      }
    },
    [queryClient, userId]
  );

  const handleCreateReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPost || !userId || !newReply.trim()) return; // Add this line

      try {
        setIsSubmittingReply(true);
        await buyerService.createPostReply({
          user_id: userId,
          post_id: selectedPost._id,
          content: newReply,
        });

        // Refetch replies and posts
        const updatedReplies = await buyerService.getPostReplies(
          selectedPost._id
        );
        setReplies(updatedReplies?.replies || updatedReplies || []);
        queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
        queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(userId) });

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
    [selectedPost, userId, newReply, queryClient, setAlert, myPosts]
  );

  const handleEditClick = useCallback(
    (post: Post) => {
      if (post.user_id._id !== userId) {
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
    [userId, setAlert]
  );

  const handleEditReply = useCallback((reply: PostReply) => {
    setEditingReply(reply);
    setEditReplyContent(reply.content);
    setReplyMenuOpen(null);
  }, []);

  const handleUpdateReply = useCallback(
    (replyId: string) => {
      if (!editReplyContent.trim()) return;
      updateReplyMutation.mutate({ replyId, content: editReplyContent });
    },
    [editReplyContent, updateReplyMutation]
  );

  const handleDeleteReply = useCallback(
    (replyId: string) => {
      setConfirmAlert?.({
        title: "Delete Reply",
        message: "Are you sure you want to delete this reply?",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirmAction: () => {
          deleteReplyMutation.mutate(replyId);
        },
      });
      setReplyMenuOpen(null);
    },
    [deleteReplyMutation, setConfirmAlert]
  );

  // Close reply menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (replyMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.reply-menu-container')) {
          setReplyMenuOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [replyMenuOpen]);


  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 dark:from-gray-900 dark:via-blue-900/20 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto space-y-8 pt-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
            Community Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect, share, and engage with our vibrant community
          </p>
        </motion.div>

        {/* Tab Switcher with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
        >
          <div className="flex p-2 gap-2">
            <button
              onClick={() => {
                setActiveTab("community");
                setSearchInput("");
                setSearchQuery("");
              }}
              className={`flex-1 px-8 py-4 font-bold rounded-2xl transition-all duration-500 relative overflow-hidden group ${
                activeTab === "community"
                  ? "text-white shadow-xl"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              }`}
            >
              {activeTab === "community" && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="flex items-center justify-center gap-3 relative z-10">
                <FaUsers className="text-2xl" />
                <span className="text-lg">Community Posts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("myPosts")}
              className={`flex-1 px-8 py-4 font-bold rounded-2xl transition-all duration-500 relative overflow-hidden group ${
                activeTab === "myPosts"
                  ? "text-white shadow-xl"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              }`}
            >
              {activeTab === "myPosts" && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="flex items-center justify-center gap-3 relative z-10">
                <FaUser className="text-2xl" />
                <span className="text-lg">My Posts</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Search Bar for Community Posts */}
        {activeTab === "community" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 relative group">
                <SearchIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-500 group-focus-within:text-sky-500 transition-colors duration-300" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setSearchQuery(searchInput)
                  }
                  placeholder="Search posts by title or content..."
                  className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200/50 dark:border-blue-500/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white transition-all duration-300 placeholder-gray-400 text-lg font-medium backdrop-blur-sm"
                />
              </div>
              <button
                onClick={() => setSearchQuery(searchInput)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 font-bold text-lg"
                aria-label="Search"
              >
                <SearchIcon className="h-6 w-6" />
                <span>Search</span>
              </button>
              {searchInput && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="px-6 py-4 bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-bold backdrop-blur-sm"
                >
                  Clear
                </motion.button>
              )}
            </div>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 text-base text-gray-600 dark:text-gray-300"
              >
                Showing results for:{" "}
                <span className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text">
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
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                  <FaPlusCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  {editingPost ? "Edit Post" : "Create New Post"}
                </h2>
              </div>
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
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
                    className="w-full px-6 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200/50 dark:border-blue-500/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white transition-all duration-300 text-lg font-medium backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    rows={6}
                    placeholder="What's on your mind? Share your thoughts with the community..."
                    className="w-full px-6 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200/50 dark:border-blue-500/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white resize-none transition-all duration-300 text-lg font-medium backdrop-blur-sm"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={
                      createPostMutation.isPending || updatePostMutation.isPending
                    }
                    className="flex-1 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                    className="flex-1 bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 backdrop-blur-sm"
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
            transition={{ duration: 0.4, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50"
          >
            <button
              onClick={() => setShowPostForm(true)}
              className="w-full text-left p-6 border-3 border-dashed border-blue-300/60 dark:border-blue-500/40 rounded-2xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-sky-50/50 dark:hover:from-blue-900/20 dark:hover:to-sky-900/20 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-500 to-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaPlusCircle className="h-7 w-7 text-white" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-bold text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-sky-600 group-hover:bg-clip-text transition-all duration-300">
                  What's on your mind? Create a new post...
                </p>
              </div>
            </button>
          </motion.div>
        )}



        {/* Posts and Replies Feed */}
        <div className="space-y-6">
          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-red-50/80 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 dark:text-red-200 font-bold text-lg">
                  Failed to load posts. Please try again later.
                </p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-3xl shadow-2xl p-16 text-center border border-white/20 dark:border-gray-700/50"
            >
              <Loader size={16} color="#2563eb" />
              <p className="mt-6 text-gray-600 dark:text-gray-300 text-xl font-semibold">Loading posts...</p>
            </motion.div>
          ) : displayedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 p-16 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="h-32 w-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 via-blue-100 to-sky-100 dark:from-blue-900/40 dark:via-blue-900/40 dark:to-sky-900/40 flex items-center justify-center shadow-xl">
                  <ChatBubbleIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
                  {activeTab === "community"
                    ? searchQuery
                      ? "No posts found"
                      : "No posts yet"
                    : activeTab === "myPosts"
                    ? "No posts yet"
                    : "No replied posts yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                  {activeTab === "community"
                    ? searchQuery
                      ? "Try adjusting your search terms or browse all posts."
                      : "Be the first to share something with the community!"
                    : activeTab === "myPosts"
                    ? "Start sharing your thoughts with the community!"
                    : "Start engaging by replying to community posts!"}
                </p>
                {activeTab === "myPosts" && !showPostForm && (
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <FaPlusCircle className="h-6 w-6" />
                    Create Your First Post
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              <div className="space-y-6">
                {paginatedPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08, type: "spring" }}
                  >
                    <PostItem
                      post={post}
                      userId={userId}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex items-center justify-center gap-3"
                >
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-5 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white scale-110 shadow-2xl"
                            : "backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Replies Modal/Drawer */}
        <AnimatePresence>
          {showReplies && selectedPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowReplies(false);
                setSelectedPost(null);
                setReplies([]);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="backdrop-blur-2xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[110vh] overflow-hidden flex flex-col border-2 border-white/30 dark:border-gray-700/50"
              >
                {/* Header */}
                <div className="p-8 border-b-2 dark:border-gray-700/50 bg-gradient-to-r from-blue-100/80 via-blue-100/80 to-sky-100/80 dark:from-gray-800/80 dark:via-blue-900/30 dark:to-sky-900/30 backdrop-blur-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-3">
                        {selectedPost.title}
                      </h2>
                      <p className="text-gray-700 dark:text-gray-200 mb-4 text-lg leading-relaxed">
                        {selectedPost.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 px-4 py-2 rounded-full font-semibold backdrop-blur-sm">
                          <svg
                            className="h-5 w-5"
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
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 px-4 py-2 rounded-full font-semibold backdrop-blur-sm">
                          <ChatBubbleIcon className="h-5 w-5" />
                          {selectedPost.reply_count} Replies
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowReplies(false);
                        setSelectedPost(null);
                        setReplies([]);
                      }}
                      className="p-3 text-gray-500 hover:text-gray-900 hover:bg-white/60 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700/60 rounded-2xl transition-all duration-300 backdrop-blur-sm hover:scale-110"
                    >
                      <svg
                        className="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Replies List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-gradient-to-br from-gray-50/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/20 backdrop-blur-xl">
                  {replies.length === 0 ? (
                    <div className="text-center py-16">
                      <ChatBubbleIcon className="h-20 w-20 mx-auto text-blue-300 dark:text-blue-600 mb-6" />
                      <p className="text-gray-500 dark:text-gray-400 text-xl font-bold">
                        No replies yet. Be the first to reply!
                      </p>
                    </div>
                  ) : (
                    replies.map((reply, index) => {
                      // Determine author info - handle user, seller, or financial
                      const isSeller =
                        reply.seller_id && reply.seller_id.business_name;
                      const isFinancial =
                        reply.financial_id && reply.financial_id.name;

                      let authorName = "";
                      let authorImage: string | undefined = undefined;
                      let authorInitial = "";
                      let authorId = "";

                      if (isSeller && reply.seller_id) {
                        authorName = reply.seller_id.business_name || "Seller";
                        authorImage = reply.seller_id.shop_logo;
                        authorInitial = authorName.charAt(0).toUpperCase();
                        authorId = reply.seller_id._id;
                      } else if (isFinancial && reply.financial_id) {
                        authorName = reply.financial_id.name;
                        authorInitial = authorName.charAt(0).toUpperCase();
                        authorId = reply.financial_id._id;
                      } else if (reply.user_id) {
                        authorName = reply.user_id.name;
                        authorImage = reply.user_id.profile_image;
                        authorInitial = authorName.charAt(0).toUpperCase();
                        authorId = reply.user_id._id;
                      } else {
                        authorName = "Unknown";
                        authorInitial = "?";
                      }

                      const isEditing = editingReply?._id === reply._id;

                      const isOwnReply = authorId === userId;

                      return (
                        <motion.div
                          key={reply._id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05, type: "spring" }}
                          className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border-l-4 border-blue-500 pl-6 py-5 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              {authorImage ? (
                                <img
                                  src={`${apiURL}${authorImage}`}
                                  alt={authorName}
                                  className="h-12 w-12 rounded-full object-cover ring-4 ring-blue-200 dark:ring-blue-700 shadow-lg"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-blue-500 to-sky-500 flex items-center justify-center text-white text-base font-bold shadow-lg">
                                  {authorInitial}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block text-lg">
                                  {authorName}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                            </div>
                            {isOwnReply && (
                              <div className="relative reply-menu-container">
                                <button
                                  onClick={() => setReplyMenuOpen(replyMenuOpen === reply._id ? null : reply._id)}
                                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300"
                                >
                                  <svg
                                    className="h-6 w-6 text-gray-500 dark:text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                {replyMenuOpen === reply._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 mt-2 w-52 backdrop-blur-xl bg-white/90 dark:bg-gray-700/90 rounded-2xl shadow-2xl border-2 border-white/30 dark:border-gray-600/50 z-10 overflow-hidden"
                                  >
                                    <button
                                      onClick={() => handleEditReply(reply)}
                                      className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-all duration-300"
                                    >
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReply(reply._id)}
                                      className="w-full px-5 py-3 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-all duration-300"
                                    >
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-4">
                              <textarea
                                value={editReplyContent}
                                onChange={(e) => setEditReplyContent(e.target.value)}
                                rows={3}
                                className="w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200/50 dark:border-blue-500/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white resize-none transition-all duration-300 text-base font-medium backdrop-blur-sm"
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleUpdateReply(reply._id)}
                                  disabled={updateReplyMutation.isPending}
                                  className="flex-1 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white py-3 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
                                >
                                  {updateReplyMutation.isPending ? "Updating..." : "Update Reply"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingReply(null);
                                    setEditReplyContent("");
                                  }}
                                  className="flex-1 bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 py-3 rounded-2xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 backdrop-blur-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-base font-medium">
                              {reply.content}
                            </p>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Reply Form */}
                {userId && (
                  <div className="p-8 border-t-2 dark:border-gray-700/50 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
                    <form onSubmit={handleCreateReply} className="space-y-4">
                      <textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        required
                        rows={3}
                        placeholder="Write a reply..."
                        className="w-full px-6 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200/50 dark:border-blue-500/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white resize-none transition-all duration-300 text-lg font-medium backdrop-blur-sm"
                      />
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={isSubmittingReply || !newReply.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    </div>
  );
};

export default CommunityPage;
