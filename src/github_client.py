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


# ─── Branch / Commit / PR operations for auto-fix pipeline ──────────────────


def get_file_content(repo_full_name: str, path: str, ref: str) -> str | None:
    """Get the content of a single file at a given ref."""
    repo = _gh().get_repo(repo_full_name)
    try:
        content = repo.get_contents(path, ref=ref)
        if isinstance(content, list):
            return None
        return content.decoded_content.decode("utf-8", errors="replace")
    except Exception:
        return None


def update_file(
    repo_full_name: str,
    path: str,
    new_content: str,
    commit_message: str,
    branch: str,
) -> str | None:
    """Update (or create) a file on a branch. Returns the new commit SHA."""
    repo = _gh().get_repo(repo_full_name)
    try:
        existing = repo.get_contents(path, ref=branch)
        result = repo.update_file(
            path=path,
            message=commit_message,
            content=new_content,
            sha=existing.sha,
            branch=branch,
        )
    except Exception:
        # File doesn't exist yet — create it
        result = repo.create_file(
            path=path,
            message=commit_message,
            content=new_content,
            branch=branch,
        )
    logger.info("Committed %s on %s (%s)", path, branch, repo_full_name)
    return result["commit"].sha


def create_branch(repo_full_name: str, branch_name: str, from_ref: str) -> bool:
    """Create a new branch from a ref (SHA or branch name)."""
    repo = _gh().get_repo(repo_full_name)
    try:
        sha = repo.get_git_ref(f"heads/{from_ref}").object.sha
    except Exception:
        # from_ref might be a SHA directly
        sha = from_ref
    try:
        repo.create_git_ref(f"refs/heads/{branch_name}", sha)
        logger.info("Created branch %s from %s on %s", branch_name, sha[:8], repo_full_name)
        return True
    except Exception:
        logger.warning("Branch %s may already exist on %s", branch_name, repo_full_name)
        return False


def create_pull_request(
    repo_full_name: str,
    title: str,
    body: str,
    head: str,
    base: str,
) -> dict | None:
    """Create a new pull request. Returns PR info dict."""
    repo = _gh().get_repo(repo_full_name)
    try:
        pr = repo.create_pull(title=title, body=body, head=head, base=base)
        logger.info("Created PR #%d on %s", pr.number, repo_full_name)
        return {
            "number": pr.number,
            "title": pr.title,
            "url": pr.html_url,
            "head_branch": pr.head.ref,
            "base_branch": pr.base.ref,
        }
    except Exception as e:
        logger.warning("Failed to create PR on %s: %s", repo_full_name, e)
        return None


def check_merge_conflicts(repo_full_name: str, pr_number: int) -> dict:
    """Check if a PR has merge conflicts and return status."""
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    return {
        "mergeable": pr.mergeable,
        "mergeable_state": pr.mergeable_state,
        "merge_commit_sha": pr.merge_commit_sha,
        "base_branch": pr.base.ref,
        "head_branch": pr.head.ref,
        "changed_files": pr.changed_files,
        "additions": pr.additions,
        "deletions": pr.deletions,
    }


def get_branch_diff(repo_full_name: str, base: str, head: str) -> str:
    """Get the diff between two branches."""
    repo = _gh().get_repo(repo_full_name)
    comparison = repo.compare(base, head)
    diff_parts = []
    for f in comparison.files:
        if f.patch:
            diff_parts.append(f"diff --git a/{f.filename} b/{f.filename}\n{f.patch}")
    return "\n\n".join(diff_parts)


def update_pr_description(
    repo_full_name: str, pr_number: int, title: str | None = None, body: str | None = None
) -> None:
    """Update a PR's title and/or body."""
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    kwargs = {}
    if title:
        kwargs["title"] = title
    if body:
        kwargs["body"] = body
    if kwargs:
        pr.edit(**kwargs)
        logger.info("Updated PR #%d description on %s", pr_number, repo_full_name)
