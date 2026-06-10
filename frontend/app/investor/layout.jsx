import Layout from "@/components/Layout";
import InvestorSidebar from "@/components/InvestorSidebar";

export default function DashboardLayout({ children }) {
  return <Layout sidebar={<InvestorSidebar />}>{children}</Layout>;
}
