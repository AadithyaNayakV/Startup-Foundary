import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function FounderStartupDetail({ params }) {
  const { id } = params;
  let startup = null;
  let error = null;

  try {
    // Fetch your specific startup using the ID in the URL
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
          <Link href="/founder/dashboard" className="text-blue-600 font-medium mt-4 inline-block hover:underline">
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!startup) return null;

  // Determine status color
  const statusColor = 
    startup.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
    startup.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
    'bg-yellow-100 text-yellow-800 border-yellow-200';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
        <Link href="/founder/dashboard" className="hover:text-blue-600 transition">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{startup.name}</span>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{startup.name}</h1>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusColor}`}>
                {startup.status}
              </span>
            </div>
            <p className="text-xl text-gray-600 font-medium leading-relaxed">
              {startup.tagline}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[200px]">
            <Link 
              href={`/founder/startups/${startup.id}/edit`}
              className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Full Description</h2>
        <div className="prose text-gray-600 whitespace-pre-wrap leading-relaxed">
          {startup.description || "You haven't provided a full description yet. Click Edit Profile to add one so investors know what you are building!"}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Current Stage</p>
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 font-semibold text-sm rounded-lg border border-gray-200">
            {startup.stage.toUpperCase()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Created On</p>
          <p className="text-gray-900 font-medium">
            {new Date(startup.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </p>
        </div>
      </div>
    </div>
  );
}