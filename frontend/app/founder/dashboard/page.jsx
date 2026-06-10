import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function FounderDashboard() {
  let startups = [];
  let user = null;
  let error = null;

  try {
    // Using YOUR Axios serverApi to fetch in parallel!
    const [userData, startupsData] = await Promise.all([
      serverApi("/auth/me"),
      serverApi("/startups/me"),
    ]);

    user = userData;
    startups = startupsData;
  } catch (err) {
    console.error("SSR Axios Error:", err.message);
    error = "Failed to load dashboard data.";
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(" ")[0] || "Founder"}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your startup profiles below.
          </p>
        </div>
        <Link
          href="/founder/startups/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Create Startup
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      )}

      {startups.length === 0 && !error ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            No startups found
          </h3>
          <p className="text-gray-500 mt-1">
            You haven't added any startups to the platform yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {startups.map((startup) => (
            <div
              key={startup.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {startup.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full 
                  ${
                    startup.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : startup.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {startup.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 mb-4 flex-1">{startup.tagline}</p>
              <div className="text-sm text-gray-500">
                <strong>Stage:</strong>{" "}
                <span className="capitalize">{startup.stage}</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Founder Completeness</span>
                  <span className="font-semibold text-gray-900">
                    {startup.completeness_score || 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${startup.completeness_score || 0}%` }}
                  />
                </div>
                {startup.missing?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Missing: {startup.missing.join(", ")}
                  </p>
                )}
              </div>
              <div className="mt-6 flex space-x-3">
                <Link
                  href={`/founder/startups/${startup.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1.5 rounded"
                >
                  View Details
                </Link>
                <Link
                  href={`/founder/startups/${startup.id}/edit`}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm border border-gray-200 px-3 py-1.5 rounded"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
