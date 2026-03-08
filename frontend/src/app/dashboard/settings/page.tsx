"use client";

import { useState, useEffect } from "react";
import { listApiKeys, createApiKey, revokeApiKey, ApiKeyInfo } from "@/lib/api";

const settingsTabs = ["General", "Integrations", "Notifications", "Team"] as const;
type SettingsTab = (typeof settingsTabs)[number];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 transition-colors ${
        enabled ? "bg-primary" : "bg-border-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 bg-white transition-transform shadow-sm ${
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
    <div className="min-h-full">
      <h1 className="text-2xl font-bold text-text mb-8">Settings</h1>

      <div className="flex gap-1 mb-8">
        {settingsTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-bold transition-colors ${
              activeTab === tab
                ? "bg-primary text-text-inverse"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "General" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-surface border border-border p-6">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-3">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-inset border border-border-subtle py-2.5 px-4 text-sm text-text-secondary font-mono focus:outline-none"
              />
              <button
                onClick={copyWebhook}
                className="px-4 py-2.5 text-sm font-bold bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
              >
                {webhookCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border p-6">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-3">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={apiKeyVisible ? "text" : "password"}
                  readOnly
                  value={apiKey}
                  className="w-full bg-inset border border-border-subtle py-2.5 px-4 pr-16 text-sm text-text-secondary font-mono focus:outline-none"
                />
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted hover:text-text transition-colors uppercase"
                >
                  {apiKeyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2.5 text-sm font-bold bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">Use this key to authenticate API requests.</p>
            {apiKeys.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-text uppercase tracking-wider">Active Keys</p>
                {apiKeys.map((k, i) => (
                  <div key={`${k.prefix}-${i}`} className="flex items-center justify-between bg-inset border border-border-subtle px-4 py-2.5">
                    <div className="text-xs text-text-secondary font-mono">
                      {k.prefix}... &middot; {k.name} &middot; {new Date(k.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleRevoke(k.prefix)}
                      className="text-xs font-bold text-danger hover:text-danger/80"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
            {keysLoading && <p className="text-xs text-text-secondary mt-2">Loading keys...</p>}
          </div>

          <div className="bg-surface border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text">Auto-merge Safe PRs</p>
                <p className="text-xs text-text-muted mt-1">
                  Automatically merge PRs that pass all checks with no vulnerabilities.
                </p>
              </div>
              <Toggle enabled={autoMerge} onToggle={() => setAutoMerge(!autoMerge)} />
            </div>
          </div>

          <div className="bg-surface border border-border p-6">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-3">Review Strictness</label>
            <div className="relative max-w-xs">
              <select
                value={strictness}
                onChange={(e) => setStrictness(e.target.value)}
                className="appearance-none w-full bg-surface border border-border py-2.5 pl-4 pr-10 text-sm text-text cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-primary"
              >
                <option value="Strict">Strict — Flag all potential issues</option>
                <option value="Balanced">Balanced — Flag likely issues</option>
                <option value="Lenient">Lenient — Flag critical issues only</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-xs text-text-muted mt-2">
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
          <div className="bg-surface border border-border p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-inset border border-border-subtle flex items-center justify-center">
                <svg className="w-6 h-6 text-text" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-text">GitHub</p>
                <p className="text-xs text-text-muted">Repository monitoring & webhook integration</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 bg-success-light text-success uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success" />
              Connected
            </span>
          </div>

          <div className="bg-surface border border-border p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-inset border border-border-subtle flex items-center justify-center">
                <svg className="w-6 h-6 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-text">Linear</p>
                <p className="text-xs text-text-muted">Security issue tracking</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-bold bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors">
              Connect
            </button>
          </div>

          <div className="bg-surface border border-border p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-inset border border-border-subtle flex items-center justify-center">
                <svg className="w-6 h-6 text-text" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-text">Slack</p>
                <p className="text-xs text-text-muted">Review notifications in Slack</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-bold bg-surface border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors">
              Connect
            </button>
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="space-y-5 max-w-2xl">
          {[
            { label: "Email Notifications", desc: "Receive a daily summary of all PR reviews via email.", enabled: emailNotifs, toggle: () => setEmailNotifs(!emailNotifs) },
            { label: "Slack Notifications", desc: "Send review results to connected Slack channels.", enabled: slackNotifs, toggle: () => setSlackNotifs(!slackNotifs) },
            { label: "In-App Notifications", desc: "Show notification badges and alerts within the dashboard.", enabled: inAppNotifs, toggle: () => setInAppNotifs(!inAppNotifs) },
          ].map((item) => (
            <div key={item.label} className="bg-surface border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text">{item.label}</p>
                  <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                </div>
                <Toggle enabled={item.enabled} onToggle={item.toggle} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Team" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-surface border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold text-text">Team Members</h2>
              <button className="px-4 py-2 text-xs font-bold bg-primary text-text-inverse hover:bg-primary-hover transition-colors">
                Invite Member
              </button>
            </div>
            <div className="divide-y divide-border-subtle">
              {[
                { name: "Sarah Kim", email: "sarah@acme.dev", role: "Admin", initials: "SK" },
                { name: "John Doe", email: "john@acme.dev", role: "Member", initials: "JD" },
                { name: "Maria Rodriguez", email: "maria@acme.dev", role: "Member", initials: "MR" },
                { name: "Alex Brown", email: "alex@acme.dev", role: "Viewer", initials: "AB" },
              ].map((member) => (
                <div key={member.email} className="px-6 py-4 flex items-center gap-3 hover:bg-surface-raised transition-colors">
                  <div className="w-8 h-8 bg-primary flex items-center justify-center text-[10px] font-bold text-text-inverse">
                    {member.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text">{member.name}</p>
                    <p className="text-xs text-text-muted">{member.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 uppercase ${
                    member.role === "Admin"
                      ? "bg-primary-light text-primary"
                      : member.role === "Member"
                        ? "bg-info-light text-info"
                        : "bg-surface-raised text-text-muted"
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
