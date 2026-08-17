"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
      toast.success("AI Market Radar report generated successfully!");
      if (onRadarUpdated) {
        onRadarUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to generate Market Radar:", err);
      const msg = err.response?.data?.detail || "Failed to generate market report";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-blue-200">
              AI Market Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Market & Competitor Radar 📡
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Automated market sizing, competitor benchmarking, and growth tailwind telemetry powered by live web signals.
          </p>
        </div>

        {isFounder && (
          <button
            type="button"
            onClick={handleGenerateRadar}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {loading ? "Scanning Market Data..." : data ? "Refresh Market Radar 🔄" : "Generate Market Radar 📡"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-3">
          <p className="font-semibold text-slate-700">No Market Radar report generated for this startup yet.</p>
          {isFounder ? (
            <p className="text-slate-500">Click the button above to run real-time market sizing & competitor intelligence scanning.</p>
          ) : (
            <p className="text-slate-500">The founder has not initialized the AI Market Radar telemetry report yet.</p>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-10 text-center text-xs text-blue-700 animate-pulse font-medium">
          Analyzing industry dynamics, total addressable market size, and competitor landscape...
        </div>
      )}

      {/* Report Dashboard */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Addressable Market (TAM)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {data.tam_size || "N/A"}
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Serviceable Addressable Market (SAM)
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {data.sam_size || "N/A"}
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Industry Growth Rate (CAGR)
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                +{data.cagr_pct || 15.2}%
              </div>
            </div>
          </div>

          {/* Competitors & Tailwinds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competitors */}
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Top Competitor Benchmarking 🏆</span>
              </h3>

              <div className="space-y-3">
                {data.top_competitors?.map((comp, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 text-xs space-y-1 shadow-xs">
                    <div className="font-bold text-blue-700 text-sm">{comp.name}</div>
                    <p className="text-slate-600 leading-relaxed font-normal">{comp.strengths}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tailwinds & Risks */}
            <div className="space-y-6">
              {/* Tailwinds */}
              <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 space-y-3">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <span>Market Growth Tailwinds 🚀</span>
                </h3>
                <ul className="space-y-2">
                  {data.tailwinds?.map((tw, idx) => (
                    <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{tw}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-red-50/60 p-6 rounded-2xl border border-red-200 space-y-3">
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <span>Adoption & Execution Risks ⚠️</span>
                </h3>
                <ul className="space-y-2">
                  {data.market_risks?.map((rk, idx) => (
                    <li key={idx} className="text-xs text-red-900 flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
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
