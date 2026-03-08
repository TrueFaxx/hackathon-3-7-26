"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, ArrowRight } from "lucide-react";
import { login, setApiKey, setStoredUsername } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      setApiKey(res.api_key);
      setStoredUsername(res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            Every pull request,
            <br />
            reviewed<span className="text-primary">.</span>
          </h2>
          <p className="text-white/50 max-w-[360px]">
            Deep context analysis across your entire codebase. Vulnerabilities caught
            before they ship.
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

          <h1 className="text-2xl font-extrabold mb-2">Log in</h1>
          <p className="text-text-secondary text-sm mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
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
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg"
                placeholder="your-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-bg"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-3 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? "Logging in..." : "Log in"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
