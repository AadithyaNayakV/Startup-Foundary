import Link from "next/link";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/serverAPI";
import { 
  Rocket, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2 
} from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
            F
          </span>
          <span>Foundry</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition hidden sm:inline-block"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Founder & Investor Venture Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
          Where Visionary Founders Meet <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Strategic Capital
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Build high-fidelity startup profiles, analyze pitch decks with AI, discover vetted deal flow, and negotiate direct term sheets without intermediaries.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-2"
          >
            <span>Get Started with Google</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-8 py-4 rounded-2xl font-bold text-base transition text-center shadow-xs"
          >
            Explore Platform
          </a>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 text-left">
          
          {/* Founder Feature Box */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 hover:border-blue-400 hover:shadow-lg transition duration-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Rocket className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase">
              For Founders
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Raise Faster & Showcase Pitch Decks
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Create an institutional-grade profile, invite your founding team, run automated AI investor-readiness scoring, and engage active venture capitalists.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Pitch deck hosting & secure data room</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Instant AI readiness score & market radar</span>
              </div>
            </div>
          </div>

          {/* Investor Feature Box */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 hover:border-emerald-400 hover:shadow-lg transition duration-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold uppercase">
              For Investors
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Discover High-Conviction Startups
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Filter vetted companies by vertical, funding stage, and financial metrics. Bookmark promising deals to your pipeline and start direct conversations.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Vetted deal directory with stage & domain tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Direct 1-on-1 inbox and founder outreach</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-center py-6 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 gap-3">
        <div>&copy; {new Date().getFullYear()} Foundry Platform. All rights reserved.</div>
        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <Link href="/login" className="hover:text-slate-800">Founder Login</Link>
          <span>&bull;</span>
          <Link href="/login" className="hover:text-slate-800">Investor Login</Link>
          <span>&bull;</span>
          <Link href="/admin/login" className="hover:text-slate-800">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}