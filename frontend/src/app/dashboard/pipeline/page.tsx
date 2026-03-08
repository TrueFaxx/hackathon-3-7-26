"use client";

import { useEffect, useState } from "react";
import {
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Play,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  SkipForward,
  FileCode,
  Shield,
  Wrench,
  FileSearch,
  Merge,
  BookOpen,
} from "lucide-react";
import {
  getRepos,
  getAllPRs,
  getBranches,
  startPrFixPipeline,
  approvePrFix,
  startBranchMerge,
  approveBranchMerge,
  getPipelineRuns,
  type PipelineStep,
  type PipelineResult,
  type PipelineRun,
  type PullRequest,
  type BranchInfo,
} from "@/lib/api";

const STEP_ICONS: Record<string, React.ElementType> = {
  review: FileSearch,
  plan: BookOpen,
  fix: Wrench,
  verify: Shield,
  document: BookOpen,
  merge: Merge,
  analyze: FileSearch,
  conflict_check: GitMerge,
  resolve: Wrench,
  error: AlertTriangle,
};

function StepStatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (status === "failed" || status === "rejected") return <XCircle className="w-4 h-4 text-danger" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  if (status === "waiting") return <Clock className="w-4 h-4 text-warning" />;
  if (status === "skipped") return <SkipForward className="w-4 h-4 text-text-secondary" />;
  if (status === "blocked") return <AlertTriangle className="w-4 h-4 text-warning" />;
  return <Clock className="w-4 h-4 text-text-secondary" />;
}

