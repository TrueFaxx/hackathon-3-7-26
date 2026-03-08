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
    author: "GitGuardian",
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
    author: "GitGuardian",
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
  { type: "review", user: "GitGuardian", time: "2 hours ago", detail: "started an automated review" },
  { type: "comment", user: "GitGuardian", time: "2 hours ago", detail: "found 2 vulnerabilities and 1 contradiction" },
  { type: "status", user: "CI Pipeline", time: "1.5 hours ago", detail: "All checks passed (4/4)" },
  { type: "review", user: "GitGuardian", time: "1 hour ago", detail: "requested changes" },
  { type: "comment", user: "Sarah Kim", time: "45 min ago", detail: "acknowledged the findings and began fixes" },
  { type: "push", user: "Sarah Kim", time: "20 min ago", detail: "pushed 2 commits" },
  { type: "review", user: "GitGuardian", time: "12 min ago", detail: "re-reviewed latest changes" },
];

function SeverityBadge({ severity }: { severity: string }) {
  const cfg =
    severity === "Critical"
      ? "bg-danger-light text-danger"
      : "bg-warning-light text-warning";
  return <span className={`text-[10px] font-bold px-2.5 py-1 uppercase ${cfg}`}>{severity}</span>;
}

function EventDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    opened: "bg-primary",
    review: "bg-primary",
    comment: "bg-info",
    status: "bg-success",
    push: "bg-warning",
  };
  return (
    <div className={`w-3 h-3 shrink-0 z-10 ${colors[type] || "bg-border-strong"}`} />
  );
}

export default function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"conversation" | "files" | "ai-review">("ai-review");

  const tabItems = [
    { key: "conversation" as const, label: "Conversation" },
    { key: "files" as const, label: "Files Changed" },
    { key: "ai-review" as const, label: "Review" },
  ];

  return (
    <div className="min-h-full">
      <Link
        href="/dashboard/pull-requests"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pull Requests
      </Link>

      <div className="flex items-start gap-3 mb-3">
        <h1 className="text-2xl font-bold text-text">
          Fix authentication middleware vulnerability
        </h1>
        <span className="text-[10px] font-bold px-3 py-1 bg-warning-light text-warning uppercase whitespace-nowrap mt-1">
          Changes Requested
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary mb-8">
        <span className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary flex items-center justify-center text-[10px] font-bold text-text-inverse">
            SK
          </div>
          Sarah Kim
        </span>
        <span className="text-text-muted">acme/backend-api</span>
        <span className="font-mono text-xs bg-inset px-2 py-0.5 text-text-secondary border border-border-subtle">
          fix/auth-middleware &rarr; main
        </span>
        <span className="text-text-muted">Opened 3 hours ago</span>
        <span className="font-mono text-xs text-text-muted">#{id}</span>
      </div>

      <div className="flex gap-1 mb-8">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-text-inverse"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ai-review" && (
        <div className="space-y-8">
          <div className="bg-surface border border-border p-6">
            <h3 className="text-base font-bold text-text mb-3">Review Summary</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              This PR modifies the authentication middleware to fix a reported vulnerability. While the core fix is correct, I found <strong className="text-danger font-bold">2 security vulnerabilities</strong> and{" "}
              <strong className="text-warning font-bold">1 logical contradiction</strong> that should be resolved before merging.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-text mb-4">Vulnerabilities Found</h3>
            <div className="space-y-4">
              {vulnerabilities.map((vuln, i) => (
                <div key={i} className="bg-surface border border-border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <SeverityBadge severity={vuln.severity} />
                    <span className="text-sm font-bold text-text">{vuln.title}</span>
                  </div>
                  <p className="text-xs font-mono text-text-muted mb-3 bg-inset px-2.5 py-1 inline-block border border-border-subtle">
                    {vuln.file}
                  </p>
                  <p className="text-sm text-text-secondary mb-4">{vuln.description}</p>
                  <div>
                    <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Suggested Fix</p>
                    <div className="bg-bg-dark p-4 font-mono text-sm text-[#e1e4e8]">
                      {vuln.suggestedFix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-text mb-4">Contradictions</h3>
            {contradictions.map((c, i) => (
              <div key={i} className="bg-surface border border-border p-6">
                <p className="text-sm font-bold text-text mb-2">{c.title}</p>
                <p className="text-sm text-text-secondary mb-3">{c.description}</p>
                <div className="flex gap-2">
                  {c.files.map((f) => (
                    <span key={f} className="text-xs font-mono text-text-muted bg-inset px-2.5 py-1 border border-border-subtle">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-base font-bold text-text mb-4">Comments</h3>
            <div className="space-y-4">
              {reviewComments.map((comment, i) => (
                <div key={i} className="bg-surface border border-border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold ${
                        comment.type === "ai"
                          ? "bg-primary text-text-inverse"
                          : "bg-surface-raised text-text-secondary border border-border"
                      }`}
                    >
                      {comment.avatar}
                    </div>
                    <span className="text-sm font-bold text-text">{comment.author}</span>
                    <span className="text-xs text-text-muted">{comment.time}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{comment.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm text-text-secondary font-mono">src/middleware/auth.ts</span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-success font-bold">+24</span>
              <span className="text-danger font-bold">-8</span>
            </div>
          </div>
          <div className="font-mono text-xs leading-6 overflow-x-auto bg-inset">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={`flex ${
                  line.type === "add"
                    ? "bg-success-light text-success"
                    : line.type === "delete"
                      ? "bg-danger-light text-danger"
                      : "text-text-secondary"
                }`}
              >
                <span className="w-12 text-right px-2 select-none text-text-muted border-r border-border-subtle shrink-0">
                  {line.num[0] ?? ""}
                </span>
                <span className="w-12 text-right px-2 select-none text-text-muted border-r border-border-subtle shrink-0">
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
        <div className="space-y-0 pl-2">
          {conversationEvents.map((event, i) => (
            <div key={i} className="flex gap-4 relative items-start">
              {i < conversationEvents.length - 1 && (
                <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border" />
              )}
              <EventDot type={event.type} />
              <div className="pb-6 flex-1 -mt-0.5">
                <p className="text-sm text-text">
                  <span className="font-bold">{event.user}</span>{" "}
                  <span className="text-text-secondary">{event.detail}</span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
