"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import UserProfileModal from "@/components/UserProfileModal";

export default function FeedList({ initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      setIsRefreshing(true);
      try {
        const { data } = await api.get("/feed");
        if (isMounted && Array.isArray(data)) {
          setPosts(data);
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error("Failed to refresh feed:", err);
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    const intervalId = setInterval(fetchPosts, 12000);
    fetchPosts();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (posts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
        No posts yet. Be the first to start a conversation.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-xs text-gray-400 text-right">
          {isRefreshing ? "Refreshing feed..." : ""}
        </div>
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserId(post.author_id)}
                  className="font-semibold text-gray-900 text-sm hover:text-blue-600 hover:underline transition flex items-center gap-1 text-left"
                >
                  <span>{post.author_name || "Anonymous Member"}</span>
                  <span className="text-[10px] text-blue-500">🔍</span>
                </button>
                {post.author_role && (
                  <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {post.author_role}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

            <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-50 text-sm">
              <Link
                href={`/feed/${post.id}`}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1"
              >
                Replies ({post.reply_count || 0}) &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}
