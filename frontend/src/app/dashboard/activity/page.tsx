"use client";

import { useState } from "react";
import Link from "next/link";

const filters = ["All", "Reviews", "Merges", "Security", "System"] as const;
type Filter = (typeof filters)[number];

const activities = [
  {
    type: "review",
    category: "Reviews" as const,
    text: "AI reviewed PR #142 — Fix authentication middleware vulnerability",
    pr: 142,
    repo: "acme/backend-api",
    time: "2 min ago",
  },
  {
    type: "vuln",
    category: "Security" as const,
    text: "SQL injection vulnerability detected in src/api/users.ts",
    pr: 142,
    repo: "acme/backend-api",
    time: "2 min ago",
  },
  {
    type: "merge",
    category: "Merges" as const,
    text: "Auto-merged PR #139 — Bump eslint-config from 4.2.0 to 5.0.1",
    pr: 139,
    repo: "acme/shared-utils",
    time: "8 min ago",
  },
  {
    type: "review",
    category: "Reviews" as const,
    text: "AI reviewed PR #141 — Add rate limiting to public endpoints",
    pr: 141,
    repo: "acme/backend-api",
    time: "22 min ago",
  },
  {
    type: "system",
    category: "System" as const,
    text: "Webhook delivery to Slack succeeded (attempt 1/3)",
    pr: null,
    repo: null,
    time: "30 min ago",
  },
  {
    type: "merge",
    category: "Merges" as const,
    text: "Auto-merged PR #138 — Fix typo in README documentation",
    pr: 138,
    repo: "acme/shared-utils",
    time: "34 min ago",
  },
  {
    type: "review",
    category: "Reviews" as const,
    text: "AI reviewed PR #140 — Update React to v19 and fix breaking changes",
    pr: 140,
    repo: "acme/frontend-app",
    time: "45 min ago",
  },
  {
    type: "vuln",
    category: "Security" as const,
    text: "Hardcoded secret detected in src/config/database.ts",
    pr: 140,
    repo: "acme/frontend-app",
    time: "45 min ago",
  },
  {
    type: "system",
    category: "System" as const,
    text: "Repository acme/webhook-service connected successfully",
    pr: null,
    repo: "acme/webhook-service",
    time: "1 hr ago",
  },
  {
    type: "merge",
    category: "Merges" as const,
    text: "Auto-merged PR #136 — Bump eslint to latest stable",
    pr: 136,
    repo: "acme/shared-utils",
    time: "1.5 hr ago",
  },
  {
    type: "review",
    category: "Reviews" as const,
    text: "AI reviewed PR #137 — Implement dark mode toggle component",
    pr: 137,
    repo: "acme/frontend-app",
    time: "2 hr ago",
  },
  {
    type: "system",
    category: "System" as const,
    text: "Review model updated to Claude 3.5 Sonnet (latency improved by 18%)",
    pr: null,
    repo: null,
    time: "3 hr ago",
  },
];

function ActivityIcon({ type }: { type: string }) {
  if (type === "review") {
    return (
      <div className="w-9 h-9 rounded-full bg-gg-brand-muted flex items-center justify-center text-gg-brand shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
    );
  }
  if (type === "merge") {
    return (
      <div className="w-9 h-9 rounded-full bg-gg-accent-muted flex items-center justify-center text-gg-accent shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    );
  }
  if (type === "vuln") {
    return (
      <div className="w-9 h-9 rounded-full bg-gg-danger-muted flex items-center justify-center text-gg-danger shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gg-surface-raised flex items-center justify-center text-gg-text-muted shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
}

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = activities.filter(
    (a) => activeFilter === "All" || a.category === activeFilter
  );

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1
          className="text-[24px] text-gg-text mb-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Activity Log
        </h1>

        <div className="flex gap-1.5 mb-8">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-150 ${
                activeFilter === f
                  ? "bg-gg-btn-primary text-gg-inset font-medium"
                  : "bg-gg-btn text-gg-text-secondary border border-gg-border hover:bg-gg-btn-hover"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gg-border" />

          <div className="space-y-0">
            {filtered.length === 0 && (
              <div className="pl-14 py-16 text-center text-gg-text-muted text-sm">
                No activity matching this filter.
              </div>
            )}
            {filtered.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 py-4 relative hover:bg-gg-surface-raised px-1 rounded-lg transition-colors duration-150"
              >
                <div className="relative z-10">
                  <ActivityIcon type={item.type} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-gg-text">{item.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gg-text-muted flex-wrap">
                    {item.repo && <span>{item.repo}</span>}
                    {item.pr && (
                      <>
                        <span>·</span>
                        <Link
                          href={`/dashboard/pull-requests/${item.pr}`}
                          className="text-gg-text-link hover:underline font-medium"
                        >
                          PR #{item.pr}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gg-text-muted whitespace-nowrap shrink-0 pt-1.5">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
