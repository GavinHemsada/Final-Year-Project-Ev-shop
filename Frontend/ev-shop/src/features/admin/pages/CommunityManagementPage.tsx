import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import { TrashIcon } from "@/assets/icons/icons";
import type { AlertProps } from "@/types";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

export const CommunityManagementPage: React.FC<{
  setAlert: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["adminCommunityPosts", searchTerm],
    queryFn: () => adminService.getAllCommunityPosts({ search: searchTerm }),
  });

  const posts = postsData?.posts || []; // Adjust based on actual API response structure

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

  const replies = repliesData?.replies || [];

  // Delete Reply Mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => adminService.deletePostReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPostReplies", selectedPostId] });
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
    title: post.title,
    author: post.user_id?.name || "Unknown",
    replies: post.reply_count || 0,
    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "N/A"
  }));

  if (postsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
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
        <div className={`lg:col-span-${selectedPostId ? "2" : "3"} transition-all duration-300`}>
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
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedPostId === post._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                        onClick={() => setSelectedPostId(post._id === selectedPostId ? null : post._id)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {post.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {post.user_id?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {post.reply_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to delete this post?")) {
                                deletePostMutation.mutate(post._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Post"
                          >
                            <TrashIcon className="h-5 w-5" />
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

        {/* Replies Panel (conditionally rendered) */}
        {selectedPostId && (
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:border dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Replies</h3>
              <button 
                onClick={() => setSelectedPostId(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {repliesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader size={30} color="#4f46e5" />
                </div>
              ) : replies.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No replies yet.</p>
              ) : (
                replies.map((reply: any) => (
                  <div key={reply._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                         {reply.user_id?.name || "Unknown"}
                       </span>
                       <button
                         onClick={() => {
                           if (window.confirm("Delete this reply?")) {
                             deleteReplyMutation.mutate(reply._id);
                           }
                         }}
                         className="text-red-500 hover:text-red-700"
                         title="Delete Reply"
                       >
                         <TrashIcon className="h-4 w-4" />
                       </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                      {reply.content}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(reply.createdAt).toLocaleDateString()}
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
