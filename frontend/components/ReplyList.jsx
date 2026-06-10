"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ReplyList({ postId, initialReplies = [] }) {
  const [replies, setReplies] = useState(initialReplies);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReplies = async () => {
      if (!postId) return;
      setIsRefreshing(true);
      try {
        const { data } = await api.get(`/feed/${postId}`);
        if (isMounted && data?.replies) {
          setReplies(data.replies);
        }
      } catch (err) {
        console.error("Failed to refresh replies:", err);
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    const intervalId = setInterval(fetchReplies, 12000);
    fetchReplies();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [postId]);

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 text-right">
        {isRefreshing ? "Refreshing replies..." : ""}
      </div>
      {replies.length === 0 ? (
        <div className="text-gray-500 text-center">No replies yet.</div>
      ) : (
        replies.map((reply) => (
          <div
            key={reply.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
          >
            <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
            <p className="text-xs text-gray-400 mt-3">
              {new Date(reply.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
