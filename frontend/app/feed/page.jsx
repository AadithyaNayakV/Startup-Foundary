import { serverApi } from "@/lib/serverAPI";
import Layout from "@/components/Layout";
import FounderSidebar from "@/components/FounderSidebar";
import InvestorSidebar from "@/components/InvestorSidebar";
import AdminSidebar from "@/components/AdminSidebar";
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

  const sidebar =
    user?.role === "admin" ? (
      <AdminSidebar />
    ) : user?.role === "investor" ? (
      <InvestorSidebar />
    ) : (
      <FounderSidebar />
    );

  return (
    <Layout sidebar={sidebar}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
          <p className="text-gray-500 mt-2">
            Ask for advice, share your goals, and connect with the entire
            community.
          </p>
        </div>

        <FeedComposer />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {!error && <FeedList initialPosts={posts} />}
      </div>
    </Layout>
  );
}
