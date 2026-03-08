import json
import logging

import anthropic

from .config import settings
from .models import ReviewResult

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client

SYSTEM_PROMPT = """\
You are a senior code reviewer and security auditor. You are given the FULL context \
of a pull request: the diff, changed file contents, their base-branch versions, \
the project structure, config files, imported dependencies, related test files, \
commit history, and prior discussion.

Use ALL of this context to produce the most thorough review possible:

1. **Code quality** — logic errors, bad patterns, poor naming, missing edge cases, \
dead code, performance issues, type mismatches, broken contracts with callers/callees.
2. **Security vulnerabilities** — injection (SQL, command, XSS, SSRF), hardcoded \
secrets, insecure deserialization, path traversal, IDOR, missing auth checks, \
dependency issues, and other OWASP Top 10 problems. Cross-reference imported code \
to trace data flow from user input to dangerous sinks.
3. **Test coverage** — check if related test files adequately cover the changes. \
Flag missing test cases for new logic, edge cases, or security-sensitive paths.
4. **Contradictions** — code that conflicts with itself, existing patterns in the \
codebase, the PR description, or project config. Propose a concrete resolution.
5. **Regressions** — compare base-branch file versions against the new code to \
detect accidental removals, changed signatures that break callers, or dropped \
error handling.
6. **Approve or request changes** based on the overall assessment.

Respond ONLY with valid JSON matching this schema:
{
  "approved": bool,
  "summary": "one-paragraph summary of your review",
  "vulnerabilities": [
    {
      "file": "path/to/file",
      "line": 42,
      "severity": "low|medium|high|critical",
      "description": "what the issue is",
      "suggestion": "how to fix it"
    }
  ],
  "contradictions": [
    {
      "file": "path/to/file",
      "description": "what contradicts what",
      "resolution": "how to resolve it"
    }
  ],
  "comments": ["any other review comments"]
}
"""


async def review_pull_request(
    diff: str,
    pr_title: str,
    pr_body: str,
    changed_files: list[dict],
    repo_tree: str = "",
    config_files: list[dict] | None = None,
    imported_files: list[dict] | None = None,
    test_files: list[dict] | None = None,
    base_versions: list[dict] | None = None,
    commits: list[dict] | None = None,
    pr_comments: list[dict] | None = None,
) -> ReviewResult:
    sections = []

    # 1. PR metadata
    sections.append(
        f"## Pull Request: {pr_title}\n\n"
        f"**Description:** {pr_body or 'No description provided.'}"
    )

    # 2. Commit history
    if commits:
        commit_text = "\n".join(f"- `{c['sha']}` {c['message']}" for c in commits)
        sections.append(f"## Commit History\n{commit_text}")

    # 3. Prior discussion
    if pr_comments:
        disc = "\n".join(
            f"- **@{c['author']}**"
            + (f" on `{c['path']}:{c.get('line', '')}`" if c.get("path") else "")
            + f": {c['body']}"
            for c in pr_comments
        )
        sections.append(f"## Prior Discussion\n{disc}")

    # 4. Repo structure
    if repo_tree:
        sections.append(f"## Repository Structure\n```\n{repo_tree}\n```")

    # 5. Config / meta files
    if config_files:
        cfg_text = "\n\n".join(
            f"### {f['filename']}\n```\n{f['content']}\n```" for f in config_files
        )
        sections.append(f"## Project Config Files\n{cfg_text}")

    # 6. The diff
    sections.append(f"## Diff\n```diff\n{diff}\n```")

    # 7. Changed file contents (new versions)
    file_context = "\n\n".join(
        f"### {f['filename']}\n```\n{f.get('content', '(binary or too large)')}\n```"
        for f in changed_files
    )
    sections.append(f"## Changed Files (current PR version)\n{file_context}")

    # 8. Base-branch versions for comparison
    if base_versions:
        base_text = "\n\n".join(
            f"### {f['filename']}\n```\n{f['content']}\n```" for f in base_versions
        )
        sections.append(f"## Base Branch Versions (before this PR)\n{base_text}")

    # 9. Imported / dependency files
    if imported_files:
        imp_text = "\n\n".join(
            f"### {f['filename']} (imported by changed code)\n```\n{f['content']}\n```"
            for f in imported_files
        )
        sections.append(f"## Local Dependencies (imported files)\n{imp_text}")

    # 10. Related test files
    if test_files:
        test_text = "\n\n".join(
            f"### {f['filename']}\n```\n{f['content']}\n```" for f in test_files
        )
        sections.append(f"## Related Test Files\n{test_text}")

    user_message = "\n\n---\n\n".join(sections)

    # Truncate if exceeding ~180k chars to stay within token limits
    if len(user_message) > 180_000:
        user_message = user_message[:180_000] + "\n\n... (truncated for length)"
        logger.warning("Context truncated to 180k chars")

    logger.info(
        "Sending PR to Claude for review (%d chars, %d sections)",
        len(user_message),
        len(sections),
    )

    response = _get_client().messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Claude returned invalid JSON, attempting to extract JSON block")
        # Try to find JSON object in the response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(raw[start:end])
        else:
            logger.error("Could not extract JSON from Claude response: %s", raw[:500])
            return ReviewResult(
                approved=False,
                summary="Review failed: could not parse Claude response.",
                vulnerabilities=[],
                contradictions=[],
                comments=["Automated review encountered a parsing error. Please re-trigger the review."],
            )
    return ReviewResult(**data)
