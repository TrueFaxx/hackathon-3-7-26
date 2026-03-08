"use client";

import { useState, useEffect, useRef } from "react";
import { getReposDetails, addRepo, removeRepo, RepoDetail } from "@/lib/api";

const POLL_INTERVAL = 15_000;

const langColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

function timeAgo(iso: string): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RepositoriesPage() {
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);
  const [repos, setRepos] = useState<RepoDetail[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [addError, setAddError] = useState("");

  async function fetchRepos() {
    try {
      const res = await getReposDetails();
      setRepos(res.repos);
      setApiFailed(false);
    } catch {
      setApiFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchRepos();
    intervalRef.current = setInterval(fetchRepos, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function handleAddRepo() {
    if (!newRepoName.includes("/")) {
      setAddError("Format: owner/repo");
      return;
    }
    try {
      await addRepo(newRepoName);
      setShowAddModal(false);
      setNewRepoName("");
      setAddError("");
      fetchRepos();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add repo");
    }
  }

  async function handleDisconnect(repoName: string) {
    const [owner, repo] = repoName.split("/");
    try {
      await removeRepo(owner, repo);
      fetchRepos();
    } catch {
      // ignore
    }
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
            Could not connect to backend
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1
              className="text-[24px] text-gg-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Connected Repositories
            </h1>
            <span className="text-sm font-semibold bg-gg-brand-muted text-gg-brand px-2.5 py-0.5 rounded-full">
              {repos.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gg-btn-primary hover:bg-gg-btn-primary-hover rounded-lg transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Connect Repository
          </button>
        </div>

        {repos.length === 0 && !apiFailed && (
          <div className="bg-gg-surface border border-gg-border rounded-lg px-6 py-16 text-center">
            <p className="text-gg-text-secondary text-sm mb-3">No repositories connected yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-gg-brand hover:underline font-medium"
            >
              Connect your first repository
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {repos.map((repo) => {
            const color = langColors[repo.language] || "#8b8b8b";
            return (
              <div
                key={repo.name}
                className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-gg-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gg-text">{repo.name}</span>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gg-success-muted text-gg-success">
                    Connected
                  </span>
                </div>

                <p className="text-sm text-gg-text-secondary mb-4 line-clamp-2">
                  {repo.description || "No description"}
                </p>

                {repo.language && (
                  <div className="flex items-center gap-3 mb-5 text-xs text-gg-text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      {repo.language}
                    </span>
                    <span>{repo.stars} stars</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gg-inset rounded-lg p-3 text-center border border-gg-border-subtle">
                    <div className="text-lg font-bold text-gg-text">{repo.open_prs}</div>
                    <div className="text-[11px] text-gg-text-muted">Open PRs</div>
                  </div>
                  <div className="bg-gg-inset rounded-lg p-3 text-center border border-gg-border-subtle">
                    <div className="text-xs font-medium text-gg-text-secondary mt-1">{timeAgo(repo.updated_at)}</div>
                    <div className="text-[11px] text-gg-text-muted mt-0.5">Last Active</div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gg-border pt-4">
                  <a
                    href={`https://github.com/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs font-medium py-2 rounded-lg bg-gg-btn border border-gg-btn-border text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150 text-center"
                  >
                    View on GitHub
                  </a>
                  <button
                    onClick={() => handleDisconnect(repo.name)}
                    className="flex-1 text-xs font-medium py-2 rounded-lg bg-gg-btn border border-gg-btn-border text-gg-danger hover:bg-gg-danger-muted transition-colors duration-150"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gg-surface border border-gg-border rounded-md p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gg-text mb-4">Connect Repository</h2>
              {addError && (
                <p className="text-gg-danger text-sm mb-3">{addError}</p>
              )}
              <input
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
                placeholder="owner/repo"
                autoFocus
                className="w-full bg-gg-surface border border-gg-border rounded-lg px-3.5 h-[44px] text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand/30 transition-colors mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowAddModal(false); setAddError(""); setNewRepoName(""); }}
                  className="px-4 py-2 text-sm text-gg-text-secondary bg-gg-btn border border-gg-btn-border rounded-lg hover:bg-gg-btn-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRepo}
                  className="px-4 py-2 text-sm font-medium text-white bg-gg-btn-primary hover:bg-gg-btn-primary-hover rounded-lg transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
