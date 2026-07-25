import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function FounderStartupDetail({ params }) {
  const { id } = params;
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

      {/* Team Members Section */}
      <div id="team" className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
        {!startup.team_members || startup.team_members.length === 0 ? (
          <p className="text-gray-500 text-sm">No team members listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startup.team_members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {(member.name || member.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {member.name || "Team Member"}
                  </p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {member.role}
                  </span>
                </div>
              </div>
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