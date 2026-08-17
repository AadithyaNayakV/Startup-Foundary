"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function FounderSidebar() {
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
    { name: "Dashboard", href: "/founder/dashboard", icon: DashboardIcon },
    { name: "Investors", href: "/founder/investors", icon: BriefcaseIcon },
    { name: "Startups", href: "/founder/startups", icon: FolderIcon },
    { name: "Create Startup", href: "/founder/startups/new", icon: PlusIcon },
    {
      name: "Inbox",
      href: "/founder/inbox",
      icon: MailIcon,
      badge: unreadCount,
    },
    { name: "Community", href: "/feed", icon: ChatIcon },
    { name: "Profile", href: "/founder/profile", icon: UserIcon },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: ShieldIcon }] : []),
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

  return (
    <aside
      className={`relative bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
        <div
          className={`font-bold text-xl text-blue-600 truncate transition-all duration-300 ${
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
        aria-label="Founder navigation"
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
                  ? "bg-blue-50 text-blue-700"
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
                <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
              {link.badge > 0 && !isExpanded && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
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
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
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

function FolderIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  );
}

function PlusIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function UserIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
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
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
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
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
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

function BriefcaseIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ShieldIcon({ isActive }) {
  return (
    <svg
      className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
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
