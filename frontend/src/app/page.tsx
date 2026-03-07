"use client";

import { useState } from "react";
import Link from "next/link";

const ShieldLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
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

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
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

const features = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .3 1.8A5.5 5.5 0 0 0 4 12a5.5 5.5 0 0 0 3.5 5.1V22h5v-4.9A5.5 5.5 0 0 0 16 12a5.5 5.5 0 0 0-1.3-4.2A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4z" />
        <path d="M12 2v4" /><path d="M8 8h8" /><path d="M9 12h6" />
      </svg>
    ),
    title: "AI Code Review",
    description: "Deep analysis on every pull request — catching bugs, anti-patterns, and performance issues before they reach production.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M6 21V9a9 9 0 0 0 9 9" />
      </svg>
    ),
    title: "Intelligent Auto-Merge",
    description: "Confident changes get merged automatically. Set risk thresholds and let GitGuardian handle the rest.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Security Scanning",
    description: "Vulnerability detection, dependency audits, and secret scanning on every pull request.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6" /><path d="M10 3v7.4a2 2 0 0 1-.5 1.3L4 19a2 2 0 0 0 1.5 3h13a2 2 0 0 0 1.5-3l-5.5-7.3a2 2 0 0 1-.5-1.3V3" />
        <path d="M8.5 14h7" />
      </svg>
    ),
    title: "Alpha & Beta Testing",
    description: "Spins up ephemeral environments, runs your test suites, and validates behavior before merging.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.8" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.8-1.8" />
      </svg>
    ),
    title: "Linear Integration",
    description: "Links PRs to Linear issues, updates ticket status, and keeps your project management in sync.",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Override Controls",
    description: "Full admin override, audit logs, and role-based access so you're always in control.",
  },
];

