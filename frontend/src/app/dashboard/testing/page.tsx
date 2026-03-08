"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileCode,
  RefreshCw,
  Loader2,
  BarChart3,
  Shield,
  Bug,
  Code2,
  Globe,
  Server,
  Eye,
  Terminal,
} from "lucide-react";
import {
  getRepos,
  runFeatureTest,
  type TestResult,
  type TestCase,
} from "@/lib/api";

type Mode = "alpha" | "beta" | "security" | "code_review";

const modes: { key: Mode; label: string; desc: string; icon: React.ElementType }[] = [
  {
    key: "alpha",
    label: "Alpha",
    desc: "Core functionality, happy paths, input validation",
    icon: Bug,
  },
  {
    key: "beta",
    label: "Beta",
    desc: "Edge cases, concurrency, performance, integration",
    icon: FlaskConical,
  },
  {
    key: "security",
    label: "Security",
    desc: "OWASP Top 10, injection, auth bypass, data exposure",
    icon: Shield,
  },
  {
    key: "code_review",
    label: "Code Review",
    desc: "Quality, patterns, maintainability, best practices",
    icon: Code2,
  },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "pass")
    return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
  if (status === "fail")
    return <XCircle className="w-4 h-4 text-danger shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-warning shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pass: "text-success bg-success-light",
    fail: "text-danger bg-danger-light",
    warn: "text-warning bg-warning-light",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 uppercase ${map[status] || "text-text-secondary bg-surface"}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "text-danger bg-danger-light",
    high: "text-danger bg-danger-light",
    medium: "text-warning bg-warning-light",
    low: "text-text-secondary bg-surface",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 ${map[severity] || "text-text-secondary bg-surface"}`}>
      {severity}
    </span>
  );
}

function TypeBadge({ type }: { type?: string }) {
  if (type === "api")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-primary-light text-primary uppercase">
        <Server className="w-3 h-3" /> API
      </span>
    );
  if (type === "ui")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-warning-light text-warning uppercase">
        <Globe className="w-3 h-3" /> UI
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-surface text-text-secondary uppercase">
      <Eye className="w-3 h-3" /> Traced
    </span>
  );
}

function TestRow({ test }: { test: TestCase }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface/50 transition-colors text-left"
      >
        <StatusIcon status={test.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-secondary">{test.id}</span>
            <TypeBadge type={test.type} />
            <span className="text-sm font-medium truncate">{test.name}</span>
            {test.executed && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-success-light text-success uppercase">
                Executed
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            {test.type === "api" && test.endpoint
              ? `${test.method || "GET"} ${test.endpoint}`
              : test.type === "ui" && test.path
                ? `GET ${test.path}`
                : `${test.file}${test.line ? `:${test.line}` : ""}`}
            {" · "}{test.category}
          </p>
        </div>
        <SeverityBadge severity={test.severity} />
        <StatusBadge status={test.status} />
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 bg-surface/30 border-t border-border">
          <div className="grid gap-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Description
              </span>
              <p className="mt-1">{test.description}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Input
                </span>
                <pre className="mt-1 bg-bg border border-border p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
                  {test.input}
                </pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Expected
                </span>
                <pre className="mt-1 bg-bg border border-border p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
                  {test.expected}
                </pre>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {test.executed ? "Actual (executed)" : "Actual (traced from code)"}
              </span>
              <pre className={`mt-1 border p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40 ${
                test.status === "pass"
                  ? "bg-success-light/30 border-success/20"
                  : test.status === "fail"
                    ? "bg-danger-light/30 border-danger/20"
                    : "bg-warning-light/30 border-warning/20"
              }`}>
                {test.actual}
              </pre>
            </div>
            {test.fix && (
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Suggested Fix
                </span>
                <pre className="mt-1 bg-primary-light/30 border border-primary/20 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
                  {test.fix}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CoverageBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? "bg-success"
      : percentage >= 50
        ? "bg-warning"
        : "bg-danger";
  return (
    <div className="w-full bg-surface-dark h-2">
      <div
        className={`h-2 ${color} transition-all duration-500`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

export default function TestingPage() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [feature, setFeature] = useState("");
  const [mode, setMode] = useState<Mode>("alpha");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<TestResult[]>([]);

  useEffect(() => {
    getRepos()
      .then((r) => {
        setRepos(r.repos);
        if (r.repos.length > 0) setSelectedRepo(r.repos[0]);
      })
      .catch(() => {});
  }, []);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !feature.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await runFeatureTest(selectedRepo, feature.trim(), mode);
      setResult(res);
      setHistory((prev) => [res, ...prev].slice(0, 10));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setRunning(false);
    }
  }

  const passCount = result?.tests.filter((t) => t.status === "pass").length || 0;
  const failCount = result?.tests.filter((t) => t.status === "fail").length || 0;
  const warnCount = result?.tests.filter((t) => t.status === "warn").length || 0;
  const executedCount = result?.tests.filter((t) => t.executed).length || 0;
  const apiCount = result?.tests.filter((t) => t.type === "api").length || 0;
  const uiCount = result?.tests.filter((t) => t.type === "ui").length || 0;

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-xl font-extrabold mb-6">AI Testing</h1>

      {/* Config form */}
      <form onSubmit={handleRun} className="bg-bg border border-border mb-6">
        <div className="p-5 space-y-4">
          {/* Repo + Feature */}
          <div className="grid md:grid-cols-[200px_1fr] gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
              >
                {repos.length === 0 && <option value="">No repos connected</option>}
                {repos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Feature to test
              </label>
              <input
                type="text"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                required
                placeholder="e.g. User signup and login flow, API key validation, PR webhook handler..."
                className="w-full border border-border px-3 py-2.5 text-sm bg-bg outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Test Mode
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
              {modes.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className={`p-3 text-left transition-colors ${
                    mode === m.key
                      ? "bg-primary-light/50 border-l-2 border-primary"
                      : "bg-bg hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className={`w-4 h-4 ${mode === m.key ? "text-primary" : "text-text-secondary"}`} />
                    <span className={`text-sm font-semibold ${mode === m.key ? "text-primary" : ""}`}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run button */}
        <div className="px-5 py-3 border-t border-border bg-surface/50 flex items-center justify-between">
          {error && <p className="text-xs text-danger">{error}</p>}
          <div />
          <button
            type="submit"
            disabled={running || !selectedRepo || !feature.trim()}
            className="bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Tests
              </>
            )}
          </button>
        </div>
      </form>

      {/* Running indicator */}
      {running && (
        <div className="bg-bg border border-border p-8 mb-6">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">
                Testing &quot;{feature}&quot; on {selectedRepo}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Reading source code, tracing code paths, generating and executing test scenarios...
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 font-mono text-xs text-text-secondary">
            <p className="animate-fade-in">→ Fetching repository tree...</p>
            <p className="animate-fade-in delay-200">→ Reading source files...</p>
            <p className="animate-fade-in delay-400">→ Analyzing code paths for &quot;{feature}&quot;...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !running && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold">{result.tests.length}</p>
              <p className="text-xs text-text-secondary mt-0.5">Total Tests</p>
            </div>
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">{executedCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Executed</p>
            </div>
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold text-success">{passCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Passed</p>
            </div>
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold text-danger">{failCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Failed</p>
            </div>
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold text-warning">{warnCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Warnings</p>
            </div>
            <div className="bg-bg p-4 text-center">
              <p className="text-2xl font-extrabold">{result.coverage.percentage}%</p>
              <p className="text-xs text-text-secondary mt-0.5">Coverage</p>
            </div>
          </div>

          {/* Test type breakdown */}
          {(apiCount > 0 || uiCount > 0) && (
            <div className="flex gap-3 text-xs">
              {apiCount > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary-light px-2 py-1">
                  <Server className="w-3 h-3" /> {apiCount} API tests executed
                </span>
              )}
              {uiCount > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-warning bg-warning-light px-2 py-1">
                  <Globe className="w-3 h-3" /> {uiCount} UI tests executed
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-medium text-text-secondary bg-surface px-2 py-1">
                <Eye className="w-3 h-3" /> {result.tests.length - apiCount - uiCount} code traces
              </span>
            </div>
          )}

          {/* Coverage bar */}
          <div className="bg-bg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Path Coverage
              </span>
              <span className="text-xs text-text-secondary">
                {result.coverage.tested_paths} / {result.coverage.total_identified_paths} paths
              </span>
            </div>
            <CoverageBar percentage={result.coverage.percentage} />
          </div>

          {/* Summary */}
          <div className="bg-bg border border-border p-5">
            <h3 className="text-sm font-bold mb-2">Summary</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Files analyzed */}
          {result.files_analyzed.length > 0 && (
            <div className="bg-bg border border-border p-5">
              <h3 className="text-sm font-bold mb-3">
                Files Analyzed ({result.files_analyzed.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.files_analyzed.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 text-xs font-mono bg-surface border border-border px-2 py-1"
                  >
                    <FileCode className="w-3 h-3 text-text-secondary" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test cases */}
          <div className="bg-bg border border-border">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold">
                Test Results ({result.tests.length})
              </h3>
            </div>
            {result.tests.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-secondary">
                No test cases generated.
              </div>
            ) : (
              result.tests.map((test) => <TestRow key={test.id} test={test} />)
            )}
          </div>

          {/* Execution Log */}
          {result.execution_log && result.execution_log.length > 0 && (
            <div className="bg-accent text-white border border-accent">
              <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Execution Log</h3>
              </div>
              <div className="p-5 font-mono text-xs space-y-1">
                {result.execution_log.map((line, i) => (
                  <p key={i} className="text-white/70">
                    <span className="text-primary mr-2">→</span>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Generated Test Code */}
          {result.test_code && (
            <div className="bg-bg border border-border">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-text-secondary" />
                  <h3 className="text-sm font-bold">Generated Test Script</h3>
                </div>
                {result.code_execution && (
                  <span className={`text-xs font-semibold px-2 py-0.5 ${
                    result.code_execution.passed
                      ? "text-success bg-success-light"
                      : "text-danger bg-danger-light"
                  }`}>
                    Exit {result.code_execution.exit_code}
                  </span>
                )}
              </div>
              <pre className="p-5 text-xs font-mono overflow-auto max-h-80 bg-surface/50">
                {result.test_code}
              </pre>
              {result.code_execution && (
                <div className="border-t border-border">
                  {result.code_execution.stdout && (
                    <div className="p-4 border-b border-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        stdout
                      </span>
                      <pre className="mt-1 text-xs font-mono text-success whitespace-pre-wrap">
                        {result.code_execution.stdout}
                      </pre>
                    </div>
                  )}
                  {result.code_execution.stderr && (
                    <div className="p-4">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        stderr
                      </span>
                      <pre className="mt-1 text-xs font-mono text-danger whitespace-pre-wrap">
                        {result.code_execution.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-bg border border-border p-5">
              <h3 className="text-sm font-bold mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="mt-8">
          <h2 className="text-base font-bold mb-4">Previous Runs</h2>
          <div className="bg-bg border border-border">
            {history.slice(1).map((run, i) => {
              const p = run.tests.filter((t) => t.status === "pass").length;
              const f = run.tests.filter((t) => t.status === "fail").length;
              return (
                <button
                  key={i}
                  onClick={() => setResult(run)}
                  className="w-full flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors text-left"
                >
                  <BarChart3 className="w-4 h-4 text-text-secondary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{run.feature}</p>
                    <p className="text-xs text-text-secondary">
                      {run.mode} · {run.tests.length} tests · {p} pass · {f} fail
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {run.coverage.percentage}% coverage
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
