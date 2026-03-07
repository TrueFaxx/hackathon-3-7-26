"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/api";

export default function DashboardHeader() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gg-inset border-b border-gg-border flex items-center px-4 gap-4">
      <Link
        href="/dashboard"
        className="shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gg-brand"
        >
          <path
            d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points="9 12 11 14 15 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span
          className="text-gg-text text-[15px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          GitGuardian
        </span>
      </Link>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md" style={{ width: 420 }}>
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gg-text-muted"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search or jump to..."
            className="w-full h-9 pl-10 pr-10 rounded-full bg-gg-surface border border-gg-border text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-5 w-5 rounded border border-gg-border bg-gg-surface-raised text-[11px] text-gg-text-muted font-mono">
            /
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="relative p-1.5 rounded-md hover:bg-gg-btn transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gg-text-secondary hover:text-gg-text transition-colors"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-gg-danger rounded-full" />
        </button>

        <button className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gg-btn border border-gg-btn-border hover:bg-gg-btn-hover transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gg-text-secondary"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="w-8 h-8 rounded-full bg-gg-surface-raised border border-gg-border flex items-center justify-center text-xs font-medium text-gg-text-secondary cursor-pointer">
          JD
        </div>

        <button
          onClick={() => { clearAuth(); router.push("/login"); }}
          className="text-xs text-gg-text-muted hover:text-gg-text transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
