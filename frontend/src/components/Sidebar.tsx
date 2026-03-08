"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRepos } from "@/lib/api";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Pull Requests", href: "/dashboard/pull-requests" },
  { label: "Repositories", href: "/dashboard/repositories" },
  { label: "Security", href: "/dashboard/security" },
  { label: "Activity", href: "/dashboard/activity" },
  { label: "Chat", href: "/dashboard/chat" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [connectedRepos, setConnectedRepos] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchRepos = () => getRepos().then((res) => setConnectedRepos(res.repos)).catch(() => {});
    fetchRepos();
    intervalRef.current = setInterval(fetchRepos, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[240px] shrink-0 bg-surface-raised border-r border-border flex flex-col h-full overflow-y-auto">
      <nav className="flex-1 px-4 py-5 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary text-text-inverse font-bold"
                  : "text-text-secondary hover:bg-surface-overlay hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {connectedRepos.length > 0 && (
          <>
            <div className="border-t border-border my-4" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted px-3 mb-2 font-bold">
              Repositories
            </p>
            {connectedRepos.map((repo) => (
              <Link
                key={repo}
                href="/dashboard/repositories"
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-overlay transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-success shrink-0" />
                <span className="truncate">{repo}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
