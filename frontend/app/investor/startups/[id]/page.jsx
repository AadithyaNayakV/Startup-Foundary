import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import SaveStartupButton from "@/components/SaveStartupButton";
import ContactFounderButton from "@/components/ContactFounderButton";

export default async function StartupDetail({ params }) {
  // Extract the ID from the URL (e.g., /startups/123-abc)
  const { id } = params;

  let startup = null;
  let error = null;

  try {
    // Fetch the specific startup using your SSR Axios utility
    startup = await serverApi(`/startups/${id}`);
  } catch (err) {
    console.error("Failed to load startup:", err.message);
    error = err.response?.data?.detail || "Could not load startup profile.";
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link
            href="/investor/dashboard"
            className="text-blue-600 font-medium mt-4 inline-block hover:underline"
          >
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!startup) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
        <Link
          href="/investor/explore"
          className="hover:text-blue-600 transition"
        >
          Explore
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-[200px]">
          {startup.name}
        </span>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-white rounded-full -translate-y-32 translate-x-32 opacity-50"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {startup.name}
            </h1>
            <p className="text-xl text-gray-600 mt-3 font-medium leading-relaxed">
              {startup.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <ContactFounderButton startupId={startup.id} />
            <SaveStartupButton
              startupId={startup.id}
              initialSaved={startup.is_saved}
              initialCount={startup.save_count || 0}
            />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              About the Startup
            </h2>
            <div className="prose text-gray-600 whitespace-pre-wrap leading-relaxed">
              {startup.description || "No detailed description provided yet."}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Stats) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Quick Facts
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Stage</p>
                <div className="inline-block px-3 py-1 bg-green-50 text-green-700 font-semibold text-sm rounded-lg border border-green-100">
                  {startup.stage.toUpperCase()}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Listed On</p>
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
        </div>
      </div>
    </div>
  );
}
