"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  GitPullRequest,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { getAllPRs, getSecurityIssues, type PullRequest, type SecurityIssue } from "@/lib/api";

interface ActivityItem {
  id: string;
  type: "pr_approved" | "pr_failed" | "pr_reviewing" | "pr_opened" | "security";
  title: string;
  detail: string;
  time: string;
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

function buildActivity(prs: PullRequest[], issues: SecurityIssue[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const pr of prs) {
    const type =
      pr.guardian_status === "success"
        ? "pr_approved"
        : pr.guardian_status === "failure"
          ? "pr_failed"
          : pr.guardian_status === "pending"
            ? "pr_reviewing"
            : "pr_opened";

    items.push({
      id: `pr-${pr.repo}-${pr.number}`,
      type,
      title: `#${pr.number} ${pr.title}`,
      detail: `${pr.repo?.split("/")[1] || "repo"} · ${pr.author}`,
      time: pr.updated_at || pr.created_at,
    });
  }

  for (const issue of issues) {
    items.push({
      id: `sec-${issue.id}`,
      type: "security",
      title: issue.title,
      detail: `Priority ${issue.priority} · ${issue.state}`,
      time: issue.created_at,
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return items;
}

const iconMap = {
  pr_approved: { icon: CheckCircle2, color: "text-success" },
  pr_failed: { icon: XCircle, color: "text-danger" },
  pr_reviewing: { icon: Clock, color: "text-warning" },
  pr_opened: { icon: GitPullRequest, color: "text-text-secondary" },
  security: { icon: ShieldAlert, color: "text-danger" },
};

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchActivity() {
    setLoading(true);
    Promise.all([
      getAllPRs().catch(() => ({ count: 0, pull_requests: [] })),
      getSecurityIssues().catch(() => ({ count: 0, issues: [] })),
    ]).then(([prs, sec]) => {
      setItems(buildActivity(prs.pull_requests, sec.issues));
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="max-w-[800px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold">Activity</h1>
        <button
          onClick={fetchActivity}
          className="text-text-secondary hover:text-text transition-colors p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-bg border border-border p-12 text-center">
          <Activity className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No activity yet. Connect repositories and open pull requests to see
            activity here.
          </p>
        </div>
      ) : (
        <div className="bg-bg border border-border">
          {items.map((item) => {
            const { icon: Icon, color } = iconMap[item.type];
            return (
              <div
                key={item.id}
                className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-b-0"
              >
                <div className={`mt-0.5 shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {item.detail}
                  </p>
                </div>
                <span className="text-xs text-text-secondary shrink-0">
                  {timeAgo(item.time)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
