import hashlib
import hmac
import logging

from fastapi import FastAPI, Header, HTTPException, Request
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
    get_changed_files,
    get_pr_diff,
    merge_pr,
    post_comment,
    post_review,
)
from .linear_client import create_security_issue
from .models import Severity

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="PR Guardian", version="1.0.0")


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
    body_parts = [f"## PR Guardian Review\n\n{result.summary}"]

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

    # Post the review
    if result.approved and not result.vulnerabilities:
        post_review(repo_full_name, pr_number, review_body, "APPROVE")
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


@app.get("/health")
async def health():
    return {"status": "ok"}


def main():
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
    )


if __name__ == "__main__":
    main()
