"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { updateRole } from "@/features/auth/authSlice";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { 
  Rocket, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  ArrowRight,
  Lock
} from "lucide-react";

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState("founder");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.role) {
          router.replace(`/${data.role}/dashboard`);
        }
      } catch {
        // No session, keep role selection available.
      }
    };

    checkSession();
  }, [router]);

  const handleRoleSelection = async (roleToSet) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Lock in role on the backend
      await api.post("/auth/set-role", { role: roleToSet });

      // Update Redux state
      dispatch(updateRole(roleToSet));

      toast.success(
        `Welcome to Foundry! Registered as a ${
          roleToSet === "founder" ? "Startup Founder" : "Strategic Investor"
        }.`
      );

      // Navigate to dashboard
      router.push(`/${roleToSet}/dashboard`);
    } catch (err) {
      console.error("Failed to set role:", err);
      const msg =
        err.response?.data?.detail ||
        "Failed to save your role. Please try again.";
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-auth flex flex-col justify-between selection:bg-blue-600 selection:text-white py-6">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <BackButton href="/login" label="Back to Sign In" />
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight"
        >
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            F
          </span>
          <span>Foundry</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl w-full space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Step 2 of 2: Profile Selection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Workspace Role
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
              Select your persona on Foundry. This configures your dashboard, 
              deal flow channels, and platform permissions.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Founder Card */}
            <div
              onClick={() => setSelectedRole("founder")}
              className={`relative cursor-pointer rounded-3xl p-6 sm:p-8 bg-white transition-all duration-300 border-2 ${
                selectedRole === "founder"
                  ? "border-blue-600 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              {selectedRole === "founder" && (
                <div className="absolute top-5 right-5 bg-blue-600 text-white p-1 rounded-full shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Rocket className="w-7 h-7" />
              </div>

              <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase mb-2">
                For Builders & Startups
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Startup Founder
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                Create company profiles, publish pitch decks, run AI scoring readiness checks, and receive inquiries from active angel investors.
              </p>

              <div className="space-y-2.5 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Startup Profile & Team Management</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Pitch Deck Hosting & AI Scoring</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Direct Deal Flow Inquiries</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Founder Community Feed Access</span>
                </div>
              </div>
            </div>

            {/* Investor Card */}
            <div
              onClick={() => setSelectedRole("investor")}
              className={`relative cursor-pointer rounded-3xl p-6 sm:p-8 bg-white transition-all duration-300 border-2 ${
                selectedRole === "investor"
                  ? "border-emerald-600 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              {selectedRole === "investor" && (
                <div className="absolute top-5 right-5 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7" />
              </div>

              <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold uppercase mb-2">
                For Angels, VCs & Funds
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Strategic Investor
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                Discover vetted startups by industry and stage, review pitch materials, bookmark deal pipeline opportunities, and message founders directly.
              </p>

              <div className="space-y-2.5 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Curated High-Growth Startup Directory</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Pitch Deck & Financials Review</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>Saved Deals & Pipeline Tracker</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span>1-on-1 Direct Messaging with Founders</span>
                </div>
              </div>
            </div>

          </div>

          {/* Confirm Button */}
          <div className="pt-4 flex flex-col items-center space-y-3">
            <button
              onClick={() => handleRoleSelection(selectedRole)}
              disabled={isSubmitting}
              className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl text-white font-bold text-base transition-all duration-200 shadow-md flex items-center justify-center gap-3 cursor-pointer ${
                selectedRole === "founder"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Setting up your workspace...</span>
                </>
              ) : (
                <>
                  <span>
                    Continue as {selectedRole === "founder" ? "Startup Founder" : "Strategic Investor"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Role configuration is permanently bound to your Google account</span>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Foundry Platform. All rights reserved.
      </footer>
    </div>
  );
}
