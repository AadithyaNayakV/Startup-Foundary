"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function FeedList({ initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        console.error("Failed to refresh feed:", err);
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
    <div className="space-y-4">
      <div className="text-xs text-gray-400 text-right">
        {isRefreshing ? "Refreshing feed..." : ""}
      </div>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>
              {new Date(post.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
            </span>
            <Link
              href={`/feed/${post.id}`}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Replies ({post.reply_count})
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
