"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BackButton({ href, label = "Back", className = "" }) {
  const router = useRouter();

  const buttonContent = (
    <>
      <svg
        className="w-4 h-4 transition-transform group-hover:-translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span>{label}</span>
    </>
  );

  const baseStyles =
    "group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-slate-900 hover:border-gray-300 shadow-xs transition duration-150 cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${className}`}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`${baseStyles} ${className}`}
    >
      {buttonContent}
    </button>
  );
}
