"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAllPRs, PullRequest } from "@/lib/api";

const POLL_INTERVAL = 15_000;

const tabs = ["All", "Approved", "Reviewing", "Failed"] as const;
type Tab = (typeof tabs)[number];

function guardianToStatus(gs: string | null): "approved" | "reviewing" | "failed" {
  if (gs === "success") return "approved";
  if (gs === "failure") return "failed";
  return "reviewing";
}

function statusToTab(status: string): Tab {
  if (status === "approved") return "Approved";
  if (status === "failed") return "Failed";
  return "Reviewing";
}

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

const statusStyles: Record<string, { color: string; bg: string }> = {
  approved: { color: "text-success", bg: "bg-success-light" },
  reviewing: { color: "text-warning", bg: "bg-warning-light" },
  failed: { color: "text-danger", bg: "bg-danger-light" },
};

export default function PullRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPRs = useCallback(async () => {
    try {
      const res = await getAllPRs();
      setPrs(res.pull_requests);
      setError("");
    } catch {
      setError("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPRs();
    intervalRef.current = setInterval(fetchPRs, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchPRs]);

  const filtered = prs.filter((pr) => {
    const status = guardianToStatus(pr.guardian_status);
    const matchesTab = activeTab === "All" || statusToTab(status) === activeTab;
    const matchesSearch =
      !searchQuery ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pr.repo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text">Pull Requests</h1>
        <span className="text-xs font-bold bg-primary-light text-primary px-2.5 py-1">
          {prs.length}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? "bg-primary text-text-inverse"
                  : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs ml-auto">
          <input
            type="text"
            placeholder="Search pull requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border py-2.5 px-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-warning-light border border-warning/20 text-sm text-warning">
          {error}
        </div>
      )}

      {prs.length === 0 && !error && (
        <div className="bg-surface border border-border px-6 py-16 text-center text-text-muted text-sm">
          No open pull requests. Connect a repository first.
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && prs.length > 0 && (
          <div className="bg-surface border border-border px-6 py-16 text-center text-text-muted text-sm">
            No pull requests match your filters.
          </div>
        )}
        {filtered.map((pr) => {
          const status = guardianToStatus(pr.guardian_status);
          const style = statusStyles[status];
          return (
            <a
              key={`${pr.repo}-${pr.number}`}
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-surface border border-border p-5 hover:border-border-strong transition-colors group"
            >
              <span className={`w-2 h-2 shrink-0 ${style.color === "text-success" ? "bg-success" : style.color === "text-danger" ? "bg-danger" : "bg-warning"}`} />

              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-text group-hover:text-primary transition-colors truncate block">
                  {pr.title}
                </span>
                <span className="text-xs text-text-muted mt-1 block">
                  {pr.repo} &middot; #{pr.number} &middot; {pr.head_branch} &rarr; {pr.base_branch}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-5 shrink-0">
                <div className="w-7 h-7 bg-surface-raised flex items-center justify-center text-[10px] font-bold text-text-secondary border border-border">
                  {pr.author.slice(0, 2).toUpperCase()}
                </div>

                <span className="text-xs text-text-muted w-20 text-right">{timeAgo(pr.created_at)}</span>

                <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${style.bg} ${style.color} w-20 text-center`}>
                  {status === "approved" ? "Approved" : status === "failed" ? "Failed" : "Reviewing"}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
