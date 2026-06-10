"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "@/lib/api";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

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
    { name: "Queue", href: "/admin", icon: DashboardIcon, badge: pendingTotal },
    { name: "Stats", href: "/admin/stats", icon: ChartIcon },
    { name: "Audit Log", href: "/admin/audit", icon: ClockIcon },
    { name: "Community", href: "/feed", icon: ChatIcon },
  ];

  return (
    <aside
      className={`relative bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
        <div
          className={`font-bold text-xl text-slate-900 truncate transition-all duration-300 ${
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
          }`}
        >
          Admin
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition mx-auto"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isExpanded ? "rotate-0" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <nav
        className="flex-1 p-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden"
        aria-label="Admin navigation"
      >
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={!isExpanded ? link.name : ""}
            >
              <div className="flex-shrink-0">
                <Icon isActive={isActive} />
              </div>

              <span
                className={`ml-4 font-medium whitespace-nowrap transition-all duration-300 ${
                  isExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4 hidden"
                }`}
              >
                {link.name}
              </span>
              {link.badge > 0 && isExpanded && (
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
              {link.badge > 0 && !isExpanded && (
                <span className="ml-2 bg-red-100 text-red-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DashboardIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-slate-900" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2v-8z"
      />
    </svg>
  );
}

function ChatIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-slate-900" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 10h8m-8 4h5m-9 4h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12l4-3z"
      />
    </svg>
  );
}

function ChartIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-slate-900" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 19v-6m6 6V5m6 14v-9m6 9V9"
      />
    </svg>
  );
}

function ClockIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-slate-900" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
