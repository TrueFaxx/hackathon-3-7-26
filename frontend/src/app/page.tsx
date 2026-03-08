"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  GitPullRequest,
  AlertTriangle,
  GitMerge,
  Terminal,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Zap,
  Lock,
  Eye,
  BarChart3,
} from "lucide-react";

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span>GitGuardian</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          <a href="#stack" className="hover:text-primary transition-colors">Stack</a>
          <Link
            href="/login"
            className="text-text-secondary hover:text-text transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-white px-5 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg px-6 py-4 flex flex-col gap-4">
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium">How It Works</a>
          <a href="#stack" onClick={() => setOpen(false)} className="text-sm font-medium">Stack</a>
          <Link href="/login" className="text-sm font-medium text-text-secondary">Log in</Link>
          <Link href="/signup" className="bg-primary text-white px-5 py-2 text-sm font-semibold text-center">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 bg-bg">
      <div className="max-w-[1200px] mx-auto">
        <div className="max-w-[800px]">
          <p className="text-sm font-mono text-primary tracking-wider uppercase mb-6 animate-fade-in">
            Autonomous Code Review
          </p>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight mb-8 animate-slide-up">
            We review your
            <br />
            pull requests<span className="text-primary">.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-[560px] mb-10 animate-fade-in delay-200">
            GitGuardian reads every diff, traces data flow across your codebase,
            catches vulnerabilities, and merges safe code — all before you finish
            your coffee.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in delay-300">
            <Link
              href="/signup"
              className="bg-primary text-white px-8 py-3.5 text-sm font-semibold hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="border border-border text-text px-8 py-3.5 text-sm font-semibold hover:border-text transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="mt-20 animate-fade-in delay-400">
          <div className="bg-accent text-white font-mono text-sm overflow-hidden border border-accent">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="w-3 h-3 bg-[#FF5F57]" />
              <span className="w-3 h-3 bg-[#FEBC2E]" />
              <span className="w-3 h-3 bg-[#28C840]" />
              <span className="ml-4 text-white/40 text-xs">gitguardian — review</span>
            </div>
            <div className="p-6 space-y-2 text-[13px] leading-relaxed">
              <p className="text-white/50">$ git push origin feature/auth-flow</p>
              <p className="text-white/70">
                <span className="text-[#28C840]">✓</span> PR #142 opened — feature/auth-flow → main
              </p>
              <p className="text-white/70">
                <span className="text-[#FEBC2E]">⟳</span> GitGuardian reviewing 12 files, 847 lines changed...
              </p>
              <p className="text-white/70">
                <span className="text-[#28C840]">✓</span> No vulnerabilities found
              </p>
              <p className="text-white/70">
                <span className="text-[#28C840]">✓</span> Code quality: excellent
              </p>
              <p className="text-white/70">
                <span className="text-[#28C840]">✓</span> PR approved and merged (squash)
              </p>
              <p className="text-white/50 mt-4">Review completed in 14s</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Eye,
    title: "Deep Context Analysis",
    desc: "Reads your entire repo tree, config files, imports, tests, and commit history before reviewing a single line.",
  },
  {
    icon: AlertTriangle,
    title: "Vulnerability Detection",
    desc: "Traces data flow across 12+ files to catch SQL injection, XSS, SSRF, hardcoded secrets, and more.",
  },
  {
    icon: GitMerge,
    title: "Auto-Merge",
    desc: "Clean PRs get approved and squash-merged automatically. Failed reviews block the merge with clear reasons.",
  },
  {
    icon: Lock,
    title: "Linear Integration",
    desc: "High and critical vulnerabilities automatically create Linear issues with full context for your security team.",
  },
  {
    icon: Zap,
    title: "Override System",
    desc: "Authorized users can bypass checks with /guardian override. Unauthorized attempts are logged and denied.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    desc: "Monitor all your repositories, pull requests, and security findings in one place with real-time data.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-sm font-mono text-primary tracking-wider uppercase mb-4">
          Capabilities
        </p>
        <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-16 max-w-[500px]">
          Everything your team needs to ship secure code<span className="text-primary">.</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {features.map((f) => (
            <div key={f.title} className="bg-bg p-8 flex flex-col gap-4">
              <f.icon className="w-5 h-5 text-primary" strokeWidth={2} />
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Connect your repo",
    desc: "Add any GitHub repository to your GitGuardian dashboard. We auto-accept installation invitations.",
  },
  {
    num: "02",
    title: "Push code",
    desc: "Open a pull request on any monitored repo. GitGuardian picks it up via webhook in milliseconds.",
  },
  {
    num: "03",
    title: "Review runs",
    desc: "Claude analyzes the full diff with deep context — repo structure, imports, tests, commit history.",
  },
  {
    num: "04",
    title: "Ship or fix",
    desc: "Safe code gets auto-merged. Vulnerabilities get flagged, blocked, and tracked in Linear.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-accent text-white">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-sm font-mono text-primary tracking-wider uppercase mb-4">
          Process
        </p>
        <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-16 max-w-[500px]">
          Four steps from push to production<span className="text-primary">.</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {steps.map((s) => (
            <div key={s.num} className="bg-accent p-8 flex flex-col gap-4">
              <span className="text-sm font-mono text-primary">{s.num}</span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stats = [
  { value: "14s", label: "avg review time" },
  { value: "12+", label: "vulnerability types" },
  { value: "100%", label: "of diffs analyzed" },
  { value: "0", label: "human intervention" },
];

function Stats() {
  return (
    <section className="py-16 px-6 bg-primary text-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[clamp(2rem,5vw,3rem)] font-extrabold">{s.value}</p>
            <p className="text-sm text-white/70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const stackItems = [
  "FastAPI",
  "Claude Sonnet",
  "PyGithub",
  "Linear API",
  "Next.js",
  "SQLite",
  "Tailwind CSS",
  "TypeScript",
];

function Stack() {
  return (
    <section id="stack" className="py-24 px-6 bg-bg border-t border-border">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-sm font-mono text-primary tracking-wider uppercase mb-4">
          Tech Stack
        </p>
        <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-16 max-w-[500px]">
          Built with tools that work<span className="text-primary">.</span>
        </h2>

        <div className="flex flex-wrap gap-3">
          {stackItems.map((item) => (
            <span
              key={item}
              className="border border-border px-5 py-3 text-sm font-medium hover:border-primary hover:text-primary transition-colors cursor-default"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6 bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto text-center">
        <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-6">
          Stop reviewing PRs manually<span className="text-primary">.</span>
        </h2>
        <p className="text-text-secondary mb-10 max-w-[480px] mx-auto">
          Connect your repositories and let GitGuardian handle the rest.
          Free to use. Set up in under a minute.
        </p>
        <Link
          href="/signup"
          className="bg-primary text-white px-10 py-4 text-sm font-semibold hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
        >
          Get Started <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 bg-accent text-white/50 text-sm">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
            <Shield className="w-4 h-4 text-primary" strokeWidth={2.5} />
            GitGuardian
          </div>
          <p className="max-w-[280px] leading-relaxed">
            Autonomous code review powered by deep context analysis.
          </p>
        </div>
        <div className="flex gap-16">
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium mb-1">Product</span>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#stack" className="hover:text-white transition-colors">Stack</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium mb-1">Account</span>
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Features />
      <Stats />
      <HowItWorks />
      <Stack />
      <CTA />
      <Footer />
    </main>
  );
}
