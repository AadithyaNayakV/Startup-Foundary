import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function InvestorStartupsIndex() {
  let approvedStartups = [];
  let error = null;

  try {
    approvedStartups = await serverApi("/startups");
  } catch (err) {
    console.error("SSR Axios Error:", err.message);
    error = "Failed to load startups.";
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Startup Directory</h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Browse vetted startups and request introductions when you find a fit.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/investor/startups/saved"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Saved Startups
          </Link>
          <Link
            href="/investor/explore"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Explore
          </Link>
        </div>
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
            Check back soon for new approvals.
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
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {startup.stage.toUpperCase()}
                  </span>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
