"use client";

import { useState } from "react";
import Link from "next/link";

const tabs = [
  { id: "overview", label: "Overview", badge: null },
  { id: "pull-requests", label: "Pull Requests", badge: "5" },
  { id: "repositories", label: "Repositories", badge: null },
  { id: "security", label: "Security", badge: null },
  { id: "activity", label: "Activity", badge: null },
];

const pinnedRepos = [
  {
    name: "acme/frontend",
    description: "Next.js web application with React 19 and Tailwind CSS",
    language: "TypeScript",
    langColor: "#3178c6",
    prs: 142,
    vulns: 3,
  },
  {
    name: "acme/api-server",
    description: "RESTful API with Express, PostgreSQL, and Redis caching",
    language: "TypeScript",
    langColor: "#3178c6",
    prs: 98,
    vulns: 1,
  },
  {
    name: "acme/ml-pipeline",
    description: "ML inference service for code analysis and vulnerability detection",
    language: "Python",
    langColor: "#3572a5",
    prs: 67,
    vulns: 0,
  },
  {
    name: "acme/auth-service",
    description: "OAuth2 / OIDC identity provider with PKCE and MFA support",
    language: "Go",
    langColor: "#00ADD8",
    prs: 54,
    vulns: 2,
  },
  {
    name: "acme/infra",
    description: "Terraform modules, Helm charts, and CI/CD pipeline definitions",
    language: "Rust",
    langColor: "#dea584",
    prs: 31,
    vulns: 0,
  },
  {
    name: "acme/docs",
    description: "Developer documentation, API references, and onboarding guides",
    language: "JavaScript",
    langColor: "#f1e05a",
    prs: 22,
    vulns: 0,
  },
];

const recentPRs = [
  {
    title: "Fix rate limiter race condition",
    repo: "acme/api-server",
    description: "Resolves concurrent request handling bug in the sliding window rate limiter",
    language: "TypeScript",
    langColor: "#3178c6",
    time: "14m ago",
    vulns: 1,
    files: 4,
    sparkline: [12, 8, 18, 6, 14, 10, 16],
  },
  {
    title: "Add OAuth2 PKCE flow",
    repo: "acme/auth-service",
    description: "Implements Proof Key for Code Exchange for public clients per RFC 7636",
    language: "Go",
    langColor: "#00ADD8",
    time: "32m ago",
    vulns: 0,
    files: 7,
    sparkline: [6, 14, 10, 18, 4, 12, 8],
  },
  {
    title: "Upgrade deps: lodash 4.17.21",
    repo: "acme/frontend",
    description: "Bumps lodash to fix prototype pollution vulnerability CVE-2021-23337",
    language: "TypeScript",
    langColor: "#3178c6",
    time: "1h ago",
    vulns: 0,
    files: 2,
    sparkline: [4, 6, 10, 8, 12, 14, 20],
  },
  {
    title: "Add model versioning to inference API",
    repo: "acme/ml-pipeline",
    description: "Support multiple model versions with canary traffic splitting",
    language: "Python",
    langColor: "#3572a5",
    time: "1.5h ago",
    vulns: 0,
    files: 9,
    sparkline: [18, 14, 10, 6, 12, 16, 8],
  },
  {
    title: "Harden JWT validation middleware",
    repo: "acme/api-server",
    description: "Reject tokens with alg=none and enforce RS256 algorithm restriction",
    language: "TypeScript",
    langColor: "#3178c6",
    time: "2h ago",
    vulns: 2,
    files: 3,
    sparkline: [8, 12, 6, 18, 10, 4, 14],
  },
  {
    title: "Migrate Helm charts to v2 API",
    repo: "acme/infra",
    description: "Update all Helm chart manifests from v1beta1 to apps/v1 API version",
    language: "Rust",
    langColor: "#dea584",
    time: "3h ago",
    vulns: 0,
    files: 12,
    sparkline: [10, 16, 8, 4, 14, 6, 12],
  },
  {
    title: "Add end-to-end test suite for checkout",
    repo: "acme/frontend",
    description: "Playwright tests covering cart, payment, and order confirmation flows",
    language: "TypeScript",
    langColor: "#3178c6",
    time: "4h ago",
    vulns: 0,
    files: 6,
    sparkline: [6, 10, 14, 8, 18, 12, 4],
  },
  {
    title: "Fix connection pool exhaustion under load",
    repo: "acme/api-server",
    description: "Increase pool size and add connection timeout with exponential backoff",
    language: "TypeScript",
    langColor: "#3178c6",
    time: "5h ago",
    vulns: 0,
    files: 3,
    sparkline: [14, 8, 12, 18, 6, 10, 16],
  },
];

