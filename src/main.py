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
    list_open_prs,
    merge_pr,
    post_comment,
    post_review,
    set_commit_status,
)
from .database import (
    authenticate_user,
    create_user,
    generate_api_key,
    init_db,
    list_user_keys,
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


@app.post("/api/keys", dependencies=[Depends(require_api_key)])
async def create_new_key(req: GenerateKeyRequest, api_key: str = Security(_api_key_header)):
    """Generate an additional API key for the authenticated user."""
    user = validate_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    new_key = generate_api_key(user["user_id"], name=req.name)
    return {
        "api_key": new_key,
        "name": req.name,
        "note": "Save this API key — it won't be shown again.",
    }


@app.get("/api/keys", dependencies=[Depends(require_api_key)])
async def list_keys(api_key: str = Security(_api_key_header)):
    """List all API keys for the authenticated user (prefixes only)."""
    user = validate_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    keys = list_user_keys(user["user_id"])
    return {"keys": keys}


class RevokeKeyRequest(BaseModel):
    key_prefix: str


@app.post("/api/keys/revoke", dependencies=[Depends(require_api_key)])
async def revoke_key(req: RevokeKeyRequest, api_key: str = Security(_api_key_header)):
    """Revoke an API key by its prefix."""
    user = validate_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    revoked = revoke_api_key(user["user_id"], req.key_prefix)
    if not revoked:
        raise HTTPException(status_code=404, detail="Key not found or already revoked")
    return {"message": "API key revoked"}


# ─── Frontend API Endpoints ───────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/repos", dependencies=[Depends(require_api_key)])
async def api_repos():
    """List monitored repos."""
    repos = [
        r.strip()
        for r in settings.monitored_repos.split(",")
        if r.strip()
    ]
    return {"repos": repos}


@app.get("/api/prs/{owner}/{repo}", dependencies=[Depends(require_api_key)])
async def api_open_prs(owner: str, repo: str):
    """List open PRs for a repo with their Guardian status."""
    repo_full = f"{owner}/{repo}"
    prs = list_open_prs(repo_full)
    return {"repo": repo_full, "count": len(prs), "pull_requests": prs}


@app.get("/api/prs", dependencies=[Depends(require_api_key)])
async def api_all_open_prs():
    """List open PRs across all monitored repos."""
    repos = [r.strip() for r in settings.monitored_repos.split(",") if r.strip()]
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


@app.get("/api/security/issues", dependencies=[Depends(require_api_key)])
async def api_security_issues():
    """List open security issues from Linear."""
    issues = await get_security_issues()
    return {"count": len(issues), "issues": issues}


class ChatRequest(BaseModel):
    message: str
    context: str = ""  # optional repo/PR context


class ChatResponse(BaseModel):
    reply: str


@app.post("/api/chat", response_model=ChatResponse, dependencies=[Depends(require_api_key)])
async def api_chat(req: ChatRequest):
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


class ManualReviewRequest(BaseModel):
    repo: str  # e.g. "owner/repo"
    pr_number: int


@app.post("/api/review", dependencies=[Depends(require_api_key)])
async def api_trigger_review(req: ManualReviewRequest):
    """Manually trigger a review for a specific PR."""
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


def main():
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
    )


if __name__ == "__main__":
    main()
