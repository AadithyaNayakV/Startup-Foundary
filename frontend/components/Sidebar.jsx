"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role = "founder" }) {
  const pathname = usePathname();
  // State to track if sidebar is open (expanded) or closed (collapsed)
  const [isExpanded, setIsExpanded] = useState(true);

  // Define links based on role (you can expand these later)
  const links = role === "founder" ? [
    { name: "Dashboard", href: "/founder/dashboard", icon: DashboardIcon },
    { name: "Create Startup", href: "/founder/startups/new", icon: PlusIcon },
    { name: "Profile", href: "/founder/profile", icon: UserIcon },
  ] : [
    { name: "Dashboard", href: "/investor/dashboard", icon: DashboardIcon },
    { name: "Explore", href: "/investor/explore", icon: SearchIcon },
    { name: "Profile", href: "/investor/profile", icon: UserIcon },
  ];

  return (
    <div 
      className={`relative bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Sidebar Header & Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
        {/* Only show logo/title if expanded */}
        <div className={`font-bold text-xl text-blue-600 truncate transition-all duration-300 ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
          Foundary
        </div>
        
        {/* The Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition mx-auto"
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
        {links.map((link) => {
          const isActive = pathname === link.href;
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
              title={!isExpanded ? link.name : ""} // Native tooltip when collapsed
            >
              <div className="flex-shrink-0">
                <Icon isActive={isActive} />
              </div>
              
              <span className={`ml-4 font-medium whitespace-nowrap transition-all duration-300 ${
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"
              }`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group" title={!isExpanded ? "Logout" : ""}>
          <div className="flex-shrink-0">
            <LogoutIcon />
          </div>
          <span className={`ml-4 font-medium whitespace-nowrap transition-all duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0 hidden"
          }`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

// --- SVG Icons (Kept clean at the bottom) ---

function DashboardIcon({ isActive }) {
  return (
    <svg className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2v-8z" />
    </svg>
  );
}

function PlusIcon({ isActive }) {
  return (
    <svg className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ isActive }) {
  return (
    <svg className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function UserIcon({ isActive }) {
  return (
    <svg className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}