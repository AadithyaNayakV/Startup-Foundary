"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";
import { authStart, authSuccess, authFailure } from "@/features/auth/authSlice";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.role) {
          router.replace(`/${data.role}/dashboard`);
        } else if (data) {
          router.replace("/select-role");
        }
      } catch {
        // Not logged in yet, stay on login.
      }
    };

    checkSession();
  }, [router]);

  const handleGoogleLogin = async () => {
    dispatch(authStart());
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);

      // Send token to backend
      const { data } = await api.post("/auth/google", { id_token: idToken });

      // Store basic user info in Redux
      dispatch(
        authSuccess({
          id: data.id,
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          role: data.role,
        })
      );

      toast.success(
        data.is_new
          ? `Welcome to Foundry, ${result.user.displayName || "User"}!`
          : `Welcome back, ${result.user.displayName || "User"}!`
      );

      // Route based on backend response
      if (data.is_new || !data.role) {
        router.push("/select-role");
      } else {
        router.push(`/${data.role}/dashboard`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      const errorMessage =
        err.response?.data?.detail || err.message || "Failed to authenticate";
      dispatch(authFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-auth flex flex-col justify-between selection:bg-blue-600 selection:text-white px-4 py-8">
      {/* Centered Brand Mark */}
      <div className="flex justify-center">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-black text-slate-900 tracking-tight"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            F
          </span>
          <span>Foundry</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200 relative overflow-hidden">
          
          {/* Decorative accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Foundry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Connect with vetted startups and active investors
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-300 rounded-2xl shadow-xs text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
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
              ) : (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>
                {isLoading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>

            
          </div>

          {/* Admin Verification Notice (from project requirements) */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Admin Verification Required</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1 leading-normal">
              To protect the ecosystem, new founder profiles and investor accounts must be verified and approved by a system administrator before full platform access is enabled.
            </p>
          </div>

          {/* Admin Portal Link */}
          <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">System Administrator?</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition"
            >
              <span>Admin Portal &rarr;</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-2">
        &copy; {new Date().getFullYear()} Foundry Platform. All rights reserved.
      </footer>
    </div>
  );
}
