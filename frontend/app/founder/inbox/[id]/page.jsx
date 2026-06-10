import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import MessageThread from "@/components/MessageThread";

export default async function FounderInboxDetailPage({ params }) {
  const { id } = params;
  let messages = [];
  let currentUser = null;
  let conversations = [];
  let error = null;

  try {
    const [userData, messageData, convoData] = await Promise.all([
      serverApi("/auth/me"),
      serverApi(`/conversations/${id}/messages`),
      serverApi("/conversations"),
    ]);
    currentUser = userData;
    messages = messageData;
    conversations = convoData;
  } catch (err) {
    console.error("Failed to load conversation:", err.message);
    error = "Failed to load this conversation.";
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p>{error}</p>
          <Link
            href="/founder/inbox"
            className="text-blue-600 font-semibold mt-4 inline-block"
          >
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  const convo = conversations.find((item) => item.id === id);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          {convo?.startup_name || "Investor Conversation"}
        </h1>
        <p className="text-gray-500 mt-1">Conversation ID: {id}</p>
      </div>

      <MessageThread
        conversationId={id}
        initialMessages={messages}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
