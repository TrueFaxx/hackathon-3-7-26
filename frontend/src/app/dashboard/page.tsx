"use client";

import Link from "next/link";

const statCards = [
  {
    label: "PRs Reviewed Today",
    value: 12,
    trend: "+20%",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    valueColor: "text-gg-text",
    trendColor: "text-gg-brand",
  },
  {
    label: "Open PRs",
    value: 5,
    trend: "Active",
    trendUp: null,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    valueColor: "text-gg-info",
    trendColor: "text-gg-info",
  },
  {
    label: "Vulnerabilities",
    value: 3,
    trend: "Critical",
    trendUp: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    valueColor: "text-gg-danger",
    trendColor: "text-gg-danger",
  },
  {
    label: "Auto-merged",
    value: 8,
    trend: "Healthy",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    valueColor: "text-gg-brand",
    trendColor: "text-gg-brand",
  },
];

const recentActivity = [
  { type: "review", text: "AI reviewed PR #142 in", repo: "frontend/auth-module", time: "2 min ago" },
  { type: "merge", text: "Auto-merged PR #139 —", repo: "Update deps", time: "8 min ago" },
  { type: "vuln", text: "SQL injection found in", repo: "api/users.ts", time: "15 min ago" },
  { type: "review", text: "AI reviewed PR #141 in", repo: "backend/api", time: "22 min ago" },
  { type: "merge", text: "Auto-merged PR #138 —", repo: "Fix typo in README", time: "34 min ago" },
  { type: "review", text: "AI reviewed PR #140 in", repo: "shared/utils", time: "45 min ago" },
  { type: "vuln", text: "Hardcoded secret in", repo: "config.ts", time: "1 hr ago" },
  { type: "merge", text: "Auto-merged PR #136 —", repo: "Bump eslint", time: "1.5 hr ago" },
];

const accuracyData = [
  { day: "Mon", value: 96 },
  { day: "Tue", value: 94 },
  { day: "Wed", value: 99 },
  { day: "Thu", value: 95 },
  { day: "Fri", value: 98 },
];

function ActivityIcon({ type }: { type: string }) {
  if (type === "review") {
    return (
      <div className="w-8 h-8 rounded-full bg-gg-brand-muted flex items-center justify-center text-gg-brand shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
    );
  }
  if (type === "merge") {
    return (
      <div className="w-8 h-8 rounded-full bg-gg-accent-muted flex items-center justify-center text-gg-accent shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gg-danger-muted flex items-center justify-center text-gg-danger shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1
          className="text-[24px] text-gg-text mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-gg-text-secondary mb-8">Good morning, guardian.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-gg-surface border border-gg-border rounded-xl p-5 hover:border-gg-border-bright transition-all duration-150"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-gg-text-muted">{card.icon}</div>
                {card.trendUp === true && (
                  <span className={`text-xs font-medium ${card.trendColor} bg-gg-brand-muted px-2.5 py-1 rounded-full flex items-center gap-1`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {card.trend}
                  </span>
                )}
                {card.trendUp === false && (
                  <span className="text-xs font-medium bg-gg-danger-muted text-gg-danger px-2.5 py-1 rounded-full">
                    {card.trend}
                  </span>
                )}
                {card.trendUp === null && (
                  <span className="text-xs font-medium bg-gg-info-muted text-gg-info px-2.5 py-1 rounded-full">
                    {card.trend}
                  </span>
                )}
              </div>
              <div className={`text-3xl font-bold ${card.valueColor} mb-1`}>{card.value}</div>
              <div className="text-sm text-gg-text-secondary">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-gg-surface rounded-xl border border-gg-border hover:border-gg-border-bright transition-all duration-150">
            <div className="px-6 py-5 border-b border-gg-border flex items-center justify-between">
              <h2
                className="text-lg text-gg-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recent Activity
              </h2>
              <Link href="/dashboard/activity" className="text-xs text-gg-brand hover:text-gg-brand-dim font-medium transition-colors duration-150">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gg-border-subtle">
              {recentActivity.map((item, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gg-surface-raised transition-colors duration-150">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gg-text truncate">
                      {item.text} <span className="text-gg-text-secondary">{item.repo}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gg-text-muted whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-gg-surface rounded-xl border border-gg-border hover:border-gg-border-bright transition-all duration-150">
            <div className="px-6 py-5 border-b border-gg-border">
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg text-gg-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Review Accuracy
                </h2>
                <span className="text-xs text-gg-text-secondary">This Week</span>
              </div>
              <p className="text-3xl font-bold text-gg-brand mt-2">97.3%</p>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between gap-3 h-36">
                {accuracyData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gg-text-secondary">{d.value}%</span>
                    <div className="w-full bg-gg-border-subtle rounded-t-md relative" style={{ height: "100%" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gg-brand rounded-t-md transition-all duration-500"
                        style={{ height: `${d.value}%` }}
                      />
                    </div>
                    <span className="text-xs text-gg-text-muted font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
