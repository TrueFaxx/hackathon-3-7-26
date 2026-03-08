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
    a: "GitGuardian reviews any language GitHub supports. The reviewer understands TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP, and more.",
  },
  {
    q: "How does auto-merge work?",
    a: "When a PR passes all checks and the review approves it, GitGuardian can automatically squash-merge it. You can disable this per-repo from the dashboard.",
  },
  {
    q: "Can I override a failed review?",
    a: "Yes. Authorized users can comment /guardian override on a PR to bypass a failed review and merge manually.",
  },
];

const features = [
  {
    title: "Code Review",
    desc: "Every PR reviewed with full context — diffs, imports, tests, and repo structure. Catches bugs and anti-patterns before they ship.",
  },
  {
    title: "Security Scanning",
    desc: "Detects SQL injection, XSS, missing auth, insecure dependencies, and OWASP Top 10 vulnerabilities across 12+ file traces.",
  },
  {
    title: "Auto-Merge",
    desc: "PRs that pass review get squash-merged automatically. Failed reviews set commit status checks. Override with a comment when needed.",
  },
  {
    title: "Linear Integration",
    desc: "High and critical vulnerabilities automatically create Linear issues with full context, severity, and suggested fixes.",
  },
  {
    title: "Deep Context",
    desc: "Gathers repo tree, config files, imported deps, related tests, commit history, and prior PR discussion for thorough analysis.",
  },
  {
    title: "Override System",
    desc: "Authorized users bypass failed checks via PR comments. Unauthorized attempts are logged and denied. Full audit trail.",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight text-text">
              GitGuardian
            </Link>

            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-sm text-text-secondary hover:text-text transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text transition-colors">How it works</a>
              <a href="#faq" className="text-sm text-text-secondary hover:text-text transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/login" className="text-sm text-text-secondary hover:text-text transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-bold bg-primary text-text-inverse hover:bg-primary-hover transition-colors"
              >
                Get started
              </Link>
            </div>

            <button
              className="md:hidden text-text"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="text-sm font-bold tracking-wide">
                {menuOpen ? "CLOSE" : "MENU"}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-bg">
            <div className="px-6 py-6 space-y-4">
              <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-text-secondary hover:text-text">Features</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-text-secondary hover:text-text">How it works</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="block text-sm text-text-secondary hover:text-text">FAQ</a>
              <hr className="border-border" />
              <Link href="/login" className="block text-sm text-text-secondary hover:text-text">Sign in</Link>
              <Link href="/signup" className="block text-sm font-bold text-primary">Get started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[800px] animate-slide-up">
            <p className="text-sm text-text-muted uppercase tracking-widest mb-6">
              SINCE 2025
            </p>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-text">
              We review
              <br />
              <span className="relative inline-block">
                pull requests
                <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-primary" />
              </span>
            </h1>
            <p className="mt-8 text-lg text-text-secondary max-w-[540px] leading-relaxed">
              GitGuardian reviews every PR with deep context — catching
              vulnerabilities, enforcing standards, and auto-merging safe code.
              No human bottleneck.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 text-sm font-bold bg-primary text-text-inverse hover:bg-primary-hover transition-colors"
              >
                Get started
              </Link>
              <a
                href="#code-review"
                className="px-8 py-3 text-sm font-bold border border-text text-text hover:bg-text hover:text-text-inverse transition-colors"
              >
                See it in action
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex items-center justify-between text-xs text-text-muted">
            <span>SCROLL DOWN</span>
            <span>AUTONOMOUS CODE REVIEW</span>
          </div>
        </div>
      </section>

      {/* ─── CODE REVIEW VISUAL ─── */}
      <section id="code-review" className="pb-24 px-6">
        <div className="mx-auto max-w-[900px] animate-slide-up">
          <div className="border border-border overflow-hidden bg-surface">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3 bg-inset border-b border-border">
              <span className="text-xs text-text-muted font-mono">auth-middleware.ts</span>
              <span className="ml-auto text-xs text-text-muted">Review #47</span>
            </div>

            {/* Diff */}
            <div className="font-mono text-sm leading-7 bg-surface">
              <div className="px-5 py-0.5 text-text-secondary">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">14</span>
                {"  "}import {"{ createClient }"} from &apos;@supabase/supabase-js&apos;;
              </div>
              <div className="px-5 py-0.5 text-text-secondary">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">15</span>
              </div>
              <div className="px-5 py-0.5 text-text-secondary">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">16</span>
                {"  "}export async function getUser(req: Request) {"{"}
              </div>
              <div className="px-5 py-0.5 bg-danger-light">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">17</span>
                <span className="text-danger">{"−  const userQuery = `SELECT * FROM users WHERE id = '${req.params.id}'`;"}</span>
              </div>
              <div className="px-5 py-0.5 bg-danger-light">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">18</span>
                <span className="text-danger">{"−  const result = await db.raw(userQuery);"}</span>
              </div>
              <div className="px-5 py-0.5 bg-success-light">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">17</span>
                <span className="text-success">{"+ const result = await db('users').where('id', req.params.id).first();"}</span>
              </div>
              <div className="px-5 py-0.5 text-text-secondary">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">18</span>
                {"  "}return result;
              </div>
              <div className="px-5 py-0.5 text-text-secondary">
                <span className="select-none text-text-muted mr-4 inline-block w-8 text-right">19</span>
                {"}"}
              </div>
            </div>

            {/* Review comment */}
            <div className="mx-5 my-5 border border-border bg-surface-raised p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-primary">GitGuardian</span>
                <span className="text-xs text-text-muted">left a review</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                <strong className="text-danger font-bold">Critical:</strong> SQL injection vulnerability in{" "}
                <code className="px-1.5 py-0.5 bg-inset text-text text-xs font-mono border border-border">userQuery</code>.
                User input concatenated directly into SQL. An attacker could manipulate{" "}
                <code className="px-1.5 py-0.5 bg-inset text-text text-xs font-mono border border-border">req.params.id</code>{" "}
                to exfiltrate data or drop tables.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-bold bg-danger-light text-danger border border-danger/20">
                CRITICAL
              </span>
              <div className="mt-4 bg-bg-dark p-4 font-mono text-xs">
                <p className="text-[#8b949e] text-[11px] mb-2">Suggested fix:</p>
                <code className="text-[#3fb950]">{"const result = await db('users').where('id', req.params.id).first();"}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR (atuin-inspired blue band) ─── */}
      <section className="bg-bg-blue py-16 px-6">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm text-text-inverse/60 uppercase tracking-widest mb-8">
            A few key facts
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "12+", label: "File traces per review" },
              { value: "OWASP", label: "Top 10 coverage" },
              { value: "<30s", label: "Average review time" },
              { value: "100%", label: "Automated workflow" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-block border border-text-inverse/30 px-6 py-2 mb-3">
                  <span className="text-2xl md:text-3xl font-bold text-text-inverse">{stat.value}</span>
                </div>
                <p className="text-xs text-text-inverse/60 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-16">
            <p className="text-sm text-text-muted uppercase tracking-widest mb-4">COMPONENTS</p>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight">
              What it does
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {features.map((feature) => (
              <div key={feature.title} className="bg-bg p-8 group hover:bg-primary-muted transition-colors">
                <h3 className="text-base font-bold text-text mb-3">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="bg-bg-dark text-text-inverse py-24 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-16">
            <p className="text-sm text-text-inverse/40 uppercase tracking-widest mb-4">PROCESS</p>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-12">
            {[
              { num: "01", title: "Connect", desc: "Add your GitHub repositories from the dashboard. One click." },
              { num: "02", title: "Push", desc: "Open a pull request like you normally would. Nothing changes." },
              { num: "03", title: "Review", desc: "GitGuardian analyzes diffs, imports, tests, and full repo context." },
              { num: "04", title: "Ship", desc: "Safe PRs auto-merge. Issues get flagged with commit status checks." },
            ].map((step) => (
              <div key={step.num}>
                <span className="text-4xl font-bold text-text-inverse/20 block mb-4">{step.num}</span>
                <h3 className="text-lg font-bold text-text-inverse mb-2">{step.title}</h3>
                <p className="text-sm text-text-inverse/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6">
        <div className="mx-auto max-w-[700px]">
          <div className="mb-12">
            <p className="text-sm text-text-muted uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="divide-y divide-border">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i}>
                  <button
                    className="w-full flex items-center justify-between py-5 text-left group"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="text-sm font-bold text-text pr-4 group-hover:text-primary transition-colors">
                      {item.q}
                    </span>
                    <span
                      className="text-text-muted text-xl shrink-0 transition-transform duration-200 font-light"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-5">
                      <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-bg-blue py-24 px-6">
        <div className="mx-auto max-w-[700px] text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-text-inverse tracking-tight mb-6">
            Start reviewing PRs today
          </h2>
          <p className="text-text-inverse/60 mb-10">
            Set up in under a minute. Connect your repos and let GitGuardian handle the rest.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 text-sm font-bold bg-text-inverse text-primary hover:bg-text-inverse/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-bg-dark text-text-inverse py-16 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div>
              <span className="text-lg font-bold">GitGuardian</span>
              <p className="text-sm text-text-inverse/40 mt-2">Autonomous code review for every pull request.</p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="text-xs text-text-inverse/40 uppercase tracking-widest mb-4">Product</p>
                <div className="space-y-3">
                  <a href="#features" className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors">Features</a>
                  <a href="#how-it-works" className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors">How it works</a>
                  <a href="#faq" className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors">FAQ</a>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-inverse/40 uppercase tracking-widest mb-4">Account</p>
                <div className="space-y-3">
                  <Link href="/login" className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors">Sign in</Link>
                  <Link href="/signup" className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors">Sign up</Link>
                  <a
                    href="https://github.com/TrueFaxx/hackathon-3-7-26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-text-inverse/10 text-xs text-text-inverse/30">
            GitGuardian {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
