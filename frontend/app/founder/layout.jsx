import Layout from "@/components/Layout";
import FounderSidebar from "@/components/FounderSidebar";

export default function DashboardLayout({ children }) {
  return <Layout sidebar={<FounderSidebar />}>{children}</Layout>;
}
