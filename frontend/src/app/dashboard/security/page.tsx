"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSecurityIssues, SecurityIssue } from "@/lib/api";

const POLL_INTERVAL = 15_000;

function priorityToSeverity(p: number): string {
  if (p === 1) return "Critical";
  if (p === 2) return "High";
  return "Medium";
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg =
    severity === "Critical"
      ? "bg-danger-light text-danger"
      : severity === "High"
        ? "bg-warning-light text-warning"
        : "bg-info-light text-info";
  return <span className={`text-[10px] font-bold px-2.5 py-1 uppercase ${cfg}`}>{severity}</span>;
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSecurity = useCallback(async () => {
    try {
      const res = await getSecurityIssues();
      setIssues(res.issues);
      setError("");
    } catch {
      setError("Could not fetch security issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurity();
    intervalRef.current = setInterval(fetchSecurity, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchSecurity]);

  const critical = issues.filter((i) => i.priority === 1).length;
  const high = issues.filter((i) => i.priority === 2).length;
  const medium = issues.filter((i) => i.priority >= 3).length;

  const summaryCards = [
    { label: "Critical", count: critical, color: "text-danger", bg: "bg-danger-light", borderColor: "border-danger/20" },
    { label: "High", count: high, color: "text-warning", bg: "bg-warning-light", borderColor: "border-warning/20" },
    { label: "Medium", count: medium, color: "text-info", bg: "bg-info-light", borderColor: "border-info/20" },
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
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text">Security Overview</h1>
        {issues.length > 0 && (
          <span className="text-xs font-bold bg-danger-light text-danger px-2.5 py-1">
            {issues.length}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-warning-light border border-warning/20 text-sm text-warning">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} border ${card.borderColor} p-8 text-center`}
          >
            <div className={`text-4xl font-bold ${card.color} mb-2`}>{card.count}</div>
            <div className={`text-sm font-bold ${card.color} uppercase tracking-wider`}>{card.label}</div>
          </div>
        ))}
      </div>

      {issues.length === 0 && !error && (
        <div className="bg-surface border border-border px-6 py-16 text-center">
          <p className="text-text font-bold text-sm mb-1">All clear</p>
          <p className="text-text-secondary text-sm">
            No security issues found. Issues are created automatically when GitGuardian detects high/critical vulnerabilities.
          </p>
        </div>
      )}

      {issues.length > 0 && (
        <div className="bg-surface border border-border">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-base font-bold text-text">Security Issues</h2>
          </div>
          <div className="divide-y divide-border-subtle">
            {issues.map((issue) => {
              const severity = priorityToSeverity(issue.priority);
              return (
                <div key={issue.id} className="px-6 py-5 hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <SeverityBadge severity={severity} />
                    <span className="text-sm font-bold text-text">{issue.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                      issue.state === "open"
                        ? "bg-primary-light text-primary"
                        : "bg-surface-raised text-text-muted"
                    }`}>
                      {issue.state}
                    </span>
                    {issue.created_at && (
                      <span className="ml-auto text-xs text-text-muted">
                        {timeAgo(issue.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{issue.description}</p>
                  {issue.url && (
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:text-primary-hover"
                    >
                      View in Linear &rarr;
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
