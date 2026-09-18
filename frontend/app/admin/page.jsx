import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import AdminQueue from "@/components/AdminQueue";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default async function AdminPage() {
  let queueData = { users: [], startups: [] };
  let currentUser = null;
  let error = null;

  try {
    const [userData, queue] = await Promise.all([
      serverApi("/auth/me"),
      serverApi("/admin/queue"),
    ]);
    currentUser = userData;
    queueData = queue;
  } catch (err) {
    console.error("Failed to load admin queue:", err.message);
    error = "Failed to load admin queue.";
  }

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-3xl text-center shadow-xs">
          <p className="font-bold text-lg mb-2">Admin Access Required</p>
          <p className="text-sm text-red-600 mb-4">Your current account does not have platform administrator credentials.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Platform Moderation & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Verification Queue
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review and approve pending startup registrations, founder updates, and investor accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/stats"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            View Stats
          </Link>
          <Link
            href="/admin/audit"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            Audit Log
          </Link>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      ) : (
        <AdminQueue
          initialUsers={queueData.users || []}
          initialStartups={queueData.startups || []}
          initialRevisions={queueData.revisions || []}
        />
      )}
    </div>
  );
}
