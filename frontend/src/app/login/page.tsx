"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gg-bg relative flex flex-col">
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      {/* Top-left wordmark */}
      <div className="relative z-10 px-8 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gg-text hover:text-gg-brand transition-colors">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M20 2L4 11v18l16 9 16-9V11L20 2z" fill="none" stroke="#10b981" strokeWidth="2" />
            <path d="M14 20l4 4 8-9" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="tracking-wide" style={{ fontFamily: "Georgia, serif", fontSize: "16px" }}>
            GitGuardian
          </span>
        </Link>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] animate-float-in">
          {/* Shield logo */}
          <div className="flex justify-center mb-6">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <path
                d="M28 3L6 14.5v15C6 42.5 15.5 52 28 54c12.5-2 22-11.5 22-24.5v-15L28 3z"
                fill="rgba(16,185,129,0.15)"
                stroke="#10b981"
                strokeWidth="2"
              />
              <path
                d="M20 28l5.5 5.5L36 23"
                stroke="#10b981"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-center text-gg-text font-semibold mb-1" style={{ fontSize: "24px" }}>
            Sign in to GitGuardian
          </h1>
          <p className="text-center text-gg-text-secondary text-sm mb-5">
            Welcome back, guardian.
          </p>

          {/* Social buttons */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 bg-gg-surface border border-gg-border rounded-lg text-sm font-medium text-gg-text transition-colors hover:bg-gg-btn-hover hover:border-gg-border-bright h-[44px]"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 bg-gg-surface border border-gg-border rounded-lg text-sm font-medium text-gg-text transition-colors hover:bg-gg-btn-hover hover:border-gg-border-bright h-[44px]"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.003 24.003 0 000 21.56l7.98-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gg-border" />
            <span className="text-xs text-gg-text-muted">or</span>
            <div className="flex-1 h-px bg-gg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-gg-surface border border-gg-border rounded-lg px-3.5 h-[44px] text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand/30 transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-gg-surface border border-gg-border rounded-lg px-3.5 pr-11 h-[44px] text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gg-text-muted hover:text-gg-text transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-gg-btn-primary hover:bg-gg-btn-primary-hover text-gg-inset font-semibold text-sm rounded-lg h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-xs text-gg-text-secondary hover:text-gg-brand transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Sign up nudge */}
          <div className="mt-6 border border-gg-border rounded-lg px-4 py-3 text-center text-sm">
            <span className="text-gg-text-secondary">New to GitGuardian?</span>{" "}
            <Link href="/signup" className="text-gg-brand hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 text-center">
        <span className="text-xs text-gg-text-muted">
          <Link href="/terms" className="hover:text-gg-text-secondary transition-colors">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-gg-text-secondary transition-colors">Privacy</Link>
        </span>
      </div>
    </div>
  );
}
