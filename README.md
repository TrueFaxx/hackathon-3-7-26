# GitGuardian

Automated PR review bot powered by Claude. Reviews pull requests for code quality, security vulnerabilities, test coverage, and contradictions. Posts GitHub reviews, sets commit status checks (pass/fail), and creates Linear issues for critical findings.

## Setup

### Prerequisites

- Python 3.11+
- A GitHub account with repo access (recommend a dedicated bot account)
- An Anthropic API key
- (Optional) A Linear account for security issue tracking

### 1. Clone and install

```bash
git clone https://github.com/TrueFaxx/hackathon-3-7-26.git
cd hackathon-3-7-26
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub personal access token with `repo` scope |
| `GITHUB_WEBHOOK_SECRET` | Yes | Secret used to verify webhook payloads |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `LINEAR_API_KEY` | No | Linear API key for creating security issues |
| `LINEAR_TEAM_ID` | No | Linear team ID to file issues under |
| `SECURITY_LABEL_ID` | No | Linear label ID to tag security issues |
| `OVERRIDE_USERS` | No | Comma-separated GitHub usernames allowed to override checks (e.g. `alice,bob`) |
| `STATUS_CONTEXT` | No | Name shown on the GitHub commit status check (default: `GitGuardian`) |
| `MONITORED_REPOS` | No | Comma-separated repos for the dashboard API (e.g. `owner/repo1,owner/repo2`) |
| `API_KEY` | No | Static API key for backwards compatibility (signup system generates keys automatically) |
| `HOST` | No | Server bind address (default: `0.0.0.0`) |
| `PORT` | No | Server port (default: `8000`) |
| `LOG_LEVEL` | No | Logging level (default: `info`) |

### 3. Create a GitHub webhook

1. Go to your repo's **Settings > Webhooks > Add webhook**
2. Set the **Payload URL** to your server (e.g. `https://your-domain.com/webhook`)
3. Set **Content type** to `application/json`
4. Set the **Secret** to match your `GITHUB_WEBHOOK_SECRET`
5. Select **individual events** and enable:
   - **Pull requests** — triggers reviews on PR open/update
   - **Issue comments** — enables the `/guardian override` command
6. Click **Add webhook**

### 4. Set up branch protection (recommended)

To enforce the check as a merge gate:

1. Go to **Settings > Branches > Branch protection rules**
2. Add a rule for your main branch
3. Enable **Require status checks to pass before merging**
4. Search for and add **GitGuardian** (or your custom `STATUS_CONTEXT`)

### 5. Run the server

```bash
python -m src.main
```

For a quick demo with ngrok:

```bash
# Terminal 1
python -m src.main

# Terminal 2
ngrok http 8000
```

## How it works

1. A PR is opened or updated → GitHub sends a webhook
2. GitGuardian sets a **pending** commit status on the head SHA
3. It gathers full context: diff, file contents, imports, tests, configs, commit history, and prior comments
4. Claude reviews everything and returns structured findings
5. The bot posts a GitHub review (approve or request changes) and sets the commit status to **success** or **failure**
6. If approved, it attempts to auto-merge the PR
7. High/critical vulnerabilities are filed as Linear issues

## User Override

Authorized users (configured via `OVERRIDE_USERS`) can bypass a failed check by commenting on the PR:

```
/guardian override
```

This sets the commit status to **success** so the PR can be merged. Unauthorized users who attempt this will be denied with a comment.

## Auto-Accept Invitations

The bot automatically accepts GitHub collaborator invitations on startup and checks for new ones every 60 seconds. Just add the bot account as a collaborator on any repo and it will join automatically.

## API

All `/api/*` endpoints require authentication via the `X-API-Key` header.

### Authentication

#### Sign up

```bash
curl -X POST https://your-url/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@example.com", "password": "securepass123"}'
```

Returns an API key (`gg_...`). **Save it — it's only shown once.**

#### Log in (generate a new key)

```bash
curl -X POST https://your-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "securepass123"}'
```

#### Key management

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/keys` | Generate an additional API key (`{"name": "my-key"}`) |
| `GET` | `/api/keys` | List your keys (prefixes only) |
| `POST` | `/api/keys/revoke` | Revoke a key (`{"key_prefix": "gg_abc123"}`) |

### Dashboard Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/repos` | List monitored repos |
| `GET` | `/api/prs` | All open PRs across monitored repos with GitGuardian status |
| `GET` | `/api/prs/{owner}/{repo}` | Open PRs for a specific repo |
| `GET` | `/api/security/issues` | Open security issues from Linear |

### AI Chat

```bash
curl -X POST https://your-url/api/chat \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I prevent SQL injection in Python?"}'
```

### Manual Review Trigger

```bash
curl -X POST https://your-url/api/review \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"repo": "owner/repo", "pr_number": 1}'
```

### Other Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `POST` | `/webhook` | Signature | GitHub webhook receiver |

## Linear Integration

When `LINEAR_API_KEY` and `LINEAR_TEAM_ID` are configured:

- High and critical vulnerabilities found during PR review are automatically filed as Linear issues
- Issues include the repo, PR, author, file, line number, and suggested fix
- Use `SECURITY_LABEL_ID` to tag issues with a security label
- The `/api/security/issues` endpoint lists all open security issues from Linear
