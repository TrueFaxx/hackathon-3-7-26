"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, setApiKey, setStoredUsername } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      setApiKey(res.api_key);
      setStoredUsername(res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gg-bg relative flex flex-col">
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      {/* Top-left wordmark */}
      <div className="relative z-10 px-8 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gg-text hover:text-gg-text-secondary transition-colors">
          <span className="font-semibold text-[15px]">GitGuardian</span>
        </Link>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] animate-float-in">
          {/* Heading */}
          <h1 className="text-center text-gg-text font-semibold text-xl mb-5">
            Sign in to GitGuardian
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="text-gg-danger text-sm text-center">{error}</p>
            )}
            <input
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
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
              className="w-full flex items-center justify-center gap-2 bg-gg-btn-primary hover:bg-gg-btn-primary-hover text-white font-semibold text-sm rounded-lg h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
