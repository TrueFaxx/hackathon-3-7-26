import asyncio
import hashlib
import hmac
import logging
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import uvicorn

from .claude_reviewer import review_pull_request
from .config import settings
from .context import (
    get_base_file_versions,
    get_config_files,
    get_imported_files,
    get_pr_comments,
    get_pr_commits,
    get_related_test_files,
    get_repo_tree,
    get_tree_paths,
)
from .github_client import (
    accept_pending_invitations,
    get_changed_files,
    get_pr_diff,
    get_pr_head_sha,
    get_repo_info,
    list_open_prs,
    merge_pr,
    post_comment,
    post_review,
    set_commit_status,
)
from .database import (
    add_user_repo,
    authenticate_user,
    create_user,
    generate_api_key,
    get_user_repos,
    init_db,
    list_user_keys,
    remove_user_repo,
    revoke_api_key,
    validate_api_key,
)
from .linear_client import create_security_issue, get_security_issues
from .models import Severity

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="GitGuardian", version="1.0.0")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Key Auth ─────────────────────────────────────────────────────────────

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(api_key: str = Security(_api_key_header)):
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key. Pass X-API-Key header.")
    # Check static key from .env (backwards compatible)
    if settings.api_key and secrets.compare_digest(api_key, settings.api_key):
        return
    # Check database keys
    user = validate_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")


async def get_current_user(api_key: str = Security(_api_key_header)) -> dict:
    """Returns the authenticated user dict, or a static-key placeholder."""
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    if settings.api_key and secrets.compare_digest(api_key, settings.api_key):
        return {"user_id": 0, "username": "admin", "email": ""}
    user = validate_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user


# ─── Auto-accept invitations on startup + periodic ────────────────────────────

async def _invitation_loop():
    while True:
        try:
            accepted = accept_pending_invitations()
            if accepted:
                logger.info("Auto-accepted invitations: %s", accepted)
        except Exception:
            logger.exception("Invitation check failed")
        await asyncio.sleep(60)  # check every 60 seconds


@app.on_event("startup")
async def on_startup():
    accepted = accept_pending_invitations()
    if accepted:
        logger.info("Accepted pending invitations on startup: %s", accepted)
    asyncio.create_task(_invitation_loop())


