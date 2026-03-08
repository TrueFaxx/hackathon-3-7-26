"use client";

import { useEffect, useState } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Play,
} from "lucide-react";
import { getAllPRs, triggerReview, type PullRequest } from "@/lib/api";

type Tab = "all" | "success" | "failure" | "pending";

function StatusBadge({ status }: { status: string | null }) {
  if (status === "success")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-light px-2 py-0.5">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (status === "failure")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger-light px-2 py-0.5">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning-light px-2 py-0.5">
        <Clock className="w-3 h-3" /> Reviewing
      </span>
    );
  return (
    <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-0.5">
      Pending
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

export default function PullRequestsPage() {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [reviewing, setReviewing] = useState<string | null>(null);

  function fetchPRs() {
    setLoading(true);
    getAllPRs()
      .then((r) => setPRs(r.pull_requests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPRs();
  }, []);

  async function handleReview(pr: PullRequest) {
    if (!pr.repo) return;
    const key = `${pr.repo}-${pr.number}`;
    setReviewing(key);
    try {
      await triggerReview(pr.repo, pr.number);
      fetchPRs();
    } catch {
      // ignore
    } finally {
      setReviewing(null);
    }
  }

  const filtered =
    tab === "all"
      ? prs
      : prs.filter((p) => {
          if (tab === "pending") return !p.guardian_status || p.guardian_status === "pending";
          return p.guardian_status === tab;
        });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: prs.length },
    {
      key: "success",
      label: "Approved",
      count: prs.filter((p) => p.guardian_status === "success").length,
    },
    {
      key: "pending",
      label: "Reviewing",
      count: prs.filter(
        (p) => p.guardian_status === "pending" || !p.guardian_status,
      ).length,
    },
    {
      key: "failure",
      label: "Failed",
      count: prs.filter((p) => p.guardian_status === "failure").length,
    },
  ];

  return (
    <div className="max-w-[1000px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold">Pull Requests</h1>
        <button
          onClick={fetchPRs}
          className="text-text-secondary hover:text-text transition-colors p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {t.label}{" "}
            <span className="text-xs ml-1 opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg border border-border p-12 text-center">
          <GitPullRequest className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {tab === "all"
              ? "No open pull requests across your repositories."
              : `No ${tabs.find((t) => t.key === tab)?.label.toLowerCase()} pull requests.`}
          </p>
        </div>
      ) : (
        <div className="bg-bg border border-border">
          {filtered.map((pr) => {
            const key = `${pr.repo}-${pr.number}`;
            return (
              <div
                key={key}
                className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors"
              >
                <GitPullRequest className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      #{pr.number} {pr.title}
                      <ExternalLink className="w-3 h-3 text-text-secondary" />
                    </a>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {pr.repo?.split("/")[1]} · {pr.author} · {pr.head_branch} → {pr.base_branch} · {timeAgo(pr.created_at)}
                  </p>
                </div>
                <StatusBadge status={pr.guardian_status} />
                <button
                  onClick={() => handleReview(pr)}
                  disabled={reviewing === key}
                  className="text-text-secondary hover:text-primary transition-colors p-1.5 shrink-0"
                  title="Trigger review"
                >
                  {reviewing === key ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
