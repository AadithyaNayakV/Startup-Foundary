"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AdminQueue({
  initialUsers = [],
  initialStartups = [],
}) {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState(initialUsers);
  const [pendingStartups, setPendingStartups] = useState(initialStartups);

  const handleUserDecision = async (userId, action) => {
    const reason = window.prompt("Reason (optional):", "");
    try {
      await api.post(`/admin/users/${userId}/${action}`, {
        reason: reason || null,
      });
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      router.refresh();
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleStartupDecision = async (startupId, action) => {
    const reason = window.prompt("Reason (optional):", "");
    try {
      await api.post(`/admin/startups/${startupId}/${action}`, {
        reason: reason || null,
      });
      setPendingStartups((prev) =>
        prev.filter((startup) => startup.id !== startupId),
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to update startup:", err);
    }
  };

  return (
    <div className="space-y-10">
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Pending Users</h2>
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">No users waiting.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Role: {user.role}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleUserDecision(user.id, "approve")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUserDecision(user.id, "reject")}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Pending Startups
        </h2>
        {pendingStartups.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">No startups waiting.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingStartups.map((startup) => (
              <div
                key={startup.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{startup.name}</p>
                  <p className="text-sm text-gray-500">{startup.tagline}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Stage: {startup.stage}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartupDecision(startup.id, "approve")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartupDecision(startup.id, "reject")}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
