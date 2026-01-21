import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps, ConfirmAlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const CommunityManagementPage: React.FC<{
  setAlert: (alert: AlertProps | null) => void;
  setConfirmAlert: (alert: ConfirmAlertProps | null) => void;
}> = ({ setAlert, setConfirmAlert }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<any | null>(null);
  const queryClient = useQueryClient();

  // Fetch all posts (without pagination to get all posts)
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["adminCommunityPosts", searchTerm],
    queryFn: async () => {
      // Fetch all posts without pagination limit
      const response = await adminService.getAllCommunityPosts({
        search: searchTerm,
      });
      return response;
    },
  });

  // Handle different response structures
  // Backend returns { posts: [...], total: number } via handleResult which unwraps it
  const posts = Array.isArray(postsData)
    ? postsData
    : postsData?.posts && Array.isArray(postsData.posts)
    ? postsData.posts
    : postsData?.data?.posts && Array.isArray(postsData.data.posts)
    ? postsData.data.posts
    : postsData?.data && Array.isArray(postsData.data)
    ? postsData.data
    : [];

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => adminService.deleteCommunityPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunityPosts"] });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Post deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete post",
      });
    },
  });

  // Fetch replies for selected post (if any)
  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: ["adminPostReplies", selectedPostId],
    queryFn: () => adminService.getPostReplies(selectedPostId!),
    enabled: !!selectedPostId,
  });

  // Handle different response structures for replies
  const replies = Array.isArray(repliesData)
    ? repliesData
    : repliesData?.replies && Array.isArray(repliesData.replies)
    ? repliesData.replies
    : repliesData?.data?.replies && Array.isArray(repliesData.data.replies)
    ? repliesData.data.replies
    : repliesData?.data && Array.isArray(repliesData.data)
    ? repliesData.data
    : [];

  // Delete Reply Mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => adminService.deletePostReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminPostReplies", selectedPostId],
      });
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Reply deleted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
        type: "error",
        message: error.response?.data?.error || "Failed to delete reply",
      });
    },
  });

  const reportData = posts.map((post: any) => ({
    title: post.title || "N/A",
    author:
      post.user_id?.name ||
      post.seller_id?.business_name ||
      post.financial_id?.name ||
      "Unknown",
    replies: post.reply_count || 0,
    date: post.createdAt
      ? new Date(post.createdAt).toLocaleDateString()
      : "N/A",
  }));

  if (postsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold dark:text-white">
          Community Management
        </h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <ReportGeneratorButton
            data={reportData}
            columns={[
              { header: "Title", dataKey: "title" },
              { header: "Author", dataKey: "author" },
              { header: "Replies", dataKey: "replies" },
              { header: "Date", dataKey: "date" },
            ]}
            title="Community Posts Report"
            filename="community_posts_report"
          />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1 sm:flex-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div
          className={
            selectedPostId
              ? "lg:col-span-2 transition-all duration-300"
              : "lg:col-span-3 transition-all duration-300"
          }
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Title / Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Replies
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {posts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No posts found
                      </td>
                    </tr>
                  ) : (
                    posts.map((post: any) => (
                      <tr
                        key={post._id}
                        className={`hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedPostId === post._id
                            ? "bg-blue-200 text-white dark:bg-blue-600 dark:text-white"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedPostId(
                            post._id === selectedPostId ? null : post._id
                          )
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {post.content}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPost(post);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-1"
                          >
                            View Full Post
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {post.user_id?.name ||
                            post.seller_id?.business_name ||
                            post.financial_id?.name ||
                            "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {post.reply_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAlert({
                                title: "Delete Post",
                                message: "Are you sure you want to delete this community post? All replies will also be removed.",
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                onConfirmAction: () => deletePostMutation.mutate(post._id),
                              });
                            }}
                            disabled={deletePostMutation.isPending}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Post"
                          >
                            {deletePostMutation.isPending ? (
                              <Loader size={8} color="#dc2626" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Full Post View Modal */}
        {viewingPost && (
          <div className="fixed inset-0 bg-white-200/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold dark:text-white">
                  {viewingPost.title}
                </h3>
                <button
                  onClick={() => setViewingPost(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  By:{" "}
                  {viewingPost.user_id?.name ||
                    viewingPost.seller_id?.business_name ||
                    viewingPost.financial_id?.name ||
                    "Unknown"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Date:{" "}
                  {viewingPost.createdAt
                    ? new Date(viewingPost.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {viewingPost.content}
                </p>
              </div>
              <div className="mt-4 flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Views: {viewingPost.views || 0}</span>
                <span>•</span>
                <span>Replies: {viewingPost.reply_count || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Replies Panel (conditionally rendered) */}
        {selectedPostId && (
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Replies
              </h3>
              <button
                onClick={() => setSelectedPostId(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {repliesLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <PageLoader />
                </div>
              ) : replies.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No replies yet.
                </p>
              ) : (
                replies.map((reply: any) => (
                  <div
                    key={reply._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {reply.user_id?.name ||
                          reply.seller_id?.business_name ||
                          reply.financial_id?.name ||
                          "Unknown"}
                      </span>
                      <button
                        onClick={() => {
                          setConfirmAlert({
                            title: "Delete Reply",
                            message: "Are you sure you want to delete this reply?",
                            confirmText: "Delete",
                            cancelText: "Cancel",
                            onConfirmAction: () => deleteReplyMutation.mutate(reply._id),
                          });
                        }}
                        disabled={deleteReplyMutation.isPending}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Reply"
                      >
                        {deleteReplyMutation.isPending ? (
                          <Loader size={6} color="#dc2626" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                      {reply.content || "No content"}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      {reply.createdAt
                        ? new Date(reply.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
