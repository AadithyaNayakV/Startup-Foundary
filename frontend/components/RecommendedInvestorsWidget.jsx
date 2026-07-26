"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import UserProfileModal from "@/components/UserProfileModal";

export default function RecommendedInvestorsWidget({ startupId, domains = [] }) {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    if (!startupId) return;

    const fetchRecommendedInvestors = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/startups/${startupId}/recommended-investors`);
        setInvestors(data || []);
      } catch (err) {
        console.error("Failed to load recommended investors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedInvestors();
  }, [startupId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center text-xs text-gray-400">
        Finding recommended investors matching your domain...
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center text-xs text-gray-400">
        No investor domain matches recorded yet. Update startup sectors to trigger recommendations!
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-md border border-indigo-900 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Recommended Investors for Your Domain</span>
              <span className="text-sm bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-semibold">
                🎯 {investors.length} Match{investors.length > 1 ? "es" : ""}
              </span>
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Accredited investors actively financing startups in{" "}
              <span className="font-semibold text-emerald-400">
                {domains.length > 0 ? domains.join(", ") : "your sector"}
              </span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {investors.map((investor) => {
            const deals = investor.total_deals_count || 0;
            const topDomain = investor.top_focus_domain || investor.focus_domains?.[0] || "General Tech";

            return (
              <div
                key={investor.id}
                onClick={() => setSelectedUserId(investor.id)}
                className="p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer flex items-start justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition">
                    {(investor.name || investor.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-1">
                      <span>{investor.name || "Accredited Investor"}</span>
                      <span className="text-[10px] text-emerald-400">🔍</span>
                    </h3>
                    <p className="text-[11px] text-gray-300">{investor.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {deals} Deal{deals !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        Focus: {topDomain}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`mailto:${investor.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition shrink-0 shadow-xs"
                >
                  Connect ✉️
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}
