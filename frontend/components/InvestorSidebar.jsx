"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function InvestorSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadRole = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setIsAdmin(data?.role === "admin");
      } catch (err) {
        setIsAdmin(false);
      }
    };

    loadRole();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/conversations/unread-count");
        if (isMounted) {
          setUnreadCount(data?.count || 0);
        }
      } catch (err) {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();
    const intervalId = setInterval(fetchUnread, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const links = [
    { name: "Dashboard", href: "/investor/dashboard", icon: DashboardIcon },
    { name: "Startups", href: "/investor/startups", icon: BriefcaseIcon },
    { name: "Saved", href: "/investor/startups/saved", icon: StarIcon },
    { name: "Explore", href: "/investor/explore", icon: SearchIcon },
    {
      name: "Inbox",
      href: "/investor/inbox",
      icon: MailIcon,
      badge: unreadCount,
    },
    { name: "Community", href: "/feed", icon: ChatIcon },
    { name: "Profile", href: "/investor/profile", icon: UserIcon },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: ShieldIcon }] : []),
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`relative bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
        <div
          className={`font-bold text-xl text-emerald-600 truncate transition-all duration-300 ${
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
          }`}
        >
          Foundary
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
        aria-label="Investor navigation"
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
                  ? "bg-emerald-50 text-emerald-700"
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
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
              {link.badge > 0 && !isExpanded && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          title={!isExpanded ? "Logout" : ""}
        >
          <div className="flex-shrink-0">
            <LogoutIcon />
          </div>
          <span
            className={`ml-4 font-medium whitespace-nowrap transition-all duration-300 ${
              isExpanded ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
}

function DashboardIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
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

function BriefcaseIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-8 0V5a2 2 0 00-2-2H8a2 2 0 00-2 2v2m-3 4h18m-18 0v6a2 2 0 002 2h14a2 2 0 002-2v-6"
      />
    </svg>
  );
}

function SearchIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function UserIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function MailIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
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

function LogoutIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function ShieldIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3l7 4v5c0 4.418-3.134 8.418-7 9-3.866-.582-7-4.582-7-9V7l7-4z"
      />
    </svg>
  );
}

function StarIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.018 6.214a1 1 0 00.95.69h6.535c.969 0 1.371 1.24.588 1.81l-5.287 3.84a1 1 0 00-.364 1.118l2.018 6.214c.3.921-.755 1.688-1.54 1.118l-5.287-3.84a1 1 0 00-1.176 0l-5.287 3.84c-.784.57-1.838-.197-1.539-1.118l2.018-6.214a1 1 0 00-.364-1.118l-5.287-3.84c-.783-.57-.38-1.81.588-1.81h6.535a1 1 0 00.95-.69l2.018-6.214z"
      />
    </svg>
  );
}
