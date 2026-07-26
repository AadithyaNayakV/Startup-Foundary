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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header with background gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            ✕
          </button>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-300">
              Loading user profile...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-sm text-red-300">
              ⚠️ {error}
            </div>
          ) : profile ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-400 text-white text-2xl font-black flex items-center justify-center shadow-lg border-2 border-white/20">
                {(profile.name || profile.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white truncate">
                    {profile.name || "Anonymous Member"}
                  </h2>
                  {profile.is_approved && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 truncate mt-0.5">
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
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Bio / About */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                About & Bio
              </h3>
              {profile.bio ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No bio articulated yet.
                </p>
              )}
            </div>

            {/* Direct Contact & Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Direct Email
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-2 rounded-xl border border-blue-100"
                >
                  ✉️ {profile.email}
                </a>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
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
                    LinkedIn Profile 🔗
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic">Not linked</span>
                )}
              </div>
            </div>

            {/* Domains & Preferences */}
            <div className="space-y-4">
              {profile.focus_domains && profile.focus_domains.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Focus Domains / Industry Sectors
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.focus_domains.map((domain, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.preferred_stage && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
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
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition shadow-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
