import { serverApi } from "@/lib/serverAPI";
import Layout from "@/components/Layout";
import Sidebar from "@/components/Sidebar";
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

  const sidebar = <Sidebar role={user?.role} />;

  if (error) {
    return (
      <Layout sidebar={sidebar}>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center">
            <p className="font-semibold">{error}</p>
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-start">
          <BackButton href="/feed" label="Back to Community" />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 mb-3">
            <span className="font-bold text-slate-800">{post.author_name || "Community Member"}</span>
            {post.author_role && (
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {post.author_role}
              </span>
            )}
          </div>
          <p className="text-slate-800 whitespace-pre-wrap text-base sm:text-lg leading-relaxed">
            {post.content}
          </p>
          <p className="text-xs text-slate-400 mt-4">
            {new Date(post.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
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
