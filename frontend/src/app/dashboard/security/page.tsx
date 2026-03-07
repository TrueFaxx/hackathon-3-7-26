"use client";

import Link from "next/link";

const summaryCards = [
  { label: "Critical", count: 3, color: "text-gg-danger", bg: "bg-gg-danger-muted", border: "border-gg-danger/20" },
  { label: "High", count: 7, color: "text-gg-warning", bg: "bg-gg-warning-muted", border: "border-gg-warning/20" },
  { label: "Medium", count: 12, color: "text-gg-info", bg: "bg-gg-info-muted", border: "border-gg-info/20" },
];

const vulnerabilities = [
  {
    severity: "Critical",
    type: "SQL Injection",
    file: "src/api/users.ts:42",
    pr: { id: 142, title: "Fix auth middleware" },
    description: "User-supplied input passed directly into SQL query without parameterization.",
    suggestedFix: "Use parameterized queries instead of string interpolation.",
    status: "Open" as const,
  },
  {
    severity: "Critical",
    type: "Remote Code Execution",
    file: "src/utils/template.ts:18",
    pr: { id: 138, title: "Update template engine" },
    description: "User input evaluated via eval() in template rendering function.",
    suggestedFix: "Replace eval() with a safe template engine like Handlebars or use Function constructor with strict sandboxing.",
    status: "Open" as const,
  },
  {
    severity: "Critical",
    type: "Hardcoded Secret",
    file: "src/config/database.ts:5",
    pr: { id: 140, title: "Update React to v19" },
    description: "Database password hardcoded in source file instead of using environment variable.",
    suggestedFix: "Move secret to environment variables and reference via process.env.DB_PASSWORD.",
    status: "Resolved" as const,
  },
  {
    severity: "High",
    type: "Cross-Site Scripting (XSS)",
    file: "src/components/Comment.tsx:31",
    pr: { id: 141, title: "Add rate limiting" },
    description: "Rendering user-generated HTML content without sanitization using dangerouslySetInnerHTML.",
    suggestedFix: "Use DOMPurify or a similar library to sanitize HTML before rendering.",
    status: "Open" as const,
  },
  {
    severity: "High",
    type: "Insecure JWT Verification",
    file: "src/middleware/auth.ts:87",
    pr: { id: 142, title: "Fix auth middleware" },
    description: "JWT tokens decoded without signature verification on the refresh endpoint.",
    suggestedFix: "Use jwt.verify() instead of jwt.decode() to ensure token integrity.",
    status: "Open" as const,
  },
  {
    severity: "High",
    type: "Path Traversal",
    file: "src/api/files.ts:23",
    pr: { id: 137, title: "Dark mode toggle" },
    description: "User-supplied filename used to read files without path validation.",
    suggestedFix: "Validate and sanitize file paths. Use path.resolve() and ensure the result is within the allowed directory.",
    status: "Dismissed" as const,
  },
  {
    severity: "Medium",
    type: "Missing Rate Limiting",
    file: "src/api/auth.ts:15",
    pr: { id: 141, title: "Add rate limiting" },
    description: "Login endpoint has no rate limiting, enabling brute force attacks.",
    suggestedFix: "Add express-rate-limit middleware with appropriate window and max request settings.",
    status: "Open" as const,
  },
  {
    severity: "Medium",
    type: "Insecure Cookie Settings",
    file: "src/middleware/session.ts:8",
    pr: { id: 139, title: "Bump eslint" },
    description: "Session cookie missing Secure, HttpOnly, and SameSite attributes.",
    suggestedFix: "Set cookie options: { secure: true, httpOnly: true, sameSite: 'strict' }.",
    status: "Resolved" as const,
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const cfg =
    severity === "Critical"
      ? "bg-gg-danger-muted text-gg-danger"
      : severity === "High"
        ? "bg-gg-warning-muted text-gg-warning"
        : "bg-gg-info-muted text-gg-info";
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg}`}>{severity}</span>;
}

function StatusPill({ status }: { status: "Open" | "Resolved" | "Dismissed" }) {
  const cfg =
    status === "Open"
      ? "bg-gg-brand-muted text-gg-brand"
      : status === "Resolved"
        ? "bg-gg-accent-muted text-gg-accent"
        : "bg-gg-surface-raised text-gg-text-muted";
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg}`}>{status}</span>;
}

export default function SecurityPage() {
  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1
          className="text-[24px] text-gg-text mb-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Security Overview
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-xl p-6 text-center hover:border-gg-border-bright transition-all duration-150`}
            >
              <div className={`text-4xl font-bold ${card.color} mb-2`}>{card.count}</div>
              <div className={`text-sm font-semibold ${card.color}`}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-gg-surface rounded-xl border border-gg-border hover:border-gg-border-bright transition-all duration-150">
          <div className="px-6 py-5 border-b border-gg-border">
            <h2
              className="text-lg text-gg-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent Vulnerabilities
            </h2>
          </div>
          <div className="divide-y divide-gg-border-subtle">
            {vulnerabilities.map((vuln, i) => (
              <div key={i} className="px-6 py-5 hover:bg-gg-surface-raised transition-colors duration-150">
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <SeverityBadge severity={vuln.severity} />
                  <span className="text-sm font-semibold text-gg-text">{vuln.type}</span>
                  <StatusPill status={vuln.status} />
                  <span className="ml-auto text-xs font-mono text-gg-text-muted bg-gg-inset px-2.5 py-1 rounded-md border border-gg-border-subtle">
                    {vuln.file}
                  </span>
                </div>
                <p className="text-sm text-gg-text-secondary mb-3">{vuln.description}</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="bg-gg-brand-subtle border border-gg-brand/10 rounded-lg px-4 py-3 flex-1">
                    <p className="text-xs text-gg-text-secondary">
                      <span className="text-gg-brand font-semibold">Fix: </span>
                      {vuln.suggestedFix}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/pull-requests/${vuln.pr.id}`}
                    className="text-xs font-medium text-gg-text-link hover:underline whitespace-nowrap shrink-0"
                  >
                    PR #{vuln.pr.id}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
