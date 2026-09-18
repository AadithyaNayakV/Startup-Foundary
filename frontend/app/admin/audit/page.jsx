import { serverApi } from "@/lib/serverAPI";
import BackButton from "@/components/BackButton";
import { History, ShieldCheck, UserCheck, XCircle, CheckCircle2 } from "lucide-react";

export default async function AdminAuditPage() {
  let actions = [];
  let error = null;

  try {
    actions = await serverApi("/admin/audit");
  } catch (err) {
    console.error("Failed to load audit log:", err.message);
    error = "Failed to load audit logs.";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-start">
        <BackButton href="/admin" label="Back to Approvals Queue" />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase mb-2">
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span>Audit Trail</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          System Decision Log
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Historical record of all administrator approval and rejection actions.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      )}

      {actions.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No audit actions recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const isApproved = action.action?.toLowerCase().includes("approve");
            return (
              <div
                key={action.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>{action.action}</span>
                      </span>

                      <span className="text-xs font-semibold text-slate-500 capitalize">
                        {action.target_type}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-800">
                      Target ID: <span className="font-mono text-xs font-normal text-slate-600">{action.target_id}</span>
                    </div>

                    {action.reason && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Reason: </span>
                        {action.reason}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right space-y-0.5">
                    <div className="text-xs font-bold text-slate-700">
                      {action.admin_email || "System Admin"}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(action.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
