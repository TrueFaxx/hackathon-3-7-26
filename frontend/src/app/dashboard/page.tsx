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

function guardianLabel(status: string | null): { text: string; color: string } {
  if (status === "success") return { text: "Approved", color: "text-gg-success" };
  if (status === "failure") return { text: "Failed", color: "text-gg-danger" };
  if (status === "pending") return { text: "Reviewing", color: "text-gg-warning" };
  return { text: "Pending", color: "text-gg-text-muted" };
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
    { label: "Open PRs", value: String(prs.length), color: "text-gg-text" },
    { label: "Approved", value: String(approvedCount), color: "text-gg-success" },
    { label: "Failed Reviews", value: String(failedCount), color: "text-gg-danger" },
    { label: "Vulnerabilities", value: String(vulnCount), color: "text-gg-warning" },
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-gg-bg flex items-center justify-center">
        <p className="text-gg-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Organization Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gg-text">GitGuardian</h1>
              <p className="text-gg-text-secondary text-sm mt-0.5">
                AI-powered code review
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gg-text-secondary">
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9z" />
                  </svg>
                  {repos.length} repositor{repos.length === 1 ? "y" : "ies"}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                  </svg>
                  {prs.length} open PR{prs.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-gg-border mb-6">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.href !== "/dashboard") router.push(tab.href);
                }}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-gg-text"
                    : "text-gg-text-secondary hover:text-gg-text"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.id === "pull-requests" && prs.length > 0 && (
                    <span className="text-xs bg-gg-surface-overlay text-gg-text-secondary px-1.5 py-0.5 rounded-full leading-none">
                      {prs.length}
                    </span>
                  )}
                  {tab.id === "security" && vulnCount > 0 && (
                    <span className="text-xs bg-gg-danger-muted text-gg-danger px-1.5 py-0.5 rounded-full leading-none">
                      {vulnCount}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gg-brand rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-gg-warning-muted border border-gg-warning/20 rounded-lg text-xs text-gg-warning">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-colors"
            >
              <span className="text-xs text-gg-text-secondary block mb-1">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Left: Repos + PRs */}
          <div className="flex-1 min-w-0">
            {/* Connected Repos */}
            {repos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gg-text">Connected Repositories</h2>
                  <Link href="/dashboard/repositories" className="text-xs text-gg-brand hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {repos.map((repo) => (
                    <div
                      key={repo}
                      className="bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <a
                          href={`https://github.com/${repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-gg-text-link hover:underline"
                        >
                          {repo}
                        </a>
                        <span className="text-xs bg-gg-success-muted text-gg-success px-2 py-0.5 rounded-full">
                          Monitoring
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repos.length === 0 && (
              <div className="mb-8 bg-gg-surface border border-gg-border rounded-lg px-6 py-12 text-center">
                <p className="text-gg-text-secondary text-sm mb-3">No repositories connected yet.</p>
                <Link href="/dashboard/repositories" className="text-sm text-gg-brand hover:underline font-medium">
                  Connect your first repository
                </Link>
              </div>
            )}

            {/* Recent PRs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gg-text">Open Pull Requests</h2>
                {prs.length > 0 && (
                  <Link href="/dashboard/pull-requests" className="text-xs text-gg-brand hover:underline">
                    View all
                  </Link>
                )}
              </div>

              {prs.length === 0 && (
                <div className="bg-gg-surface border border-gg-border rounded-lg px-6 py-12 text-center text-gg-text-muted text-sm">
                  No open pull requests.
                </div>
              )}

              {prs.length > 0 && (
                <div className="border border-gg-border rounded-lg overflow-hidden">
                  {prs.slice(0, 10).map((pr, i) => {
                    const status = guardianLabel(pr.guardian_status);
                    return (
                      <div
                        key={`${pr.repo}-${pr.number}`}
                        className={`flex items-center gap-4 px-4 py-3 hover:bg-gg-surface-raised transition-colors ${
                          i > 0 ? "border-t border-gg-border-subtle" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-gg-text-link hover:underline truncate"
                            >
                              {pr.title}
                            </a>
                            <span className={`text-xs font-medium ${status.color} shrink-0`}>
                              {status.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gg-text-secondary">
                            <span>{pr.repo}</span>
                            <span>#{pr.number}</span>
                            <span>by {pr.author}</span>
                            <span>{timeAgo(pr.created_at)}</span>
                            <span>{pr.head_branch} → {pr.base_branch}</span>
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
          <div className="w-72 shrink-0 space-y-6">
            {/* Review Summary */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">Review Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gg-text-secondary">Approved</span>
                  <span className="font-medium text-gg-success">{approvedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gg-text-secondary">Failed</span>
                  <span className="font-medium text-gg-danger">{failedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gg-text-secondary">Pending</span>
                  <span className="font-medium text-gg-warning">{pendingCount}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/repositories"
                  className="block w-full text-left text-sm text-gg-text-secondary hover:text-gg-brand transition-colors px-3 py-2 rounded-md hover:bg-gg-btn"
                >
                  + Connect repository
                </Link>
                <Link
                  href="/dashboard/security"
                  className="block w-full text-left text-sm text-gg-text-secondary hover:text-gg-brand transition-colors px-3 py-2 rounded-md hover:bg-gg-btn"
                >
                  View security issues
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block w-full text-left text-sm text-gg-text-secondary hover:text-gg-brand transition-colors px-3 py-2 rounded-md hover:bg-gg-btn"
                >
                  Manage API keys
                </Link>
              </div>
            </div>

            {/* Repos Quick List */}
            {repos.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gg-text mb-3">Repositories</h3>
                <ul className="space-y-1.5">
                  {repos.map((repo) => (
                    <li key={repo} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gg-brand shrink-0" />
                      <span className="text-sm text-gg-text-secondary truncate">{repo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
