"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function SaveStartupButton({
  startupId,
  initialSaved,
  initialCount,
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveCount, setSaveCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSaved) {
        await api.delete(`/startups/${startupId}/save`);
        setIsSaved(false);
        setSaveCount((prev) => Math.max(0, prev - 1));
        toast.success("Startup removed from your saved list.");
      } else {
        await api.post(`/startups/${startupId}/save`);
        setIsSaved(true);
        setSaveCount((prev) => prev + 1);
        toast.success("Startup saved to your deal flow!");
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error(err.response?.data?.detail || "Failed to update save status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={isLoading}
      className={`w-full font-semibold py-3 px-6 rounded-xl transition shadow-sm border ${
        isSaved
          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
      aria-pressed={isSaved}
    >
      {isSaved ? `Saved (${saveCount})` : `Save Profile (${saveCount})`}
    </button>
  );
}
