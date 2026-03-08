"use client";

import { useState, useEffect } from "react";
import { getAllPRs, PullRequest } from "@/lib/api";

const tabs = ["All", "Approved", "Reviewing", "Failed"] as const;
type Tab = (typeof tabs)[number];

const statusDot: Record<string, string> = {
  approved: "bg-gg-brand",
  reviewing: "bg-gg-warning",
  failed: "bg-gg-danger",
};

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

export default function PullRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prs, setPrs] = useState<PullRequest[]>([]);

  useEffect(() => {
    async function fetchPRs() {
      try {
        const res = await getAllPRs();
        setPrs(res.pull_requests);
      } catch {
        setError("Could not connect to backend");
      } finally {
        setLoading(false);
      }
    }
    fetchPRs();
  }, []);

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
            Pull Requests
          </h1>
          <span className="text-sm font-semibold bg-gg-brand-muted text-gg-brand px-2.5 py-0.5 rounded-full">
            {prs.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-150 ${
                  activeTab === tab
                    ? "bg-gg-btn-primary text-white font-medium"
                    : "bg-gg-btn text-gg-text-secondary border border-gg-border hover:bg-gg-btn-hover"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 sm:max-w-xs ml-auto">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gg-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search pull requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gg-surface border border-gg-border rounded-lg py-2 pl-10 pr-4 text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand transition-colors duration-150"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-gg-warning-muted border border-gg-warning/20 rounded-lg text-xs text-gg-warning">
            {error}
          </div>
        )}

        {prs.length === 0 && !error && (
          <div className="bg-gg-surface border border-gg-border rounded-lg px-6 py-16 text-center text-gg-text-muted text-sm">
            No open pull requests. Connect a repository first.
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 && prs.length > 0 && (
            <div className="bg-gg-surface border border-gg-border rounded-lg px-6 py-16 text-center text-gg-text-muted text-sm">
              No pull requests match your filters.
            </div>
          )}
          {filtered.map((pr) => {
            const status = guardianToStatus(pr.guardian_status);
            return (
              <a
                key={`${pr.repo}-${pr.number}`}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-all duration-150 group"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot[status]}`} />

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gg-text group-hover:text-gg-brand transition-colors duration-150 truncate block">
                    {pr.title}
                  </span>
                  <span className="text-xs text-gg-text-secondary mt-0.5 block">
                    {pr.repo} · #{pr.number} · {pr.head_branch} → {pr.base_branch}
                  </span>
                </div>

                <div className="hidden md:flex items-center gap-5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gg-surface-raised flex items-center justify-center text-[10px] font-semibold text-gg-text-secondary">
                    {pr.author.slice(0, 2).toUpperCase()}
                  </div>

                  <span className="text-xs text-gg-text-muted w-20 text-right">{timeAgo(pr.created_at)}</span>

                  <span className={`text-xs font-medium w-16 text-right ${
                    status === "approved" ? "text-gg-brand" : status === "failed" ? "text-gg-danger" : "text-gg-warning"
                  }`}>
                    {status === "approved" ? "Approved" : status === "failed" ? "Failed" : "Reviewing"}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
