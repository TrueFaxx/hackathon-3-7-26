# GitGuardian

Automated PR review bot powered by Claude. Reviews pull requests for code quality, security vulnerabilities, test coverage, and contradictions. Posts GitHub reviews, sets commit status checks (pass/fail), and creates Linear issues for critical findings.

## Setup

### Prerequisites

- Python 3.11+
- A GitHub account with repo access
- An Anthropic API key
- (Optional) A Linear account for security issue tracking

### 1. Clone and install

```bash
git clone https://github.com/TrueFaxx/hackathon-3-7-26.git
cd hackathon-3-7-26
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
