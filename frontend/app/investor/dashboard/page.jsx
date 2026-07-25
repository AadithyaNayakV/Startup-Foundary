import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function InvestorDashboard() {
  let user = null;
  let approvedStartups = [];
  let savedStartups = [];
  let isPendingApproval = false;
  let error = null;

  try {
    user = await serverApi("/auth/me");
    if (user?.role === "investor" && !user?.is_approved) {
      isPendingApproval = true;
    }
  } catch (err) {
    console.error("Failed to load user profile:", err.message);
  }

  if (!isPendingApproval) {
    try {
      const [startupsData, savedData] = await Promise.all([
        serverApi("/startups"),
        serverApi("/startups/saved"),
      ]);
      approvedStartups = startupsData || [];
      savedStartups = savedData || [];
    } catch (err) {
      console.error("SSR Axios Error:", err.message);
      if (err.response?.status === 403) {
        isPendingApproval = true;
      } else {
        error = "Failed to load investor data.";
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(" ")[0] || "Investor"}
          </h1>
          <p className="text-gray-500 mt-1">
            Discover and contact vetted startups.
          </p>
        </div>
        {!isPendingApproval && (
          <Link
            href="/investor/startups/saved"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm"
          >
            Saved Startups ({savedStartups.length})
          </Link>
        )}
      </div>

      {isPendingApproval ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="text-4xl">⏳</div>
          <h2 className="text-2xl font-bold text-amber-900">
            Account Pending Approval
          </h2>
          <p className="text-amber-700 max-w-xl mx-auto text-sm leading-relaxed">
            Your investor account has been submitted and is currently being reviewed by our administration team. Once approved, you will get full access to startup profiles, pitch decks, and direct messaging with founders.
          </p>
          <div className="pt-2">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              Status: Pending Review
            </span>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
          )}

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            Recently Approved Startups
          </h2>

          {approvedStartups.length === 0 && !error ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                No startups available
              </h3>
              <p className="text-gray-500 mt-1">
                Check back later for newly approved startups.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedStartups.map((startup) => (
                <div
                  key={startup.id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {startup.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {startup.stage?.toUpperCase()} STAGE
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 flex-1">{startup.tagline}</p>

                  {startup.domains && startup.domains.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {startup.domains.map((domain, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/investor/startups/${startup.id}`}
                      className="w-full block text-center bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium text-sm border border-gray-200 px-4 py-2 rounded transition-colors"
                    >
                      View Full Profile & Pitch Deck
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
