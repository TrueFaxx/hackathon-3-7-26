"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getActivity, getActivityStats, getRepos, ReviewLog } from "@/lib/api";

const POLL_INTERVAL = 15_000;

const filters = ["All", "Approved", "Failed", "Overridden"] as const;
type Filter = (typeof filters)[number];

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

function ResultBadge({ result }: { result: string }) {
  const cfg =
    result === "approved"
      ? "bg-gg-success-muted text-gg-success"
      : result === "failed"
        ? "bg-gg-danger-muted text-gg-danger"
        : "bg-gg-warning-muted text-gg-warning";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg}`}>
      {result}
    </span>
  );
}

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [repoFilter, setRepoFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [repos, setRepos] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    approved: 0,
    failed: 0,
    overridden: 0,
    total_vulns_found: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [actRes, statsRes, repoRes] = await Promise.all([
        getActivity(repoFilter || undefined),
        getActivityStats(repoFilter || undefined),
        getRepos(),
      ]);
      setLogs(actRes.logs);
      setStats(statsRes);
      setRepos(repoRes.repos);
    } catch {
      // keep existing data on failure
    } finally {
      setLoading(false);
    }
  }, [repoFilter]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const filtered = logs.filter((log) => {
    if (activeFilter === "All") return true;
    return log.result === activeFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="min-h-full bg-gg-bg flex items-center justify-center">
        <p className="text-gg-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1
          className="text-[24px] text-gg-text mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Review Activity
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Reviews", value: stats.total_reviews, color: "text-gg-text" },
            { label: "Approved", value: stats.approved, color: "text-gg-success" },
            { label: "Failed", value: stats.failed, color: "text-gg-danger" },
            { label: "Overridden", value: stats.overridden, color: "text-gg-warning" },
            { label: "Vulns Found", value: stats.total_vulns_found, color: "text-gg-danger" },
          ].map((s) => (
            <div key={s.label} className="bg-gg-surface border border-gg-border rounded-md p-4">
              <span className="text-xs text-gg-text-secondary block mb-1">{s.label}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activeFilter === f
                    ? "bg-gg-btn-primary text-white font-medium"
                    : "bg-gg-btn text-gg-text-secondary border border-gg-border hover:bg-gg-btn-hover"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {repos.length > 0 && (
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="ml-auto appearance-none bg-gg-surface border border-gg-border rounded-md py-1.5 pl-3 pr-8 text-sm text-gg-text cursor-pointer hover:border-gg-border-bright focus:outline-none focus:border-gg-brand"
            >
              <option value="">All repositories</option>
              {repos.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>

        {/* Log list */}
        {filtered.length === 0 && (
          <div className="bg-gg-surface border border-gg-border rounded-md px-6 py-16 text-center text-gg-text-muted text-sm">
            {logs.length === 0
              ? "No reviews yet. Reviews are logged automatically when GitGuardian processes a PR."
              : "No activity matching this filter."}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="border border-gg-border rounded-md overflow-hidden">
            {filtered.map((log, i) => (
              <div
                key={log.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gg-surface-raised transition-colors ${
                  i > 0 ? "border-t border-gg-border-subtle" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ResultBadge result={log.result} />
                    <a
                      href={`https://github.com/${log.repo}/pull/${log.pr_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gg-text-link hover:underline truncate"
                    >
                      {log.pr_title}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gg-text-muted">
                    <span>{log.repo}</span>
                    <span>#{log.pr_number}</span>
                    <span>by {log.pr_author}</span>
                    {log.vuln_count > 0 && (
                      <span className="text-gg-danger">{log.vuln_count} vuln{log.vuln_count !== 1 ? "s" : ""}</span>
                    )}
                    <span className="font-mono text-[11px]">{log.head_sha.slice(0, 7)}</span>
                  </div>
                  {log.summary && (
                    <p className="text-xs text-gg-text-secondary mt-1 line-clamp-1">{log.summary}</p>
                  )}
                </div>
                <span className="text-xs text-gg-text-muted whitespace-nowrap shrink-0">
                  {timeAgo(log.reviewed_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
