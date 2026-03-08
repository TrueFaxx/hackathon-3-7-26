"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  GitPullRequest,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  getReposDetails,
  getAllPRs,
  getSecurityIssues,
  type RepoDetail,
  type PullRequest,
  type SecurityIssue,
} from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-bg border border-border p-6 hover:border-primary transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
        <ArrowRight className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </Link>
  );
}

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

export default function DashboardOverview() {
  const [repos, setRepos] = useState<RepoDetail[]>([]);
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getReposDetails().catch(() => ({ repos: [] })),
      getAllPRs().catch(() => ({ count: 0, pull_requests: [] })),
      getSecurityIssues().catch(() => ({ count: 0, issues: [] })),
    ]).then(([r, p, s]) => {
      setRepos(r.repos);
      setPRs(p.pull_requests);
      setIssues(s.issues);
      setLoading(false);
    });
  }, []);

  const approved = prs.filter((p) => p.guardian_status === "success").length;
  const failed = prs.filter((p) => p.guardian_status === "failure").length;
  const reviewing = prs.filter(
    (p) => p.guardian_status === "pending",
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px]">
      <h1 className="text-xl font-extrabold mb-6">Overview</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border mb-8">
        <StatCard
          label="Repositories"
          value={repos.length}
          icon={FolderGit2}
          href="/dashboard/repositories"
        />
        <StatCard
          label="Open PRs"
          value={prs.length}
          icon={GitPullRequest}
          href="/dashboard/pull-requests"
        />
        <StatCard
          label="Approved"
          value={approved}
          icon={CheckCircle2}
          href="/dashboard/pull-requests"
        />
        <StatCard
          label="Security Issues"
          value={issues.length}
          icon={ShieldAlert}
          href="/dashboard/security"
        />
      </div>

      {/* Recent PRs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Recent Pull Requests</h2>
          <Link
            href="/dashboard/pull-requests"
            className="text-xs text-primary font-medium hover:underline"
          >
            View all
          </Link>
        </div>

        {prs.length === 0 ? (
          <div className="bg-bg border border-border p-8 text-center text-sm text-text-secondary">
            No open pull requests. Connect a repository to get started.
          </div>
        ) : (
          <div className="bg-bg border border-border">
            <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-4 py-2 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <span>Pull Request</span>
              <span>Repository</span>
              <span>Status</span>
              <span>Time</span>
            </div>
            {prs.slice(0, 8).map((pr) => (
              <a
                key={`${pr.repo}-${pr.number}`}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface transition-colors items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    #{pr.number} {pr.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {pr.head_branch} → {pr.base_branch}
                  </p>
                </div>
                <span className="text-xs text-text-secondary truncate">
                  {pr.repo?.split("/")[1] || "—"}
                </span>
                <StatusBadge status={pr.guardian_status} />
                <span className="text-xs text-text-secondary">
                  {timeAgo(pr.created_at)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Repos overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Repositories</h2>
          <Link
            href="/dashboard/repositories"
            className="text-xs text-primary font-medium hover:underline"
          >
            Manage
          </Link>
        </div>

        {repos.length === 0 ? (
          <div className="bg-bg border border-border p-8 text-center text-sm text-text-secondary">
            No repositories connected yet.{" "}
            <Link href="/dashboard/repositories" className="text-primary hover:underline">
              Add one
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-px bg-border">
            {repos.map((repo) => (
              <div key={repo.name} className="bg-bg p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold">{repo.name}</p>
                    {repo.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary mt-3">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary inline-block" />
                      {repo.language}
                    </span>
                  )}
                  <span>{repo.open_prs} open PRs</span>
                  <span>{repo.stars} stars</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
