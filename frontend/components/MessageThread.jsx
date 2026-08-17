"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function MessageThread({
  conversationId,
  initialMessages = [],
  currentUserId,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      if (!conversationId) return;
      setIsRefreshing(true);
      try {
        const { data } = await api.get(
          `/conversations/${conversationId}/messages`,
        );
        if (isMounted && Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to refresh messages:", err);
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    const intervalId = setInterval(fetchMessages, 10000);
    fetchMessages();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [conversationId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!body.trim() || isSending) return;

    setIsSending(true);
    try {
      const { data } = await api.post(
        `/conversations/${conversationId}/messages`,
        { body },
      );
      setMessages((prev) => [...prev, data]);
      setBody("");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">No messages yet.</div>
        ) : (
          messages.map((msg) => {
            const isMine =
              Boolean(currentUserId) &&
              String(msg.sender_id) === String(currentUserId);
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={`mt-1 text-[11px] ${
                      isMine ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
      >
        <label className="block text-sm font-medium text-gray-600 mb-2">
          New message {isRefreshing ? "(syncing...)" : ""}
        </label>
        <textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your reply..."
          className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
        />
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-70"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
