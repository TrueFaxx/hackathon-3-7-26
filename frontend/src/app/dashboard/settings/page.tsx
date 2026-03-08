"use client";

import { useEffect, useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  type ApiKeyInfo,
} from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function fetchKeys() {
    listApiKeys()
      .then((r) => setKeys(r.keys))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createApiKey(keyName || "default");
      setNewKey(res.api_key);
      setKeyName("");
      setShowCreate(false);
      fetchKeys();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(prefix: string) {
    try {
      await revokeApiKey(prefix);
      setKeys((prev) => prev.filter((k) => k.prefix !== prefix));
    } catch {
      // ignore
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="max-w-[700px]">
      <h1 className="text-xl font-extrabold mb-6">Settings</h1>

      {/* API Keys Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">API Keys</h2>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setNewKey(null);
            }}
            className="bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Key
          </button>
        </div>

        {/* New key banner */}
        {newKey && (
          <div className="bg-success-light border border-success/20 p-4 mb-4">
            <p className="text-sm font-medium text-success mb-2">
              API key created. Copy it now — you won&apos;t see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-bg border border-border px-3 py-2 text-xs font-mono truncate">
                {newKey}
              </code>
              <button
                onClick={copyKey}
                className="bg-accent text-white px-3 py-2 text-xs font-semibold flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="bg-bg border border-border p-5 mb-4">
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name (optional)"
                className="flex-1 border border-border px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-bg"
              />
              <button
                type="submit"
                disabled={creating}
                className="bg-accent text-white px-5 py-2.5 text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Generate"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-sm text-text-secondary">Loading...</div>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-bg border border-border p-8 text-center">
            <Key className="w-6 h-6 text-text-secondary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No API keys yet.</p>
          </div>
        ) : (
          <div className="bg-bg border border-border">
            <div className="grid grid-cols-[1fr_120px_100px_40px] gap-4 px-4 py-2 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <span>Key</span>
              <span>Name</span>
              <span>Created</span>
              <span></span>
            </div>
            {keys.map((k) => (
              <div
                key={k.prefix}
                className="grid grid-cols-[1fr_120px_100px_40px] gap-4 px-4 py-3 border-b border-border last:border-b-0 items-center"
              >
                <code className="text-sm font-mono">{k.prefix}...</code>
                <span className="text-sm text-text-secondary">{k.name}</span>
                <span className="text-xs text-text-secondary">
                  {timeAgo(k.created_at)}
                </span>
                <button
                  onClick={() => handleRevoke(k.prefix)}
                  className="text-text-secondary hover:text-danger transition-colors p-1"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook info */}
      <div>
        <h2 className="text-base font-bold mb-4">Webhook</h2>
        <div className="bg-bg border border-border p-5">
          <p className="text-sm text-text-secondary mb-3">
            Configure your GitHub webhook to point to your GitGuardian instance.
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Payload URL
              </span>
              <code className="block bg-surface border border-border px-3 py-2 text-xs font-mono mt-1">
                https://your-domain.com/webhook
              </code>
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Content type
              </span>
              <code className="block bg-surface border border-border px-3 py-2 text-xs font-mono mt-1">
                application/json
              </code>
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Events
              </span>
              <code className="block bg-surface border border-border px-3 py-2 text-xs font-mono mt-1">
                Pull requests, Issue comments
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
