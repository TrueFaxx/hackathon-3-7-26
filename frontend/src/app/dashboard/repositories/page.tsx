"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRepos } from "@/lib/api";

const mockRepos = [
  {
    id: 1,
    name: "acme/backend-api",
    description: "Core REST API powering the Acme platform. Node.js + Express + PostgreSQL.",
    language: "TypeScript",
    langColor: "#3178c6",
    prsReviewed: 87,
    vulnsFound: 12,
    lastActivity: "12 min ago",
    status: "Connected" as const,
  },
  {
    id: 2,
    name: "acme/frontend-app",
    description: "Customer-facing React application with Next.js App Router.",
    language: "TypeScript",
    langColor: "#3178c6",
    prsReviewed: 64,
    vulnsFound: 5,
    lastActivity: "1 hr ago",
    status: "Connected" as const,
  },
  {
    id: 3,
    name: "acme/shared-utils",
    description: "Shared utility libraries, types, and validation schemas.",
    language: "TypeScript",
    langColor: "#3178c6",
    prsReviewed: 31,
    vulnsFound: 2,
    lastActivity: "6 hr ago",
    status: "Paused" as const,
  },
  {
    id: 4,
    name: "acme/webhook-service",
    description: "Event-driven webhook delivery service with retry logic.",
    language: "Go",
    langColor: "#00ADD8",
    prsReviewed: 19,
    vulnsFound: 1,
    lastActivity: "2 days ago",
    status: "Connected" as const,
  },
];

export default function RepositoriesPage() {
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);
  const [repos, setReposData] = useState(mockRepos);
  const [repoStates, setRepoStates] = useState(
    mockRepos.map((r) => ({ id: r.id, status: r.status }))
  );

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await getRepos();
        const mapped = res.repos.map((r: string, i: number) => ({
          id: i + 1,
          name: r,
          description: "",
          language: "",
          langColor: "#3178c6",
          prsReviewed: 0,
          vulnsFound: 0,
          lastActivity: "-",
          status: "Connected" as const,
        }));
        setReposData(mapped);
        setRepoStates(mapped.map((r: { id: number; status: "Connected" | "Paused" }) => ({ id: r.id, status: r.status })));
        setApiFailed(false);
      } catch {
        setApiFailed(true);
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  function toggleStatus(id: number) {
    setRepoStates((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Connected" ? ("Paused" as const) : ("Connected" as const) } : r
      )
    );
  }

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
        {apiFailed && (
          <div className="mb-4 px-4 py-2 bg-gg-warning-muted border border-gg-warning/20 rounded-lg text-xs text-gg-warning">
            Could not connect to backend — showing sample data
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-[24px] text-gg-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Connected Repositories
          </h1>
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gg-btn-primary hover:bg-gg-btn-primary-hover rounded-lg transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Connect Repository
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {repos.map((repo) => {
            const state = repoStates.find((s) => s.id === repo.id)!;
            return (
              <div
                key={repo.id}
                className="bg-gg-surface rounded-xl border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-gg-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gg-text">{repo.name}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      state.status === "Connected"
                        ? "bg-gg-brand-muted text-gg-brand"
                        : "bg-gg-warning-muted text-gg-warning"
                    }`}
                  >
                    {state.status}
                  </span>
                </div>

                <p className="text-sm text-gg-text-secondary mb-4">{repo.description}</p>

                <div className="flex items-center gap-3 mb-5 text-xs text-gg-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: repo.langColor }} />
                    {repo.language}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-gg-inset rounded-lg p-3 text-center border border-gg-border-subtle">
                    <div className="text-lg font-bold text-gg-text">{repo.prsReviewed}</div>
                    <div className="text-[11px] text-gg-text-muted">PRs Reviewed</div>
                  </div>
                  <div className="bg-gg-inset rounded-lg p-3 text-center border border-gg-border-subtle">
                    <div className="text-lg font-bold text-gg-danger">{repo.vulnsFound}</div>
                    <div className="text-[11px] text-gg-text-muted">Vulns Found</div>
                  </div>
                  <div className="bg-gg-inset rounded-lg p-3 text-center border border-gg-border-subtle">
                    <div className="text-xs font-medium text-gg-text-secondary mt-1">{repo.lastActivity}</div>
                    <div className="text-[11px] text-gg-text-muted mt-0.5">Last Active</div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gg-border pt-4">
                  <button
                    onClick={() => toggleStatus(repo.id)}
                    className="flex-1 text-xs font-medium py-2 rounded-lg bg-gg-btn border border-gg-btn-border text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150"
                  >
                    {state.status === "Connected" ? "Pause" : "Resume"}
                  </button>
                  <button className="flex-1 text-xs font-medium py-2 rounded-lg bg-gg-btn border border-gg-btn-border text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150">
                    Settings
                  </button>
                  <button className="flex-1 text-xs font-medium py-2 rounded-lg bg-gg-btn border border-gg-btn-border text-gg-danger hover:bg-gg-danger-muted transition-colors duration-150">
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
