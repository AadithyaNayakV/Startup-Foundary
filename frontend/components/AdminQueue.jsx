"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import UserProfileModal from "@/components/UserProfileModal";
import toast from "react-hot-toast";

export default function AdminQueue({
  initialUsers = [],
  initialStartups = [],
  initialRevisions = [],
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("startups"); // 'startups', 'revisions', 'users'
  const [pendingUsers, setPendingUsers] = useState(initialUsers);
  const [pendingStartups, setPendingStartups] = useState(initialStartups);
  const [pendingRevisions, setPendingRevisions] = useState(initialRevisions);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleUserDecision = async (userId, action) => {
    const reason = window.prompt(`Reason for ${action} (optional):`, "");
    if (reason === null) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/users/${userId}/${action}`, {
        reason: reason || null,
      });
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success(
        `User ${action === "approve" ? "approved" : "rejected"} successfully!`
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartupDecision = async (startupId, action) => {
    const reason = window.prompt(`Reason for ${action} (optional):`, "");
    if (reason === null) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/startups/${startupId}/${action}`, {
        reason: reason || null,
      });
      setPendingStartups((prev) =>
        prev.filter((startup) => startup.id !== startupId)
      );
      toast.success(
        `Startup ${
          action === "approve"
            ? "approved & dispatched for AI scoring!"
            : "rejected."
        }`
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to update startup:", err);
      toast.error(err.response?.data?.detail || "Failed to update startup.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionDecision = async (startupId, action) => {
    const reason = window.prompt(
      `Reason for ${action === "approve" ? "approving" : "rejecting"} revision (optional):`,
      ""
    );
    if (reason === null) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/startups/${startupId}/revisions/${action}`, {
        reason: reason || null,
      });
      setPendingRevisions((prev) =>
        prev.filter((startup) => startup.id !== startupId)
      );
      toast.success(
        `Startup revision ${
          action === "approve" ? "approved and merged live!" : "rejected."
        }`
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to process revision:", err);
      toast.error(err.response?.data?.detail || "Failed to process revision.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatValue = (field, val) => {
    if (val === null || val === undefined || val === "") {
      return <span className="text-gray-400 italic">None</span>;
    }
    if (field === "pitch_deck_url") {
      return (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline font-medium break-all flex items-center gap-1"
        >
          📄 View Pitch Deck
        </a>
      );
    }
    if (
      field === "ask_amount" ||
      field === "implied_valuation" ||
      field === "total_raised"
    ) {
      return (
        <span className="font-semibold text-gray-900">
          ${Number(val).toLocaleString()}
        </span>
      );
    }
    if (field === "equity_offered") {
      return (
        <span className="font-semibold text-gray-900">{Number(val)}%</span>
      );
    }
    if (field === "team_members" && Array.isArray(val)) {
      return (
        <ul className="list-disc list-inside space-y-1 text-xs">
          {val.map((m, i) => (
            <li key={i}>
              {m.role || "Member"} (User ID: {m.user_id})
            </li>
          ))}
        </ul>
      );
    }
    return String(val);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab("startups")}
            className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "startups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>🚀 New Applications</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                pendingStartups.length > 0
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {pendingStartups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("revisions")}
            className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "revisions"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>🛡️ Profile Revisions</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                pendingRevisions.length > 0
                  ? "bg-amber-100 text-amber-800 font-bold"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {pendingRevisions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>👥 Pending Users</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                pendingUsers.length > 0
                  ? "bg-indigo-100 text-indigo-700 font-bold"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {pendingUsers.length}
            </span>
          </button>
        </div>

        {/* Tab 1: New Startup Applications */}
        {activeTab === "startups" && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  New Startup Applications
                </h2>
                <p className="text-sm text-gray-500">
                  Review new company submissions before approving them to the
                  live network and running AI scoring.
                </p>
              </div>
            </div>

            {pendingStartups.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm">No new startup applications waiting for review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStartups.map((startup) => (
                  <div
                    key={startup.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition space-y-4 bg-gray-50/50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {startup.name}
                          </h3>
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide">
                            {startup.stage || "idea"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {startup.tagline}
                        </p>
                        {startup.description && (
                          <p className="text-xs text-gray-500 mt-2 max-w-2xl line-clamp-2">
                            {startup.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/founder/startups/${startup.id}`}
                          target="_blank"
                          className="px-3.5 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                        >
                          👁️ Full Profile
                        </Link>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleStartupDecision(startup.id, "approve")
                          }
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                        >
                          ✓ Approve Application
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleStartupDecision(startup.id, "reject")
                          }
                          className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-200/80 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400 block">Funding Ask:</span>
                        <span className="font-semibold text-gray-800">
                          {startup.ask_amount
                            ? `$${Number(startup.ask_amount).toLocaleString()}`
                            : startup.funding_needed || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Equity:</span>
                        <span className="font-semibold text-gray-800">
                          {startup.equity_offered
                            ? `${startup.equity_offered}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Domains:</span>
                        <span className="font-semibold text-gray-800">
                          {startup.domains?.join(", ") || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Pitch Deck:</span>
                        {startup.pitch_deck_url ? (
                          <a
                            href={startup.pitch_deck_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-medium underline truncate block"
                          >
                            View Deck 📄
                          </a>
                        ) : (
                          <span className="text-gray-400">Not Uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Profile Revisions (Before vs After Diff) */}
        {activeTab === "revisions" && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>🛡️ Sensitive Field Revisions</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-normal">
                    Re-verification Required
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Founders updated sensitive fields (Company Name, Pitch Deck, Deal Terms, Team). Non-sensitive changes were applied live automatically.
                </p>
              </div>
            </div>

            {pendingRevisions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-3xl mb-2">✨</p>
                <p className="text-sm">No pending revisions require admin verification.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRevisions.map((startup) => (
                  <div
                    key={startup.id}
                    className="border-2 border-amber-200 rounded-xl p-5 bg-amber-50/20 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {startup.name}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                            Live Profile Approved
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Startup ID: {startup.id} • Live Stage: {startup.stage}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/founder/startups/${startup.id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                        >
                          👁️ View Live
                        </Link>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleRevisionDecision(startup.id, "approve")
                          }
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                        >
                          ✓ Approve Revision
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleRevisionDecision(startup.id, "reject")
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                        >
                          ✕ Reject Revision
                        </button>
                      </div>
                    </div>

                    {/* Diff Table */}
                    <div className="overflow-hidden border border-amber-200 rounded-lg bg-white">
                      <div className="bg-amber-100/70 px-4 py-2 text-xs font-semibold text-amber-900 border-b border-amber-200">
                        Requested Changes (Before vs After Diff)
                      </div>
                      <div className="divide-y divide-gray-100">
                        {startup.pending_diff && startup.pending_diff.length > 0 ? (
                          startup.pending_diff.map((item, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 text-xs"
                            >
                              <div className="md:col-span-3 font-semibold text-gray-700 flex items-center">
                                <span>{item.label}</span>
                              </div>
                              <div className="md:col-span-4 bg-red-50/60 p-2 rounded border border-red-100">
                                <span className="text-[10px] font-bold text-red-500 uppercase block mb-0.5">
                                  Current Live Value
                                </span>
                                <div className="text-gray-600">
                                  {formatValue(item.field, item.old_value)}
                                </div>
                              </div>
                              <div className="md:col-span-1 flex items-center justify-center text-gray-400 font-bold">
                                →
                              </div>
                              <div className="md:col-span-4 bg-emerald-50/70 p-2 rounded border border-emerald-200">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-0.5">
                                  Proposed New Value
                                </span>
                                <div className="text-gray-900 font-medium">
                                  {formatValue(item.field, item.new_value)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-gray-500 italic">
                            No specific field diff available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Pending Users */}
        {activeTab === "users" && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pending Users</h2>
                <p className="text-sm text-gray-500">
                  Review and verify founder and investor accounts before granting platform access.
                </p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm">No users waiting for approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 rounded-xl p-4 bg-gray-50/40 hover:bg-white transition"
                  >
                    <div
                      onClick={() => setSelectedUserId(user.id)}
                      className="cursor-pointer group"
                    >
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                        <span>{user.name || "Unnamed"}</span>
                        <span className="text-xs text-blue-500 font-normal">
                          🔍 View Profile
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Role: <span className="font-medium text-gray-700 capitalize">{user.role}</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleUserDecision(user.id, "approve")}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleUserDecision(user.id, "reject")}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}
