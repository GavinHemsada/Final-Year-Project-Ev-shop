import React, { useState, useEffect } from "react";
import {
  HeartIcon,
  ChatBubbleIcon,
  EditIcon,
  TrashIcon,
} from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { buyerService } from "../buyerService";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/Loader";

// --- Helper Icons ---
const PhotographIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

interface Post {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    profile_image?: string;
  };
  title: string;
  content: string;
  views: number;
  reply_count: number;
  last_reply_by?: {
    _id: string;
    name: string;
    profile_image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PostReply {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    profile_image?: string;
  };
  post_id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const apiURL = import.meta.env.VITE_API_URL;

export const CommunityPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const { getUserID, user } = useAuth();
  const userId = getUserID();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await buyerService.getCommunityPosts();
      // handleResult unwraps { success: true, posts: [...] } to { posts: [...] }
      // So response should be an object with posts property
      let postsData: any[] = [];

      if (Array.isArray(response)) {
        // Response is directly the array (unwrapped by handleResult)
        postsData = response;
      } else if (response && Array.isArray(response.posts)) {
        // Response is { posts: [...] } (most likely case)
        postsData = response.posts;
      } else if (response && response.success && Array.isArray(response.posts)) {
        // Response has success wrapper (fallback)
        postsData = response.posts;
      }

      setPosts(postsData);
    } catch (error: any) {
      console.error("Failed to fetch posts:", error);
      const errorMessage = error?.response?.data?.message || "Failed to load community posts";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Please log in to create a post",
        type: "error",
      });
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Please fill in both title and content",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await buyerService.createCommunityPost({
        user_id: userId,
        title: formData.title,
        content: formData.content,
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post created successfully!",
        type: "success",
      });
      setFormData({ title: "", content: "" });
      setShowPostForm(false);
      fetchPosts();
    } catch (error: any) {
      console.error("Failed to create post:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to create post",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !userId) return;

    try {
      setIsSubmitting(true);
      await buyerService.updateCommunityPost(editingPost._id, {
        user_id: userId,
        title: formData.title,
        content: formData.content,
      });
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post updated successfully!",
        type: "success",
      });
      setFormData({ title: "", content: "" });
      setEditingPost(null);
      setShowPostForm(false);
      fetchPosts();
    } catch (error: any) {
      console.error("Failed to update post:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: error?.response?.data?.message || "Failed to update post",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await buyerService.deleteCommunityPost(id);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Post deleted successfully!",
        type: "success",
      });
      fetchPosts();
    } catch (error: any) {
      console.error("Failed to delete post:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete post",
        type: "error",
      });
    }
  };

  const handleViewPost = async (post: Post) => {
    setSelectedPost(post);
    setShowReplies(true);

    // Update view count
    try {
      await buyerService.postView(post._id);
      // Refresh posts to get updated view count
      fetchPosts();
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
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !userId || !newReply.trim()) return;

    try {
      setIsSubmittingReply(true);
      await buyerService.createPostReply({
        user_id: userId,
        post_id: selectedPost._id,
        content: newReply,
      });

      // Update reply count and last reply by
      try {
        const updatedReplies = await buyerService.getPostReplies(
          selectedPost._id
        );
        const repliesData = updatedReplies?.replies || updatedReplies || [];
        const newReplies = Array.isArray(repliesData) ? repliesData : [];
        setReplies(newReplies);

        // Update reply count
        await buyerService.replyCount(selectedPost._id);

        // Update last reply by
        if (newReplies.length > 0 && newReplies[0].user_id) {
          await buyerService.lastReplyBy(selectedPost._id, {
            last_reply_by: newReplies[0].user_id._id,
          });
        }

        // Refresh posts
        fetchPosts();
      } catch (error) {
        console.error("Failed to update reply count:", error);
      }

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
  };

  const handleEditClick = (post: Post) => {
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
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">Community Forum</h1>

      {/* Create/Edit Post Section */}
      {showPostForm && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {editingPost ? "Edit Post" : "Create New Post"}
          </h2>
          <form
            onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={4}
                placeholder="What's on your mind?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : editingPost
                  ? "Update Post"
                  : "Create Post"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPostForm(false);
                  setEditingPost(null);
                  setFormData({ title: "", content: "" });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Post Button */}
      {!showPostForm && (
        <div className="bg-white p-4 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <button
            onClick={() => setShowPostForm(true)}
            className="w-full text-left p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors dark:border-gray-600 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
          >
            <p className="text-gray-500 dark:text-gray-400">
              What's on your mind, {user?.name || "User"}?
            </p>
          </button>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
            <p className="text-gray-500 text-center py-10 dark:text-gray-400">
              No posts yet. Be the first to share something!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {post.user_id.profile_image ? (
                    <img
                      src={`${apiURL}${post.user_id.profile_image}`}
                      alt={post.user_id.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                      {post.user_id.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold dark:text-white">
                      {post.user_id.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                {post.user_id._id === userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(post)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Edit post"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Delete post"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                {post.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Post Stats */}
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
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
                    {post.views} Views
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatBubbleIcon className="h-4 w-4" />
                    {post.reply_count} Replies
                  </span>
                  {post.last_reply_by && (
                    <span className="text-xs">
                      Last reply by {post.last_reply_by.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex justify-around mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => handleViewPost(post)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-500 font-medium p-2 rounded-lg w-full justify-center transition-colors dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <ChatBubbleIcon className="h-5 w-5" /> View & Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Replies Modal/Drawer */}
      {showReplies && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold dark:text-white mb-2">
                  {selectedPost.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedPost.content}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>{selectedPost.views} Views</span>
                  <span>{selectedPost.reply_count} Replies</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReplies(false);
                  setSelectedPost(null);
                  setReplies([]);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

            {/* Replies List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {replies.length === 0 ? (
                <p className="text-gray-500 text-center py-8 dark:text-gray-400">
                  No replies yet. Be the first to reply!
                </p>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply._id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {reply.user_id.profile_image ? (
                        <img
                          src={`${apiURL}${reply.user_id.profile_image}`}
                          alt={reply.user_id.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {reply.user_id.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold dark:text-white">
                        {reply.user_id.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {reply.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            {userId && (
              <div className="p-6 border-t dark:border-gray-700">
                <form onSubmit={handleCreateReply} className="space-y-3">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    required
                    rows={3}
                    placeholder="Write a reply..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !newReply.trim()}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingReply ? "Posting..." : "Post Reply"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
