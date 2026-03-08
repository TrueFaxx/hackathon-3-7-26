// When Next.js rewrites are active, requests go through the proxy (same origin).
// Fall back to direct backend URL if NEXT_PUBLIC_API_URL is set explicitly.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gg_api_key");
}

export function setApiKey(key: string) {
  localStorage.setItem("gg_api_key", key);
}

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gg_username");
}

export function setStoredUsername(name: string) {
  localStorage.setItem("gg_username", name);
}

export function clearAuth() {
  localStorage.removeItem("gg_api_key");
  localStorage.removeItem("gg_username");
}

export function isAuthenticated(): boolean {
  return !!getApiKey();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const key = getApiKey();
    if (key) headers["X-API-Key"] = key;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    // Handle expired/revoked API keys — redirect to login
    if (res.status === 401 && auth && typeof window !== "undefined") {
      clearAuth();
      window.location.href = "/login";
      throw new ApiError("Session expired", 401);
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || res.statusText, res.status);
  }

  return res.json();
}

// Auth
export async function signup(username: string, email: string, password: string) {
  return request<{ message: string; username: string; api_key: string }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify({ username, email, password }) },
    false,
  );
}

export async function login(username: string, password: string) {
  return request<{ message: string; username: string; api_key: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false,
  );
}

// Repos
export interface RepoDetail {
  name: string;
  description: string;
  language: string;
  open_prs: number;
  stars: number;
  updated_at: string;
}

export async function getRepos() {
  return request<{ repos: string[] }>("/api/repos");
}

export async function getReposDetails() {
  return request<{ repos: RepoDetail[] }>("/api/repos/details");
}

export async function addRepo(repo: string) {
  return request<{ message: string; repo: string }>("/api/repos", {
    method: "POST",
    body: JSON.stringify({ repo }),
  });
}

export async function removeRepo(owner: string, repo: string) {
  return request<{ message: string }>(`/api/repos/${owner}/${repo}`, {
    method: "DELETE",
  });
}

// Pull Requests
export interface PullRequest {
  number: number;
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
  url: string;
  head_sha: string;
  base_branch: string;
  head_branch: string;
  guardian_status: string | null;
  repo?: string;
}

export async function getAllPRs() {
  return request<{ count: number; pull_requests: PullRequest[] }>("/api/prs");
}

export async function getRepoPRs(owner: string, repo: string) {
  return request<{ repo: string; count: number; pull_requests: PullRequest[] }>(
    `/api/prs/${owner}/${repo}`,
  );
}

// Security
export interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  priority: number;
  state: string;
  url: string;
  created_at: string;
}

export async function getSecurityIssues() {
  return request<{ count: number; issues: SecurityIssue[] }>("/api/security/issues");
}

// Chat
export async function chat(message: string, context = "") {
  return request<{ reply: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}

// Manual Review
export async function triggerReview(repo: string, prNumber: number) {
  return request<{ status: string; approved: boolean }>("/api/review", {
    method: "POST",
    body: JSON.stringify({ repo, pr_number: prNumber }),
  });
}

// AI Testing
export interface TestCase {
  id: string;
  type?: "traced" | "api" | "ui";
  name: string;
  category: string;
  description: string;
  input: string;
  expected: string;
  actual: string;
  status: "pass" | "fail" | "warn";
  severity: string;
  file: string;
  line: number | null;
  fix: string | null;
  executed?: boolean;
  endpoint?: string;
  method?: string;
  path?: string;
}

export interface TestResult {
  feature: string;
  mode: string;
  summary: string;
  files_analyzed: string[];
  tests: TestCase[];
  coverage: {
    tested_paths: number;
    total_identified_paths: number;
    percentage: number;
  };
  recommendations: string[];
  execution_log?: string[];
  test_code?: string;
  code_execution?: {
    exit_code: number;
    stdout: string;
    stderr: string;
    passed: boolean;
  };
}

export async function runFeatureTest(
  repo: string,
  feature: string,
  mode: string = "alpha",
  files: string[] = [],
) {
  return request<TestResult>("/api/test", {
    method: "POST",
    body: JSON.stringify({ repo, feature, mode, files }),
  });
}

// API Keys
export interface ApiKeyInfo {
  prefix: string;
  name: string;
  created_at: string;
}

export async function listApiKeys() {
  return request<{ keys: ApiKeyInfo[] }>("/api/keys");
}

export async function createApiKey(name = "default") {
  return request<{ api_key: string; name: string }>("/api/keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(keyPrefix: string) {
  return request<{ message: string }>("/api/keys/revoke", {
    method: "POST",
    body: JSON.stringify({ key_prefix: keyPrefix }),
  });
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

export interface PipelineStep {
  name: string;
  status: "running" | "done" | "failed" | "skipped" | "waiting" | "rejected" | "blocked";
  detail: unknown;
}

export interface PipelineRun {
  id: number;
  repo: string;
  pr_number: number | null;
  branch: string | null;
  pipeline_type: string;
  status: string;
  steps: PipelineStep[];
  created_at: string;
  updated_at: string;
}

export interface PipelineResult {
  run_id: number;
  status: string;
  steps: PipelineStep[];
  needs_approval?: boolean;
  plan?: Record<string, unknown>;
  review?: Record<string, unknown>;
  error?: string;
  pr_number?: number;
}

export async function startPrFixPipeline(repo: string, prNumber: number) {
  return request<PipelineResult>("/api/pipeline/pr-fix", {
    method: "POST",
    body: JSON.stringify({ repo, pr_number: prNumber }),
  });
}

export async function approvePrFix(runId: number, repo: string, prNumber: number, action = "approve") {
  return request<PipelineResult>("/api/pipeline/pr-fix/approve", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, repo, pr_number: prNumber, action }),
  });
}

export async function startBranchMerge(repo: string, sourceBranch: string, targetBranch = "main") {
  return request<PipelineResult>("/api/pipeline/branch-merge", {
    method: "POST",
    body: JSON.stringify({ repo, source_branch: sourceBranch, target_branch: targetBranch }),
  });
}

export async function approveBranchMerge(runId: number, repo: string, prNumber: number, action = "approve") {
  return request<PipelineResult>("/api/pipeline/branch-merge/approve", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, repo, pr_number: prNumber, action }),
  });
}

export async function getPipelineRuns(repo = "") {
  const params = repo ? `?repo=${encodeURIComponent(repo)}` : "";
  return request<{ runs: PipelineRun[] }>(`/api/pipeline/runs${params}`);
}

export async function getPipelineRun(runId: number) {
  return request<PipelineRun>(`/api/pipeline/runs/${runId}`);
}

export interface BranchInfo {
  name: string;
  sha: string;
}

export async function getBranches(repo: string) {
  const [owner, name] = repo.split("/");
  return request<{ branches: BranchInfo[]; default_branch: string }>(
    `/api/repos/${owner}/${name}/branches`,
  );
}

// Health
export async function healthCheck() {
  return request<{ status: string }>("/health", {}, false);
}
