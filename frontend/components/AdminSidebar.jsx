"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  ListOrdered,
  BarChart3,
  History,
  MessagesSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function AdminSidebar({ isMobile = false, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [stats, setStats] = useState({
    pending_users: 0,
    pending_startups: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        if (isMounted) {
          setStats({
            pending_users: data.pending_users || 0,
            pending_startups: data.pending_startups || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      }
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const pendingTotal = stats.pending_users + stats.pending_startups;

  const links = [
    { name: "Queue", href: "/admin", icon: ListOrdered, badge: pendingTotal },
    { name: "Stats", href: "/admin/stats", icon: BarChart3 },
    { name: "Audit Log", href: "/admin/audit", icon: History },
    { name: "Community", href: "/feed", icon: MessagesSquare },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
      toast.success("Successfully logged out.");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onNavigate) {
      onNavigate();
    }
  };

  const effectiveExpanded = isMobile ? true : isExpanded;

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-300 ease-in-out ${
        isMobile
          ? "w-full min-h-full"
          : effectiveExpanded
          ? "w-64"
          : "w-20"
      }`}
    >
      {/* Top Brand Header (Desktop only) */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 h-16">
          <Link
            href="/admin"
            className={`font-black text-xl text-slate-900 flex items-center gap-2 truncate transition-all duration-300 ${
              effectiveExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            }`}
          >
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </span>
            <span>Admin</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition mx-auto cursor-pointer"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav
        className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden"
        aria-label="Admin navigation"
      >
        {links.map((link) => {
          const isActive =
            pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== "/admin");
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                isActive
                  ? "bg-slate-100 text-slate-900 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={!effectiveExpanded ? link.name : ""}
            >
              <div className="flex-shrink-0">
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
              </div>

              <span
                className={`ml-3.5 whitespace-nowrap transition-all duration-200 ${
                  effectiveExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4 hidden"
                }`}
              >
                {link.name}
              </span>

              {link.badge > 0 && effectiveExpanded && (
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
              {link.badge > 0 && !effectiveExpanded && (
                <span className="ml-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout Button */}
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 group cursor-pointer"
          title={!effectiveExpanded ? "Logout" : ""}
        >
          <div className="flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600" />
          </div>
          <span
            className={`ml-3.5 whitespace-nowrap transition-all duration-200 ${
              effectiveExpanded ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
}
