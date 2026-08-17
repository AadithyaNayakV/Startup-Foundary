"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function FeedComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/feed", { content });
      setContent("");
      toast.success("Post shared with the community!");
      setSuccess("✓ Post shared with the community!");
      setTimeout(() => setSuccess(""), 3500);
      router.refresh();
    } catch (err) {
      console.error("Failed to create post:", err);
      toast.error(err.response?.data?.detail || "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium mb-3">
          {success}
        </div>
      )}
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Share an update
      </label>
      <textarea
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Ask for advice, share what you are building, or describe what you are looking for."
        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