def verify_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.github_webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@app.post("/webhook")
async def handle_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
):
    payload = await request.body()

    if x_hub_signature_256 and not verify_signature(payload, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    if x_github_event == "issue_comment":
        return await _handle_override_comment(await request.json())

    if x_github_event != "pull_request":
        return {"status": "ignored", "event": x_github_event}

    data = await request.json()
    action = data.get("action")
    if action not in ("opened", "synchronize", "reopened"):
        return {"status": "ignored", "action": action}

    pr = data["pull_request"]
    repo_full_name = data["repository"]["full_name"]
    pr_number = pr["number"]
    pr_title = pr["title"]
    pr_body = pr.get("body", "")
    pr_author = pr["user"]["login"]
    head_sha = pr["head"]["sha"]
    base_ref = pr["base"]["ref"]

    logger.info("Reviewing PR %s#%d: %s", repo_full_name, pr_number, pr_title)

    # Set pending status while review is in progress
    set_commit_status(
        repo_full_name,
        head_sha,
        "pending",
        "Review in progress...",
        settings.status_context,
    )

    # Fetch core PR data
    diff = get_pr_diff(repo_full_name, pr_number)
    changed_files = get_changed_files(repo_full_name, pr_number)

    # Gather deep context
    logger.info("Gathering full context for %s#%d", repo_full_name, pr_number)
    tree_paths = get_tree_paths(repo_full_name, head_sha)
    repo_tree = get_repo_tree(repo_full_name, head_sha)
    config_files = get_config_files(repo_full_name, head_sha)
    imported_files = get_imported_files(changed_files, repo_full_name, head_sha, tree_paths)
    test_files = get_related_test_files(changed_files, repo_full_name, head_sha, tree_paths)
    base_versions = get_base_file_versions(changed_files, repo_full_name, base_ref)
    commits = get_pr_commits(repo_full_name, pr_number)
    pr_comments = get_pr_comments(repo_full_name, pr_number)

    # Run Claude review with full context
    result = await review_pull_request(
        diff=diff,
        pr_title=pr_title,
        pr_body=pr_body,
        changed_files=changed_files,
        repo_tree=repo_tree,
        config_files=config_files,
        imported_files=imported_files,
        test_files=test_files,
        base_versions=base_versions,
        commits=commits,
        pr_comments=pr_comments,
    )

    # Build review comment
    body_parts = [f"## GitGuardian Review\n\n{result.summary}"]

    if result.vulnerabilities:
        body_parts.append("\n### Security Vulnerabilities\n")
        for v in result.vulnerabilities:
            line_info = f" (line {v.line})" if v.line else ""
            body_parts.append(
                f"- **[{v.severity.value.upper()}]** `{v.file}`{line_info}: "
                f"{v.description}\n  - Fix: {v.suggestion}"
            )

    if result.contradictions:
        body_parts.append("\n### Contradictions Found\n")
        for c in result.contradictions:
            body_parts.append(
                f"- `{c.file}`: {c.description}\n  - Resolution: {c.resolution}"
            )

    if result.comments:
        body_parts.append("\n### Other Comments\n")
        for comment in result.comments:
            body_parts.append(f"- {comment}")

    review_body = "\n".join(body_parts)

    # Post the review and set commit status
    passed = result.approved and not result.vulnerabilities

    if passed:
        post_review(repo_full_name, pr_number, review_body, "APPROVE")
        set_commit_status(
            repo_full_name,
            head_sha,
            "success",
            "Review passed",
            settings.status_context,
        )
        logger.info("PR approved — attempting merge")
        merged = merge_pr(repo_full_name, pr_number)
        if not merged:
            post_comment(
                repo_full_name,
                pr_number,
                "PR was approved but could not be auto-merged "
                "(merge conflicts or branch protection). Please merge manually.",
            )
    else:
        post_review(repo_full_name, pr_number, review_body, "REQUEST_CHANGES")
        vuln_count = len(result.vulnerabilities)
        desc = f"Review failed — {vuln_count} issue(s) found" if vuln_count else "Review failed — changes requested"
        set_commit_status(
            repo_full_name,
            head_sha,
            "failure",
            desc,
            settings.status_context,
        )

    # Create Linear issues for high/critical vulnerabilities
    high_vulns = [
        v
        for v in result.vulnerabilities
        if v.severity in (Severity.HIGH, Severity.CRITICAL)
    ]
    for vuln in high_vulns:
        await create_security_issue(
            title=f"[Security] {vuln.severity.value.upper()}: {vuln.description[:80]}",
            description=(
                f"**Repository:** {repo_full_name}\n"
                f"**PR:** #{pr_number} — {pr_title}\n"
                f"**Author:** @{pr_author}\n"
                f"**File:** `{vuln.file}`"
                f"{f' (line {vuln.line})' if vuln.line else ''}\n\n"
                f"**Vulnerability:** {vuln.description}\n\n"
                f"**Suggested fix:** {vuln.suggestion}"
            ),
            priority=1 if vuln.severity == Severity.CRITICAL else 2,
        )

    return {"status": "reviewed", "approved": result.approved}


async def _handle_override_comment(data: dict) -> dict:
    """Allow authorized users to override a failed check via `/guardian override`."""
    action = data.get("action")
    if action != "created":
        return {"status": "ignored", "action": action}

    comment_body = data.get("comment", {}).get("body", "").strip().lower()
    if comment_body not in ("/guardian override", "/guardian approve"):
        return {"status": "ignored", "reason": "not an override command"}

    # Only process comments on PRs (issues with pull_request key)
    issue = data.get("issue", {})
    if "pull_request" not in issue:
        return {"status": "ignored", "reason": "not a pull request"}

    commenter = data.get("comment", {}).get("user", {}).get("login", "")
    allowed = settings.get_override_users()

    if commenter.lower() not in allowed:
        repo_full_name = data["repository"]["full_name"]
        pr_number = issue["number"]
        post_comment(
            repo_full_name,
            pr_number,
            f"@{commenter} You are not authorized to override GitGuardian checks.",
        )
        logger.warning(
            "Unauthorized override attempt by %s on %s#%d",
            commenter, repo_full_name, pr_number,
        )
        return {"status": "denied", "user": commenter}

    repo_full_name = data["repository"]["full_name"]
    pr_number = issue["number"]
    head_sha = get_pr_head_sha(repo_full_name, pr_number)

    set_commit_status(
        repo_full_name,
        head_sha,
        "success",
        f"Overridden by @{commenter}",
        settings.status_context,
    )
    post_comment(
        repo_full_name,
        pr_number,
        f"GitGuardian check overridden by @{commenter}.",
    )
    logger.info(
        "Check overridden by %s on %s#%d", commenter, repo_full_name, pr_number
    )
    return {"status": "overridden", "user": commenter}


# ─── Auth Endpoints (no API key required) ─────────────────────────────────────


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


@app.post("/auth/signup")
async def signup(req: SignupRequest):
    """Create a new account and return an API key."""
    if len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email")

    user_id = create_user(req.username, req.email, req.password)
    if user_id is None:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    api_key = generate_api_key(user_id, name="default")
    logger.info("New user signed up: %s", req.username)
    return {
        "message": "Account created successfully",
        "username": req.username,
        "api_key": api_key,
        "note": "Save this API key — it won't be shown again. Pass it as X-API-Key header.",
    }


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
async def login(req: LoginRequest):
    """Login and generate a new API key."""
    user_id = authenticate_user(req.username, req.password)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    api_key = generate_api_key(user_id, name=f"login-{secrets.token_hex(4)}")
    return {
        "message": "Login successful",
        "username": req.username,
        "api_key": api_key,
        "note": "Save this API key — it won't be shown again.",
    }


class GenerateKeyRequest(BaseModel):
    name: str = "default"


@app.post("/api/keys")
async def create_new_key(req: GenerateKeyRequest, user: dict = Depends(get_current_user)):
    """Generate an additional API key for the authenticated user."""
    new_key = generate_api_key(user["user_id"], name=req.name)
    return {
        "api_key": new_key,
        "name": req.name,
        "note": "Save this API key — it won't be shown again.",
    }


@app.get("/api/keys")
async def list_keys(user: dict = Depends(get_current_user)):
    """List all active API keys for the authenticated user (prefixes only)."""
    raw_keys = list_user_keys(user["user_id"])
    # Map key_prefix -> prefix for frontend, filter out revoked keys
    keys = [
        {
            "prefix": k["key_prefix"],
            "name": k["name"],
            "created_at": k["created_at"],
        }
        for k in raw_keys
        if not k.get("revoked")
    ]
    return {"keys": keys}


class RevokeKeyRequest(BaseModel):
    key_prefix: str


@app.post("/api/keys/revoke")
async def revoke_key(req: RevokeKeyRequest, user: dict = Depends(get_current_user)):
    """Revoke an API key by its prefix."""
    revoked = revoke_api_key(user["user_id"], req.key_prefix)
    if not revoked:
        raise HTTPException(status_code=404, detail="Key not found or already revoked")
    return {"message": "API key revoked"}


# ─── Frontend API Endpoints ───────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/repos")
async def api_repos(user: dict = Depends(get_current_user)):
    """List the authenticated user's repos."""
    repos = get_user_repos(user["user_id"])
    return {"repos": repos}


@app.get("/api/repos/details")
async def api_repos_details(user: dict = Depends(get_current_user)):
    """List repos with full GitHub metadata."""
    repos = get_user_repos(user["user_id"])
    details = []
    for repo_name in repos:
        try:
            info = get_repo_info(repo_name)
            details.append(info)
        except Exception:
            logger.exception("Failed to fetch info for %s", repo_name)
            details.append({
                "name": repo_name,
                "description": "",
                "language": "",
                "open_prs": 0,
                "stars": 0,
                "updated_at": "",
            })
    return {"repos": details}


class AddRepoRequest(BaseModel):
    repo: str  # e.g. "owner/repo"


@app.post("/api/repos")
async def api_add_repo(req: AddRepoRequest, user: dict = Depends(get_current_user)):
    """Add a repo to the authenticated user's account."""
    if "/" not in req.repo:
        raise HTTPException(status_code=400, detail="Repo must be in 'owner/repo' format")
    added = add_user_repo(user["user_id"], req.repo)
    if not added:
        raise HTTPException(status_code=409, detail="Repo already added")
    return {"message": f"Added {req.repo}", "repo": req.repo}


@app.delete("/api/repos/{owner}/{repo}")
async def api_remove_repo(owner: str, repo: str, user: dict = Depends(get_current_user)):
    """Remove a repo from the authenticated user's account."""
    removed = remove_user_repo(user["user_id"], f"{owner}/{repo}")
    if not removed:
        raise HTTPException(status_code=404, detail="Repo not found in your account")
    return {"message": f"Removed {owner}/{repo}"}


@app.get("/api/prs/{owner}/{repo}")
async def api_open_prs(owner: str, repo: str, user: dict = Depends(get_current_user)):
    """List open PRs for a repo (must be in user's account)."""
    repo_full = f"{owner}/{repo}"
    user_repos = get_user_repos(user["user_id"])
    if repo_full not in user_repos:
        raise HTTPException(status_code=403, detail="Repo not in your account. Add it first via POST /api/repos")
    prs = list_open_prs(repo_full)
    return {"repo": repo_full, "count": len(prs), "pull_requests": prs}


@app.get("/api/prs")
async def api_all_open_prs(user: dict = Depends(get_current_user)):
    """List open PRs across the authenticated user's repos."""
    repos = get_user_repos(user["user_id"])
    all_prs = []
    for repo in repos:
        try:
            prs = list_open_prs(repo)
            for pr in prs:
                pr["repo"] = repo
            all_prs.extend(prs)
        except Exception:
            logger.exception("Failed to fetch PRs for %s", repo)
    return {"count": len(all_prs), "pull_requests": all_prs}


@app.get("/api/security/issues")
async def api_security_issues(user: dict = Depends(get_current_user)):
    """List open security issues from Linear."""
    raw_issues = await get_security_issues()
    # Map identifier -> id for frontend consistency
    issues = [
        {
            "id": issue.get("identifier", ""),
            "title": issue.get("title", ""),
            "description": issue.get("description", ""),
            "priority": issue.get("priority"),
            "state": issue.get("state", ""),
            "url": issue.get("url", ""),
            "created_at": issue.get("created_at", ""),
        }
        for issue in raw_issues
    ]
    return {"count": len(issues), "issues": issues}


class ChatRequest(BaseModel):
    message: str
    context: str = ""  # optional repo/PR context


class ChatResponse(BaseModel):
    reply: str


@app.post("/api/chat", response_model=ChatResponse)
async def api_chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    """Direct chat with Claude about security, code review, or project questions."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    system = (
        "You are PR Guardian's AI assistant. You help developers with code review, "
        "security best practices, and understanding vulnerabilities. "
        "Be concise and actionable."
    )
    if req.context:
        system += f"\n\nAdditional context:\n{req.context}"

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": req.message}],
    )

    return ChatResponse(reply=response.content[0].text)


# ─── AI Testing Endpoint ─────────────────────────────────────────────────────


class TestRequest(BaseModel):
    repo: str  # e.g. "owner/repo"
    feature: str  # description of the feature to test
    mode: str = "alpha"  # alpha | beta | security | code_review
    files: list[str] = []  # optional specific files to focus on


TEST_SYSTEM_PROMPT = """\
You are GitGuardian's autonomous testing engine. You are given full source code \
from a repository and a feature description. Your job is to:

1. READ the actual source code provided.
2. IDENTIFY all code paths related to the described feature.
3. GENERATE two types of tests:
   a) "traced" tests — trace code logic mentally to verify correctness
   b) "api" tests — real HTTP requests to test API endpoints
   c) "ui" tests — real HTTP fetches to verify frontend pages load correctly
