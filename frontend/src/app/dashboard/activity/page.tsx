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
      ? "bg-success-light text-success"
      : result === "failed"
        ? "bg-danger-light text-danger"
        : "bg-warning-light text-warning";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${cfg}`}>
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
      <div className="min-h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-2xl font-bold text-text mb-8">Review Activity</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Reviews", value: stats.total_reviews, color: "text-text" },
          { label: "Approved", value: stats.approved, color: "text-success" },
          { label: "Failed", value: stats.failed, color: "text-danger" },
          { label: "Overridden", value: stats.overridden, color: "text-warning" },
          { label: "Vulns Found", value: stats.total_vulns_found, color: "text-danger" },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border p-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">{s.label}</span>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeFilter === f
                  ? "bg-primary text-text-inverse"
                  : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong"
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
            className="ml-auto appearance-none bg-surface border border-border py-2 pl-3 pr-8 text-sm text-text cursor-pointer hover:border-border-strong focus:outline-none focus:border-primary"
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
        <div className="bg-surface border border-border px-6 py-16 text-center text-text-muted text-sm">
          {logs.length === 0
            ? "No reviews yet. Reviews are logged automatically when GitGuardian processes a PR."
            : "No activity matching this filter."}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="border border-border overflow-hidden">
          {filtered.map((log, i) => (
            <div
              key={log.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors ${
                i > 0 ? "border-t border-border-subtle" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ResultBadge result={log.result} />
                  <a
                    href={`https://github.com/${log.repo}/pull/${log.pr_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-text hover:text-primary transition-colors truncate"
                  >
                    {log.pr_title}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{log.repo}</span>
                  <span>#{log.pr_number}</span>
                  <span>by {log.pr_author}</span>
                  {log.vuln_count > 0 && (
                    <span className="text-danger font-bold">{log.vuln_count} vuln{log.vuln_count !== 1 ? "s" : ""}</span>
                  )}
                  <span className="font-mono text-[11px]">{log.head_sha.slice(0, 7)}</span>
                </div>
                {log.summary && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1">{log.summary}</p>
                )}
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                {timeAgo(log.reviewed_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
