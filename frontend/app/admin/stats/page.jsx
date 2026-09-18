import { serverApi } from "@/lib/serverAPI";
import BackButton from "@/components/BackButton";
import { Users, Rocket, CheckCircle, Clock, ShieldAlert } from "lucide-react";

export default async function AdminStatsPage() {
  let stats = null;
  let error = null;

  try {
    stats = await serverApi("/admin/stats");
  } catch (err) {
    console.error("Failed to load admin stats:", err.message);
    error = "Failed to load admin platform stats.";
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
          {error}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Users",
      value: stats?.pending_users ?? 0,
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      description: "Users awaiting manual verification",
    },
    {
      title: "Pending Startups",
      value: stats?.pending_startups ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      description: "Submissions awaiting review & AI scoring",
    },
    {
      title: "Approved Startups",
      value: stats?.approved_startups ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      description: "Live verified companies on directory",
    },
    {
      title: "Total Registered Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      description: "Founders, Investors & Admins",
    },
    {
      title: "Total Startups Created",
      value: stats?.total_startups ?? 0,
      icon: Rocket,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      description: "All historical submissions",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-start">
        <BackButton href="/admin" label="Back to Approvals Queue" />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase mb-2">
          Platform Metrics
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          System Overview & Activity Stats
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Real-time metrics computed directly from database records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
