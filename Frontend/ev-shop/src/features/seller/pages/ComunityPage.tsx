import React, { useState } from "react";
import {
  HeartIcon,
  ChatBubbleIcon,
} from "@/assets/icons/icons";
import type { AlertProps } from "@/types";

// --- Helper Icons (can be moved to icons.tsx) ---
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

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 100-2.186m0 2.186c-.18.324-.283.696-.283 1.093s.103.77.283 1.093m0-2.186l-9.566-5.314"
    />
  </svg>
);

// --- Mock Data ---
const mockPosts = [
  {
    id: 1,
    author: "Elena Rodriguez",
    avatar: "https://placehold.co/100x100/3498db/ffffff?text=ER",
    timestamp: "4 hours ago",
    content:
      "Just took my new Aura EV for a long drive up the coast. The range is even better than advertised! So quiet and smooth. #EVLife #AuraEV",
    image: "https://placehold.co/600x400/3498db/ffffff?text=Aura+EV+Trip",
    likes: 128,
    comments: 16,
  },
  {
    id: 2,
    author: "Ben Carter",
    avatar: "https://placehold.co/100x100/2ecc71/ffffff?text=BC",
    timestamp: "1 day ago",
    content:
      "Has anyone tried the new software update for the Pulse XR? Wondering if it improves the infotainment response time. Let me know your thoughts!",
    likes: 42,
    comments: 29,
  },
];

export const CommunityPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [newPostContent, setNewPostContent] = useState("");

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    // Add new post to the top of the list
    alert("Post submitted!");
    setNewPostContent("");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">Community Forum</h1>

      {/* Create Post Section */}
      <div className="bg-white p-4 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          className="w-full p-3 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          rows={3}
          placeholder="What's on your mind, Kasun?"
        ></textarea>
        <div className="flex justify-between items-center mt-3">
          <button className="p-2 text-gray-500 hover:text-blue-600 rounded-full dark:text-gray-400 dark:hover:text-blue-400">
            <PhotographIcon className="h-6 w-6" />
          </button>
          <button
            onClick={handlePost}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Post
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
          >
            {/* Post Header */}
            <div className="flex items-center gap-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold dark:text-white">{post.author}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.timestamp}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <p className="my-4 text-gray-700 dark:text-gray-300">
              {post.content}
            </p>
            {post.image && (
              <img
                src={post.image}
                alt="Post content"
                className="mt-4 rounded-lg w-full object-cover"
              />
            )}

            {/* Post Stats */}
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-4 pt-2 border-t dark:border-gray-700">
              <span>{post.likes} Likes</span>
              <span>{post.comments} Comments</span>
            </div>

            {/* Post Actions */}
            <div className="flex justify-around mt-2 pt-2 border-t dark:border-gray-700">
              <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 font-medium p-2 rounded-lg w-full justify-center transition-colors dark:text-gray-400 dark:hover:text-red-400">
                <HeartIcon className="h-5 w-5" /> Like
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 font-medium p-2 rounded-lg w-full justify-center transition-colors dark:text-gray-400 dark:hover:text-blue-400">
                <ChatBubbleIcon className="h-5 w-5" /> Comment
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 font-medium p-2 rounded-lg w-full justify-center transition-colors dark:text-gray-400 dark:hover:text-green-400">
                <ShareIcon className="h-5 w-5" /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;