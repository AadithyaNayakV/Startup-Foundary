"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { updateRole } from "@/features/auth/authSlice";

import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";

export default function SelectRolePage() {
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

  const handleRoleSelection = async (selectedRole) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Tell backend to lock in this role
      await api.post("/auth/set-role", { role: selectedRole });

      // Update Redux state
      dispatch(updateRole(selectedRole));

      toast.success(
        `Welcome to Foundry! Registered as a ${
          selectedRole === "founder" ? "Startup Founder" : "Strategic Investor"
        }.`
      );

      // Navigate to their new dashboard
      router.push(`/${selectedRole}/dashboard`);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="flex justify-start">
          <BackButton href="/login" label="Back to Sign In" />
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Choose Your Path
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Select how you want to use the platform.{" "}
            <br className="hidden sm:block" />
            <span className="font-semibold text-red-500">
              Note: This choice is permanent.
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Founder Card */}
          <button
            onClick={() => handleRoleSelection("founder")}
            disabled={isSubmitting}
            className="relative group bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all duration-200 text-left disabled:opacity-50"
          >
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              I am a Founder
            </h3>
            <p className="text-gray-500">
              Create a profile for your startup, upload pitch decks, and connect
              with potential investors.
            </p>
          </button>

          {/* Investor Card */}
          <button
            onClick={() => handleRoleSelection("investor")}
            disabled={isSubmitting}
            className="relative group bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-green-500 hover:shadow-xl transition-all duration-200 text-left disabled:opacity-50"
          >
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              I am an Investor
            </h3>
            <p className="text-gray-500">
              Discover vetted startups, review AI-generated insights, and
              contact founders directly.
            </p>
          </button>
        </div>

        {isSubmitting && (
          <p className="text-center text-gray-500 animate-pulse mt-8">
            Setting up your workspace...
          </p>
        )}
      </div>
    </div>
  );
}
