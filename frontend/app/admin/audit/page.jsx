import { serverApi } from "@/lib/serverAPI";

export default async function AdminAuditPage() {
  let actions = [];
  let error = null;

  try {
    actions = await serverApi("/admin/audit");
  } catch (err) {
    console.error("Failed to load audit log:", err.message);
    error = "Failed to load audit log.";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Admin Audit Log</h1>
        <p className="text-gray-500 mt-2">
          Track approvals and rejections across the platform.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {actions.length === 0 && !error ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
          No admin actions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {action.admin_email || "Admin"} - {action.action}{" "}
                    {action.target_type}
                  </p>
                  <p className="text-sm text-gray-400">
                    Target ID: {action.target_id}
                  </p>
                  {action.reason && (
                    <p className="text-sm text-gray-600 mt-2">
                      Reason: {action.reason}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(action.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
