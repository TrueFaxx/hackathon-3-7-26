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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="px-6 pt-6">
        <Link href="/" className="text-lg font-bold text-text hover:opacity-70 transition-opacity">
          GitGuardian
        </Link>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] animate-slide-up">
          <h1 className="text-2xl font-bold text-text mb-8">
            Sign in
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 bg-danger-light text-danger text-sm border border-danger/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border px-4 h-12 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border px-4 pr-12 h-12 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted hover:text-text transition-colors uppercase"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-12 bg-primary text-text-inverse text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <span className="text-sm text-text-secondary">New to GitGuardian? </span>
            <Link href="/signup" className="text-sm font-bold text-text hover:text-primary transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <span className="text-xs text-text-muted">
          <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
          <span className="mx-2">&middot;</span>
          <Link href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
        </span>
      </div>
    </div>
  );
}
