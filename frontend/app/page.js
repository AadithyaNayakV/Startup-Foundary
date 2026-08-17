import Link from "next/link";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/serverAPI";

export default async function Home() {
  let user = null;

  try {
    user = await serverApi("/auth/me");
  } catch {
    user = null;
  }

  if (user?.role) {
    redirect(`/${user.role}/dashboard`);
  } else if (user) {
    redirect("/select-role");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="text-2xl font-black tracking-tight text-blue-600 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-lg shadow-sm shadow-blue-500/20">
            F
          </span>
          Foundry
        </div>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
        >
          Sign In &rarr;
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          Next-Gen Founder & Investor Platform
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Where Visionary Founders Meet <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Strategic Investors
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Build company profiles, upload pitch decks, discover vetted high-growth startups, and initiate direct deal flow conversations in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-base transition shadow-md shadow-blue-600/20 text-center"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 px-8 py-4 rounded-xl font-semibold text-base transition text-center shadow-xs"
          >
            Explore Platform
          </a>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 text-left">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-md transition shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xl font-bold">
              🚀
            </div>
            <h3 className="text-2xl font-bold text-slate-900">For Founders</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              Showcase your startup, attach pitch decks, invite co-founders, track approval completeness scores, and receive direct inquiries from accredited investors.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-8 rounded-2xl space-y-4 hover:border-emerald-300 hover:shadow-md transition shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xl font-bold">
              💼
            </div>
            <h3 className="text-2xl font-bold text-slate-900">For Investors</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              Browse vetted startup directories, filter by industry domain or stage, review pitch decks, save target companies, and open 1-on-1 direct message threads.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white text-center py-6 text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} Foundry Platform. All rights reserved.
      </footer>
    </div>
  );
}