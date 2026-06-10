import Link from "next/link";
import Layout from "@/components/Layout";
import AdminSidebar from "@/components/AdminSidebar";
import { serverApi } from "@/lib/serverAPI";

export default async function AdminLayout({ children }) {
  let currentUser = null;

  try {
    currentUser = await serverApi("/auth/me");
  } catch {
    currentUser = null;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p>Admin access required.</p>
          <Link
            href="/"
            className="text-blue-600 font-semibold mt-4 inline-block"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <Layout sidebar={<AdminSidebar />}>{children}</Layout>;
}
