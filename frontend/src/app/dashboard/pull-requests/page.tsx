"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPRs, PullRequest } from "@/lib/api";

const tabs = ["All", "Open", "Merged", "Failed"] as const;
type Tab = (typeof tabs)[number];

const mockPRs = [
  {
    id: 142,
    title: "Fix authentication middleware vulnerability",
    repo: "acme/backend-api",
    status: "reviewing" as const,
    author: "SK",
    authorName: "Sarah Kim",
    time: "12 min ago",
    additions: 142,
    deletions: 37,
  },
  {
    id: 141,
    title: "Add rate limiting to public endpoints",
    repo: "acme/backend-api",
    status: "approved" as const,
    author: "JD",
    authorName: "John Doe",
    time: "34 min ago",
    additions: 89,
    deletions: 12,
  },
  {
    id: 140,
    title: "Update React to v19 and fix breaking changes",
    repo: "acme/frontend-app",
    status: "reviewing" as const,
    author: "MR",
    authorName: "Maria Rodriguez",
    time: "1 hr ago",
    additions: 456,
    deletions: 312,
  },
  {
    id: 139,
    title: "Bump eslint-config from 4.2.0 to 5.0.1",
    repo: "acme/shared-utils",
    status: "merged" as const,
    author: "AB",
    authorName: "Alex Brown",
    time: "2 hr ago",
    additions: 18,
    deletions: 15,
  },
  {
    id: 138,
    title: "Fix SQL injection in user search endpoint",
    repo: "acme/backend-api",
    status: "failed" as const,
    author: "SK",
    authorName: "Sarah Kim",
    time: "3 hr ago",
    additions: 34,
    deletions: 8,
  },
  {
    id: 137,
    title: "Implement dark mode toggle component",
    repo: "acme/frontend-app",
    status: "approved" as const,
    author: "LW",
    authorName: "Lisa Wang",
    time: "4 hr ago",
    additions: 203,
    deletions: 45,
  },
  {
    id: 136,
    title: "Add webhook retry logic with exponential backoff",
    repo: "acme/webhook-service",
    status: "reviewing" as const,
    author: "JD",
    authorName: "John Doe",
    time: "5 hr ago",
    additions: 167,
    deletions: 23,
  },
  {
    id: 135,
    title: "Remove deprecated crypto module usage",
    repo: "acme/shared-utils",
    status: "merged" as const,
    author: "MR",
    authorName: "Maria Rodriguez",
    time: "6 hr ago",
    additions: 78,
    deletions: 134,
  },
];

const statusDot: Record<string, string> = {
  approved: "bg-gg-brand",
  reviewing: "bg-gg-info",
  failed: "bg-gg-danger",
  merged: "bg-gg-purple",
};

function statusToTab(status: string): Tab {
  if (status === "approved") return "Open";
  if (status === "reviewing") return "Open";
  if (status === "merged") return "Merged";
  return "Failed";
}

export default function PullRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);
  const [prList, setPrList] = useState<typeof mockPRs>(mockPRs);

  useEffect(() => {
    async function fetchPRs() {
      try {
        const res = await getAllPRs();
        setPrList(
          res.pull_requests.map((pr: PullRequest, i: number) => ({
            id: pr.number,
            title: pr.title,
            repo: pr.repo || "",
            status: (pr.guardian_status === "success"
              ? "approved"
              : pr.guardian_status === "failure"
                ? "failed"
                : pr.guardian_status === "pending"
                  ? "reviewing"
                  : "reviewing") as "approved" | "reviewing" | "failed" | "merged",
            author: pr.author.slice(0, 2).toUpperCase(),
            authorName: pr.author,
            time: new Date(pr.created_at).toLocaleDateString(),
            additions: 0,
            deletions: 0,
          }))
        );
        setApiFailed(false);
      } catch {
        setApiFailed(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPRs();
  }, []);

  const filtered = prList.filter((pr) => {
    const matchesTab = activeTab === "All" || statusToTab(pr.status) === activeTab;
    const matchesSearch =
      !searchQuery ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.repo.toLowerCase().includes(searchQuery.toLowerCase());
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
            {prList.length}
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

        {apiFailed && (
          <div className="mb-4 px-4 py-2 bg-gg-warning-muted border border-gg-warning/20 rounded-lg text-xs text-gg-warning">
            Could not connect to backend — showing sample data
          </div>
        )}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-gg-surface border border-gg-border rounded-lg px-6 py-16 text-center text-gg-text-muted text-sm">
              No pull requests match your filters.
            </div>
          )}
          {filtered.map((pr) => (
            <Link
              key={pr.id}
              href={`/dashboard/pull-requests/${pr.id}`}
              className="flex items-center gap-4 bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-all duration-150 group"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot[pr.status]}`} />

              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gg-text group-hover:text-gg-brand transition-colors duration-150 truncate block">
                  {pr.title}
                </span>
                <span className="text-xs text-gg-text-secondary mt-0.5 block">
                  {pr.repo} · #{pr.id}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-gg-surface-raised flex items-center justify-center text-[10px] font-semibold text-gg-text-secondary">
                  {pr.author}
                </div>

                <span className="text-xs text-gg-text-muted w-16 text-right">{pr.time}</span>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-gg-brand">+{pr.additions}</span>
                  <span className="text-gg-danger">-{pr.deletions}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
