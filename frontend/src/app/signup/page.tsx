"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Shield, ArrowRight, Check, X } from "lucide-react";
import { signup, setApiKey, setStoredUsername } from "@/lib/api";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return [
      { label: "8+ characters", pass: password.length >= 8 },
      { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
      { label: "Number", pass: /\d/.test(password) },
    ];
  }, [password]);

  if (!password) return null;

  return (
    <div className="flex gap-4 mt-2">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`text-xs flex items-center gap-1 ${c.pass ? "text-success" : "text-text-secondary"}`}
        >
          {c.pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await signup(username, email, password);
      setApiKey(res.api_key);
      setStoredUsername(res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} />
          GitGuardian
        </Link>
        <div>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-tight mb-4">
            Security-first
            <br />
            code review<span className="text-primary">.</span>
          </h2>
          <p className="text-white/50 max-w-[360px]">
            Set up in under a minute. Connect your GitHub repos and start
            shipping secure code today.
          </p>
        </div>
        <p className="text-white/30 text-sm">GitGuardian — Autonomous Code Review</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-bold text-lg mb-12">
            <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} />
            GitGuardian
          </Link>

          <h1 className="text-2xl font-extrabold mb-2">Create account</h1>
          <p className="text-text-secondary text-sm mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>

          {error && (
            <div className="bg-danger-light border border-danger/20 text-danger text-sm px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg"
                placeholder="your-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg"
                placeholder="••••••••"
              />
              <PasswordStrength password={password} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-3 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