function StepRow({ step }: { step: PipelineStep }) {
  const [open, setOpen] = useState(false);
  const Icon = STEP_ICONS[step.name.split("_")[0]] || FileSearch;
  const label = step.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface/50 transition-colors text-left"
      >
        <StepStatusIcon status={step.status} />
        <Icon className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-medium flex-1">{label}</span>
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 ${
          step.status === "done" ? "text-success bg-success-light" :
          step.status === "failed" || step.status === "rejected" ? "text-danger bg-danger-light" :
          step.status === "running" ? "text-primary bg-primary-light" :
          step.status === "waiting" ? "text-warning bg-warning-light" :
          "text-text-secondary bg-surface"
        }`}>
          {step.status}
        </span>
        {step.detail && typeof step.detail !== "string" ? (
          open ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />
        ) : null}
      </button>
      {open ? (
        <div className="px-5 pb-4 bg-surface/30 border-t border-border">
          {typeof step.detail === "string" ? (
            <p className="text-sm text-text-secondary py-2">{step.detail}</p>
          ) : step.detail != null ? (
            <pre className="text-xs font-mono overflow-auto max-h-80 py-3 whitespace-pre-wrap">
              {JSON.stringify(step.detail, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-text-secondary py-2">No details</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PipelineStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    completed: { color: "text-success bg-success-light", label: "Completed" },
    failed: { color: "text-danger bg-danger-light", label: "Failed" },
    running: { color: "text-primary bg-primary-light", label: "Running" },
    pending: { color: "text-text-secondary bg-surface", label: "Pending" },
    awaiting_approval: { color: "text-warning bg-warning-light", label: "Needs Approval" },
    awaiting_merge_approval: { color: "text-warning bg-warning-light", label: "Merge Ready" },
    rejected: { color: "text-danger bg-danger-light", label: "Rejected" },
    needs_fixes: { color: "text-warning bg-warning-light", label: "Needs Fixes" },
    needs_manual_review: { color: "text-warning bg-warning-light", label: "Manual Review" },
    merge_failed: { color: "text-danger bg-danger-light", label: "Merge Failed" },
  };
  const info = map[status] || { color: "text-text-secondary bg-surface", label: status };
  return (
    <span className={`text-xs font-semibold uppercase px-2 py-0.5 ${info.color}`}>
      {info.label}
    </span>
  );
}

export default function PipelinePage() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [runs, setRuns] = useState<PipelineRun[]>([]);

  // PR fix form
  const [selectedPr, setSelectedPr] = useState<number>(0);
  const [prFixRunning, setPrFixRunning] = useState(false);
  const [activeResult, setActiveResult] = useState<PipelineResult | null>(null);

  // Branch merge form
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [mergeRunning, setMergeRunning] = useState(false);

  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pr_fix" | "branch_merge">("pr_fix");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    getRepos().then((r) => {
      setRepos(r.repos);
      if (r.repos.length > 0) setSelectedRepo(r.repos[0]);
    }).catch(() => {});
    getPipelineRuns().then((r) => setRuns(r.runs)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    getAllPRs().then((r) => {
      setPrs(r.pull_requests.filter((p: PullRequest) => p.repo === selectedRepo));
    }).catch(() => {});
    getBranches(selectedRepo).then((r) => {
      setBranches(r.branches);
      setDefaultBranch(r.default_branch);
      setTargetBranch(r.default_branch);
    }).catch(() => {});
  }, [selectedRepo]);

  async function handleStartPrFix(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !selectedPr) return;
    setPrFixRunning(true);
    setError("");
    setActiveResult(null);
    try {
      const res = await startPrFixPipeline(selectedRepo, selectedPr);
      setActiveResult(res);
      getPipelineRuns().then((r) => setRuns(r.runs)).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setPrFixRunning(false);
    }
  }

  async function handleApproveReject(action: "approve" | "reject") {
    if (!activeResult) return;
    setApproving(true);
    setError("");
    try {
      const res = activeResult.pr_number
        ? await approveBranchMerge(activeResult.run_id, selectedRepo, activeResult.pr_number, action)
        : await approvePrFix(activeResult.run_id, selectedRepo, selectedPr, action);
      setActiveResult(res);
      getPipelineRuns().then((r) => setRuns(r.runs)).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setApproving(false);
    }
  }

  async function handleStartBranchMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !sourceBranch) return;
    setMergeRunning(true);
    setError("");
    setActiveResult(null);
    try {
      const res = await startBranchMerge(selectedRepo, sourceBranch, targetBranch);
      setActiveResult(res);
      getPipelineRuns().then((r) => setRuns(r.runs)).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setMergeRunning(false);
    }
  }

  function loadRun(run: PipelineRun) {
    setActiveResult({
      run_id: run.id,
      status: run.status,
      steps: run.steps,
      needs_approval: run.status === "awaiting_approval" || run.status === "awaiting_merge_approval",
      pr_number: run.pr_number || undefined,
    });
    setSelectedRepo(run.repo);
    if (run.pr_number) setSelectedPr(run.pr_number);
  }

  const isRunning = prFixRunning || mergeRunning;

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-xl font-extrabold mb-6">Auto-Fix Pipeline</h1>

      {/* Tab selector */}
      <div className="flex gap-px bg-border mb-6">
        <button
          onClick={() => setTab("pr_fix")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === "pr_fix" ? "bg-primary text-white" : "bg-bg text-text-secondary hover:bg-surface"
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          PR Auto-Fix
        </button>
        <button
          onClick={() => setTab("branch_merge")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === "branch_merge" ? "bg-primary text-white" : "bg-bg text-text-secondary hover:bg-surface"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Branch Merge
        </button>
      </div>

      {/* PR Fix Form */}
      {tab === "pr_fix" && (
        <form onSubmit={handleStartPrFix} className="bg-bg border border-border mb-6">
          <div className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Repository
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
                >
                  {repos.length === 0 && <option value="">No repos</option>}
                  {repos.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Pull Request
                </label>
                <select
                  value={selectedPr}
                  onChange={(e) => setSelectedPr(Number(e.target.value))}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
                >
                  <option value={0}>Select a PR...</option>
                  {prs.map((pr) => (
                    <option key={pr.number} value={pr.number}>
                      #{pr.number} — {pr.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              The pipeline will: review PR for issues → create a fix plan → ask for your approval →
              apply fixes → verify → iterate if needed → document changes → merge to main.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-border bg-surface/50 flex items-center justify-between">
            {error && <p className="text-xs text-danger">{error}</p>}
            <div />
            <button
              type="submit"
              disabled={isRunning || !selectedPr}
              className="bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {prFixRunning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running pipeline...</>
              ) : (
                <><Play className="w-4 h-4" /> Start Pipeline</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Branch Merge Form */}
      {tab === "branch_merge" && (
        <form onSubmit={handleStartBranchMerge} className="bg-bg border border-border mb-6">
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
              >
                {repos.length === 0 && <option value="">No repos</option>}
                {repos.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Source Branch
                </label>
                <select
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
                >
                  <option value="">Select branch...</option>
                  {branches
                    .filter((b) => b.name !== defaultBranch)
                    .map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Target Branch
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
                >
                  {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              The pipeline will: check for conflicts → AI-resolve if needed → review merged code →
              document → ask for approval → merge to {targetBranch || "main"}.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-border bg-surface/50 flex items-center justify-between">
            {error && <p className="text-xs text-danger">{error}</p>}
            <div />
            <button
              type="submit"
              disabled={isRunning || !sourceBranch}
              className="bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {mergeRunning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running pipeline...</>
              ) : (
                <><GitMerge className="w-4 h-4" /> Start Merge Pipeline</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Active pipeline result */}
      {activeResult && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold">Pipeline #{activeResult.run_id}</h2>
              <PipelineStatusBadge status={activeResult.status} />
            </div>
            {activeResult.needs_approval && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveReject("approve")}
                  disabled={approving}
                  className="bg-success text-white px-4 py-2 text-sm font-semibold hover:bg-success/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                  Approve & Continue
                </button>
                <button
                  onClick={() => handleApproveReject("reject")}
                  disabled={approving}
                  className="bg-danger text-white px-4 py-2 text-sm font-semibold hover:bg-danger/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="bg-bg border border-border">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold">Pipeline Steps</h3>
            </div>
            {activeResult.steps.map((step, i) => (
              <StepRow key={`${step.name}-${i}`} step={step} />
            ))}
          </div>

          {/* Plan preview (when awaiting approval) */}
          {activeResult.plan && activeResult.needs_approval && (
            <div className="bg-bg border border-border">
              <div className="px-5 py-3 border-b border-border bg-warning-light/30">
                <h3 className="text-sm font-bold text-warning">Fix Plan — Review Before Approving</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-text-secondary mb-4">
                  {(activeResult.plan as Record<string, unknown>).plan_summary as string}
                </p>
                {Array.isArray((activeResult.plan as Record<string, unknown>).fixes) && (
                  <div className="space-y-3">
                    {((activeResult.plan as Record<string, unknown>).fixes as Array<Record<string, unknown>>).map((fix, i) => (
                      <div key={i} className="border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-text-secondary">{fix.id as string}</span>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 ${
                            fix.severity === "critical" ? "text-danger bg-danger-light" :
                            fix.severity === "high" ? "text-danger bg-danger-light" :
                            fix.severity === "medium" ? "text-warning bg-warning-light" :
                            "text-text-secondary bg-surface"
                          }`}>
                            {fix.severity as string}
                          </span>
                          <span className="text-sm font-medium">{fix.issue as string}</span>
                        </div>
                        <p className="text-xs text-text-secondary mb-2">
                          <FileCode className="w-3 h-3 inline mr-1" />
                          {fix.file as string}
                        </p>
                        <div className="grid md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-danger uppercase">Before</span>
                            <pre className="mt-1 bg-danger-light/20 border border-danger/10 p-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                              {fix.old_code as string}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-success uppercase">After</span>
                            <pre className="mt-1 bg-success-light/20 border border-success/10 p-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                              {fix.new_code as string}
                            </pre>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary mt-2">{fix.explanation as string}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline history */}
      {runs.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4">Pipeline History</h2>
          <div className="bg-bg border border-border">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => loadRun(run)}
                className={`w-full flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors text-left ${
                  activeResult?.run_id === run.id ? "bg-primary-light/20" : ""
                }`}
              >
                {run.pipeline_type === "pr_fix" ? (
                  <GitPullRequest className="w-4 h-4 text-text-secondary shrink-0" />
                ) : (
                  <GitMerge className="w-4 h-4 text-text-secondary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {run.pipeline_type === "pr_fix"
                      ? `PR #${run.pr_number} Fix`
                      : `Merge ${run.branch} → main`}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {run.repo} · {new Date(run.created_at).toLocaleDateString()} · {run.steps.length} steps
                  </p>
                </div>
                <PipelineStatusBadge status={run.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
