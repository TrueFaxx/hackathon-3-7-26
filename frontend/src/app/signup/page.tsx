"use client";

import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, setApiKey, setStoredUsername } from "@/lib/api";

function getPasswordStrength(pw: string): {
  label: string;
  color: string;
  textColor: string;
  width: string;
} {
  if (!pw) return { label: "", color: "", textColor: "", width: "0%" };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1)
    return { label: "Weak", color: "bg-gg-danger", textColor: "text-gg-danger", width: "33%" };
  if (score <= 3)
    return { label: "Medium", color: "bg-gg-warning", textColor: "text-gg-warning", width: "66%" };
  return { label: "Strong", color: "bg-gg-brand", textColor: "text-gg-brand", width: "100%" };
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const canSubmit = username && email && password.length >= 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await signup(username, email, password);
      setApiKey(res.api_key);
      setStoredUsername(res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-gg-surface border border-gg-border rounded-lg px-3.5 h-[44px] text-sm text-gg-text placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand/30 transition-colors";

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
            Create your account
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className={inputClass}
            />

            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={inputClass}
            />

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  className={`${inputClass} pr-11`}
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

              {password && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gg-border-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${strength.textColor}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gg-btn-primary hover:bg-gg-btn-primary-hover text-white font-semibold text-sm rounded-lg h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 border border-gg-border rounded-lg px-4 py-3 text-center text-sm">
            <span className="text-gg-text-secondary">Already have an account?</span>{" "}
            <Link href="/login" className="text-gg-brand hover:underline font-medium">
              Sign in
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
