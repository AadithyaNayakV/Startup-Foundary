"use client";

import FounderSidebar from "./FounderSidebar";
import InvestorSidebar from "./InvestorSidebar";
import AdminSidebar from "./AdminSidebar";

export default function Sidebar({ role = "founder", isMobile = false, onNavigate }) {
  if (role === "admin") {
    return <AdminSidebar isMobile={isMobile} onNavigate={onNavigate} />;
  }
  if (role === "investor") {
    return <InvestorSidebar isMobile={isMobile} onNavigate={onNavigate} />;
  }
  return <FounderSidebar isMobile={isMobile} onNavigate={onNavigate} />;
}