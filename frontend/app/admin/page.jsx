import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import AdminQueue from "@/components/AdminQueue";

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
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p>Admin access required.</p>
          <Link
            href="/"
            className="text-blue-600 font-semibold mt-4 inline-block"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Control Panel
        </h1>
        <p className="text-gray-500 mt-2">
          Approve or reject new users and startups to protect the ecosystem.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
      ) : (
        <AdminQueue
          initialUsers={queueData.users || []}
          initialStartups={queueData.startups || []}
        />
      )}
    </div>
  );
}
