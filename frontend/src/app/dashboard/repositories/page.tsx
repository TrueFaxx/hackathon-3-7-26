"use client";

import { useEffect, useState } from "react";
import {
  FolderGit2,
  Plus,
  Trash2,
  Star,
  GitPullRequest,
  ExternalLink,
} from "lucide-react";
import {
  getReposDetails,
  addRepo,
  removeRepo,
  type RepoDetail,
} from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRepo, setNewRepo] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function fetchRepos() {
    getReposDetails()
      .then((r) => setRepos(r.repos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRepos();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newRepo.includes("/")) {
      setError("Format: owner/repo");
      return;
    }
    setAdding(true);
    setError("");
    try {
      await addRepo(newRepo);
      setNewRepo("");
      setShowAdd(false);
      setLoading(true);
      fetchRepos();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add repo");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(repoName: string) {
    const [owner, repo] = repoName.split("/");
    try {
      await removeRepo(owner, repo);
      setRepos((prev) => prev.filter((r) => r.name !== repoName));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold">Repositories</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      {showAdd && (
        <div className="bg-bg border border-border p-5 mb-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newRepo}
              onChange={(e) => setNewRepo(e.target.value)}
              placeholder="owner/repository"
              className="flex-1 border border-border px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-bg"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-accent text-white px-5 py-2.5 text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {adding ? "Adding..." : "Connect"}
            </button>
          </form>
          {error && (
            <p className="text-xs text-danger mt-2">{error}</p>
          )}
        </div>
      )}

      {repos.length === 0 ? (
        <div className="bg-bg border border-border p-12 text-center">
          <FolderGit2 className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-4">
            No repositories connected yet.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm text-primary font-medium hover:underline"
          >
            Add your first repository
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-border border border-border">
          {repos.map((repo) => (
            <div key={repo.name} className="bg-bg p-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FolderGit2 className="w-4 h-4 text-text-secondary shrink-0" />
                  <a
                    href={`https://github.com/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {repo.name}
                    <ExternalLink className="w-3 h-3 text-text-secondary" />
                  </a>
                </div>
                {repo.description && (
                  <p className="text-xs text-text-secondary ml-6 mb-2 line-clamp-1">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center gap-4 ml-6 text-xs text-text-secondary">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary inline-block" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitPullRequest className="w-3 h-3" /> {repo.open_prs} open
                  </span>
                  <span>Updated {timeAgo(repo.updated_at)}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(repo.name)}
                className="text-text-secondary hover:text-danger transition-colors p-2 shrink-0"
                title="Disconnect repository"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
