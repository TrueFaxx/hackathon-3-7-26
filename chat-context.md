# GitGuardian - Chat Context Export

## Project Overview
GitGuardian is an AI-powered PR review bot built for a hackathon. It automatically reviews pull requests using Claude AI, sets GitHub commit status checks (pass/fail), creates Linear issues for critical vulnerabilities, and provides a full-stack dashboard.

## Architecture

### Backend (FastAPI + Python)
- **`src/main.py`** — Main FastAPI app with all API endpoints, webhook handler, auth middleware
- **`src/github_client.py`** — GitHub API functions via PyGithub (PR diffs, commit statuses, repo info, auto-accept invitations)
- **`src/claude_reviewer.py`** — Claude API review logic using `claude-sonnet-4-20250514`
- **`src/database.py`** — SQLite database for users, API keys, user-scoped repos
- **`src/linear_client.py`** — Linear GraphQL API for security issue tracking
- **`src/config.py`** — Pydantic settings with env vars
- **`src/models.py`** — Pydantic models (Severity, Vulnerability, Contradiction, ReviewResult)
- **`src/context.py`** — Deep context gathering (repo tree, imports, tests, base versions, commits, comments)

### Frontend (Next.js + Tailwind CSS)
- **`frontend/src/lib/api.ts`** — API client with all endpoint functions, auth via localStorage
- **`frontend/src/app/login/page.tsx`** — Login page
- **`frontend/src/app/signup/page.tsx`** — Signup page with password strength meter
- **`frontend/src/app/dashboard/page.tsx`** — Main dashboard with real stats, repos, PRs
- **`frontend/src/app/dashboard/layout.tsx`** — Auth guard, redirects to /login if not authenticated
- **`frontend/src/app/dashboard/pull-requests/page.tsx`** — PR listing with status tabs (All/Approved/Reviewing/Failed)
- **`frontend/src/app/dashboard/repositories/page.tsx`** — Repo management with real GitHub metadata, connect/disconnect
- **`frontend/src/app/dashboard/security/page.tsx`** — Security issues from Linear
- **`frontend/src/app/dashboard/settings/page.tsx`** — API key management
- **`frontend/src/app/dashboard/activity/page.tsx`** — Activity page
- **`frontend/src/components/DashboardHeader.tsx`** — Header with username, search, sign out
- **`frontend/src/components/Sidebar.tsx`** — Sidebar nav with real repo list from API

## API Endpoints

### Auth (no API key required)
- `POST /auth/signup` — Create account, returns API key
- `POST /auth/login` — Login, returns API key

### Repos (requires X-API-Key header)
- `GET /api/repos` — List user's repos (names only)
- `GET /api/repos/details` — List repos with full GitHub metadata (description, language, stars, open PRs, last update)
- `POST /api/repos` — Add repo (`{ "repo": "owner/repo" }`)
- `DELETE /api/repos/{owner}/{repo}` — Remove repo

### Pull Requests
- `GET /api/prs` — All open PRs across user's repos
- `GET /api/prs/{owner}/{repo}` — Open PRs for specific repo

### Security
- `GET /api/security/issues` — Security issues from Linear

### Chat
- `POST /api/chat` — Chat with Claude AI (`{ "message": "...", "context": "..." }`)

### Review
- `POST /api/review` — Manually trigger PR review (`{ "repo": "owner/repo", "pr_number": 123 }`)

### API Keys
- `GET /api/keys` — List API keys (prefixes only)
- `POST /api/keys` — Generate new API key
- `POST /api/keys/revoke` — Revoke key by prefix

### Webhook
- `POST /webhook` — GitHub webhook handler (PR events + `/guardian override` comments)

### Health
- `GET /health` — Health check

## Auth Flow
1. User signs up or logs in via frontend
2. Backend creates user in SQLite, generates `gg_` prefixed API key
3. Frontend stores API key in `localStorage` as `gg_api_key`, username as `gg_username`
4. All subsequent API calls include `X-API-Key` header
5. Backend validates key against hashed keys in DB (or static key from .env for backwards compat)

