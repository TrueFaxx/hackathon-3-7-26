"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRepos, getAllPRs, getSecurityIssues, PullRequest } from "@/lib/api";

const POLL_INTERVAL = 15_000;

const tabs = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "pull-requests", label: "Pull Requests", href: "/dashboard/pull-requests" },
  { id: "repositories", label: "Repositories", href: "/dashboard/repositories" },
  { id: "security", label: "Security", href: "/dashboard/security" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function guardianLabel(status: string | null): { text: string; color: string; bg: string } {
  if (status === "success") return { text: "Approved", color: "text-success", bg: "bg-success-light" };
  if (status === "failure") return { text: "Failed", color: "text-danger", bg: "bg-danger-light" };
  if (status === "pending") return { text: "Reviewing", color: "text-warning", bg: "bg-warning-light" };
  return { text: "Pending", color: "text-text-muted", bg: "bg-surface-raised" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repos, setRepos] = useState<string[]>([]);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [vulnCount, setVulnCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [repoRes, prRes, secRes] = await Promise.all([
        getRepos(),
        getAllPRs(),
        getSecurityIssues(),
      ]);
      setRepos(repoRes.repos);
      setPrs(prRes.pull_requests);
      setVulnCount(secRes.count);
      setLastUpdated(new Date());
      setError("");
    } catch {
      setError("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const approvedCount = prs.filter((p) => p.guardian_status === "success").length;
  const failedCount = prs.filter((p) => p.guardian_status === "failure").length;
  const pendingCount = prs.filter((p) => !p.guardian_status || p.guardian_status === "pending").length;

  const stats = [
    { label: "Open PRs", value: String(prs.length), color: "text-text" },
    { label: "Approved", value: String(approvedCount), color: "text-success" },
    { label: "Failed Reviews", value: String(failedCount), color: "text-danger" },
    { label: "Vulnerabilities", value: String(vulnCount), color: "text-warning" },
  ];

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Organization Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">GitGuardian</h1>
            {lastUpdated && (
              <span className="text-[11px] text-text-muted" title={lastUpdated.toLocaleTimeString()}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Autonomous code review
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            <span>{repos.length} repositor{repos.length === 1 ? "y" : "ies"}</span>
            <span>&middot;</span>
            <span>{prs.length} open PR{prs.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.href !== "/dashboard") router.push(tab.href);
              }}
              className={`relative px-5 py-3 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.id === "pull-requests" && prs.length > 0 && (
                  <span className="text-[10px] bg-primary-light text-primary px-1.5 py-0.5 font-bold">
                    {prs.length}
                  </span>
                )}
                {tab.id === "security" && vulnCount > 0 && (
                  <span className="text-[10px] bg-danger-light text-danger px-1.5 py-0.5 font-bold">
                    {vulnCount}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-warning-light border border-warning/20 text-sm text-warning">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border p-5 hover:border-border-strong transition-colors"
          >
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">{stat.label}</span>
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-10">
        {/* Left: Repos + PRs */}
        <div className="flex-1 min-w-0">
          {/* Connected Repos */}
          {repos.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text">Connected Repositories</h2>
                <Link href="/dashboard/repositories" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {repos.map((repo) => (
                  <div
                    key={repo}
                    className="bg-surface border border-border p-4 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://github.com/${repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-text hover:text-primary transition-colors"
                      >
                        {repo}
                      </a>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-success-light text-success uppercase">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {repos.length === 0 && (
            <div className="mb-10 bg-surface border border-border px-6 py-16 text-center">
              <p className="text-text-secondary text-sm mb-3">No repositories connected yet.</p>
              <Link href="/dashboard/repositories" className="text-sm font-bold text-primary hover:text-primary-hover">
                Connect your first repository
              </Link>
            </div>
          )}

          {/* Recent PRs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text">Open Pull Requests</h2>
              {prs.length > 0 && (
                <Link href="/dashboard/pull-requests" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                  View all
                </Link>
              )}
            </div>

            {prs.length === 0 && (
              <div className="bg-surface border border-border px-6 py-16 text-center text-text-muted text-sm">
                No open pull requests.
              </div>
            )}

            {prs.length > 0 && (
              <div className="border border-border overflow-hidden">
                {prs.slice(0, 10).map((pr, i) => {
                  const status = guardianLabel(pr.guardian_status);
                  return (
                    <div
                      key={`${pr.repo}-${pr.number}`}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors ${
                        i > 0 ? "border-t border-border-subtle" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-text hover:text-primary transition-colors truncate"
                          >
                            {pr.title}
                          </a>
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${status.bg} ${status.color} shrink-0 uppercase`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                          <span>{pr.repo}</span>
                          <span>#{pr.number}</span>
                          <span>by {pr.author}</span>
                          <span>{timeAgo(pr.created_at)}</span>
                          <span>{pr.head_branch} &rarr; {pr.base_branch}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 shrink-0 space-y-8">
          {/* Review Summary */}
          <div>
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Review Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Approved</span>
                <span className="font-bold text-success">{approvedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Failed</span>
                <span className="font-bold text-danger">{failedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Pending</span>
                <span className="font-bold text-warning">{pendingCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-1">
              <Link
                href="/dashboard/repositories"
                className="block text-sm text-text-secondary hover:text-primary transition-colors py-2"
              >
                + Connect repository
              </Link>
              <Link
                href="/dashboard/security"
                className="block text-sm text-text-secondary hover:text-primary transition-colors py-2"
              >
                View security issues
              </Link>
              <Link
                href="/dashboard/settings"
                className="block text-sm text-text-secondary hover:text-primary transition-colors py-2"
              >
                Manage API keys
              </Link>
            </div>
          </div>

          {/* Repos Quick List */}
          {repos.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Repositories</h3>
              <ul className="space-y-2">
                {repos.map((repo) => (
                  <li key={repo} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary shrink-0" />
                    <span className="text-sm text-text-secondary truncate">{repo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
