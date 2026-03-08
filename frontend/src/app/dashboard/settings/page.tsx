"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listApiKeys, createApiKey, revokeApiKey, ApiKeyInfo } from "@/lib/api";

const settingsTabs = ["General", "Integrations", "Notifications", "Team"] as const;
type SettingsTab = (typeof settingsTabs)[number];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors duration-150 ${
        enabled ? "bg-gg-brand" : "bg-gg-btn"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150 shadow-sm ${
          enabled ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");
  const [autoMerge, setAutoMerge] = useState(true);
  const [strictness, setStrictness] = useState("Balanced");
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [slackNotifs, setSlackNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  const webhookUrl = "https://api.gitguardian.dev/webhooks/gh/acme-org";
  const apiKey = newKeyValue || "gg_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

  useEffect(() => {
    async function fetchKeys() {
      setKeysLoading(true);
      try {
        const res = await listApiKeys();
        setApiKeys(res.keys);
      } catch {
        // keep empty list on failure
      } finally {
        setKeysLoading(false);
      }
    }
    fetchKeys();
  }, []);

  async function handleRegenerate() {
    try {
      const res = await createApiKey();
      setNewKeyValue(res.api_key);
      setApiKeyVisible(true);
      const keysRes = await listApiKeys();
      setApiKeys(keysRes.keys);
    } catch {
      // ignore
    }
  }

  async function handleRevoke(prefix: string) {
    try {
      await revokeApiKey(prefix);
      setApiKeys((prev) => prev.filter((k) => k.prefix !== prefix));
    } catch {
      // ignore
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  }

  return (
    <div className="min-h-full bg-gg-bg">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1
          className="text-[24px] text-gg-text mb-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Settings
        </h1>

        <div className="flex gap-1.5 mb-8">
          {settingsTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm rounded-full transition-all duration-150 ${
                activeTab === tab
                  ? "bg-gg-btn-primary text-white font-medium"
                  : "bg-gg-btn text-gg-text-secondary border border-gg-border hover:bg-gg-btn-hover"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "General" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <label className="text-sm font-semibold text-gg-text block mb-3">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-gg-inset border border-gg-border-subtle rounded-lg py-2.5 px-4 text-sm text-gg-text-secondary font-mono focus:outline-none"
                />
                <button
                  onClick={copyWebhook}
                  className="px-4 py-2.5 text-sm font-medium bg-gg-btn border border-gg-btn-border rounded-lg text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150 flex items-center gap-2"
                >
                  {webhookCopied ? (
                    <>
                      <svg className="w-4 h-4 text-gg-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <label className="text-sm font-semibold text-gg-text block mb-3">API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={apiKeyVisible ? "text" : "password"}
                    readOnly
                    value={apiKey}
                    className="w-full bg-gg-inset border border-gg-border-subtle rounded-lg py-2.5 px-4 pr-10 text-sm text-gg-text-secondary font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gg-text-muted hover:text-gg-text transition-colors duration-150"
                  >
                    {apiKeyVisible ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button className="px-4 py-2.5 text-sm font-medium bg-gg-btn border border-gg-btn-border rounded-lg text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150">
                  Show
                </button>
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2.5 text-sm font-medium bg-gg-btn border border-gg-btn-border rounded-lg text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gg-text-muted mt-2">Use this key to authenticate API requests.</p>
              {apiKeys.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gg-text">Active Keys</p>
                  {apiKeys.map((k) => (
                    <div key={k.prefix} className="flex items-center justify-between bg-gg-inset border border-gg-border-subtle rounded-lg px-4 py-2">
                      <div className="text-xs text-gg-text-secondary font-mono">
                        {k.prefix}... &middot; {k.name} &middot; {new Date(k.created_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleRevoke(k.prefix)}
                        className="text-xs text-gg-danger hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {keysLoading && <p className="text-xs text-gg-text-secondary mt-2">Loading keys...</p>}
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gg-text">Auto-merge Safe PRs</p>
                  <p className="text-xs text-gg-text-muted mt-1">
                    Automatically merge PRs that pass all checks with no vulnerabilities.
                  </p>
                </div>
                <Toggle enabled={autoMerge} onToggle={() => setAutoMerge(!autoMerge)} />
              </div>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <label className="text-sm font-semibold text-gg-text block mb-3">Review Strictness</label>
              <div className="relative max-w-xs">
                <select
                  value={strictness}
                  onChange={(e) => setStrictness(e.target.value)}
                  className="appearance-none w-full bg-gg-surface border border-gg-border rounded-lg py-2.5 pl-4 pr-10 text-sm text-gg-text cursor-pointer hover:border-gg-border-bright transition-colors duration-150 focus:outline-none focus:border-gg-brand"
                >
                  <option value="Strict">Strict — Flag all potential issues</option>
                  <option value="Balanced">Balanced — Flag likely issues</option>
                  <option value="Lenient">Lenient — Flag critical issues only</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gg-text-muted pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-gg-text-muted mt-2">
                {strictness === "Strict"
                  ? "Every potential issue is flagged. Expect more false positives."
                  : strictness === "Balanced"
                    ? "Good balance between thoroughness and noise. Recommended for most teams."
                    : "Only critical vulnerabilities and clear bugs are flagged."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "Integrations" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-gg-surface rounded-md border border-gg-border p-6 flex items-center justify-between hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gg-inset border border-gg-border-subtle flex items-center justify-center">
                  <svg className="w-6 h-6 text-gg-text" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gg-text">GitHub</p>
                  <p className="text-xs text-gg-text-muted">acme-org · 4 repositories connected</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-gg-success-muted text-gg-success font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gg-success" />
                Connected
              </span>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 flex items-center justify-between hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gg-inset border border-gg-border-subtle flex items-center justify-center">
                  <svg className="w-6 h-6 text-gg-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gg-text">Linear</p>
                  <p className="text-xs text-gg-text-muted">Project management integration</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-gg-btn border border-gg-btn-border rounded-lg text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150">
                Connect
              </button>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 flex items-center justify-between hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gg-inset border border-gg-border-subtle flex items-center justify-center">
                  <svg className="w-6 h-6 text-gg-text" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gg-text">Slack</p>
                  <p className="text-xs text-gg-text-muted">Receive review notifications in Slack</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-gg-btn border border-gg-btn-border rounded-lg text-gg-text-secondary hover:bg-gg-btn-hover hover:text-gg-text transition-colors duration-150">
                Connect
              </button>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gg-inset border border-gg-border-subtle flex items-center justify-center">
                  <svg className="w-6 h-6 text-gg-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gg-text">Claude API</p>
                  <p className="text-xs text-gg-text-muted">AI model used for code reviews</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="sk-ant-api03-..."
                  className="flex-1 bg-gg-inset border border-gg-border-subtle rounded-lg py-2.5 px-4 text-sm text-gg-text font-mono placeholder:text-gg-text-muted focus:outline-none focus:border-gg-brand focus:ring-1 focus:ring-gg-brand transition-colors duration-150"
                />
                <button className="px-5 py-2.5 text-sm font-medium text-white bg-gg-btn-primary hover:bg-gg-btn-primary-hover rounded-lg transition-colors duration-150">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gg-text">Email Notifications</p>
                  <p className="text-xs text-gg-text-muted mt-1">Receive a daily summary of all PR reviews via email.</p>
                </div>
                <Toggle enabled={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} />
              </div>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gg-text">Slack Notifications</p>
                  <p className="text-xs text-gg-text-muted mt-1">Send review results to connected Slack channels.</p>
                </div>
                <Toggle enabled={slackNotifs} onToggle={() => setSlackNotifs(!slackNotifs)} />
              </div>
            </div>

            <div className="bg-gg-surface rounded-md border border-gg-border p-6 hover:border-gg-border-bright transition-all duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gg-text">In-App Notifications</p>
                  <p className="text-xs text-gg-text-muted mt-1">Show notification badges and alerts within the dashboard.</p>
                </div>
                <Toggle enabled={inAppNotifs} onToggle={() => setInAppNotifs(!inAppNotifs)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Team" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-gg-surface rounded-md border border-gg-border hover:border-gg-border-bright transition-all duration-150">
              <div className="px-6 py-5 border-b border-gg-border flex items-center justify-between">
                <h2
                  className="text-base text-gg-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Team Members
                </h2>
                <button className="px-4 py-2 text-xs font-medium bg-gg-btn-primary text-white rounded-lg hover:bg-gg-btn-primary-hover transition-colors duration-150">
                  Invite Member
                </button>
              </div>
              <div className="divide-y divide-gg-border-subtle">
                {[
                  { name: "Sarah Kim", email: "sarah@acme.dev", role: "Admin", initials: "SK" },
                  { name: "John Doe", email: "john@acme.dev", role: "Member", initials: "JD" },
                  { name: "Maria Rodriguez", email: "maria@acme.dev", role: "Member", initials: "MR" },
                  { name: "Alex Brown", email: "alex@acme.dev", role: "Viewer", initials: "AB" },
                ].map((member) => (
                  <div key={member.email} className="px-6 py-4 flex items-center gap-3 hover:bg-gg-surface-raised transition-colors duration-150">
                    <div className="w-9 h-9 rounded-full bg-gg-brand-muted flex items-center justify-center text-xs font-semibold text-gg-brand">
                      {member.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gg-text">{member.name}</p>
                      <p className="text-xs text-gg-text-muted">{member.email}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        member.role === "Admin"
                          ? "bg-gg-purple-muted text-gg-purple"
                          : member.role === "Member"
                            ? "bg-gg-brand-muted text-gg-brand"
                            : "bg-gg-surface-raised text-gg-text-muted"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