4. For traced tests, walk through the actual code conditionals step by step.
5. For api/ui tests, specify exact requests that will be EXECUTED against the running server.

You must trace real code paths — not guess. If a function validates input length >= 8, \
and your test sends a 5-char input, it FAILS. Trace the actual conditionals.

Respond ONLY with valid JSON matching this schema:
{
  "feature": "name of feature tested",
  "mode": "alpha|beta|security|code_review",
  "summary": "one-paragraph summary of test results",
  "files_analyzed": ["list of files you read and traced"],
  "tests": [
    {
      "id": "T1",
      "type": "traced|api|ui",
      "name": "descriptive test name",
      "category": "functional|edge_case|security|performance|integration|ui",
      "description": "what this test checks",
      "input": "the specific input or action",
      "expected": "what should happen",
      "actual": "what the code actually does (traced from source) — leave empty string for api/ui tests, they will be executed",
      "status": "pass|fail|warn",
      "severity": "low|medium|high|critical",
      "file": "path/to/relevant/file",
      "line": 42,
      "fix": "suggested fix if status is fail or warn, otherwise null",
      "endpoint": "/api/some/path (for api tests only)",
      "method": "GET|POST|DELETE (for api tests only)",
      "body": {"key": "value (for api POST tests only, can be null)"},
      "expected_status": 200,
      "expected_body_contains": "string or list of strings to check in response (api tests)",
      "path": "/ (for ui tests — the page path to fetch)",
      "expected_contains": ["strings that should appear in page HTML (ui tests)"],
      "expected_not_contains": ["strings that should NOT appear in page HTML (ui tests)"]
    }
  ],
  "coverage": {
    "tested_paths": 12,
    "total_identified_paths": 15,
    "percentage": 80
  },
  "recommendations": ["list of actionable recommendations"],
  "test_code": "optional: a complete Python test script using httpx that tests the API endpoints. Use assert statements. The script should be self-contained and print results."
}

