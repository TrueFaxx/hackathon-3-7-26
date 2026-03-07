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
