"use client";

import { useState } from "react";
import Link from "next/link";

const faqItems = [
  {
    q: "Does GitGuardian store my source code?",
    a: "No. GitGuardian processes diffs in memory during review and never persists your source code. Once the review is posted, the code is discarded.",
  },
  {
    q: "Which languages are supported?",
    a: "GitGuardian reviews any language GitHub supports. The AI understands TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP, and more.",
  },
  {
    q: "How does auto-merge work?",
    a: "When a PR passes all checks and the AI review approves it, GitGuardian can automatically squash-merge it. You can disable this per-repo.",
  },
  {
    q: "Can I override a failed review?",
    a: "Yes. Authorized users can comment /guardian override on a PR to bypass a failed review and merge manually.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gg-bg text-gg-text">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gg-bg/80 backdrop-blur-md border-b border-gg-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-[18px] font-bold tracking-tight text-gg-text">
                GitGuardian
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">How it Works</a>
              <a href="#faq" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm text-gg-text-secondary hover:text-gg-text transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-semibold rounded-md bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
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
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gg-text-secondary hover:text-gg-text">FAQ</a>
              <hr className="border-gg-border" />
              <Link href="/login" className="block text-sm text-gg-text-secondary hover:text-gg-text">Sign in</Link>
              <Link href="/signup" className="block text-sm font-semibold text-gg-brand">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gg-text leading-tight">
            AI-powered code review
            <br />
            for every pull request
          </h1>

          <p className="mt-6 text-lg text-gg-text-secondary max-w-2xl mx-auto leading-relaxed">
            GitGuardian reviews your PRs with Claude AI — catching bugs,
            vulnerabilities, and anti-patterns before they reach production.
            Safe PRs get auto-merged.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-6 py-2.5 text-sm font-semibold rounded-md bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
            >
              Get started
            </Link>
            <a
              href="#code-review"
              className="px-6 py-2.5 text-sm font-medium rounded-md bg-gg-btn border border-gg-btn-border text-gg-text hover:bg-gg-btn-hover transition-colors"
            >
              See it in action
            </a>
          </div>
        </div>
      </section>

      {/* Code Review Visual */}
      <section id="code-review" className="pb-20 px-5 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-md border border-gg-border overflow-hidden animate-float-in">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gg-inset border-b border-gg-border">
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
              <div className="px-4 py-0.5 bg-gg-success-muted">
                <span className="select-none text-gg-text-muted/50 mr-4 inline-block w-8 text-right">17</span>
                <span className="text-gg-success">{"+ const result = await db('users').where('id', req.params.id).first();"}</span>
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
            <div className="mx-4 my-4 rounded-md border border-gg-border bg-gg-surface-raised p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gg-brand">GitGuardian</span>
                <span className="text-xs text-gg-text-muted">left a review</span>
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
              <div className="rounded-md bg-gg-inset p-3 font-mono text-xs text-gg-text-secondary">
                <p className="text-gg-text-muted text-[11px] mb-1.5">Suggested fix:</p>
                <code className="text-gg-success">{"const result = await db('users').where('id', req.params.id).first();"}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gg-border">
        <div className="py-20 bg-gg-surface">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold text-gg-text text-center mb-12">
              What it does
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Code Review",
                  desc: "Every PR gets reviewed by Claude AI with full context — diffs, imports, tests, and repo structure. Catches bugs, security issues, and anti-patterns.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ),
                },
                {
                  title: "Security Scanning",
                  desc: "Detects SQL injection, XSS, missing auth checks, insecure dependencies, and other OWASP Top 10 vulnerabilities. Creates Linear issues for critical findings.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                    </svg>
                  ),
                },
                {
                  title: "Auto-Merge",
                  desc: "PRs that pass review get automatically squash-merged. Failed reviews set commit status checks so nothing slips through. Override with a comment when needed.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                      <path d="M6 21V9a9 9 0 0 0 9 9" />
                    </svg>
                  ),
                },
              ].map((feature) => (
                <div key={feature.title} className="p-5 rounded-md border border-gg-border bg-gg-surface-raised">
                  <div className="text-gg-text-secondary mb-3">{feature.icon}</div>
                  <h3 className="text-sm font-semibold text-gg-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-gg-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gg-bg border-t border-gg-border">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <h2 className="text-2xl font-bold text-gg-text text-center mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: "Connect", desc: "Add your GitHub repos from the dashboard" },
              { num: 2, title: "Push", desc: "Open a pull request like you normally would" },
              { num: 3, title: "Review", desc: "AI analyzes your diff, imports, tests, and context" },
              { num: 4, title: "Ship", desc: "Safe PRs auto-merge. Issues get flagged with status checks" },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gg-surface border border-gg-border text-sm font-bold text-gg-text-secondary">
                  {step.num}
                </div>
                <h3 className="text-sm font-semibold text-gg-text mb-1">{step.title}</h3>
                <p className="text-sm text-gg-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gg-surface border-t border-gg-border">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-2xl font-bold text-gg-text text-center mb-10">
            FAQ
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="rounded-md border border-gg-border bg-gg-surface-raised overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gg-surface-overlay transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="text-sm font-medium text-gg-text pr-4">{item.q}</span>
                    <span
                      className="text-gg-text-muted text-lg shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-gg-text-secondary leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gg-bg border-t border-gg-border">
        <div className="mx-auto max-w-2xl px-5 sm:px-8 text-center">
          <h2 className="text-2xl font-bold text-gg-text">
            Start reviewing PRs with AI
          </h2>
          <p className="mt-3 text-gg-text-secondary">
            Set up in under a minute. Connect your repos and let GitGuardian handle the rest.
          </p>
          <div className="mt-6">
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 text-sm font-semibold rounded-md bg-gg-btn-primary text-white hover:bg-gg-btn-primary-hover transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gg-inset border-t border-gg-border py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gg-text">GitGuardian</span>
              <span className="text-xs text-gg-text-muted">AI-powered PR review bot</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gg-text-muted">
              <a href="https://github.com/TrueFaxx/hackathon-3-7-26" target="_blank" rel="noopener noreferrer" className="hover:text-gg-text transition-colors">
                GitHub
              </a>
              <Link href="/login" className="hover:text-gg-text transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-gg-text transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
