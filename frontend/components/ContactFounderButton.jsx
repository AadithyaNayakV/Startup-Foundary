"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ContactFounderButton({ startupId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleContact = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data } = await api.post("/conversations", {
        startup_id: startupId,
      });

      if (data?.id) {
        router.push(`/investor/inbox/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleContact}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm disabled:opacity-70"
    >
      {isLoading ? "Opening..." : "Contact Founder"}
    </button>
  );
}
