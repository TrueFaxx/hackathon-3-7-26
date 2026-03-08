"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth, getStoredUsername } from "@/lib/api";

export default function DashboardHeader() {
  const router = useRouter();
  const username = getStoredUsername() || "User";
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gg-surface border-b border-gg-border flex items-center px-4 gap-4">
      <Link
        href="/dashboard"
        className="shrink-0 font-semibold text-[15px] text-gg-text hover:opacity-80 transition-opacity"
      >
        GitGuardian
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-gg-text-secondary">{username}</span>

        <div className="w-7 h-7 rounded-full bg-gg-btn border border-gg-btn-border flex items-center justify-center text-xs font-medium text-gg-text-secondary">
          {initials}
        </div>

        <button
          onClick={() => { clearAuth(); router.push("/login"); }}
          className="text-xs text-gg-text-muted hover:text-gg-text transition-colors px-2 py-1 rounded hover:bg-gg-btn"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
