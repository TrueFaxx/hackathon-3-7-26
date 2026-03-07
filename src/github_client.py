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
