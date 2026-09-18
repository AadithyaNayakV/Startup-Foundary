"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href, label = "Back", className = "" }) {
  const router = useRouter();

  const buttonContent = (
    <>
      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-1" />
      <span>{label}</span>
    </>
  );

  const baseStyles =
    "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs transition duration-150 cursor-pointer";

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
