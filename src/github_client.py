import logging

from github import Auth, Github

from .config import settings

logger = logging.getLogger(__name__)

def _get_gh() -> Github:
    return Github(auth=Auth.Token(settings.github_token))


gh = _get_gh() if settings.github_token else None


def _gh() -> Github:
    global gh
    if gh is None:
        gh = _get_gh()
    return gh


def get_pr_diff(repo_full_name: str, pr_number: int) -> str:
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    files = pr.get_files()
    diff_parts = []
    for f in files:
        if f.patch:
            diff_parts.append(f"diff --git a/{f.filename} b/{f.filename}\n{f.patch}")
    return "\n\n".join(diff_parts)


def get_changed_files(repo_full_name: str, pr_number: int) -> list[dict]:
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    result = []
    for f in pr.get_files():
        entry = {"filename": f.filename, "status": f.status}
        if f.status != "removed":
            try:
                content = repo.get_contents(f.filename, ref=pr.head.sha)
                if hasattr(content, "decoded_content"):
                    entry["content"] = content.decoded_content.decode(
                        "utf-8", errors="replace"
                    )
                else:
                    entry["content"] = "(binary or too large)"
            except Exception:
                entry["content"] = "(could not fetch)"
        result.append(entry)
    return result


def post_review(
    repo_full_name: str,
    pr_number: int,
    body: str,
    event: str,
) -> None:
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    pr.create_review(body=body, event=event)
    logger.info("Posted %s review on %s#%d", event, repo_full_name, pr_number)


def merge_pr(repo_full_name: str, pr_number: int) -> bool:
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    if not pr.mergeable:
        logger.warning("PR %s#%d is not mergeable", repo_full_name, pr_number)
        return False
    pr.merge(merge_method="squash")
    logger.info("Merged PR %s#%d", repo_full_name, pr_number)
    return True


def post_comment(repo_full_name: str, pr_number: int, body: str) -> None:
    repo = _gh().get_repo(repo_full_name)
    issue = repo.get_issue(pr_number)
    issue.create_comment(body)


def set_commit_status(
    repo_full_name: str,
    sha: str,
    state: str,
    description: str,
    context: str = "GitGuardian",
) -> None:
    """Set a commit status check (pass/fail) on a specific SHA.

    Args:
        state: one of "pending", "success", "failure", "error"
    """
    repo = _gh().get_repo(repo_full_name)
    repo.get_commit(sha).create_status(
        state=state,
        description=description[:140],  # GitHub limits to 140 chars
        context=context,
    )
    logger.info("Set commit status %s on %s (%s)", state, sha[:8], context)


def get_pr_head_sha(repo_full_name: str, pr_number: int) -> str:
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    return pr.head.sha


def accept_pending_invitations() -> list[str]:
    """Accept all pending repository collaboration invitations."""
    accepted = []
    try:
        user = _gh().get_user()
        for invite in user.get_invitations():
            invite.accept()
            repo_name = invite.repository.full_name
            logger.info("Accepted collaboration invite for %s", repo_name)
            accepted.append(repo_name)
    except Exception:
        logger.exception("Failed to check/accept invitations")
    return accepted


def get_repo_info(repo_full_name: str) -> dict:
    """Get repo metadata from GitHub."""
    repo = _gh().get_repo(repo_full_name)
    return {
        "name": repo.full_name,
        "description": repo.description or "",
        "language": repo.language or "",
        "open_prs": repo.get_pulls(state="open").totalCount,
        "stars": repo.stargazers_count,
        "updated_at": repo.updated_at.isoformat() if repo.updated_at else "",
    }


def list_open_prs(repo_full_name: str) -> list[dict]:
    repo = _gh().get_repo(repo_full_name)
    prs = repo.get_pulls(state="open", sort="created", direction="desc")
    results = []
    for pr in prs:
        statuses = repo.get_commit(pr.head.sha).get_statuses()
        guardian_status = None
        for s in statuses:
            if s.context == settings.status_context:
                guardian_status = s.state
                break
        results.append({
            "number": pr.number,
            "title": pr.title,
            "author": pr.user.login,
            "created_at": pr.created_at.isoformat(),
            "updated_at": pr.updated_at.isoformat(),
            "head_sha": pr.head.sha,
            "base_branch": pr.base.ref,
            "head_branch": pr.head.ref,
            "url": pr.html_url,
            "guardian_status": guardian_status,
        })
    return results
