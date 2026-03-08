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
      ? "bg-gg-danger-muted text-gg-danger"
      : severity === "High"
        ? "bg-gg-warning-muted text-gg-warning"
        : "bg-gg-info-muted text-gg-info";
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg}`}>{severity}</span>;
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
    { label: "Critical", count: critical, color: "text-gg-danger", bg: "bg-gg-danger-muted", border: "border-gg-danger/20" },
    { label: "High", count: high, color: "text-gg-warning", bg: "bg-gg-warning-muted", border: "border-gg-warning/20" },
    { label: "Medium", count: medium, color: "text-gg-info", bg: "bg-gg-info-muted", border: "border-gg-info/20" },
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
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1
            className="text-[24px] text-gg-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Security Overview
          </h1>
          {issues.length > 0 && (
            <span className="text-sm font-semibold bg-gg-danger-muted text-gg-danger px-2.5 py-0.5 rounded-full">
              {issues.length}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-gg-warning-muted border border-gg-warning/20 rounded-lg text-xs text-gg-warning">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-md p-6 text-center hover:border-gg-border-bright transition-all duration-150`}
            >
              <div className={`text-4xl font-bold ${card.color} mb-2`}>{card.count}</div>
              <div className={`text-sm font-semibold ${card.color}`}>{card.label}</div>
            </div>
          ))}
        </div>

        {issues.length === 0 && !error && (
          <div className="bg-gg-surface border border-gg-border rounded-md px-6 py-16 text-center">
            <p className="text-gg-text text-sm font-medium mb-1">All clear!</p>
            <p className="text-gg-text-secondary text-sm">
              No security issues found. Issues are created automatically when GitGuardian detects high/critical vulnerabilities in PR reviews.
            </p>
          </div>
        )}

        {issues.length > 0 && (
          <div className="bg-gg-surface rounded-md border border-gg-border">
            <div className="px-6 py-5 border-b border-gg-border">
              <h2
                className="text-lg text-gg-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Security Issues
              </h2>
            </div>
            <div className="divide-y divide-gg-border-subtle">
              {issues.map((issue) => {
                const severity = priorityToSeverity(issue.priority);
                return (
                  <div key={issue.id} className="px-6 py-5 hover:bg-gg-surface-raised transition-colors duration-150">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <SeverityBadge severity={severity} />
                      <span className="text-sm font-semibold text-gg-text">{issue.title}</span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        issue.state === "open"
                          ? "bg-gg-brand-muted text-gg-brand"
                          : "bg-gg-surface-raised text-gg-text-muted"
                      }`}>
                        {issue.state}
                      </span>
                      {issue.created_at && (
                        <span className="ml-auto text-xs text-gg-text-muted">
                          {timeAgo(issue.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gg-text-secondary mb-3">{issue.description}</p>
                    {issue.url && (
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gg-text-link hover:underline"
                      >
                        View in Linear →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
