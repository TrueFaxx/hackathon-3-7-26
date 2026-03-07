"use client";

import { useState } from "react";
import Link from "next/link";

const ShieldIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 2L4 7v9c0 7.5 5.1 14.5 12 16 6.9-1.5 12-8.5 12-16V7L16 2z"
      fill="rgba(16,185,129,0.15)"
      stroke="#10b981"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M11 16l3.5 3.5L21 12"
      stroke="#10b981"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-gg-brand mt-0.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PricingCheck = () => (
  <svg
    className="w-4 h-4 text-gg-brand mt-0.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─── FAQ Data ─── */
const faqItems = [
  {
    q: "Does GitGuardian store my source code?",
    a: "No. GitGuardian processes diffs in memory during review and never persists your source code. All analysis happens ephemerally — once the review is posted, the code is discarded. We are SOC 2 Type II compliant.",
  },
  {
    q: "Which languages and frameworks are supported?",
    a: "GitGuardian supports TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP, Swift, and Kotlin out of the box. Framework-specific rules cover React, Next.js, Django, Rails, Spring Boot, and more. We add new language support monthly.",
  },
  {
    q: "How does auto-merge decide what's safe?",
    a: "Auto-merge uses a composite risk score based on code complexity, test coverage delta, dependency changes, and security scan results. You configure the threshold — only PRs that pass every check and fall below your risk ceiling get merged automatically.",
  },
  {
    q: "Can I customize the review rules?",
    a: "Absolutely. You can create custom rule sets in YAML, disable specific checks, adjust severity levels, and scope rules to specific directories or file types. Pro and Enterprise plans support organization-wide rule inheritance.",
  },
  {
    q: "Does it work with GitHub Enterprise and self-hosted runners?",
    a: "Yes. Our Enterprise plan includes a self-hosted option that runs entirely within your infrastructure. It works with GitHub Enterprise Server, GitHub Enterprise Cloud, and custom CI runners.",
  },
  {
    q: "What happens if GitGuardian flags a false positive?",
    a: "You can dismiss any finding with a single comment. GitGuardian learns from dismissals within your organization and reduces false positives over time. You can also add inline ignore directives for specific rules.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gg-bg text-gg-text">
      {/* ══════════════════════════════════════════════
          1. NAVBAR
      ══════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gg-bg/80 backdrop-blur-md border-b border-gg-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ShieldIcon className="w-7 h-7" />
              <span className="text-[18px] font-bold tracking-tight text-gg-text">
                GitGuardian
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Pricing</a>
              <a href="#" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Docs</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
              >
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-gg-text-secondary hover:text-gg-text"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gg-border bg-gg-bg">
            <div className="px-5 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gg-text-secondary hover:text-gg-text">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gg-text-secondary hover:text-gg-text">How it Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gg-text-secondary hover:text-gg-text">Pricing</a>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gg-text-secondary hover:text-gg-text">Docs</a>
              <hr className="border-gg-border" />
              <Link href="/login" className="block text-sm text-gg-text-secondary hover:text-gg-text">Sign in</Link>
              <Link href="/signup" className="block text-sm font-semibold text-gg-brand">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════
          2. HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gg-bg">
        <div className="absolute inset-0 grid-bg opacity-[0.03]" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-20 pb-12 text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gg-brand-muted border border-gg-brand/30 mb-8">
              <svg className="w-3.5 h-3.5 text-gg-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-gg-brand">Now with autonomous testing</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gg-text leading-[1.05] animate-fade-in stagger-1">
            Your code deserves
            <br />
            <span className="text-gg-brand">a guardian</span>
          </h1>

          <p className="mt-6 text-lg text-gg-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2">
            GitGuardian reviews every pull request with AI precision — catching bugs,
            vulnerabilities, and anti-patterns before they reach production.
            Then auto-merges the safe ones.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in stagger-3">
            <Link
              href="/signup"
              className="px-6 py-3 text-base font-semibold rounded-lg bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
            >
              Start for free
            </Link>
            <a
              href="#code-review"
              className="px-6 py-3 text-base font-medium rounded-lg bg-gg-btn border border-gg-btn-border text-gg-text hover:bg-gg-btn-hover transition-colors"
            >
              See it in action
            </a>
          </div>

          <p className="mt-8 text-sm text-gg-text-muted animate-fade-in stagger-4">
            Trusted by 500+ engineering teams &nbsp;·&nbsp; Vercel &nbsp;·&nbsp; Linear &nbsp;·&nbsp; Supabase &nbsp;·&nbsp; Resend &nbsp;·&nbsp; Planetscale
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. CODE REVIEW VISUAL
      ══════════════════════════════════════════════ */}
      <section id="code-review" className="relative bg-gg-bg pb-24 -mt-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="rounded-xl border border-gg-border overflow-hidden glow-border animate-glow animate-slide-up">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gg-inset border-b border-gg-border rounded-t-xl">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-gg-text-secondary font-mono">auth-middleware.ts</span>
            </div>

            {/* Diff */}
            <div className="font-mono text-sm leading-6 bg-gg-surface">
              <div className="px-4 py-0.5 text-gg-text-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">14</span>
                {"  "}import {"{ createClient }"} from &apos;@supabase/supabase-js&apos;;
              </div>
              <div className="px-4 py-0.5 text-gg-text-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">15</span>
                {"  "}
              </div>
              <div className="px-4 py-0.5 text-gg-text-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">16</span>
                {"  "}export async function getUser(req: Request) {"{"}
              </div>
              <div className="px-4 py-0.5 bg-[rgba(248,81,73,0.1)]">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">17</span>
                <span className="text-gg-danger">{"−  const userQuery = `SELECT * FROM users WHERE id = '${req.params.id}'`;"}</span>
              </div>
              <div className="px-4 py-0.5 bg-[rgba(248,81,73,0.1)]">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">18</span>
                <span className="text-gg-danger">{"−  const result = await db.raw(userQuery);"}</span>
              </div>
              <div className="px-4 py-0.5 bg-gg-brand-subtle">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">17</span>
                <span className="text-gg-brand">{"+ const result = await db('users').where('id', req.params.id).first();"}</span>
              </div>
              <div className="px-4 py-0.5 text-gg-text-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">18</span>
                {"  "}return result;
              </div>
              <div className="px-4 py-0.5 text-gg-text-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">19</span>
                {"}"}
              </div>
            </div>

            {/* Review comment */}
            <div className="mx-4 my-4 rounded-lg border border-gg-border bg-gg-surface-raised p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold text-gg-brand">GitGuardian</span>
                <span className="text-xs text-gg-text-muted">left a review 2 min ago</span>
              </div>
              <p className="text-sm text-gg-text-secondary leading-relaxed mb-3">
                <strong className="text-gg-danger">Critical:</strong> SQL injection vulnerability detected in{" "}
                <code className="px-1.5 py-0.5 rounded bg-gg-inset text-gg-text text-xs font-mono">userQuery</code>.
                User input is concatenated directly into the SQL string. An attacker could manipulate{" "}
                <code className="px-1.5 py-0.5 rounded bg-gg-inset text-gg-text text-xs font-mono">req.params.id</code>{" "}
                to exfiltrate data or drop tables.
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(248,81,73,0.15)] text-gg-danger mb-3">
                CRITICAL
              </span>
              <div className="rounded-lg bg-gg-inset p-3 font-mono text-xs text-gg-text-secondary">
                <p className="text-gg-text-muted text-[11px] mb-1.5">Suggested fix:</p>
                <code className="text-gg-brand">{"const result = await db('users').where('id', req.params.id).first();"}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. STATS BAR
      ══════════════════════════════════════════════ */}
      <section className="bg-gg-surface border-y border-gg-border py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,247", label: "PRs reviewed this month" },
              { value: "99.7%", label: "Review accuracy" },
              { value: "2.4 min", label: "Average review time" },
              { value: "847", label: "Vulnerabilities caught" },
            ].map((stat) => (
              <div key={stat.label} className="animate-fade-in">
                <p className="text-4xl font-bold text-gg-brand">{stat.value}</p>
                <p className="mt-2 text-sm text-gg-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. FEATURE SECTIONS (alternating)
      ══════════════════════════════════════════════ */}
      <section id="features">
        {/* ── Section A: Catches what humans miss ── */}
        <div className="py-24 bg-gg-bg">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight text-gg-text">
                  Catches what humans miss
                </h2>
                <p className="mt-4 text-gg-text-secondary leading-relaxed">
                  GitGuardian doesn&apos;t just lint your code — it understands it. Our AI traces
                  data flow across files, follows function calls through layers of abstraction,
                  and spots vulnerabilities that surface-level tools ignore.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Traces data flow across 12+ files",
                    "Detects OWASP Top 10 in real-time",
                    "Reviews 10,000+ lines in under 3 minutes",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gg-text-secondary">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual: Vulnerability finding card */}
              <div className="animate-slide-up stagger-2">
                <div className="rounded-xl border border-gg-border bg-gg-surface p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gg-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-sm font-semibold text-gg-text">Security Scan Results</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[rgba(248,81,73,0.15)] text-gg-danger">3 findings</span>
                  </div>
                  {[
                    { severity: "CRITICAL", color: "gg-danger", title: "SQL injection in user query", file: "auth-middleware.ts:17" },
                    { severity: "HIGH", color: "gg-warning", title: "Missing rate limiting on /api/login", file: "routes/auth.ts:42" },
                    { severity: "MEDIUM", color: "gg-info", title: "Insecure cookie configuration", file: "server.ts:89" },
                  ].map((finding) => (
                    <div key={finding.title} className="rounded-lg bg-gg-surface-raised border border-gg-border-subtle p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold bg-${finding.color}-muted text-${finding.color}`} style={{
                          backgroundColor: finding.color === "gg-danger" ? "rgba(248,81,73,0.15)" : finding.color === "gg-warning" ? "rgba(210,153,34,0.15)" : "rgba(88,166,255,0.15)",
                          color: finding.color === "gg-danger" ? "#f85149" : finding.color === "gg-warning" ? "#d29922" : "#58a6ff",
                        }}>
                          {finding.severity}
                        </span>
                        <span className="text-xs text-gg-text font-medium">{finding.title}</span>
                      </div>
                      <p className="text-xs text-gg-text-muted font-mono">{finding.file}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section B: Merges with confidence ── */}
        <div className="py-24 bg-gg-surface">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Visual: PR merge success card */}
              <div className="order-2 lg:order-1 animate-slide-up stagger-2">
                <div className="rounded-xl border border-gg-border bg-gg-surface-raised p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gg-border-subtle">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gg-brand-muted">
                      <svg className="w-5 h-5 text-gg-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                        <path d="M6 21V9a9 9 0 0 0 9 9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gg-text">feat: add user settings page</p>
                      <p className="text-xs text-gg-text-muted">main ← feature/user-settings</p>
                    </div>
                    <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-gg-brand-muted text-gg-brand">Merged</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "AI Code Review", status: "Passed", color: "#10b981" },
                      { label: "Security Scan", status: "No issues", color: "#10b981" },
                      { label: "Test Suite", status: "47/47 passed", color: "#10b981" },
                      { label: "Branch Protection", status: "Rules met", color: "#10b981" },
                    ].map((check) => (
                      <div key={check.label} className="flex items-center gap-3">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={check.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-sm text-gg-text-secondary">{check.label}</span>
                        <span className="ml-auto text-xs text-gg-text-muted">{check.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gg-border-subtle">
                    <p className="text-xs text-gg-text-muted flex items-center gap-1.5">
                      <ShieldIcon className="w-3.5 h-3.5" />
                      Auto-merged by GitGuardian · Risk score: 0.12 / 1.00
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight text-gg-text">
                  Merges with confidence
                </h2>
                <p className="mt-4 text-gg-text-secondary leading-relaxed">
                  Not all PRs need a human in the loop. GitGuardian calculates a composite
                  risk score and auto-merges changes that meet your safety threshold — while
                  respecting every branch protection rule you&apos;ve set.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Squash-merges approved PRs automatically",
                    "Respects branch protection rules",
                    "Posts detailed review comments on failures",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gg-text-secondary">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section C: Runs your tests autonomously ── */}
        <div className="py-24 bg-gg-bg">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight text-gg-text">
                  Runs your tests autonomously
                </h2>
                <p className="mt-4 text-gg-text-secondary leading-relaxed">
                  GitGuardian spins up ephemeral environments, executes your test suites,
                  and generates additional test scenarios based on the code changes in each PR.
                  No more merging blind.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Alpha and beta testing pipelines",
                    "Generates test scenarios from code changes",
                    "Reports coverage gaps before merge",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gg-text-secondary">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual: Test results card */}
              <div className="animate-slide-up stagger-2">
                <div className="rounded-xl border border-gg-border bg-gg-surface p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gg-text">Test Results</span>
                    <span className="text-xs text-gg-text-muted font-mono">2m 14s</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg bg-gg-brand-subtle border border-gg-brand/20 p-3 text-center">
                      <p className="text-2xl font-bold text-gg-brand">47</p>
                      <p className="text-xs text-gg-text-muted mt-1">Passed</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-[rgba(248,81,73,0.08)] border border-gg-danger/20 p-3 text-center">
                      <p className="text-2xl font-bold text-gg-danger">2</p>
                      <p className="text-xs text-gg-text-muted mt-1">Failed</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-[rgba(210,153,34,0.08)] border border-gg-warning/20 p-3 text-center">
                      <p className="text-2xl font-bold text-gg-warning">3</p>
                      <p className="text-xs text-gg-text-muted mt-1">Skipped</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "auth.login.test.ts", status: "passed", icon: "✓", color: "#10b981" },
                      { name: "auth.register.test.ts", status: "passed", icon: "✓", color: "#10b981" },
                      { name: "user.settings.test.ts", status: "failed", icon: "✕", color: "#f85149" },
                      { name: "api.middleware.test.ts", status: "passed", icon: "✓", color: "#10b981" },
                      { name: "db.migration.test.ts", status: "failed", icon: "✕", color: "#f85149" },
                    ].map((test) => (
                      <div key={test.name} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gg-surface-raised">
                        <span className="text-xs font-bold" style={{ color: test.color }}>{test.icon}</span>
                        <span className="text-xs text-gg-text-secondary font-mono flex-1">{test.name}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: test.color }}>{test.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gg-border-subtle">
                    <div className="flex items-center justify-between text-xs text-gg-text-muted">
                      <span>Coverage: 87.3%</span>
                      <span className="text-gg-warning">↓ 1.2% from main</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gg-surface-overlay overflow-hidden">
                      <div className="h-full rounded-full bg-gg-brand" style={{ width: "87.3%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-gg-bg">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gg-text animate-fade-in">
            Ship faster, ship safer
          </h2>
          <p className="mt-4 text-center text-gg-text-secondary max-w-xl mx-auto animate-fade-in stagger-1">
            From install to auto-merge in four simple steps.
          </p>

          <div className="mt-16 grid md:grid-cols-4 gap-8 relative">
            {/* Connecting gradient line */}
            <div className="hidden md:block absolute top-7 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-0.5 bg-gradient-to-r from-gg-brand via-gg-accent to-gg-brand rounded-full" />

            {[
              {
                num: 1,
                title: "Install",
                desc: "Add GitGuardian to your GitHub org in 30 seconds",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                ),
              },
              {
                num: 2,
                title: "Push",
                desc: "Open a PR like you normally would",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                    <path d="M6 21V9a9 9 0 0 0 9 9" />
                  </svg>
                ),
              },
              {
                num: 3,
                title: "Review",
                desc: "AI analyzes code, deps, tests, and security",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
              },
              {
                num: 4,
                title: "Ship",
                desc: "Safe PRs auto-merge. Issues get flagged.",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.num} className={`relative text-center animate-slide-up stagger-${i + 1}`}>
                <div className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gg-bg border-2 border-gg-brand text-gg-brand font-bold text-lg">
                  {step.num}
                </div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-gg-text-secondary">
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold text-gg-text mb-2">{step.title}</h3>
                <p className="text-sm text-gg-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-gg-surface border-y border-gg-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gg-text mb-4 animate-fade-in">
            Teams ship faster with GitGuardian
          </h2>
          <p className="text-center text-gg-text-secondary mb-16 animate-fade-in stagger-1">
            Hear from the engineers who rely on it every day.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "We went from 4-hour review cycles to 15 minutes. GitGuardian catches the stuff my senior devs used to spend hours on — dependency conflicts, missing error boundaries, auth edge cases. Our merge velocity tripled.",
                name: "Sarah Chen",
                role: "Staff Engineer",
                company: "Vercel",
                avatar: "SC",
              },
              {
                quote: "The security scanning alone is worth it. In the first week, it caught two critical vulnerabilities in our API layer that had been sitting in open PRs for days. The suggested fixes were production-ready.",
                name: "Marcus Rodriguez",
                role: "Security Lead",
                company: "Linear",
                avatar: "MR",
              },
              {
                quote: "Auto-merge was the feature I didn't know I needed. Dependency bumps, typo fixes, docs updates — they all just flow through now. My team focuses on the PRs that actually matter.",
                name: "Anika Patel",
                role: "Engineering Manager",
                company: "Supabase",
                avatar: "AP",
              },
            ].map((t, i) => (
              <div key={t.name} className={`rounded-xl border border-gg-border bg-gg-surface-raised p-6 flex flex-col animate-slide-up stagger-${i + 1}`}>
                <svg className="w-8 h-8 text-gg-brand/30 mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-gg-text-secondary leading-relaxed flex-1">{t.quote}</p>
                <div className="mt-6 pt-4 border-t border-gg-border-subtle flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gg-brand-muted flex items-center justify-center text-xs font-bold text-gg-brand">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gg-text">{t.name}</p>
                    <p className="text-xs text-gg-text-muted">{t.role} at {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          8. PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-gg-bg">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gg-text mb-4 animate-fade-in">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gg-text-secondary mb-16 animate-fade-in stagger-1">
            Start free. Upgrade when your team is ready.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free tier */}
            <div className="rounded-xl border border-gg-border bg-gg-surface p-6 flex flex-col animate-slide-up stagger-1">
              <h3 className="text-lg font-semibold text-gg-text">Free</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gg-text">$0</span>
                <span className="text-sm text-gg-text-muted">/ forever</span>
              </div>
              <p className="mt-2 text-sm text-gg-text-secondary">For open source and side projects.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["10 PRs / month", "Basic AI review", "Security scanning", "GitHub comments", "Community support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gg-text-secondary">
                    <PricingCheck />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-gg-btn border border-gg-btn-border text-gg-text hover:bg-gg-btn-hover transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-xl border border-gg-brand bg-gg-surface p-6 flex flex-col glow-border animate-slide-up stagger-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-gg-brand text-white tracking-wide">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-gg-text">Pro</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gg-text">$29</span>
                <span className="text-sm text-gg-text-muted">/ mo</span>
              </div>
              <p className="mt-2 text-sm text-gg-text-secondary">For teams shipping fast with confidence.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["Unlimited PRs", "Advanced AI review", "Auto-merge engine", "Alpha & Beta testing", "Linear integration", "Priority support", "Custom rules"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gg-text-secondary">
                    <PricingCheck />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise tier */}
            <div className="rounded-xl border border-gg-border bg-gg-surface p-6 flex flex-col animate-slide-up stagger-3">
              <h3 className="text-lg font-semibold text-gg-text">Enterprise</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gg-text">Custom</span>
              </div>
              <p className="mt-2 text-sm text-gg-text-secondary">For organizations with advanced needs.</p>
              <ul className="mt-6 space-y-3 flex-1">
                {["Everything in Pro", "Self-hosted option", "SSO & SAML", "Audit logs", "SLA guarantee", "Dedicated support", "Custom integrations"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gg-text-secondary">
                    <PricingCheck />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-gg-btn border border-gg-btn-border text-gg-text hover:bg-gg-btn-hover transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          9. FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-gg-surface border-y border-gg-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center text-gg-text mb-12 animate-fade-in">
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="rounded-xl border border-gg-border bg-gg-surface-raised overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gg-surface-overlay transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="text-sm font-semibold text-gg-text pr-4">{item.q}</span>
                    <span
                      className="text-gg-text-muted text-lg shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-gg-text-secondary leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          10. FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-gg-bg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-gg-brand-subtle blur-[120px] opacity-50" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center animate-fade-in">
          <ShieldIcon className="w-14 h-14 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gg-text">
            Ready to guard your codebase?
          </h2>
          <p className="mt-4 text-lg text-gg-text-secondary max-w-lg mx-auto">
            Join hundreds of engineering teams shipping safer code with GitGuardian.
            Set up in under a minute.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block px-8 py-3 text-base font-semibold rounded-lg bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          11. FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="bg-gg-inset border-t border-gg-border py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <ShieldIcon className="w-6 h-6" />
                <span className="text-base font-bold tracking-tight text-gg-text">GitGuardian</span>
              </Link>
              <p className="mt-3 text-sm text-gg-text-secondary leading-relaxed">
                AI-powered code review and auto-merge for modern dev teams.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-gg-text-secondary">
                <li><a href="#features" className="hover:text-gg-text transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-gg-text transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-4">Developers</h4>
              <ul className="space-y-2.5 text-sm text-gg-text-secondary">
                <li><a href="#" className="hover:text-gg-text transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Status Page</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gg-text-secondary">
                <li><a href="#" className="hover:text-gg-text transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gg-text-secondary">
                <li><a href="#" className="hover:text-gg-text transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gg-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gg-text-muted">&copy; 2026 GitGuardian. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gg-text-muted hover:text-gg-text transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gg-text-muted hover:text-gg-text transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gg-text-muted hover:text-gg-text transition-colors" aria-label="Discord">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
