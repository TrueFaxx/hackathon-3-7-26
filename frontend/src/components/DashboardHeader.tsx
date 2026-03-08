"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth, getStoredUsername } from "@/lib/api";

export default function DashboardHeader() {
  const router = useRouter();
  const username = getStoredUsername() || "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-bg-dark flex items-center px-6 gap-4">
      <Link
        href="/dashboard"
        className="shrink-0 font-bold text-[15px] text-text-inverse hover:opacity-80 transition-opacity"
      >
        GitGuardian
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-text-inverse/60">{username}</span>

        <div className="w-7 h-7 bg-primary flex items-center justify-center text-[10px] font-bold text-text-inverse">
          {initials}
        </div>

        <button
          onClick={() => { clearAuth(); router.push("/login"); }}
          className="text-xs font-bold text-text-inverse/40 hover:text-text-inverse transition-colors uppercase tracking-wider"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