IMPORTANT for api tests: The backend runs at http://localhost:8000. Use real endpoint paths from the source code.
IMPORTANT for ui tests: The frontend runs at http://localhost:3000. Test that pages render and contain expected text.
IMPORTANT: Generate at LEAST 3 api tests and 2 ui tests in addition to traced tests when the feature involves endpoints or UI.
"""

ALPHA_ADDENDUM = """
ALPHA TESTING MODE: Focus on core functionality correctness, happy paths, \
basic error handling, and input validation. Test the feature as if it's being \
used for the first time by internal testers. Look for crashes, unhandled \
exceptions, wrong return values, and missing validation.
"""

BETA_ADDENDUM = """
BETA TESTING MODE: Focus on edge cases, concurrency issues, performance under \
load, user experience problems, integration issues between components, and \
real-world usage patterns. Test the feature as if real users are about to use \
it. Look for race conditions, memory leaks, slow paths, confusing error \
messages, and data consistency issues.
"""

SECURITY_ADDENDUM = """
SECURITY AUDIT MODE: Focus exclusively on security vulnerabilities. Trace all \
user input from entry points to data sinks. Check for: SQL injection, XSS, \
SSRF, command injection, path traversal, IDOR, hardcoded secrets, insecure \
deserialization, missing auth checks, broken access control, sensitive data \
exposure. Every test should attempt to exploit a specific vulnerability.
"""

CODE_REVIEW_ADDENDUM = """
CODE REVIEW MODE: Focus on code quality, design patterns, maintainability, \
and best practices. Check for: dead code, duplicated logic, poor error \
handling, missing type safety, broken abstractions, inconsistent naming, \
missing documentation for complex logic, and violations of SOLID principles.
"""

MODE_ADDENDUMS = {
    "alpha": ALPHA_ADDENDUM,
    "beta": BETA_ADDENDUM,
    "security": SECURITY_ADDENDUM,
    "code_review": CODE_REVIEW_ADDENDUM,
}


@app.post("/api/test")
async def api_run_tests(req: TestRequest, user: dict = Depends(get_current_user)):
    """AI-driven feature testing: reads repo code and runs test scenarios."""
    import anthropic

    # Verify repo belongs to user
    user_repos = get_user_repos(user["user_id"])
    if req.repo not in user_repos:
        raise HTTPException(status_code=403, detail="Repo not in your account")

    from .github_client import _gh

    repo_obj = _gh().get_repo(req.repo)
    default_branch = repo_obj.default_branch

    # Gather repo context
    tree_paths = get_tree_paths(req.repo, default_branch)
    repo_tree = get_repo_tree(req.repo, default_branch)

    # Determine which files to read
    files_to_read: list[str] = []
    if req.files:
        # User specified files
        files_to_read = [f for f in req.files if f in tree_paths]
    else:
        # Auto-detect: read all source files (skip binaries, node_modules, etc.)
        skip_prefixes = (
            "node_modules/", ".git/", ".next/", "__pycache__/", "venv/",
            "dist/", "build/", ".cache/", "coverage/",
        )
        source_exts = {
            ".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs",
            ".java", ".rb", ".php", ".swift", ".kt",
        }
        for path in sorted(tree_paths):
            if any(path.startswith(p) for p in skip_prefixes):
                continue
            ext = "." + path.rsplit(".", 1)[1] if "." in path else ""
            if ext in source_exts:
                files_to_read.append(path)
            if len(files_to_read) >= 40:
                break

    # Fetch file contents
    file_contents: list[dict] = []
    for path in files_to_read:
        try:
            content = repo_obj.get_contents(path, ref=default_branch)
            if hasattr(content, "decoded_content") and content.size and content.size <= 100_000:
                text = content.decoded_content.decode("utf-8", errors="replace")
                file_contents.append({"filename": path, "content": text})
        except Exception:
            continue

    # Also grab config files for context
    config_files = get_config_files(req.repo, default_branch)

    # Build the prompt
    sections = [f"## Repository: {req.repo}\n## Feature to test: {req.feature}"]

    if repo_tree:
        sections.append(f"## Repository Structure\n```\n{repo_tree}\n```")

    if config_files:
        cfg_text = "\n\n".join(
            f"### {f['filename']}\n```\n{f['content']}\n```" for f in config_files
        )
        sections.append(f"## Config Files\n{cfg_text}")

    if file_contents:
        src_text = "\n\n".join(
            f"### {f['filename']}\n```\n{f['content']}\n```" for f in file_contents
        )
        sections.append(f"## Source Code\n{src_text}")

    user_message = "\n\n---\n\n".join(sections)

    # Truncate if needed
    if len(user_message) > 180_000:
        user_message = user_message[:180_000] + "\n\n... (truncated for length)"

    system = TEST_SYSTEM_PROMPT + MODE_ADDENDUMS.get(req.mode, ALPHA_ADDENDUM)

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]

    import json
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # If Claude didn't return valid JSON, wrap it
        result = {
            "feature": req.feature,
            "mode": req.mode,
            "summary": raw,
            "files_analyzed": [f["filename"] for f in file_contents],
            "tests": [],
            "coverage": {"tested_paths": 0, "total_identified_paths": 0, "percentage": 0},
            "recommendations": [],
        }

    # ─── Phase 2: Execute api and ui tests against running servers ────────
    from .test_runner import execute_api_tests, execute_ui_tests, execute_code_test

    api_tests = [t for t in result.get("tests", []) if t.get("type") == "api"]
    ui_tests = [t for t in result.get("tests", []) if t.get("type") == "ui"]
    traced_tests = [t for t in result.get("tests", []) if t.get("type", "traced") == "traced"]

    execution_log: list[str] = []

    # Execute API tests
    if api_tests:
        execution_log.append(f"Executing {len(api_tests)} API tests against backend...")
        # Get the user's actual API key for authenticated requests
        from .database import generate_api_key as _gen_key
        temp_key = _gen_key(user["user_id"], name="test-runner-temp")
        try:
            executed_api = await execute_api_tests(
                api_tests,
                backend_url=f"http://localhost:{settings.port}",
                api_key=temp_key,
            )
            # Merge execution results back
            api_map = {t["id"]: t for t in executed_api}
            for t in result["tests"]:
                if t.get("id") in api_map:
                    ex = api_map[t["id"]]
                    t["actual"] = ex.get("actual", t.get("actual", ""))
                    t["status"] = ex.get("status", t.get("status", "warn"))
                    t["executed"] = True
            execution_log.append(
                f"API tests complete: {sum(1 for t in executed_api if t.get('status') == 'pass')} passed, "
                f"{sum(1 for t in executed_api if t.get('status') == 'fail')} failed"
            )
        except Exception as e:
            execution_log.append(f"API test execution error: {str(e)}")
        finally:
            # Revoke the temporary key
            try:
                revoke_api_key(user["user_id"], temp_key[:10])
            except Exception:
                pass

    # Execute UI tests
    if ui_tests:
        execution_log.append(f"Executing {len(ui_tests)} UI tests against frontend...")
        try:
            executed_ui = await execute_ui_tests(ui_tests)
            ui_map = {t["id"]: t for t in executed_ui}
            for t in result["tests"]:
                if t.get("id") in ui_map:
                    ex = ui_map[t["id"]]
                    t["actual"] = ex.get("actual", t.get("actual", ""))
                    t["status"] = ex.get("status", t.get("status", "warn"))
                    t["executed"] = True
            execution_log.append(
                f"UI tests complete: {sum(1 for t in executed_ui if t.get('status') == 'pass')} passed, "
                f"{sum(1 for t in executed_ui if t.get('status') == 'fail')} failed"
            )
        except Exception as e:
            execution_log.append(f"UI test execution error: {str(e)}")

    # Execute generated test code if present
    test_code = result.get("test_code")
    code_result = None
    if test_code and isinstance(test_code, str) and len(test_code) > 20:
        execution_log.append("Executing generated test script...")
        code_result = execute_code_test(test_code)
        if code_result["passed"]:
            execution_log.append("Test script passed")
        else:
            execution_log.append(f"Test script failed (exit {code_result['exit_code']})")

    # Recompute coverage based on actual execution
    total = len(result.get("tests", []))
    passed = sum(1 for t in result.get("tests", []) if t.get("status") == "pass")
    failed = sum(1 for t in result.get("tests", []) if t.get("status") == "fail")
    if total > 0:
        result["coverage"] = {
            "tested_paths": total,
            "total_identified_paths": total,
            "percentage": round(passed / total * 100),
        }

    result["execution_log"] = execution_log
    if code_result:
        result["code_execution"] = code_result

    return result


class ManualReviewRequest(BaseModel):
    repo: str  # e.g. "owner/repo"
    pr_number: int


async def _run_review(
    repo_full_name: str,
    pr_number: int,
    pr_title: str,
    pr_body: str,
    pr_author: str,
    head_sha: str,
    base_ref: str,
) -> dict:
    """Run a full review on a PR and post results. Returns status dict."""
    diff = get_pr_diff(repo_full_name, pr_number)
    changed_files = get_changed_files(repo_full_name, pr_number)

    tree_paths = get_tree_paths(repo_full_name, head_sha)
    repo_tree = get_repo_tree(repo_full_name, head_sha)
    config_files = get_config_files(repo_full_name, head_sha)
    imported_files = get_imported_files(changed_files, repo_full_name, head_sha, tree_paths)
    test_files = get_related_test_files(changed_files, repo_full_name, head_sha, tree_paths)
    base_versions = get_base_file_versions(changed_files, repo_full_name, base_ref)
    commits = get_pr_commits(repo_full_name, pr_number)
    pr_comments = get_pr_comments(repo_full_name, pr_number)

    result = await review_pull_request(
        diff=diff,
        pr_title=pr_title,
        pr_body=pr_body,
        changed_files=changed_files,
        repo_tree=repo_tree,
        config_files=config_files,
        imported_files=imported_files,
        test_files=test_files,
        base_versions=base_versions,
        commits=commits,
        pr_comments=pr_comments,
    )

    body_parts = [f"## GitGuardian Review\n\n{result.summary}"]
    if result.vulnerabilities:
        body_parts.append("\n### Security Vulnerabilities\n")
        for v in result.vulnerabilities:
            line_info = f" (line {v.line})" if v.line else ""
            body_parts.append(
                f"- **[{v.severity.value.upper()}]** `{v.file}`{line_info}: "
                f"{v.description}\n  - Fix: {v.suggestion}"
            )
    if result.contradictions:
        body_parts.append("\n### Contradictions Found\n")
        for c in result.contradictions:
            body_parts.append(
                f"- `{c.file}`: {c.description}\n  - Resolution: {c.resolution}"
            )
    if result.comments:
        body_parts.append("\n### Other Comments\n")
        for comment in result.comments:
            body_parts.append(f"- {comment}")

    review_body = "\n".join(body_parts)
    passed = result.approved and not result.vulnerabilities

    if passed:
        post_review(repo_full_name, pr_number, review_body, "APPROVE")
        set_commit_status(repo_full_name, head_sha, "success", "Review passed", settings.status_context)
        merged = merge_pr(repo_full_name, pr_number)
        if not merged:
            post_comment(
                repo_full_name, pr_number,
                "PR was approved but could not be auto-merged "
                "(merge conflicts or branch protection). Please merge manually.",
            )
    else:
        post_review(repo_full_name, pr_number, review_body, "REQUEST_CHANGES")
        vuln_count = len(result.vulnerabilities)
        desc = f"Review failed — {vuln_count} issue(s) found" if vuln_count else "Review failed — changes requested"
        set_commit_status(repo_full_name, head_sha, "failure", desc, settings.status_context)

    high_vulns = [v for v in result.vulnerabilities if v.severity in (Severity.HIGH, Severity.CRITICAL)]
    for vuln in high_vulns:
        await create_security_issue(
            title=f"[Security] {vuln.severity.value.upper()}: {vuln.description[:80]}",
            description=(
                f"**Repository:** {repo_full_name}\n"
                f"**PR:** #{pr_number} — {pr_title}\n"
                f"**Author:** @{pr_author}\n"
                f"**File:** `{vuln.file}`{f' (line {vuln.line})' if vuln.line else ''}\n\n"
                f"**Vulnerability:** {vuln.description}\n\n"
                f"**Suggested fix:** {vuln.suggestion}"
            ),
            priority=1 if vuln.severity == Severity.CRITICAL else 2,
        )

    return {"status": "reviewed", "approved": result.approved}


@app.post("/api/review")
async def api_trigger_review(req: ManualReviewRequest, user: dict = Depends(get_current_user)):
    """Manually trigger a review for a specific PR (must be in user's repos)."""
    user_repos = get_user_repos(user["user_id"])
    if req.repo not in user_repos:
        raise HTTPException(status_code=403, detail="Repo not in your account")

    from .github_client import _gh

    repo = _gh().get_repo(req.repo)
    pr = repo.get_pull(req.pr_number)

    head_sha = pr.head.sha
    base_ref = pr.base.ref
    pr_author = pr.user.login

    set_commit_status(req.repo, head_sha, "pending", "Review in progress...", settings.status_context)

    try:
        result = await _run_review(
            req.repo, req.pr_number, pr.title, pr.body or "", pr_author, head_sha, base_ref
        )
        return result
    except Exception:
        logger.exception("Manual review failed for %s#%d", req.repo, req.pr_number)
        set_commit_status(req.repo, head_sha, "error", "Review encountered an error", settings.status_context)
        raise HTTPException(status_code=500, detail="Review failed")


@app.get("/")
async def root():
    return {"status": "ok", "app": "GitGuardian", "docs": "/docs"}


def main():
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
    )


if __name__ == "__main__":
    main()
