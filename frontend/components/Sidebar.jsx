"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";
import api from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Fallback to URL path if Redux isn't hydrated yet
  const role = user?.role || pathname.split("/")[1]; 

  const handleLogout = async () => {
    try {
      // Assuming your backend has a /auth/logout endpoint to clear the HTTP-only cookie
      await api.post("/auth/logout"); 
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      dispatch(logout());
      router.push("/login");
    }
  };

  const navLinks = {
    founder: [
      { name: "Dashboard", href: "/founder/dashboard", icon: "📊" },
      { name: "My Startups", href: "/founder/startups", icon: "🚀" },
      { name: "Messages", href: "/founder/messages", icon: "💬" },
    ],
    investor: [
      { name: "Dashboard", href: "/investor/dashboard", icon: "📊" },
      { name: "Explore Startups", href: "/investor/explore", icon: "🔍" },
      { name: "Saved", href: "/investor/saved", icon: "⭐" },
    ],
    admin: [
      { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
      { name: "Pending Approvals", href: "/admin/startups", icon: "⏳" },
      { name: "User Management", href: "/admin/users", icon: "👥" },
    ],
  };

  const links = navLinks[role] || [];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">Foundry</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-medium" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3 text-lg">{link.icon}</span>
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-gray-500 capitalize">{role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}