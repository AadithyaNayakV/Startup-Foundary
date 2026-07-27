"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function MarketRadarWidget({
  startupId,
  marketRadarData,
  isFounder = false,
  onRadarUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(marketRadarData || null);
  const [error, setError] = useState(null);

  const handleGenerateRadar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/startups/${startupId}/generate-market-radar`);
      setData(res.data.market_radar_data);
      if (onRadarUpdated) {
        onRadarUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to generate Market Radar:", err);
      setError(err.response?.data?.detail || "Failed to generate market report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-indigo-950/60 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-indigo-400/30">
              AI Market Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1.5 flex items-center gap-2">
            Market & Competitor Radar 📡
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Automated market sizing, competitor benchmarking, and growth tailwind telemetry powered by live web signals.
          </p>
        </div>

        {isFounder && (
          <button
            type="button"
            onClick={handleGenerateRadar}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 shrink-0"
          >
            {loading ? "Scanning Market Data..." : data ? "Refresh Market Radar 🔄" : "Generate Market Radar 📡"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 text-red-300 border border-red-800/50 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-xs text-gray-400 space-y-3">
          <p className="font-semibold text-gray-300">No Market Radar report generated for this startup yet.</p>
          {isFounder ? (
            <p className="text-gray-400">Click the button above to run real-time market sizing & competitor intelligence scanning.</p>
          ) : (
            <p className="text-gray-400">The founder has not initialized the AI Market Radar telemetry report yet.</p>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-xs text-indigo-300 animate-pulse">
          Analyzing industry dynamics, total addressable market size, and competitor landscape...
        </div>
      )}

      {/* Report Dashboard */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-950/60 p-5 rounded-2xl border border-indigo-800/40">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Total Addressable Market (TAM)
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {data.tam_size || "N/A"}
              </div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Serviceable Addressable Market (SAM)
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {data.sam_size || "N/A"}
              </div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Industry Growth Rate (CAGR)
              </span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                +{data.cagr_pct || 15.2}%
              </div>
            </div>
          </div>

          {/* Competitors & Tailwinds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competitors */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Top Competitor Benchmarking 🏆</span>
              </h3>

              <div className="space-y-3">
                {data.top_competitors?.map((comp, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-indigo-300 text-sm">{comp.name}</div>
                    <p className="text-gray-400 leading-relaxed">{comp.strengths}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tailwinds & Risks */}
            <div className="space-y-6">
              {/* Tailwinds */}
              <div className="bg-emerald-950/30 p-6 rounded-2xl border border-emerald-900/40 space-y-3">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span>Market Growth Tailwinds 🚀</span>
                </h3>
                <ul className="space-y-2">
                  {data.tailwinds?.map((tw, idx) => (
                    <li key={idx} className="text-xs text-emerald-100/90 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{tw}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/30 space-y-3">
                <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
                  <span>Adoption & Execution Risks ⚠️</span>
                </h3>
                <ul className="space-y-2">
                  {data.market_risks?.map((rk, idx) => (
                    <li key={idx} className="text-xs text-red-200/90 flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{rk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
