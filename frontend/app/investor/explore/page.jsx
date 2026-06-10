import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import SaveStartupButton from "@/components/SaveStartupButton";

export default async function ExploreStartups() {
  let approvedStartups = [];
  let currentUser = null;
  let error = null;

  try {
    // Strictly fetches startups where status == 'approved' from your DB
    const [startupsData, userData] = await Promise.all([
      serverApi("/startups/trending"),
      serverApi("/auth/me"),
    ]);
    approvedStartups = startupsData;
    currentUser = userData;
  } catch (err) {
    console.error("SSR Axios Error:", err.message);
    error = "Failed to load startup directory.";
  }

  const getMatchLabel = (startup) => {
    const focusDomains = currentUser?.focus_domains || [];
    const preferredStage = currentUser?.preferred_stage || "";
    let score = 0;

    if (focusDomains.length > 0 && Array.isArray(startup.domains)) {
      const overlap = startup.domains.some((domain) =>
        focusDomains.includes(domain),
      );
      if (overlap) score += 2;
    }

    if (preferredStage && startup.stage === preferredStage) {
      score += 1;
    }

    if (score >= 3) return { label: "Match: High", tone: "emerald" };
    if (score === 2) return { label: "Match: Medium", tone: "amber" };
    if (score === 1) return { label: "Match: Low", tone: "slate" };
    return { label: "Match: New", tone: "gray" };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Explore Startups</h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Discover the most promising startups vetted by our team. Filter by
          industry, stage, or funding requirements.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md font-medium text-center">
          {error}
        </div>
      )}

      {approvedStartups.length === 0 && !error ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900">
            No startups available right now
          </h3>
          <p className="text-gray-500 mt-2">
            Founders are still submitting their profiles. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedStartups.map((startup) => (
            <div
              key={startup.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200 flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 truncate pr-4">
                    {startup.name}
                  </h3>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full bg-green-50 text-green-700 border border-green-200">
                      {startup.stage.toUpperCase()}
                    </span>
                    {currentUser?.role === "investor" && (
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border ${
                          getMatchLabel(startup).tone === "emerald"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : getMatchLabel(startup).tone === "amber"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : getMatchLabel(startup).tone === "slate"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {getMatchLabel(startup).label}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                  {startup.tagline}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50">
                  <Link
                    href={`/investor/startups/${startup.id}`}
                    className="w-full flex justify-center items-center bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium text-sm border border-gray-200 px-4 py-2.5 rounded-lg transition-colors"
                  >
                    View Full Profile
                  </Link>
                  <div className="mt-3">
                    <SaveStartupButton
                      startupId={startup.id}
                      initialSaved={startup.is_saved}
                      initialCount={startup.save_count || 0}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
