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

  if (currentUser && currentUser.role === "admin") {
    return <Layout sidebar={<AdminSidebar />}>{children}</Layout>;
  }

  return <>{children}</>;
}
