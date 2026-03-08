"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getSecurityIssues, type SecurityIssue } from "@/lib/api";

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 1)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger-light px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" /> Critical
      </span>
    );
  if (priority === 2)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning-light px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" /> High
      </span>
    );
  return (
    <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-0.5">
      Medium
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SecurityPage() {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchIssues() {
    setLoading(true);
    getSecurityIssues()
      .then((r) => setIssues(r.issues))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold">Security Issues</h1>
        <button
          onClick={fetchIssues}
          className="text-text-secondary hover:text-text transition-colors p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-px bg-border mb-8">
        <div className="bg-bg p-5 text-center">
          <p className="text-2xl font-extrabold">{issues.length}</p>
          <p className="text-xs text-text-secondary mt-1">Total Issues</p>
        </div>
        <div className="bg-bg p-5 text-center">
          <p className="text-2xl font-extrabold text-danger">
            {issues.filter((i) => i.priority === 1).length}
          </p>
          <p className="text-xs text-text-secondary mt-1">Critical</p>
        </div>
        <div className="bg-bg p-5 text-center">
          <p className="text-2xl font-extrabold text-warning">
            {issues.filter((i) => i.priority === 2).length}
          </p>
          <p className="text-xs text-text-secondary mt-1">High</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-bg border border-border p-12 text-center">
          <ShieldAlert className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No security issues found</p>
          <p className="text-xs text-text-secondary">
            GitGuardian is monitoring your repositories for vulnerabilities.
          </p>
        </div>
      ) : (
        <div className="bg-bg border border-border">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-5 border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={issue.priority} />
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {issue.title}
                    <ExternalLink className="w-3 h-3 text-text-secondary" />
                  </a>
                </div>
                <span className="text-xs text-text-secondary shrink-0">
                  {timeAgo(issue.created_at)}
                </span>
              </div>
              {issue.description && (
                <p className="text-xs text-text-secondary line-clamp-2 ml-0">
                  {issue.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
