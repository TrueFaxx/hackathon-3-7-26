import logging

import httpx

from .config import settings

logger = logging.getLogger(__name__)

LINEAR_API_URL = "https://api.linear.app/graphql"

def _headers() -> dict:
    return {
        "Authorization": settings.linear_api_key,
        "Content-Type": "application/json",
    }


async def create_security_issue(
    title: str,
    description: str,
    priority: int = 1,
    assignee_email: str | None = None,
) -> str | None:
    """Create a high-priority issue in Linear for a security vulnerability.

    Args:
        title: Issue title.
        description: Markdown description of the vulnerability.
        priority: 0=none, 1=urgent, 2=high, 3=medium, 4=low.
        assignee_email: Optional email of the person to assign.

    Returns:
        The Linear issue identifier (e.g. "ENG-123") or None on failure.
    """
    if not settings.linear_api_key or not settings.linear_team_id:
        logger.warning("Linear not configured — skipping issue creation for: %s", title)
        return None

    variables: dict = {
        "teamId": settings.linear_team_id,
        "title": title,
        "description": description,
        "priority": priority,
    }

    if settings.security_label_id:
        variables["labelIds"] = [settings.security_label_id]

    if assignee_email:
        user_id = await _find_user_by_email(assignee_email)
        if user_id:
            variables["assigneeId"] = user_id

    mutation = """
    mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            success
            issue {
                identifier
                url
            }
        }
    }
    """

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LINEAR_API_URL,
            headers=_headers(),
            json={"query": mutation, "variables": {"input": variables}},
        )
        data = resp.json()

    result = data.get("data", {}).get("issueCreate", {})
    if result.get("success"):
        issue = result["issue"]
        logger.info("Created Linear issue %s: %s", issue["identifier"], issue["url"])
        return issue["identifier"]

    logger.error("Failed to create Linear issue: %s", data)
    return None


async def get_security_issues() -> list[dict]:
    """Fetch open security issues from Linear."""
    if not settings.linear_api_key or not settings.linear_team_id:
        return []

    filter_input: dict = {
        "team": {"id": {"eq": settings.linear_team_id}},
        "state": {"type": {"nin": ["completed", "canceled"]}},
    }
    if settings.security_label_id:
        filter_input["labels"] = {"id": {"eq": settings.security_label_id}}

    query = """
    query($filter: IssueFilter) {
        issues(filter: $filter, orderBy: updatedAt, first: 50) {
            nodes {
                identifier
                title
                description
                priority
                url
                state { name }
                assignee { name email }
                createdAt
            }
        }
    }
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                LINEAR_API_URL,
                headers=_headers(),
                json={"query": query, "variables": {"filter": filter_input}},
            )
            data = resp.json()

        nodes = data.get("data", {}).get("issues", {}).get("nodes", [])
        return [
            {
                "identifier": n["identifier"],
                "title": n["title"],
                "description": n.get("description", ""),
                "priority": n.get("priority"),
                "url": n["url"],
                "state": n.get("state", {}).get("name", ""),
                "assignee": n.get("assignee", {}).get("name") if n.get("assignee") else None,
                "created_at": n.get("createdAt", ""),
            }
            for n in nodes
        ]
    except Exception:
        logger.exception("Failed to fetch Linear issues")
        return []


async def _find_user_by_email(email: str) -> str | None:
    query = """
    query {
        users {
            nodes {
                id
                email
            }
        }
    }
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LINEAR_API_URL,
            headers=_headers(),
            json={"query": query},
        )
        data = resp.json()

    for user in data.get("data", {}).get("users", {}).get("nodes", []):
        if user.get("email") == email:
            return user["id"]
    return None
