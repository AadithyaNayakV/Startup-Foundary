"use client";

import { useState } from "react";
import UserProfileModal from "@/components/UserProfileModal";

export default function TeamMemberCard({ member, accentColor = "emerald" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userId = member.user_id || member.id;

  const bgGradient =
    accentColor === "blue"
      ? "from-blue-600 to-indigo-600"
      : "from-emerald-500 to-teal-600";

  const roleBadge =
    accentColor === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="p-5 border border-gray-100 rounded-2xl bg-white shadow-xs hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-tr ${bgGradient} text-white font-bold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition`}
            >
              {(member.name || member.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition flex items-center gap-1.5">
                <span>{member.name || "Team Member"}</span>
                <span className="text-[10px] text-blue-500 font-medium">🔍</span>
              </p>
              <p className="text-xs text-gray-500">{member.email}</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${roleBadge}`}
          >
            {member.role}
          </span>
        </div>

        {member.bio && (
          <p className="text-xs text-gray-600 mt-3 line-clamp-2 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            "{member.bio}"
          </p>
        )}

        {member.linkedin_url && (
          <div className="mt-3 text-right">
            <a
              href={
                member.linkedin_url.startsWith("http")
                  ? member.linkedin_url
                  : `https://${member.linkedin_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              LinkedIn Profile 🔗
            </a>
          </div>
        )}
      </div>

      <UserProfileModal
        userId={userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
