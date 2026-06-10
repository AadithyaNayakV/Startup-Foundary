"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function FeedComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/feed", { content });
      setContent("");
      router.refresh();
    } catch (err) {
      console.error("Failed to create post:", err);
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
        Share an update
      </label>
      <textarea
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Ask for advice, share what you are building, or describe what you are looking for."
        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-70"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
