"use client";

import { useRouter } from "next/navigation";
import { Shield, LogOut, User } from "lucide-react";
import { clearAuth, getStoredUsername } from "@/lib/api";

export default function DashboardHeader() {
  const router = useRouter();
  const username = getStoredUsername();

  function handleSignOut() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="h-14 border-b border-border bg-bg flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-text-secondary">
        <span className="font-mono text-xs">~/dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-text-secondary" />
          <span className="font-medium">{username || "User"}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-danger transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