## PR Review Flow
1. GitHub webhook fires on PR open/sync/reopen
2. Backend sets "pending" commit status
3. Gathers deep context (diff, changed files, repo tree, imports, tests, base versions, commits, comments)
4. Claude reviews with full context
5. Posts review (APPROVE or REQUEST_CHANGES)
6. Sets commit status (success/failure)
7. If approved, attempts auto-merge (squash)
8. Creates Linear issues for HIGH/CRITICAL vulnerabilities
9. Users can override via `/guardian override` comment (if in OVERRIDE_USERS list)

## Key Technical Details

### PullRequest Interface (frontend)
```typescript
interface PullRequest {
  number: number;
  title: string;
  author: string;        // GitHub username
  created_at: string;    // ISO date
  updated_at: string;
  url: string;           // GitHub PR URL
  head_sha: string;
  base_branch: string;   // e.g. "main"
  head_branch: string;   // e.g. "feature-x"
  guardian_status: string | null;  // "success" | "failure" | "pending" | null
  repo?: string;         // "owner/repo" (added by /api/prs endpoint)
}
```

### RepoDetail Interface (frontend)
```typescript
interface RepoDetail {
  name: string;          // "owner/repo"
  description: string;
  language: string;
  open_prs: number;
  stars: number;
  updated_at: string;    // ISO date
}
```

### Guardian Status Mapping
- `"success"` → Approved (green)
- `"failure"` → Failed (red)
- `"pending"` → Reviewing (yellow)
- `null` → Pending review (grey)

## Environment Variables (.env)
```
GITHUB_TOKEN=ghp_...          # Bot account token
GITHUB_WEBHOOK_SECRET=...     # Webhook HMAC secret
ANTHROPIC_API_KEY=sk-ant-...  # Claude API key
OVERRIDE_USERS=TrueFaxx       # Comma-separated override users
STATUS_CONTEXT=GitGuardian    # Commit status context name
MONITORED_REPOS=TrueFaxx/hackathon-3-7-26
API_KEY=...                   # Static API key (backwards compat)
LINEAR_API_KEY=               # Optional Linear integration
LINEAR_TEAM_ID=               # Optional Linear team
```

## Running Locally
```bash
# Backend (port 8000)
cd /home/kali/hackathon-3-7-26
source venv/bin/activate
python -m src.main

# Frontend (port 3000)
cd frontend
# On WSL, use Linux node directly:
/usr/bin/node node_modules/next/dist/bin/next dev --port 3000
```

## WSL Notes
- `npx` resolves to Windows Node — use `/usr/bin/node` directly
- `npm` is Windows-only — use `corepack npm` for Linux installs
- Native modules (lightningcss, swc) need Linux binaries — reinstall with `corepack npm install`
- SWC binary caches in `~/.cache/next-swc/`

## Git Info
- Repo: https://github.com/TrueFaxx/hackathon-3-7-26
- User: TrueFaxx / erlhyena@proton.me
- Bot GitHub account token for PR reviews (separate from personal)
- ngrok URL: unepochal-remi-unlooked.ngrok-free.dev (for webhook)

## What Was Done in This Session
1. Fixed PullRequest interface field mismatches (`user`→`author`, `html_url`→`url`, `head_ref`→`head_branch`, `base_ref`→`base_branch`, removed `state`)
2. Added `addRepo()` and `removeRepo()` API functions
3. Wired Connect/Disconnect buttons on repositories page
4. Fixed `guardian_status` context string (`"PR Guardian"` → `settings.status_context`)
5. Fixed lightningcss native module issue (reinstalled with `corepack npm`)
6. Made dashboard tabs navigate to actual pages
7. Made sidebar fetch real repos from API
8. Made header show actual username
9. Added `/api/repos/details` backend endpoint for real GitHub repo metadata
10. Removed ALL mock/placeholder data from dashboard, PRs, repos, and security pages
11. All pages now show real data from the backend API
12. Pushed everything to GitHub
