import Link from "next/link";
import { serverApi } from "@/lib/serverAPI";
import Layout from "@/components/Layout";
import FounderSidebar from "@/components/FounderSidebar";
import InvestorSidebar from "@/components/InvestorSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import ReplyComposer from "@/components/ReplyComposer";
import ReplyList from "@/components/ReplyList";
import BackButton from "@/components/BackButton";

export default async function FeedDetailPage({ params }) {
  const { id } = await params;
  let feedData = null;
  let user = null;
  let error = null;

  try {
    const [data, userData] = await Promise.all([
      serverApi(`/feed/${id}`),
      serverApi("/auth/me").catch(() => null),
    ]);
    feedData = data;
    user = userData;
  } catch (err) {
    console.error("Failed to load post:", err.message);
    error = "Failed to load this post.";
  }

  const sidebar =
    user?.role === "admin" ? (
      <AdminSidebar />
    ) : user?.role === "investor" ? (
      <InvestorSidebar />
    ) : (
      <FounderSidebar />
    );

  if (error) {
    return (
      <Layout sidebar={sidebar}>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
            <p>{error}</p>
            <BackButton href="/feed" label="Back to Community" className="mt-4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!feedData) return null;

  const { post, replies } = feedData;

  return (
    <Layout sidebar={sidebar}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <BackButton href="/feed" label="Back to Community" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
            <span>{post.author_name || "Community Member"}</span>
            {post.author_role && (
              <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {post.author_role}
              </span>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          <p className="text-sm text-gray-400 mt-4">
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
    </Layout>
  );
}
