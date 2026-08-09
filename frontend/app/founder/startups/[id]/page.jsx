import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import TeamMemberCard from "@/components/TeamMemberCard";
import RecommendedInvestorsWidget from "@/components/RecommendedInvestorsWidget";
import MarketRadarWidget from "@/components/MarketRadarWidget";
import DataRoomSection from "@/components/DataRoomSection";

export default async function FounderStartupDetail({ params }) {
  const { id } = await params;
  let startup = null;
  let error = null;

  try {
    startup = await serverApi(`/startups/${id}`);
  } catch (err) {
    console.error("Failed to load startup:", err.message);
    error = err.response?.data?.detail || "Could not load your startup profile.";
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link
            href="/founder/dashboard"
            className="text-blue-600 font-medium mt-4 inline-block hover:underline"
          >
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!startup) return null;

  const statusColor =
    startup.status === "approved"
      ? "bg-green-100 text-green-800 border-green-200"
      : startup.status === "rejected"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
        <Link
          href="/founder/dashboard"
          className="hover:text-blue-600 transition"
        >
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-[200px]">
          {startup.name}
        </span>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-5 flex-1">
            {startup.logo_url && (
              <img
                src={startup.logo_url}
                alt={`${startup.name} logo`}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {startup.name}
                </h1>
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusColor}`}
                >
                  {startup.status}
                </span>
              </div>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                {startup.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
            <Link
              href={`/founder/startups/${startup.id}/edit`}
              className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm"
            >
              Edit Profile
            </Link>
            {startup.pitch_deck_url && (
              <a
                href={startup.pitch_deck_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition border border-gray-200"
              >
                View Pitch Deck 📄
              </a>
            )}
          </div>
        </div>
      </div>

      {/* AI Investment Intelligence Scorecard */}
      {startup.ai_score !== null && startup.ai_score !== undefined && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 rounded-2xl shadow-md relative overflow-hidden border border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-700/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🦈</span>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  AI Investment Intelligence Scorecard
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Automated evaluation engine analysis & deal terms audit
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-center">
                <span
                  className={`text-4xl font-black ${
                    startup.ai_score >= 75
                      ? "text-emerald-400"
                      : startup.ai_score >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {startup.ai_score}
                </span>
                <span className="text-xs text-slate-400 block font-semibold">
                  / 100 Score
                </span>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Verdict
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block mt-1 ${
                    startup.ai_score >= 75
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : startup.ai_score >= 50
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {startup.ai_verdict || "Evaluated"}
                </span>
              </div>
            </div>
          </div>

          {/* Weighted VC Rubric Sub-Scores Grid */}
          {startup.ai_score_breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-700/60 text-center">
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-semibold mb-1">Problem-Market Fit</p>
                <p className="text-lg font-bold text-emerald-400">
                  {startup.ai_score_breakdown.category_scores?.problem_market_fit ??
                   startup.ai_score_breakdown.problem_market_fit ??
                   startup.ai_score_breakdown.valuation_score ?? "--"}
                  <span className="text-xs text-slate-500 font-normal"> / {startup.ai_score_breakdown.category_scores ? "30" : "25"}</span>
                </p>
              </div>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-semibold mb-1">Competitive Moat</p>
                <p className="text-lg font-bold text-blue-400">
                  {startup.ai_score_breakdown.category_scores?.competitive_moat ??
                   startup.ai_score_breakdown.competitive_moat ??
                   startup.ai_score_breakdown.moat_score ?? "--"}
                  <span className="text-xs text-slate-500 font-normal"> / 25</span>
                </p>
              </div>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-semibold mb-1">Market Opportunity</p>
                <p className="text-lg font-bold text-indigo-400">
                  {startup.ai_score_breakdown.category_scores?.market_opportunity ??
                   startup.ai_score_breakdown.market_opportunity ??
                   startup.ai_score_breakdown.traction_score ?? "--"}
                  <span className="text-xs text-slate-500 font-normal"> / {startup.ai_score_breakdown.category_scores ? "20" : "25"}</span>
                </p>
              </div>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-semibold mb-1">Tech & Execution</p>
                <p className="text-lg font-bold text-amber-400">
                  {startup.ai_score_breakdown.category_scores?.execution_viability ??
                   startup.ai_score_breakdown.execution_viability ??
                   startup.ai_score_breakdown.margin_score ?? "--"}
                  <span className="text-xs text-slate-500 font-normal"> / 25</span>
                </p>
              </div>
            </div>
          )}

          {/* Detected Tech Stack & Competitors Found */}
          {startup.ai_score_breakdown && (startup.ai_score_breakdown.detected_tech_stack?.length > 0 || startup.ai_score_breakdown.competitors_found?.length > 0) && (
            <div className="py-4 border-b border-slate-700/60 space-y-3 text-xs">
              {startup.ai_score_breakdown.detected_tech_stack?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium">Detected Tech:</span>
                  {startup.ai_score_breakdown.detected_tech_stack.map((tech, idx) => (
                    <span key={idx} className="bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {startup.ai_score_breakdown.competitors_found?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium">Scraped Competitors:</span>
                  {startup.ai_score_breakdown.competitors_found.map((comp, idx) => (
                    <span key={idx} className="bg-slate-800/80 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 text-[11px]">
                      {comp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Strengths & Risk Factors */}
          {startup.ai_score_breakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
              <div>
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>✓</span> Key Strengths & Tailwinds
                </h4>
                <ul className="space-y-1.5 text-slate-200 text-xs">
                  {(startup.ai_score_breakdown.key_pros || startup.ai_score_breakdown.strengths || []).map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>⚠️</span> Risk Factors & Headwinds
                </h4>
                <ul className="space-y-1.5 text-slate-200 text-xs">
                  {(startup.ai_score_breakdown.key_cons || startup.ai_score_breakdown.red_flags || []).map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deal Terms & Financial Traction Card */}
      {(startup.ask_amount || startup.equity_offered || startup.mrr || startup.moat_description) && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> Deal Terms & Financial Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {startup.ask_amount && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <p className="text-xs text-gray-500 font-medium">Ask Amount</p>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">
                  ${startup.ask_amount.toLocaleString()}
                </p>
              </div>
            )}

            {startup.equity_offered && (
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="text-xs text-gray-500 font-medium">Equity Offered</p>
                <p className="text-xl font-extrabold text-blue-800 mt-1">
                  {startup.equity_offered}%
                </p>
              </div>
            )}

            {startup.implied_valuation && (
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <p className="text-xs text-gray-500 font-medium">Implied Valuation</p>
                <p className="text-xl font-extrabold text-indigo-800 mt-1">
                  ${startup.implied_valuation.toLocaleString()}
                </p>
              </div>
            )}

            {startup.mrr && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Monthly Revenue (MRR)</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ${startup.mrr.toLocaleString()}
                </p>
              </div>
            )}

            {startup.growth_rate_pct && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">MoM Growth Rate</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  +{startup.growth_rate_pct}%
                </p>
              </div>
            )}

            {startup.runway_months && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Runway</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {startup.runway_months} Months
                </p>
              </div>
            )}
          </div>

          {startup.use_of_funds && (
            <div className="mb-4 text-sm">
              <span className="font-semibold text-gray-700">Use of Funds: </span>
              <span className="text-gray-600">{startup.use_of_funds}</span>
            </div>
          )}

          {startup.moat_description && (
            <div className="text-sm border-t pt-4 border-gray-100">
              <span className="font-semibold text-gray-900 block mb-1">Competitive Defensibility & Moat:</span>
              <p className="text-gray-600 leading-relaxed">{startup.moat_description}</p>
            </div>
          )}
        </div>
      )}

      {/* Details Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Full Description
        </h2>
        <div className="prose text-gray-600 whitespace-pre-wrap leading-relaxed">
          {startup.description ||
            "You haven't provided a full description yet. Click Edit Profile to add one so investors know what you are building!"}
        </div>
      </div>

      {/* AI Market Radar Widget */}
      <MarketRadarWidget
        startupId={startup.id}
        marketRadarData={startup.market_radar_data}
        isFounder={true}
      />

      {/* Due Diligence Data Room */}
      <DataRoomSection startupId={startup.id} isFounder={true} />

      {/* Recommended Investors Widget */}
      <RecommendedInvestorsWidget startupId={startup.id} domains={startup.domains} />

      {/* Team Members Section */}
      <div id="team" className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
        {!startup.team_members || startup.team_members.length === 0 ? (
          <p className="text-gray-500 text-sm">No team members listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startup.team_members.map((member) => (
              <TeamMemberCard key={member.id || member.user_id} member={member} accentColor="blue" />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Current Stage</p>
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 font-semibold text-sm rounded-lg border border-gray-200">
            {startup.stage?.toUpperCase()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Created On</p>
          <p className="text-gray-900 font-medium">
            {new Date(startup.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}