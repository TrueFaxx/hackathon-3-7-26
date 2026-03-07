"use client";

import { use, useState } from "react";
import Link from "next/link";

const vulnerabilities = [
  {
    severity: "Critical",
    title: "SQL Injection via unsanitized user input",
    file: "src/api/users.ts:42",
    description:
      "User-supplied input is passed directly into a SQL query without parameterization, allowing an attacker to inject arbitrary SQL commands.",
    suggestedFix:
      "db.query('SELECT * FROM users WHERE id = $1', [id])",
  },
  {
    severity: "High",
    title: "JWT token not validated on refresh endpoint",
    file: "src/middleware/auth.ts:87",
    description:
      "The /auth/refresh endpoint accepts expired tokens without verifying the signature, enabling token forgery attacks.",
    suggestedFix:
      "jwt.verify(token, secret, { ignoreExpiration: false })",
  },
];

const contradictions = [
  {
    title: "Conflicting error handling strategies",
    description:
      "Lines 23-30 use try/catch with custom error classes, but lines 45-52 use a global error middleware pattern. This inconsistency may cause errors to be swallowed silently.",
    files: ["src/api/users.ts:23-30", "src/middleware/error.ts:45-52"],
  },
];

const reviewComments = [
  {
    author: "GitGuardian AI",
    avatar: "GG",
    time: "12 min ago",
    body: "The authentication middleware has several security concerns that should be addressed before merging. I've identified 2 vulnerabilities and 1 logical contradiction in the implementation.",
    type: "ai",
  },
  {
    author: "Sarah Kim",
    avatar: "SK",
    time: "8 min ago",
    body: "Thanks for the detailed review! I'll fix the SQL injection issue first. The JWT validation was intentional for backwards compat but I agree it's risky.",
    type: "human",
  },
  {
    author: "GitGuardian AI",
    avatar: "GG",
    time: "5 min ago",
    body: "Regarding backwards compatibility: consider adding a deprecation period where both validated and unvalidated refresh work, with logging for unvalidated calls. This gives consumers time to migrate.",
    type: "ai",
  },
];

const diffLines = [
  { type: "context", num: [38, 38], content: "export async function authenticateRequest(req: Request) {" },
  { type: "context", num: [39, 39], content: "  const token = req.headers.get('authorization')?.split(' ')[1];" },
  { type: "context", num: [40, 40], content: "" },
  { type: "delete", num: [41, null], content: "  const user = await db.query(`SELECT * FROM users WHERE id = ${req.userId}`);" },
  { type: "add", num: [null, 41], content: "  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);" },
  { type: "context", num: [42, 42], content: "" },
  { type: "delete", num: [43, null], content: "  if (!token) return null;" },
  { type: "add", num: [null, 43], content: "  if (!token) {" },
  { type: "add", num: [null, 44], content: "    throw new AuthenticationError('Missing bearer token');" },
  { type: "add", num: [null, 45], content: "  }" },
  { type: "context", num: [44, 46], content: "" },
  { type: "context", num: [45, 47], content: "  try {" },
  { type: "delete", num: [46, null], content: "    const decoded = jwt.decode(token);" },
  { type: "add", num: [null, 48], content: "    const decoded = jwt.verify(token, process.env.JWT_SECRET);" },
  { type: "context", num: [47, 49], content: "    return { userId: decoded.sub, role: decoded.role };" },
  { type: "context", num: [48, 50], content: "  } catch (err) {" },
  { type: "delete", num: [49, null], content: "    return null;" },
  { type: "add", num: [null, 51], content: "    throw new AuthenticationError('Invalid or expired token');" },
  { type: "context", num: [50, 52], content: "  }" },
  { type: "context", num: [51, 53], content: "}" },
];

const conversationEvents = [
  { type: "opened", user: "Sarah Kim", time: "3 hours ago", detail: "opened this pull request" },
  { type: "review", user: "GitGuardian AI", time: "2 hours ago", detail: "started an automated review" },
  { type: "comment", user: "GitGuardian AI", time: "2 hours ago", detail: "found 2 vulnerabilities and 1 contradiction" },
  { type: "status", user: "CI Pipeline", time: "1.5 hours ago", detail: "All checks passed (4/4)" },
  { type: "review", user: "GitGuardian AI", time: "1 hour ago", detail: "requested changes" },
  { type: "comment", user: "Sarah Kim", time: "45 min ago", detail: "acknowledged the findings and began fixes" },
  { type: "push", user: "Sarah Kim", time: "20 min ago", detail: "pushed 2 commits" },
  { type: "review", user: "GitGuardian AI", time: "12 min ago", detail: "re-reviewed latest changes" },
];

