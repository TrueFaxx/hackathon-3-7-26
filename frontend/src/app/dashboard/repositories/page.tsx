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
      <div className="min-h-full flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {apiFailed && (
        <div className="mb-6 px-4 py-3 bg-warning-light border border-warning/20 text-sm text-warning">
          Could not connect to backend
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text">Connected Repositories</h1>
          <span className="text-xs font-bold bg-primary-light text-primary px-2.5 py-1">
            {repos.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-text-inverse bg-primary hover:bg-primary-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Connect Repository
        </button>
      </div>

      {repos.length === 0 && !apiFailed && (
        <div className="bg-surface border border-border px-6 py-16 text-center">
          <p className="text-text-secondary text-sm mb-3">No repositories connected yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm font-bold text-primary hover:text-primary-hover"
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
              className="bg-surface border border-border p-6 hover:border-border-strong transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-bold text-text">{repo.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-success-light text-success uppercase">
                  Connected
                </span>
              </div>

              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {repo.description || "No description"}
              </p>

              {repo.language && (
                <div className="flex items-center gap-4 mb-5 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {repo.language}
                  </span>
                  <span>{repo.stars} stars</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-inset border border-border-subtle p-3 text-center">
                  <div className="text-lg font-bold text-text">{repo.open_prs}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Open PRs</div>
                </div>
                <div className="bg-inset border border-border-subtle p-3 text-center">
                  <div className="text-xs font-bold text-text-secondary mt-1">{timeAgo(repo.updated_at)}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-bold">Last Active</div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-border pt-4">
                <a
                  href={`https://github.com/${repo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-xs font-bold py-2.5 bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors text-center"
                >
                  View on GitHub
                </a>
                <button
                  onClick={() => handleDisconnect(repo.name)}
                  className="flex-1 text-xs font-bold py-2.5 bg-surface border border-border text-danger hover:bg-danger-light transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface border border-border p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-text mb-6">Connect Repository</h2>
            {addError && (
              <div className="mb-4 px-4 py-3 bg-danger-light text-danger text-sm border border-danger/20">
                {addError}
              </div>
            )}
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Repository
            </label>
            <input
              type="text"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
              placeholder="owner/repo"
              autoFocus
              className="w-full bg-surface border border-border px-4 h-12 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); setNewRepoName(""); }}
                className="px-5 py-2.5 text-sm font-bold text-text-secondary bg-surface border border-border hover:border-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRepo}
                className="px-5 py-2.5 text-sm font-bold text-text-inverse bg-primary hover:bg-primary-hover transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
