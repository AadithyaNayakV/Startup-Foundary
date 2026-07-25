import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import SaveStartupButton from "@/components/SaveStartupButton";
import ContactFounderButton from "@/components/ContactFounderButton";

export default async function StartupDetail({ params }) {
  const { id } = params;

  let startup = null;
  let error = null;

  try {
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-white rounded-full -translate-y-32 translate-x-32 opacity-50"></div>

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
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {startup.name}
              </h1>
              <p className="text-xl text-gray-600 mt-2 font-medium leading-relaxed">
                {startup.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
            <ContactFounderButton startupId={startup.id} />
            <SaveStartupButton
              startupId={startup.id}
              initialSaved={startup.is_saved}
              initialCount={startup.save_count || 0}
            />
            {startup.pitch_deck_url && (
              <a
                href={startup.pitch_deck_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold py-3 px-6 rounded-xl transition border border-emerald-200 shadow-sm"
              >
                View Pitch Deck 📄
              </a>
            )}
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

          {/* Team Members Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team</h2>
            {!startup.team_members || startup.team_members.length === 0 ? (
              <p className="text-gray-500 text-sm">No team members listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.team_members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {member.name || "Team Member"}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  {startup.stage?.toUpperCase()}
                </div>
              </div>

              {startup.funding_needed && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Funding Target</p>
                  <p className="text-gray-900 font-medium">
                    {startup.funding_needed}
                  </p>
                </div>
              )}

              {startup.website_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Website</p>
                  <a
                    href={startup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium text-sm truncate block"
                  >
                    {startup.website_url}
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Listed On</p>
                <p className="text-gray-900 font-medium text-sm">
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
