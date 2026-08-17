"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function UserProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setError(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/users/${userId}/profile`);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError(err.response?.data?.detail || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const roleColors = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    investor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    founder: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const roleLabels = {
    admin: "System Admin",
    investor: "Accredited Investor",
    founder: "Startup Founder",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-gray-200 transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-gray-200 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-500 hover:text-gray-900 bg-gray-200/60 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading user profile...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-sm text-red-600">
              ⚠️ {error}
            </div>
          ) : profile ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-black flex items-center justify-center shadow-xs">
                {(profile.name || profile.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 truncate">
                    {profile.name || "Anonymous Member"}
                  </h2>
                  {profile.is_approved && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {profile.email}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      roleColors[profile.role] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {roleLabels[profile.role] || profile.role?.toUpperCase() || "Member"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Body */}
        {profile && !loading && !error && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
            {/* Bio / About */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                About & Bio
              </h3>
              {profile.bio ? (
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No bio articulated yet.
                </p>
              )}
            </div>

            {/* Direct Contact & Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Direct Email
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 transition bg-blue-50 px-3 py-2 rounded-xl border border-blue-200"
                >
                  ✉️ {profile.email}
                </a>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Social Network
                </span>
                {profile.linkedin_url ? (
                  <a
                    href={
                      profile.linkedin_url.startsWith("http")
                        ? profile.linkedin_url
                        : `https://${profile.linkedin_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#004182] px-3.5 py-2 rounded-xl transition shadow-xs"
                  >
                    LinkedIn Profile ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Not connected
                  </span>
                )}
              </div>
            </div>

            {/* Investor Specific Preferences */}
            {profile.role === "investor" && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Focus Domains
                  </span>
                  {profile.focus_domains && profile.focus_domains.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.focus_domains.map((dom, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No specific focus domains listed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Track Record & Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {profile.total_deals_count !== undefined && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Deals Tracked
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {profile.total_deals_count || 0} Deals
                  </span>
                </div>
              )}

              {profile.preferred_stage && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Preferred Stage
                  </span>
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                    {profile.preferred_stage.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
