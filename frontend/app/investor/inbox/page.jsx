import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";

export default async function InvestorInboxPage() {
  let conversations = [];
  let error = null;

  try {
    conversations = await serverApi("/conversations");
  } catch (err) {
    console.error("Failed to load conversations:", err.message);
    error = "Failed to load your inbox.";
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Investor Inbox</h1>
        <p className="text-gray-500 mt-1">
          Track your founder conversations and follow-ups.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
      )}

      {conversations.length === 0 && !error ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
          No conversations yet. Reach out to a founder to start one.
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((convo) => (
            <Link
              key={convo.id}
              href={`/investor/inbox/${convo.id}`}
              className="block bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-emerald-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {convo.startup_name || "Startup"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Conversation ID: {convo.id}
                  </p>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(convo.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {convo.unread && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                  New message
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
