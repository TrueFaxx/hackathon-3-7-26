"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  ShieldAlert,
  Settings,
  Activity,
  Shield,
  FlaskConical,
  Workflow,
  ChevronRight,
} from "lucide-react";
import { getRepos } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/dashboard/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/dashboard/pipeline", label: "Auto-Fix Pipeline", icon: Workflow },
  { href: "/dashboard/testing", label: "AI Testing", icon: FlaskConical },
  { href: "/dashboard/security", label: "Security", icon: ShieldAlert },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [repos, setRepos] = useState<string[]>([]);

  useEffect(() => {
    getRepos()
      .then((r) => setRepos(r.repos))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-[240px] min-h-screen bg-bg border-r border-border flex flex-col shrink-0">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm">
          <Shield className="w-4 h-4 text-primary" strokeWidth={2.5} />
          GitGuardian
        </Link>
      </div>

      <nav className="flex-1 py-3">
        <div className="px-3 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary px-2">
            Menu
          </span>
        </div>
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                active
                  ? "text-primary bg-primary-light/50 font-medium border-r-2 border-primary"
                  : "text-text-secondary hover:text-text hover:bg-surface"
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        {repos.length > 0 && (
          <>
            <div className="px-3 mt-6 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary px-2">
                Repositories
              </span>
            </div>
            {repos.map((repo) => (
              <Link
                key={repo}
                href="/dashboard/repositories"
                className="flex items-center gap-2 px-5 py-1.5 text-xs text-text-secondary hover:text-text transition-colors"
              >
                <FolderGit2 className="w-3 h-3" />
                <span className="truncate">{repo.split("/")[1] || repo}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
