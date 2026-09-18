import { serverApi } from "@/lib/serverAPI";
import Layout from "@/components/Layout";
import Sidebar from "@/components/Sidebar";
import FeedComposer from "@/components/FeedComposer";
import FeedList from "@/components/FeedList";

export default async function FeedPage() {
  let posts = [];
  let user = null;
  let error = null;

  try {
    const [postsData, userData] = await Promise.all([
      serverApi("/feed"),
      serverApi("/auth/me").catch(() => null),
    ]);
    posts = postsData || [];
    user = userData;
  } catch (err) {
    console.error("Failed to load feed:", err.message);
    error = "Failed to load community posts.";
  }

  return (
    <Layout sidebar={<Sidebar role={user?.role} />}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase mb-2">
            Community Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Founder & Investor Discussions
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Ask for feedback, share fundraising milestones, and connect with peers and investors across the platform.
          </p>
        </div>

        <FeedComposer />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-semibold">
            {error}
          </div>
        )}

        {!error && <FeedList initialPosts={posts} />}
      </div>
    </Layout>
  );
}
