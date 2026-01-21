import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatBubbleIcon, SearchIcon } from "@/assets/icons/icons";
import type { AlertProps, Post, PostReply, ConfirmAlertProps } from "@/types";
import { financialService } from "../financialService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRole, selectActiveRoleId } from "@/context/authSlice";
import { Loader, PageLoader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { FaUser, FaUsers, FaPlusCircle } from "react-icons/fa";
import { PostItem } from "@/components/PostItems";

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
  financialId?: string | null;
}> = ({ setAlert, setConfirmAlert, financialId: propFinancialId }) => {
  const reduxFinancialId = useAppSelector(selectActiveRoleId);
  const financialId = propFinancialId || reduxFinancialId;
  console.log(financialId);
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

  // Fetch all community posts with search
  const { 
    data: postsData, 
    isLoading: isLoadingCommunity,
  } = useQuery({
    queryKey: queryKeys.communityPosts(searchQuery),
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await financialService.getCommunityPosts(params);
      return response?.posts || response || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: activeTab === "community",
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch financial's own posts
  const { 
    data: myPostsData, 
    isLoading: isLoadingMyPosts,
  } = useQuery({
    queryKey: queryKeys.myPosts(financialId!),
    queryFn: async () => {
      if (!financialId) return [];
      const response = await financialService.getCommunityPostbyFinancial(financialId);
      return response?.posts || response || [];
    },
    enabled: !!financialId && activeTab === "myPosts",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allPosts: Post[] = useMemo(() => postsData || [], [postsData]);
  const myPosts: Post[] = useMemo(() => myPostsData || [], [myPostsData]);

  const isLoading = 
    activeTab === "community" ? isLoadingCommunity :
    isLoadingMyPosts;


  const displayedPosts = 
    activeTab === "community" ? allPosts : 
    myPosts;

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
      financial_id: string;
      title: string;
      content: string;
    }) => financialService.createCommunityPost(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(financialId!) });
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
      postData: { financial_id: string; title: string; content: string };
    }) => financialService.updateCommunityPost(postId, postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(financialId!) });
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
    mutationFn: (postId: string) => financialService.deleteCommunityPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(financialId!) });
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

  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, content }: { replyId: string; content: string }) =>
      financialService.updatePostReply(replyId, { content }),
    onSuccess: async () => {
      if (selectedPost) {
        try {
          const response = await financialService.getPostReplies(selectedPost._id);
          setReplies(response?.replies || response || []);
        } catch (error) {
          console.error("Failed to refetch replies:", error);
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(financialId!) });
      
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
    mutationFn: (replyId: string) => financialService.deletePostReply(replyId),
    onSuccess: async () => {
      if (selectedPost) {
        try {
          const response = await financialService.getPostReplies(selectedPost._id);
          setReplies(response?.replies || response || []);
        } catch (error) {
          console.error("Failed to refetch replies:", error);
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(financialId!) });
      
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
      if (!financialId) {
        setAlert?.({
          id: Date.now(),
          title: "Error",
          message: "Financial Profile ID not found. Please refresh the page.",
          type: "error",
        });
        return;
      }

      if (editingPost) {
        updatePostMutation.mutate({
          postId: editingPost._id,
          postData: {
            financial_id: financialId,
            title: formData.title,
            content: formData.content,
          },
        });
      } else {
        createPostMutation.mutate({
          financial_id: financialId,
          title: formData.title,
          content: formData.content,
        });
      }
    },
    [financialId, editingPost, formData, createPostMutation, updatePostMutation]
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

      try {
        await financialService.postView(post._id);
        queryClient.invalidateQueries({
          queryKey: queryKeys.communityPosts(searchQuery),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.myPosts(financialId!),
        });
      } catch (error) {
        console.error("Failed to update view count:", error);
      }

      try {
        const response = await financialService.getPostReplies(post._id);
        const repliesData = response?.replies || response || [];
        setReplies(Array.isArray(repliesData) ? repliesData : []);
      } catch (error) {
        console.error("Failed to fetch replies:", error);
        setReplies([]);
      }
    },
    [queryClient, financialId, searchQuery]
  );

  const handleCreateReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPost || !financialId || !newReply.trim()) return;

      try {
        setIsSubmittingReply(true);
        await financialService.createPostReply({
          financial_id: financialId,
          post_id: selectedPost._id,
          content: newReply,
        });

        const updatedReplies = await financialService.getPostReplies(
          selectedPost._id
        );
        setReplies(updatedReplies?.replies || updatedReplies || []);
        queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.myPosts(financialId),
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
    [selectedPost, financialId, newReply, queryClient, setAlert]
  );

  const handleEditClick = useCallback(
    (post: Post) => {
      if (post.financial_id?._id !== financialId) {
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
    [financialId, setAlert]
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
            onClick={() => {
              if (financialId) setShowPostForm(true);
            }}
            disabled={!financialId}
            className={`w-full text-left p-4 border-2 border-dashed rounded-xl transition-all duration-300 group ${
              financialId 
                ? "border-gray-300 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:border-gray-600 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform ${
                 financialId ? "bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110" : "bg-gray-400"
              }`}>
                <FaPlusCircle className="h-5 w-5 text-white" />
              </div>
              <p className={`font-medium transition-colors ${
                financialId 
                  ? "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}>
                {financialId 
                  ? "What's on your mind? Create a new post..." 
                  : "Loading profile... Please wait."}
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
          <>
            <div className="space-y-6">
              {paginatedPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <PostItem
                    post={post}
                    userId={financialId}
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
                className="mt-8 flex items-center justify-center gap-2"
              >
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Replies Drawer/Modal */}
      <AnimatePresence>
        {showReplies && selectedPost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReplies(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-4 z-10">
                  <h2 className="text-2xl font-bold dark:text-white">Replies</h2>
                  <button
                    onClick={() => setShowReplies(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Original Post Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-lg mb-2 dark:text-gray-200">{selectedPost.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{selectedPost?.content}</p>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleCreateReply} className="space-y-4">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={!newReply.trim() || isSubmittingReply}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingReply ? <Loader size={10} color="#ffffff" /> : "Post Reply"}
                  </button>
                </form>

                {/* Replies List */}
                <div className="space-y-4">
                  {replies && replies.length > 0 ? (
                    replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {reply.user_id?.name?.charAt(0) ||
                               reply.seller_id?.business_name?.charAt(0) ||
                               reply.financial_id?.name?.charAt(0) ||
                               "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm dark:text-white">
                                {reply.user_id?.name ||
                                 reply.seller_id?.business_name ||
                                 reply.financial_id?.name ||
                                 "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Reply Actions (for own replies) */}
                          {(
                            (reply.financial_id?._id === financialId && financialId)
                          ) && (
                            <div className="relative reply-menu-container">
                              <button
                                onClick={() => setReplyMenuOpen(replyMenuOpen === reply._id ? null : reply._id)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              
                              <AnimatePresence>
                                {replyMenuOpen === reply._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden"
                                  >
                                    <button
                                      onClick={() => handleEditReply(reply)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReply(reply._id)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>

                        {/* Reply Content (Editable) */}
                        <div className="mt-3 pl-11">
                          {editingReply?._id === reply._id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editReplyContent}
                                onChange={(e) => setEditReplyContent(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingReply(null)}
                                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateReply(reply._id)}
                                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No replies yet. Be the first to reply!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
