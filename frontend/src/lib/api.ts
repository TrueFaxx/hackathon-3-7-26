const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

class ApiError extends Error {
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
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || res.statusText, res.status);
  }

  return res.json();
}

// ─── Auth (no API key) ──────────────────────────────────────────────────────

export async function signup(username: string, email: string, password: string) {
  return request<{
    message: string;
    username: string;
    api_key: string;
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  }, false);
}

export async function login(username: string, password: string) {
  return request<{
    message: string;
    username: string;
    api_key: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }, false);
}

// ─── Repos ──────────────────────────────────────────────────────────────────

export async function getRepos() {
  return request<{ repos: string[] }>("/api/repos");
}

// ─── Pull Requests ──────────────────────────────────────────────────────────

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  user: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_sha: string;
  base_ref: string;
  head_ref: string;
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

// ─── Security ───────────────────────────────────────────────────────────────

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

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function chat(message: string, context = "") {
  return request<{ reply: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}

// ─── Manual Review ──────────────────────────────────────────────────────────

export async function triggerReview(repo: string, prNumber: number) {
  return request<{ status: string; approved: boolean }>("/api/review", {
    method: "POST",
    body: JSON.stringify({ repo, pr_number: prNumber }),
  });
}

// ─── API Keys ───────────────────────────────────────────────────────────────

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

// ─── Health ─────────────────────────────────────────────────────────────────

export async function healthCheck() {
  return request<{ status: string }>("/health", {}, false);
}
