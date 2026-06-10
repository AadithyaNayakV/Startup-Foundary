import { serverApi } from "@/lib/serverAPI";

export default async function AdminStatsPage() {
  let stats = null;
  let error = null;

  try {
    stats = await serverApi("/admin/stats");
  } catch (err) {
    console.error("Failed to load admin stats:", err.message);
    error = "Failed to load admin stats.";
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Admin Stats</h1>
        <p className="text-gray-500 mt-2">
          Overview of platform growth and pending approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Pending Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">
            {stats.pending_users}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Pending Startups</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">
            {stats.pending_startups}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Approved Startups</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">
            {stats.approved_startups}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">
            {stats.total_users}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Startups</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">
            {stats.total_startups}
          </p>
        </div>
      </div>
    </div>
  );
}
