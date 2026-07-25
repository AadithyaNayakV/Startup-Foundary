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
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {reply.author_name || "Community Member"}
                </span>
                {reply.author_role && (
                  <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {reply.author_role}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(reply.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