const steps = [
  { num: "01", title: "Install the App", description: "One-click install from GitHub Marketplace. Select repos and configure permissions." },
  { num: "02", title: "PR is Opened", description: "A developer opens a pull request. GitGuardian is notified instantly via webhook." },
  { num: "03", title: "AI Reviews Code", description: "Deep analysis: code quality, security, tests, and compatibility — all in under three minutes." },
  { num: "04", title: "Merge or Report", description: "Safe PRs auto-merge. Risky ones get detailed review comments and blocking labels." },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for open source and side projects.",
    features: ["10 PRs / month", "Basic AI review", "Security scanning", "GitHub comments", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For teams shipping fast with confidence.",
    features: ["Unlimited PRs", "Advanced AI review", "Auto-merge engine", "Alpha & Beta testing", "Linear integration", "Priority support", "Custom rules"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For organizations with advanced needs.",
    features: ["Everything in Pro", "Self-hosted option", "SSO & SAML", "Audit logs", "SLA guarantee", "Dedicated support", "Custom integrations"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gg-bg text-gg-text">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gg-bg/80 backdrop-blur-md border-b border-gg-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ShieldLogo className="w-7 h-7" />
              <span
                className="text-[18px] font-semibold tracking-tight text-gg-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                GitGuardian
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Pricing</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-semibold rounded-full bg-gg-btn-primary text-gg-inset hover:bg-gg-btn-primary-hover transition-colors"
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
              <hr className="border-gg-border" />
              <Link href="/login" className="block text-sm text-gg-text-secondary hover:text-gg-text">Sign in</Link>
              <Link href="/signup" className="block text-sm font-semibold text-gg-brand">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gg-brand-muted border border-gg-brand/30 mb-8">
              <svg className="w-3.5 h-3.5 text-gg-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-gg-brand">Powered by Claude AI</span>
            </div>

            <h1
              className="text-[44px] sm:text-[52px] lg:text-[60px] font-semibold leading-[1.08] tracking-tight text-gg-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI That Guards
              <br />
              Your Code
            </h1>

            <p className="mt-6 text-[18px] leading-relaxed text-gg-text-secondary max-w-xl mx-auto">
              Autonomous pull request reviews, security scanning, alpha &amp; beta testing,
              and intelligent auto-merging — all in one GitHub App.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="px-8 py-3 text-[15px] font-semibold rounded-full bg-gg-btn-primary text-gg-inset hover:bg-gg-btn-primary-hover transition-colors"
              >
                Get Started Free
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-3 text-[15px] font-medium rounded-full border border-gg-border text-gg-text hover:border-gg-border-bright hover:bg-gg-surface transition-colors"
              >
                Watch Demo
              </a>
            </div>
          </div>

          {/* Mock code review card */}
          <div className="mt-16 max-w-2xl mx-auto animate-slide-up stagger-2">
            <div className="rounded-xl border border-gg-border bg-gg-surface overflow-hidden glow-border animate-glow">
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gg-border text-xs text-gg-text-secondary">
                <svg className="w-4 h-4 text-gg-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                  <path d="M6 21V9a9 9 0 0 0 9 9" />
                </svg>
                <span className="font-medium text-gg-text">acme/web-app</span>
                <span className="text-gg-text-muted mx-1">/</span>
                <span className="text-gg-text-secondary">feat: add user authentication flow</span>
                <span className="ml-auto hidden sm:inline text-gg-text-muted">main ← feature/auth</span>
                <span className="ml-auto sm:ml-2 px-2 py-0.5 rounded-full bg-gg-brand-muted text-gg-brand text-[11px] font-medium">
                  +127 −14
                </span>
              </div>

              <div className="font-mono text-xs leading-6">
                <div className="px-5 py-0.5 bg-gg-surface-raised text-gg-text-muted">
                  <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-5 text-right">18</span>
                  {"  "}import {"{ hash }"} from &apos;bcrypt&apos;;
                </div>
                <div className="px-5 py-0.5 bg-gg-brand-subtle">
                  <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-5 text-right">19</span>
                  <span className="text-gg-brand">+ const saltRounds = 12;</span>
                </div>
                <div className="px-5 py-0.5 bg-gg-brand-subtle">
                  <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-5 text-right">20</span>
                  <span className="text-gg-brand">+ const hashedPassword = await hash(password, saltRounds);</span>
                </div>
                <div className="px-5 py-0.5 bg-gg-surface-raised text-gg-text-muted">
                  <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-5 text-right">21</span>
                  {"  "}await db.users.create({"{ email, hashedPassword }"});
                </div>
                <div className="px-5 py-0.5 bg-gg-danger-muted">
                  <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-5 text-right">22</span>
                  <span className="text-gg-danger">− console.log(password); // DEBUG</span>
                </div>
              </div>

              <div className="mx-4 my-3 rounded-lg border border-gg-brand/20 bg-gg-brand-subtle p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldLogo className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-gg-brand">GitGuardian</span>
                    <span className="text-gg-text-muted ml-2">reviewed just now</span>
                    <p className="mt-1.5 text-gg-text-secondary">
                      <span className="text-gg-danger font-medium">Security issue:</span> Line 22 logs plaintext password to console. Remove before merging.
                    </p>
                    <p className="mt-1 text-gg-text-secondary">
                      <span className="text-gg-brand font-medium">Approved:</span> Salt rounds = 12 meets OWASP recommendations. Hashing implementation is correct.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-gg-surface border-y border-gg-border">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "PRs Reviewed" },
              { value: "99.7%", label: "Accuracy" },
              { value: "< 3 min", label: "Avg Review Time" },
              { value: "500+", label: "Teams" },
            ].map((stat) => (
              <div key={stat.label} className="text-center animate-fade-in">
                <p className="text-2xl sm:text-3xl font-bold text-gg-brand">{stat.value}</p>
                <p className="mt-1 text-xs text-gg-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 animate-fade-in">
            <h2
              className="text-3xl sm:text-[38px] font-semibold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything you need to ship safely
            </h2>
            <p className="mt-4 text-gg-text-secondary text-[16px] leading-relaxed">
              GitGuardian plugs into your workflow and watches every pull request — so you can focus on building.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group rounded-xl border border-gg-border bg-gg-surface p-6 hover:border-gg-border-bright hover:-translate-y-0.5 transition-all duration-200 animate-slide-up stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gg-brand-muted text-gg-brand">
                  {feature.icon}
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5 text-gg-text">{feature.title}</h3>
                <p className="text-sm text-gg-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-gg-surface">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 animate-fade-in">
            <h2
              className="text-3xl sm:text-[38px] font-semibold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How it works
            </h2>
            <p className="mt-4 text-gg-text-secondary text-[16px] leading-relaxed">
              From install to auto-merge in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-6 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-gg-border" />

            {steps.map((item, i) => (
              <div
                key={item.num}
                className={`relative text-center animate-slide-up stagger-${i + 1}`}
              >
                <div className="relative z-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gg-bg border border-gg-brand text-gg-brand font-semibold text-sm">
                  {item.num}
                </div>
                <h3 className="text-[15px] font-semibold mb-2 text-gg-text">{item.title}</h3>
                <p className="text-sm text-gg-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 animate-fade-in">
            <h2
              className="text-3xl sm:text-[38px] font-semibold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-gg-text-secondary text-[16px] leading-relaxed">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-6 flex flex-col animate-slide-up stagger-${Math.min(i + 1, 4)} ${
                  tier.highlighted
                    ? "border-gg-brand bg-gg-surface shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                    : "border-gg-border bg-gg-surface"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-gg-brand text-gg-inset tracking-wide">
                    Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-gg-text">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gg-text">{tier.price}</span>
                  <span className="text-sm text-gg-text-muted">/ {tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-gg-text-secondary">{tier.description}</p>

                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gg-text-secondary">
                      <CheckIcon className="w-4 h-4 text-gg-brand mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors ${
                    tier.highlighted
                      ? "bg-gg-btn-primary text-gg-inset hover:bg-gg-btn-primary-hover"
                      : "bg-gg-btn border border-gg-btn-border text-gg-text hover:bg-gg-btn-hover"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gg-surface to-gg-bg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-gg-brand-subtle blur-3xl opacity-60" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center animate-fade-in">
          <ShieldLogo className="w-12 h-12 mx-auto mb-6" />
          <h2
            className="text-3xl sm:text-[40px] font-semibold tracking-tight leading-tight text-gg-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Start guarding your code today
          </h2>
          <p className="mt-4 text-gg-text-secondary text-[17px] leading-relaxed max-w-lg mx-auto">
            Join hundreds of teams who ship faster and safer with GitGuardian.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block px-8 py-3 text-[15px] font-semibold rounded-full bg-gg-btn-primary text-gg-inset hover:bg-gg-btn-primary-hover transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gg-inset border-t border-gg-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <ShieldLogo className="w-6 h-6" />
                <span
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  GitGuardian
                </span>
              </Link>
              <p className="mt-3 text-sm text-gg-text-secondary leading-relaxed">
                AI-powered code reviews and auto-merging for modern development teams.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gg-text-secondary">
                <li><a href="#features" className="hover:text-gg-text transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-gg-text transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-gg-text transition-colors">How it Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gg-text-secondary">
                <li><a href="#" className="hover:text-gg-text transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gg-text-muted mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gg-text-secondary">
                <li><a href="#" className="hover:text-gg-text transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gg-text transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gg-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gg-text-muted">&copy; {new Date().getFullYear()} GitGuardian. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-xs text-gg-text-muted hover:text-gg-text transition-colors">Terms</a>
              <a href="#" className="text-xs text-gg-text-muted hover:text-gg-text transition-colors">Privacy</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gg-text-muted hover:text-gg-text transition-colors" aria-label="GitHub">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gg-text-muted hover:text-gg-text transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
