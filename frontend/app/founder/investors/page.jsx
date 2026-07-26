"use client";

import { useState, useEffect } from "react";
import UserProfileModal from "@/components/UserProfileModal";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";

const DOMAIN_OPTIONS = [
  "All Domains",
  "AI / Machine Learning",
  "SaaS",
  "FinTech",
  "Healthcare",
  "E-commerce",
  "CleanTech",
  "EdTech",
  "Consumer",
  "B2B Marketplaces",
  "Hardware / IoT",
  "Cybersecurity",
  "Web3 / Crypto",
];

export default function FounderInvestorDirectoryPage() {
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [page, setPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState({
    items: [],
    page: 1,
    limit: 8,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      setLoading(true);
      try {
        const domainParam = selectedDomain !== "All Domains" ? selectedDomain : "";
        const { data } = await api.get(
          `/users/investors?domain=${encodeURIComponent(domainParam)}&page=${page}&limit=8`
        );
        setPaginatedData(data);
      } catch (err) {
        console.error("Failed to load investor directory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [selectedDomain, page]);

  const handleDomainChange = (newDomain) => {
    setSelectedDomain(newDomain);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Block */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-lg border border-indigo-900/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-extrabold uppercase border border-emerald-400/30">
              Verified Directory
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            Accredited Investor Directory 💼
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Explore active venture capital and angel investors. Filter by domain focus to discover capital partners matching your startup's sector.
          </p>
        </div>

        {/* Domain Dropdown Selector */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shrink-0">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
            Filter Sector Focus
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="bg-slate-900 text-white border border-gray-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-400 outline-none w-full md:w-56 cursor-pointer"
          >
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-sm text-gray-500 shadow-xs">
          Loading investor directory...
        </div>
      ) : paginatedData.items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-500 shadow-xs space-y-2">
          <p className="text-base font-semibold text-gray-800">
            No investors matched this domain filter.
          </p>
          <p className="text-xs text-gray-400">
            Try switching domain filters or view "All Domains".
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
            <span>
              Showing {paginatedData.items.length} of {paginatedData.total_count} Accredited Investor{paginatedData.total_count !== 1 ? "s" : ""}
            </span>
            {selectedDomain !== "All Domains" && (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Sector: {selectedDomain}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {paginatedData.items.map((investor) => {
              const deals = investor.total_deals_count || 0;
              const topDomain = investor.top_focus_domain || investor.focus_domains?.[0] || "General Tech";

              return (
                <div
                  key={investor.id}
                  className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-base shadow-xs">
                          {(investor.name || investor.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">
                            {investor.name || "Accredited Investor"}
                          </h3>
                          <p className="text-xs text-gray-500">{investor.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Investor
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Top Focus: {topDomain}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {deals} Portfolio Deal{deals !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {investor.bio && (
                      <p className="text-xs text-gray-600 mt-4 line-clamp-2 italic bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        "{investor.bio}"
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(investor.id)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition"
                    >
                      View Profile 🔍
                    </button>

                    <a
                      href={`mailto:${investor.email}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-xs"
                    >
                      Direct Email ✉️
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={paginatedData.page}
            totalPages={paginatedData.total_pages}
            onPageChange={(newPage) => setPage(newPage)}
            hasNext={paginatedData.has_next}
            hasPrev={paginatedData.has_prev}
          />
        </div>
      )}

      <UserProfileModal
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
