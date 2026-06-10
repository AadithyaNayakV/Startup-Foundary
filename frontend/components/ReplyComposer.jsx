"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ReplyComposer({ postId }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/feed/${postId}/reply`, { content });
      setContent("");
      router.refresh();
    } catch (err) {
      console.error("Failed to reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Add a reply
      </label>
      <textarea
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share your thoughts..."
        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Reply"}
        </button>
      </div>
    </form>
  );
}