const teamMembers = [
  { initials: "JD", name: "John Doe", role: "Admin" },
  { initials: "SK", name: "Sarah Kim", role: "Reviewer" },
  { initials: "MT", name: "Mike Torres", role: "Developer" },
];

const topLanguages = [
  { name: "TypeScript", color: "#3178c6" },
  { name: "Python", color: "#3572a5" },
  { name: "Go", color: "#00ADD8" },
  { name: "Rust", color: "#dea584" },
  { name: "JavaScript", color: "#f1e05a" },
];

const activeTopics = ["security", "code-review", "testing", "CI/CD", "dependencies", "auth"];

const sidebarActivity = [
  { text: "Merged #247 in acme/frontend", time: "14m ago", color: "text-gg-brand" },
  { text: "Blocked #189 in acme/api", time: "1h ago", color: "text-gg-danger" },
  { text: "Reviewed #312 in acme/docs", time: "2h ago", color: "text-gg-text-secondary" },
  { text: "Approved #301 in acme/infra", time: "3h ago", color: "text-gg-brand" },
  { text: "Flagged #288 in acme/auth", time: "4h ago", color: "text-gg-warning" },
];

function Sparkline({ data }: { data: number[] }) {
  return (
    <svg width="50" height="24" viewBox="0 0 50 24" fill="none" className="shrink-0">
      {data.map((h, i) => (
        <rect
          key={i}
          x={i * 7 + 1}
          y={24 - h}
          width="4"
          height={h}
          rx="1"
          className="fill-gg-brand"
          opacity={0.7 + (h / 20) * 0.3}
        />
      ))}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="shrink-0">
      <path
        d="M24 4L8 12v10c0 11 6.8 18.4 16 22 9.2-3.6 16-11 16-22V12L24 4z"
        fill="rgba(16,185,129,0.15)"
        stroke="#10b981"
        strokeWidth="2"
      />
      <path
        d="M20 24l4 4 6-8"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [repoFilter, setRepoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredPRs = recentPRs.filter((pr) =>
    pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pr.repo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Organization Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <ShieldIcon />
            <div>
              <h1 className="text-2xl font-bold text-gg-text">GitGuardian</h1>
              <p className="text-gg-text-secondary text-sm mt-0.5">
                AI-powered code review for your entire organization
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gg-text-secondary">
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9z" />
                  </svg>
                  12 repositories
                </span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path fillRule="evenodd" d="M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a.75.75 0 100 1.5 1.5 1.5 0 01.666 2.844.75.75 0 00-.416.672v.352a.75.75 0 00.574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 101.434-.44 5.01 5.01 0 00-2.56-3.012A3 3 0 0011 4z" />
                  </svg>
                  3 team members
                </span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path fillRule="evenodd" d="M11.536 3.464a5 5 0 010 7.072L8 14.07l-3.536-3.535a5 5 0 117.072-7.072v.001zm1.06 8.132a6.5 6.5 0 10-9.192 0l3.535 3.536a1.5 1.5 0 002.122 0l3.535-3.536zM8 9a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  San Francisco, CA
                </span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
                    <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-.025 5.475a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25z" />
                  </svg>
                  <span className="text-gg-text-link">gitguardian.dev</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="px-3 py-1.5 text-sm text-gg-text bg-gg-btn border border-gg-btn-border rounded-md hover:bg-gg-btn-hover transition-colors">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M7.429 1.525a3.5 3.5 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.195.046a7.6 7.6 0 01.571.99c.02.037.014.12-.058.196l-.814.806a1.87 1.87 0 00-.488 1.394 7 7 0 010 .582c.032.551.208 1.04.488 1.394l.814.806c.072.076.078.159.058.196a7.6 7.6 0 01-.571.99c-.02.03-.085.076-.195.046l-1.102-.303c-.56-.153-1.113-.008-1.53.27a4.4 4.4 0 01-.501.29c-.447.222-.85.629-.997 1.189l-.289 1.105c-.029.11-.101.143-.137.146a3.5 3.5 0 01-1.142 0c-.036-.003-.108-.037-.137-.146l-.289-1.105a1.87 1.87 0 00-.997-1.189 4.4 4.4 0 01-.501-.29c-.417-.278-.97-.423-1.53-.27l-1.102.303c-.11.03-.175-.016-.195-.046a7.6 7.6 0 01-.571-.99c-.02-.037-.014-.12.058-.196l.814-.806c.28-.354.456-.843.488-1.394a7 7 0 000-.582 1.87 1.87 0 00-.488-1.394l-.814-.806c-.072-.076-.078-.159-.058-.196a7.6 7.6 0 01.571-.99c.02-.03.085-.076.195-.046l1.102.303c.56.153 1.113.008 1.53-.27.16-.107.327-.204.501-.29.447-.222.85-.629.997-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 0a4.9 4.9 0 00-1.635.279c-.566.192-.9.726-1.028 1.214l-.29 1.105a.35.35 0 01-.186.222 5.9 5.9 0 00-.672.39.35.35 0 01-.285.05l-1.103-.303c-.49-.135-1.07-.012-1.433.476a9.1 9.1 0 00-.684 1.186c-.256.521-.194 1.1.114 1.505l.814.806a.35.35 0 01.091.26 5.5 5.5 0 000 .394.35.35 0 01-.091.26l-.814.806c-.308.405-.37.984-.114 1.505.174.354.39.695.684 1.186.363.488.943.611 1.433.476l1.103-.303a.35.35 0 01.285.05c.218.148.444.28.672.39a.35.35 0 01.186.222l.29 1.105c.128.488.462 1.022 1.028 1.214a4.9 4.9 0 003.27 0c.566-.192.9-.726 1.028-1.214l.29-1.105a.35.35 0 01.186-.222 5.9 5.9 0 00.672-.39.35.35 0 01.285-.05l1.103.303c.49.135 1.07.012 1.433-.476.294-.49.51-.832.684-1.186.256-.521.194-1.1-.114-1.505l-.814-.806a.35.35 0 01-.091-.26 5.5 5.5 0 000-.394.35.35 0 01.091-.26l.814-.806c.308-.405.37-.984.114-1.505a9.1 9.1 0 00-.684-1.186c-.363-.488-.943-.611-1.433-.476l-1.103.303a.35.35 0 01-.285-.05 5.9 5.9 0 00-.672-.39.35.35 0 01-.186-.222l-.29-1.105C10.535 1.005 10.201.47 9.635.279A4.9 4.9 0 008 0zM6.5 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8 5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
                Settings
              </span>
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-gg-btn-primary rounded-md hover:bg-gg-btn-primary-hover transition-colors">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
                </svg>
                New Review
              </span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-gg-border mb-6">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-gg-text"
                    : "text-gg-text-secondary hover:text-gg-text"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.badge && (
                    <span className="text-xs bg-gg-surface-overlay text-gg-text-secondary px-1.5 py-0.5 rounded-full leading-none">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gg-brand rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8">
          {/* Left Column (70%) */}
          <div className="flex-1 min-w-0">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "PRs Reviewed Today", value: "12", trend: "+3", trendUp: true, color: "text-gg-text" },
                { label: "Vulnerabilities Found", value: "3", trend: null, trendUp: false, color: "text-gg-danger" },
                { label: "Auto-merged", value: "8", trend: null, trendUp: true, color: "text-gg-brand" },
                { label: "Avg Review Time", value: "2.4m", trend: null, trendUp: true, color: "text-gg-text" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gg-text-secondary">{stat.label}</span>
                    {stat.trend && (
                      <span className="flex items-center gap-0.5 text-xs text-gg-brand">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <path d="M5 2L8 6H2L5 2z" />
                        </svg>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Pinned Repositories */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gg-text-secondary">
                  <path fillRule="evenodd" d="M4.456.734a1.75 1.75 0 012.826.504l.613 1.327a3.08 3.08 0 002.084 1.707l2.454.584c1.332.317 1.8 1.972.832 2.94L11.06 10l.354 3.893c.12 1.339-1.16 2.315-2.353 1.796L6 14.502l-3.06 1.187c-1.192.52-2.473-.457-2.354-1.796L.94 10 .734 7.796c-.968-.968-.5-2.623.832-2.94l2.454-.584a3.08 3.08 0 002.084-1.707l.613-1.327-.261-.504z" />
                </svg>
                <h2 className="text-base font-semibold text-gg-text">Pinned</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {pinnedRepos.map((repo) => (
                  <div
                    key={repo.name}
                    className="bg-gg-surface border border-gg-border rounded-lg p-4 hover:border-gg-border-bright transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Link href="#" className="text-sm font-semibold text-gg-text-link hover:underline">
                        {repo.name}
                      </Link>
                      <span className="text-xs bg-gg-brand-muted text-gg-brand px-2 py-0.5 rounded-full">
                        Monitoring
                      </span>
                    </div>
                    <p className="text-xs text-gg-text-secondary mb-3 line-clamp-1">
                      {repo.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gg-text-secondary">
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: repo.langColor }}
                        />
                        {repo.language}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                          <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                        </svg>
                        {repo.prs} PRs
                      </span>
                      {repo.vulns > 0 && (
                        <span className="flex items-center gap-1 text-gg-danger">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-80">
                            <path fillRule="evenodd" d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" />
                          </svg>
                          {repo.vulns} vulns
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div>
              <h2 className="text-base font-semibold text-gg-text mb-3">Recent Reviews</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gg-text-muted"
                  >
                    <path fillRule="evenodd" d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find a review..."
                    className="w-full bg-gg-surface border border-gg-border rounded-md pl-9 pr-3 py-1.5 text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gg-surface border border-gg-border rounded-md px-3 py-1.5 text-sm text-gg-text-secondary focus:outline-none focus:border-gg-brand appearance-none cursor-pointer"
                >
                  <option value="all">Status: All</option>
                  <option value="approved">Approved</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={repoFilter}
                  onChange={(e) => setRepoFilter(e.target.value)}
                  className="bg-gg-surface border border-gg-border rounded-md px-3 py-1.5 text-sm text-gg-text-secondary focus:outline-none focus:border-gg-brand appearance-none cursor-pointer"
                >
                  <option value="all">Repository</option>
                  <option value="frontend">acme/frontend</option>
                  <option value="api">acme/api-server</option>
                  <option value="ml">acme/ml-pipeline</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gg-surface border border-gg-border rounded-md px-3 py-1.5 text-sm text-gg-text-secondary focus:outline-none focus:border-gg-brand appearance-none cursor-pointer"
                >
                  <option value="recent">Recently reviewed</option>
                  <option value="vulns">Most vulnerabilities</option>
                  <option value="files">Most files changed</option>
                </select>
              </div>

              <div className="border border-gg-border rounded-lg overflow-hidden">
                {filteredPRs.map((pr, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-gg-surface-raised transition-colors ${
                      i > 0 ? "border-t border-gg-border-subtle" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <Link href="#" className="text-sm font-semibold text-gg-text-link hover:underline truncate">
                          {pr.title}
                        </Link>
                      </div>
                      <span className="text-xs text-gg-text-secondary">{pr.repo}</span>
                      <p className="text-xs text-gg-text-secondary mt-0.5 truncate">
                        {pr.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gg-text-secondary">
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: pr.langColor }}
                          />
                          {pr.language}
                        </span>
                        <span>Reviewed {pr.time}</span>
                        {pr.vulns > 0 && (
                          <span className="text-gg-danger">{pr.vulns} vuln{pr.vulns > 1 ? "s" : ""}</span>
                        )}
                        <span>{pr.files} files changed</span>
                      </div>
                    </div>
                    <Sparkline data={pr.sparkline} />
                  </div>
                ))}
                {filteredPRs.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gg-text-muted">
                    No reviews match your search.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar (30%) */}
          <div className="w-72 shrink-0 space-y-6">
            {/* Team */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">People</h3>
              <div className="flex items-center gap-2 mb-2">
                {teamMembers.map((m) => (
                  <div
                    key={m.initials}
                    className="w-10 h-10 rounded-full bg-gg-surface-raised border border-gg-border flex items-center justify-center text-xs font-medium text-gg-text-secondary"
                    title={`${m.name} — ${m.role}`}
                  >
                    {m.initials}
                  </div>
                ))}
              </div>
              <Link href="#" className="text-xs text-gg-text-link hover:underline">
                View all
              </Link>
            </div>

            {/* Top Languages */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">Top languages</h3>
              <ul className="space-y-1.5">
                {topLanguages.map((lang) => (
                  <li key={lang.name} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-sm text-gg-text-secondary">{lang.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Topics */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">Active topics</h3>
              <div className="flex flex-wrap gap-1.5">
                {activeTopics.map((topic) => (
                  <span
                    key={topic}
                    className="bg-gg-accent-muted text-gg-accent text-xs px-2.5 py-1 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xs font-semibold text-gg-text mb-3">Recent activity</h3>
              <ul className="space-y-2">
                {sidebarActivity.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        item.color === "text-gg-brand"
                          ? "bg-gg-brand"
                          : item.color === "text-gg-danger"
                            ? "bg-gg-danger"
                            : item.color === "text-gg-warning"
                              ? "bg-gg-warning"
                              : "bg-gg-text-secondary"
                      }`}
                    />
                    <span className="text-xs text-gg-text-secondary leading-snug">
                      <span className={item.color}>{item.text}</span>
                      <span className="text-gg-text-muted"> · {item.time}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