function SeverityBadge({ severity }: { severity: string }) {
  const cfg =
    severity === "Critical"
      ? "bg-gg-danger-muted text-gg-danger"
      : "bg-gg-warning-muted text-gg-warning";
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg}`}>{severity}</span>;
}

function EventIcon({ type }: { type: string }) {
  const icons: Record<string, { bg: string; color: string; svg: React.ReactNode }> = {
    opened: {
      bg: "bg-gg-brand-muted",
      color: "text-gg-brand",
      svg: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
    },
    review: {
      bg: "bg-gg-purple-muted",
      color: "text-gg-purple",
      svg: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    comment: {
      bg: "bg-gg-info-muted",
      color: "text-gg-info",
      svg: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    status: {
      bg: "bg-gg-brand-muted",
      color: "text-gg-brand",
      svg: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    push: {
      bg: "bg-gg-warning-muted",
      color: "text-gg-warning",
      svg: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
  };
  const i = icons[type] || icons.status;
  return (
    <div className={`w-8 h-8 rounded-full ${i.bg} ${i.color} flex items-center justify-center shrink-0 z-10`}>
      {i.svg}
    </div>
  );
}

export default function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"conversation" | "files" | "ai-review">("ai-review");

  const tabItems = [
    { key: "conversation" as const, label: "Conversation" },
    { key: "files" as const, label: "Files Changed" },
    { key: "ai-review" as const, label: "AI Review" },
  ];

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <Link
          href="/dashboard/pull-requests"
          className="inline-flex items-center gap-1.5 text-sm text-gg-text-muted hover:text-gg-brand transition-colors duration-150 mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pull Requests
        </Link>

        <div className="flex items-start gap-3 mb-3">
          <h1
            className="text-[24px] text-gg-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fix authentication middleware vulnerability
          </h1>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gg-warning-muted text-gg-warning whitespace-nowrap mt-1">
            Changes Requested
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gg-text-secondary mb-8">
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gg-surface-raised flex items-center justify-center text-[10px] font-semibold text-gg-text-secondary">
              SK
            </div>
            Sarah Kim
          </span>
          <span className="text-gg-text-muted">acme/backend-api</span>
          <span className="font-mono text-xs bg-gg-inset px-2 py-0.5 rounded-md text-gg-text-secondary border border-gg-border-subtle">
            fix/auth-middleware → main
          </span>
          <span className="text-gg-text-muted">Opened 3 hours ago</span>
          <span className="font-mono text-xs text-gg-text-muted">#{id}</span>
        </div>

        <div className="flex gap-1.5 mb-8">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 text-sm rounded-full transition-all duration-150 ${
                activeTab === tab.key
                  ? "bg-gg-btn-primary text-gg-inset font-medium"
                  : "bg-gg-btn text-gg-text-secondary border border-gg-border hover:bg-gg-btn-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "ai-review" && (
          <div className="space-y-6">
            <div className="bg-gg-surface rounded-xl border border-gg-border p-5 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-gg-brand-muted flex items-center justify-center">
                  <svg className="w-4 h-4 text-gg-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-4.06.644L9 16m10-1.5V19a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 19v-4.5" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gg-text">AI Review Summary</h3>
              </div>
              <p className="text-sm text-gg-text-secondary leading-relaxed">
                This PR modifies the authentication middleware to fix a reported vulnerability. While the core fix is correct, I found <strong className="text-gg-danger">2 security vulnerabilities</strong> and{" "}
                <strong className="text-gg-warning">1 logical contradiction</strong> that should be resolved before merging. The SQL injection fix is critical and must be addressed immediately.
              </p>
            </div>

            <div>
              <h3
                className="text-lg text-gg-text mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg className="w-5 h-5 text-gg-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vulnerabilities Found
              </h3>
              <div className="space-y-4">
                {vulnerabilities.map((vuln, i) => (
                  <div
                    key={i}
                    className="bg-gg-surface rounded-xl border border-gg-border p-5 hover:border-gg-border-bright transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <SeverityBadge severity={vuln.severity} />
                      <span className="text-sm font-semibold text-gg-text">{vuln.title}</span>
                    </div>
                    <p className="text-xs font-mono text-gg-text-muted mb-3 bg-gg-inset px-2.5 py-1 rounded-md inline-block border border-gg-border-subtle">
                      {vuln.file}
                    </p>
                    <p className="text-sm text-gg-text-secondary mb-4">{vuln.description}</p>
                    <div>
                      <p className="text-xs font-semibold text-gg-brand mb-2">Suggested Fix</p>
                      <div className="bg-gg-inset rounded-md p-3 font-mono text-sm text-gg-text-secondary border border-gg-border-subtle">
                        {vuln.suggestedFix}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3
                className="text-lg text-gg-text mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg className="w-5 h-5 text-gg-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Contradictions
              </h3>
              {contradictions.map((c, i) => (
                <div
                  key={i}
                  className="bg-gg-surface rounded-xl border border-gg-border p-5 hover:border-gg-border-bright transition-all duration-150"
                >
                  <p className="text-sm font-semibold text-gg-text mb-2">{c.title}</p>
                  <p className="text-sm text-gg-text-secondary mb-3">{c.description}</p>
                  <div className="flex gap-2">
                    {c.files.map((f) => (
                      <span key={f} className="text-xs font-mono text-gg-text-muted bg-gg-inset px-2.5 py-1 rounded-md border border-gg-border-subtle">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3
                className="text-lg text-gg-text mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Comments
              </h3>
              <div className="space-y-4">
                {reviewComments.map((comment, i) => (
                  <div
                    key={i}
                    className="bg-gg-surface rounded-xl border border-gg-border p-5 hover:border-gg-border-bright transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                          comment.type === "ai"
                            ? "bg-gg-brand-muted text-gg-brand"
                            : "bg-gg-surface-raised text-gg-text-secondary"
                        }`}
                      >
                        {comment.avatar}
                      </div>
                      <span className="text-sm font-medium text-gg-text">{comment.author}</span>
                      <span className="text-xs text-gg-text-muted">{comment.time}</span>
                    </div>
                    <p className="text-sm text-gg-text-secondary leading-relaxed">{comment.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="bg-gg-surface rounded-xl border border-gg-border overflow-hidden hover:border-gg-border-bright transition-all duration-150">
            <div className="px-5 py-4 border-b border-gg-border flex items-center justify-between">
              <span className="text-sm text-gg-text-secondary font-mono">src/middleware/auth.ts</span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-gg-brand">+24</span>
                <span className="text-gg-danger">-8</span>
              </div>
            </div>
            <div className="font-mono text-xs leading-6 overflow-x-auto bg-gg-inset">
              {diffLines.map((line, i) => (
                <div
                  key={i}
                  className={`flex ${
                    line.type === "add"
                      ? "bg-gg-brand-subtle text-gg-brand"
                      : line.type === "delete"
                        ? "bg-gg-danger-muted text-gg-danger"
                        : "text-gg-text-secondary"
                  }`}
                >
                  <span className="w-12 text-right px-2 select-none text-gg-text-muted border-r border-gg-border-subtle shrink-0">
                    {line.num[0] ?? ""}
                  </span>
                  <span className="w-12 text-right px-2 select-none text-gg-text-muted border-r border-gg-border-subtle shrink-0">
                    {line.num[1] ?? ""}
                  </span>
                  <span className="w-6 text-center select-none shrink-0">
                    {line.type === "add" ? "+" : line.type === "delete" ? "-" : " "}
                  </span>
                  <span className="pr-4">{line.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "conversation" && (
          <div className="space-y-0 pl-1">
            {conversationEvents.map((event, i) => (
              <div key={i} className="flex gap-3 relative">
                {i < conversationEvents.length - 1 && (
                  <div className="absolute left-[15px] top-9 bottom-0 w-px bg-gg-border" />
                )}
                <EventIcon type={event.type} />
                <div className="pb-6 flex-1">
                  <p className="text-sm text-gg-text">
                    <span className="font-medium">{event.user}</span>{" "}
                    <span className="text-gg-text-secondary">{event.detail}</span>
                  </p>
                  <p className="text-xs text-gg-text-muted mt-0.5">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
