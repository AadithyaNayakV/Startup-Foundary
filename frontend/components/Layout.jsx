"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Layout({ children, sidebar }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen text-slate-900">
      
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link href="/" className="flex items-center gap-2 font-black text-lg text-slate-900">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
            F
          </span>
          <span>Foundry</span>
        </Link>

        <div className="w-8" /> {/* Placeholder for visual symmetry */}
      </header>

      {/* Mobile Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-lg text-slate-900">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  F
                </span>
                <span>Foundry</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {React.isValidElement(sidebar)
                ? React.cloneElement(sidebar, {
                    isMobile: true,
                    onNavigate: () => setIsMobileMenuOpen(false),
                  })
                : sidebar}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex flex-shrink-0 sticky top-0 h-screen">
        {React.isValidElement(sidebar)
          ? React.cloneElement(sidebar, { isMobile: false })
          : sidebar}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
