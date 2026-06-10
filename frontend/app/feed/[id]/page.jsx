import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import ReplyComposer from "@/components/ReplyComposer";
import ReplyList from "@/components/ReplyList";

export default async function FeedDetailPage({ params }) {
  const { id } = params;
  let feedData = null;
  let error = null;

  try {
    feedData = await serverApi(`/feed/${id}`);
  } catch (err) {
    console.error("Failed to load post:", err.message);
    error = "Failed to load this post.";
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p>{error}</p>
          <Link
            href="/feed"
            className="text-blue-600 font-semibold mt-4 inline-block"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  if (!feedData) return null;

  const { post, replies } = feedData;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        <p className="text-sm text-gray-500 mt-4">
          {new Date(post.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </p>
      </div>

      <ReplyComposer postId={post.id} />

      <ReplyList postId={post.id} initialReplies={replies} />
    </div>
  );
}
