"""PR Auto-Fix Pipeline — AI-driven fix, test, iterate, document, merge.

Pipeline types:
1. pr_fix: PR has issues → plan fix → apply → test → iterate → document → push
2. branch_merge: New branch → check conflicts → resolve → test → merge to main
"""

import json
import logging

import anthropic

from .config import settings
from .github_client import (
    _gh,
    get_pr_diff,
    get_changed_files,
    get_file_content,
    update_file,
    create_branch,
    post_comment,
    post_review,
    set_commit_status,
    merge_pr,
    check_merge_conflicts,
    get_branch_diff,
    update_pr_description,
)
from .context import (
    get_repo_tree,
    get_config_files,
    get_imported_files,
    get_related_test_files,
    get_tree_paths,
    get_base_file_versions,
    get_pr_commits,
)
from .claude_reviewer import review_pull_request
from .database import create_pipeline_run, update_pipeline_run

logger = logging.getLogger(__name__)

MAX_FIX_ITERATIONS = 3


def _claude(system: str, user_msg: str, max_tokens: int = 8192) -> str:
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return raw


# ─── Step 1: Analyze PR and create fix plan ──────────────────────────────────

PLAN_SYSTEM = """\
You are GitGuardian's auto-fix planner. You are given a PR review that found issues \
(vulnerabilities, contradictions, code problems). Your job is to create a concrete, \
step-by-step fix plan.

For each issue, specify:
1. Which file to modify
2. What the current problematic code looks like (exact snippet)
3. What the fixed code should be
4. Why this fix resolves the issue

Respond ONLY with valid JSON:
{
  "plan_summary": "one paragraph describing all fixes",
  "fixes": [
    {
      "id": "F1",
      "file": "path/to/file.py",
      "issue": "description of the problem",
      "severity": "low|medium|high|critical",
      "old_code": "exact current code snippet (enough context to locate it)",
      "new_code": "the fixed code",
      "explanation": "why this fix works"
    }
  ],
  "new_files": [
    {
      "file": "path/to/new_file.py",
      "content": "full file content",
      "reason": "why this file is needed"
    }
  ],
  "test_plan": "description of how to verify the fixes work"
}
"""


async def create_fix_plan(
    repo_full_name: str,
    pr_number: int,
    review_result: dict,
) -> dict:
    """Analyze review findings and create a fix plan."""
    diff = get_pr_diff(repo_full_name, pr_number)
    changed_files = get_changed_files(repo_full_name, pr_number)

    pr_obj = _gh().get_repo(repo_full_name).get_pull(pr_number)
    head_sha = pr_obj.head.sha
    tree_paths = get_tree_paths(repo_full_name, head_sha)

    # Get full file contents for files that need fixing
    file_contents = {}
    for f in changed_files:
        if f.get("content"):
            file_contents[f["filename"]] = f["content"]

    # Also get files mentioned in review that might not be in the diff
    for vuln in review_result.get("vulnerabilities", []):
        path = vuln.get("file", "")
        if path and path not in file_contents:
            content = get_file_content(repo_full_name, path, head_sha)
            if content:
                file_contents[path] = content

    for contradiction in review_result.get("contradictions", []):
        path = contradiction.get("file", "")
        if path and path not in file_contents:
            content = get_file_content(repo_full_name, path, head_sha)
            if content:
                file_contents[path] = content

    user_msg_parts = [
        f"## PR #{pr_number} Review Results\n{json.dumps(review_result, indent=2)}",
        f"## Diff\n```diff\n{diff}\n```",
    ]

    for path, content in file_contents.items():
        user_msg_parts.append(f"## {path}\n```\n{content}\n```")

    user_msg = "\n\n---\n\n".join(user_msg_parts)
    if len(user_msg) > 150_000:
        user_msg = user_msg[:150_000] + "\n\n...(truncated)"

    raw = _claude(PLAN_SYSTEM, user_msg)
    return json.loads(raw)


# ─── Step 2: Apply fixes ─────────────────────────────────────────────────────


async def apply_fixes(
    repo_full_name: str,
    branch: str,
    plan: dict,
) -> list[dict]:
    """Apply fix plan by committing changes to the branch. Returns applied fixes."""
    applied = []

    for fix in plan.get("fixes", []):
        file_path = fix["file"]
        old_code = fix["old_code"]
        new_code = fix["new_code"]

        # Get current file content
        current = get_file_content(repo_full_name, file_path, branch)
        if current is None:
            applied.append({**fix, "applied": False, "reason": "file not found"})
            continue

        if old_code not in current:
            # Try a fuzzy match — strip whitespace differences
            stripped_old = " ".join(old_code.split())
            stripped_current = " ".join(current.split())
            if stripped_old not in stripped_current:
                applied.append({**fix, "applied": False, "reason": "old_code not found in file"})
                continue
            # Reconstruct with proper whitespace match
            lines = current.split("\n")
            for i, line in enumerate(lines):
                if old_code.split("\n")[0].strip() in line:
                    # Found start, replace block
                    old_lines = old_code.split("\n")
                    new_content = (
                        "\n".join(lines[:i])
                        + "\n" + new_code + "\n"
                        + "\n".join(lines[i + len(old_lines):])
                    )
                    break
            else:
                applied.append({**fix, "applied": False, "reason": "could not locate code block"})
                continue
        else:
            new_content = current.replace(old_code, new_code, 1)

        # Commit the fix
        commit_msg = f"fix: {fix['issue'][:72]}\n\nApplied by GitGuardian auto-fix pipeline.\n{fix['explanation']}"
        sha = update_file(repo_full_name, file_path, new_content, commit_msg, branch)
        applied.append({**fix, "applied": True, "commit_sha": sha})

    # Create new files if specified
    for new_file in plan.get("new_files", []):
        commit_msg = f"add: {new_file['file']}\n\n{new_file['reason']}"
        sha = update_file(repo_full_name, new_file["file"], new_file["content"], commit_msg, branch)
        applied.append({
            "id": f"NF-{new_file['file']}",
            "file": new_file["file"],
            "issue": new_file["reason"],
            "applied": True,
            "commit_sha": sha,
        })

    return applied


# ─── Step 3: Test the fixes ──────────────────────────────────────────────────


async def test_fixes(
    repo_full_name: str,
    pr_number: int,
) -> dict:
    """Re-run the AI review on the PR after fixes to check if issues are resolved."""
    diff = get_pr_diff(repo_full_name, pr_number)
    changed_files = get_changed_files(repo_full_name, pr_number)
    pr_obj = _gh().get_repo(repo_full_name).get_pull(pr_number)
    head_sha = pr_obj.head.sha

    tree_paths = get_tree_paths(repo_full_name, head_sha)
    repo_tree = get_repo_tree(repo_full_name, head_sha)
    config_files = get_config_files(repo_full_name, head_sha)
    imported_files = get_imported_files(changed_files, repo_full_name, head_sha, tree_paths)
    test_files = get_related_test_files(changed_files, repo_full_name, head_sha, tree_paths)
    base_versions = get_base_file_versions(changed_files, repo_full_name, pr_obj.base.ref)

    result = await review_pull_request(
        diff=diff,
        pr_title=pr_obj.title,
        pr_body=pr_obj.body or "",
        changed_files=changed_files,
        repo_tree=repo_tree,
        config_files=config_files,
        imported_files=imported_files,
        test_files=test_files,
        base_versions=base_versions,
    )

    return {
        "approved": result.approved,
        "summary": result.summary,
        "remaining_vulnerabilities": [v.model_dump() for v in result.vulnerabilities],
        "remaining_contradictions": [c.model_dump() for c in result.contradictions],
        "comments": result.comments,
        "issues_remaining": len(result.vulnerabilities) + len(result.contradictions),
    }


# ─── Step 4: Document and finalize ───────────────────────────────────────────

DOC_SYSTEM = """\
You are GitGuardian's documentation writer. Given a list of fixes that were applied \
to a PR, write a clear, professional PR description that:

1. Summarizes what the PR does (original purpose + fixes applied)
2. Lists each fix with what was changed and why
3. Notes any remaining items or things to watch for
4. Includes a test plan

Respond ONLY with valid JSON:
{
  "title": "PR title (concise, max 72 chars)",
  "body": "Full PR description in markdown"
}
"""


async def document_fixes(
    repo_full_name: str,
    pr_number: int,
    original_title: str,
    original_body: str,
    applied_fixes: list[dict],
    test_result: dict,
) -> dict:
    """Generate documentation for the fixes and update the PR."""
    user_msg = json.dumps({
        "original_title": original_title,
        "original_body": original_body,
        "applied_fixes": applied_fixes,
        "test_result": test_result,
    }, indent=2)

    raw = _claude(DOC_SYSTEM, user_msg, max_tokens=4096)
    doc = json.loads(raw)

    # Update the PR
    update_pr_description(repo_full_name, pr_number, title=doc.get("title"), body=doc.get("body"))

    return doc


# ─── Main pipeline orchestrators ─────────────────────────────────────────────


async def run_pr_fix_pipeline(
    repo_full_name: str,
    pr_number: int,
    user_id: int | None = None,
) -> dict:
    """Full PR fix pipeline: review → plan → fix → test → iterate → document → merge.

    Returns the pipeline result with all steps.
    """
    run_id = create_pipeline_run(
        repo=repo_full_name,
        pipeline_type="pr_fix",
        pr_number=pr_number,
        user_id=user_id,
    )

    steps: list[dict] = []
    pr_obj = _gh().get_repo(repo_full_name).get_pull(pr_number)
    head_branch = pr_obj.head.ref
    original_title = pr_obj.title
    original_body = pr_obj.body or ""

    def add_step(name: str, status: str, detail: dict | str = ""):
        step = {"name": name, "status": status, "detail": detail}
        steps.append(step)
        update_pipeline_run(run_id, "running", steps)
        return step

    try:
        # ─── Step 1: Initial review ──────────────────────────────────────
        add_step("review", "running", "Analyzing PR for issues...")

        diff = get_pr_diff(repo_full_name, pr_number)
        changed_files = get_changed_files(repo_full_name, pr_number)
        head_sha = pr_obj.head.sha
        tree_paths = get_tree_paths(repo_full_name, head_sha)
        repo_tree = get_repo_tree(repo_full_name, head_sha)
        config_files = get_config_files(repo_full_name, head_sha)
        imported_files = get_imported_files(changed_files, repo_full_name, head_sha, tree_paths)
        test_files = get_related_test_files(changed_files, repo_full_name, head_sha, tree_paths)
        base_versions = get_base_file_versions(changed_files, repo_full_name, pr_obj.base.ref)
        commits = get_pr_commits(repo_full_name, pr_number)

        review = await review_pull_request(
            diff=diff,
            pr_title=original_title,
            pr_body=original_body,
            changed_files=changed_files,
            repo_tree=repo_tree,
            config_files=config_files,
            imported_files=imported_files,
            test_files=test_files,
            base_versions=base_versions,
            commits=commits,
        )

        review_data = {
            "approved": review.approved,
            "summary": review.summary,
            "vulnerabilities": [v.model_dump() for v in review.vulnerabilities],
            "contradictions": [c.model_dump() for c in review.contradictions],
            "comments": review.comments,
        }

        issue_count = len(review.vulnerabilities) + len(review.contradictions)
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = review_data

        # If no issues, skip to documentation
        if review.approved and issue_count == 0:
            add_step("plan", "skipped", "No issues found — PR is clean")
            add_step("fix", "skipped", "No fixes needed")
            add_step("verify", "skipped", "No verification needed")
            add_step("document", "running", "Documenting clean review...")

            doc = await document_fixes(
                repo_full_name, pr_number,
                original_title, original_body,
                [], review_data,
            )
            steps[-1]["status"] = "done"
            steps[-1]["detail"] = doc

            add_step("merge", "done", "PR approved — ready to merge")
            set_commit_status(repo_full_name, head_sha, "success", "Pipeline passed — no issues", settings.status_context)
            update_pipeline_run(run_id, "completed", steps)
            return {"run_id": run_id, "status": "completed", "steps": steps, "needs_approval": False, "approved": True}

        # ─── Step 2: Create fix plan ─────────────────────────────────────
        add_step("plan", "running", f"Planning fixes for {issue_count} issues...")

        plan = await create_fix_plan(repo_full_name, pr_number, review_data)
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = plan

        # Return with needs_approval — user must confirm before fixes are applied
        add_step("fix", "waiting", "Waiting for user approval to apply fixes...")
        update_pipeline_run(run_id, "awaiting_approval", steps)

        return {
            "run_id": run_id,
            "status": "awaiting_approval",
            "steps": steps,
            "needs_approval": True,
            "plan": plan,
            "review": review_data,
        }

    except Exception as e:
        add_step("error", "failed", str(e))
        update_pipeline_run(run_id, "failed", steps)
        logger.exception("Pipeline failed for %s#%d", repo_full_name, pr_number)
        return {"run_id": run_id, "status": "failed", "steps": steps, "error": str(e)}


async def continue_pr_fix_pipeline(
    run_id: int,
    repo_full_name: str,
    pr_number: int,
) -> dict:
    """Continue pipeline after user approves fixes. Apply → test → iterate → document → merge."""
    from .database import get_pipeline_run

    run = get_pipeline_run(run_id)
    if not run:
        return {"error": "Pipeline run not found"}

    steps = run["steps"]
    pr_obj = _gh().get_repo(repo_full_name).get_pull(pr_number)
    head_branch = pr_obj.head.ref
    original_title = pr_obj.title
    original_body = pr_obj.body or ""

    def add_step(name: str, status: str, detail: dict | str = ""):
        step = {"name": name, "status": status, "detail": detail}
        steps.append(step)
        update_pipeline_run(run_id, "running", steps)
        return step

    # Find the plan from previous steps
    plan = None
    review_data = None
    for step in steps:
        if step["name"] == "plan" and step["status"] == "done":
            plan = step["detail"]
        if step["name"] == "review" and step["status"] == "done":
            review_data = step["detail"]

    if not plan:
        return {"error": "No fix plan found in pipeline"}

    try:
        # Remove the "waiting" fix step
        steps = [s for s in steps if not (s["name"] == "fix" and s["status"] == "waiting")]

        # ─── Step 3: Apply fixes ─────────────────────────────────────────
        add_step("fix", "running", f"Applying {len(plan.get('fixes', []))} fixes...")

        applied = await apply_fixes(repo_full_name, head_branch, plan)
        applied_count = sum(1 for f in applied if f.get("applied"))
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = {
            "applied": applied_count,
            "total": len(applied),
            "fixes": applied,
        }

        post_comment(
            repo_full_name, pr_number,
            f"**GitGuardian Auto-Fix** applied {applied_count}/{len(applied)} fixes. Running verification..."
        )

        # ─── Step 4: Test/verify (with iteration) ────────────────────────
        for iteration in range(1, MAX_FIX_ITERATIONS + 1):
            step_name = f"verify_round_{iteration}" if iteration > 1 else "verify"
            add_step(step_name, "running", f"Verification round {iteration}...")

            test_result = await test_fixes(repo_full_name, pr_number)
            steps[-1]["status"] = "done"
            steps[-1]["detail"] = test_result

            if test_result["approved"] and test_result["issues_remaining"] == 0:
                break

            if iteration < MAX_FIX_ITERATIONS:
                # More issues — generate additional fixes
                add_step(f"refix_round_{iteration + 1}", "running",
                         f"Re-fixing {test_result['issues_remaining']} remaining issues...")

                replan = await create_fix_plan(repo_full_name, pr_number, test_result)
                re_applied = await apply_fixes(repo_full_name, head_branch, replan)
                re_count = sum(1 for f in re_applied if f.get("applied"))
                steps[-1]["status"] = "done"
                steps[-1]["detail"] = {
                    "applied": re_count,
                    "fixes": re_applied,
                    "plan": replan,
                }

        # ─── Step 5: Document ────────────────────────────────────────────
        add_step("document", "running", "Generating documentation...")

        doc = await document_fixes(
            repo_full_name, pr_number,
            original_title, original_body,
            applied, test_result,
        )
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = doc

        # ─── Step 6: Merge ───────────────────────────────────────────────
        head_sha = pr_obj.head.sha
        if test_result.get("approved"):
            add_step("merge", "running", "Merging to main...")
            set_commit_status(repo_full_name, head_sha, "success", "Pipeline passed — fixes applied", settings.status_context)
            post_review(repo_full_name, pr_number, "**GitGuardian Auto-Fix pipeline passed.** All issues resolved.", "APPROVE")
            merged = merge_pr(repo_full_name, pr_number)
            steps[-1]["status"] = "done" if merged else "failed"
            steps[-1]["detail"] = "Merged to main" if merged else "Merge failed (conflicts or permissions)"
            update_pipeline_run(run_id, "completed" if merged else "merge_failed", steps)
        else:
            add_step("merge", "blocked", f"{test_result['issues_remaining']} issues remain after {MAX_FIX_ITERATIONS} fix rounds")
            set_commit_status(repo_full_name, head_sha, "failure", "Pipeline: some issues remain", settings.status_context)
            post_comment(
                repo_full_name, pr_number,
                f"**GitGuardian Auto-Fix** completed {MAX_FIX_ITERATIONS} rounds but "
                f"{test_result['issues_remaining']} issues remain. Manual review recommended."
            )
            update_pipeline_run(run_id, "needs_manual_review", steps)

        return {"run_id": run_id, "status": run["status"], "steps": steps}

    except Exception as e:
        add_step("error", "failed", str(e))
        update_pipeline_run(run_id, "failed", steps)
        logger.exception("Pipeline continuation failed for run %d", run_id)
        return {"run_id": run_id, "status": "failed", "steps": steps, "error": str(e)}


# ─── Branch merge pipeline ───────────────────────────────────────────────────

MERGE_RESOLVE_SYSTEM = """\
You are GitGuardian's merge conflict resolver. You are given conflicting files from \
two branches. For each conflict, produce the correct merged version that preserves \
the intent of both changes.

Respond ONLY with valid JSON:
{
  "resolution_summary": "what you resolved and how",
  "resolved_files": [
    {
      "file": "path/to/file",
      "content": "full resolved file content",
      "explanation": "how the conflict was resolved"
    }
  ]
}
"""


async def run_branch_merge_pipeline(
    repo_full_name: str,
    source_branch: str,
    target_branch: str = "main",
    user_id: int | None = None,
) -> dict:
    """Branch merge pipeline: check conflicts → resolve → test → merge."""
    run_id = create_pipeline_run(
        repo=repo_full_name,
        pipeline_type="branch_merge",
        branch=source_branch,
        user_id=user_id,
    )

    steps: list[dict] = []

    def add_step(name: str, status: str, detail: dict | str = ""):
        step = {"name": name, "status": status, "detail": detail}
        steps.append(step)
        update_pipeline_run(run_id, "running", steps)
        return step

    try:
        # ─── Step 1: Analyze branch diff ─────────────────────────────────
        add_step("analyze", "running", f"Comparing {source_branch} with {target_branch}...")

        diff = get_branch_diff(repo_full_name, target_branch, source_branch)
        repo = _gh().get_repo(repo_full_name)

        # Check if there's already a PR for this branch
        existing_prs = repo.get_pulls(state="open", head=f"{repo.owner.login}:{source_branch}", base=target_branch)
        existing_pr = None
        for pr in existing_prs:
            existing_pr = pr
            break

        steps[-1]["status"] = "done"
        steps[-1]["detail"] = {
            "diff_size": len(diff),
            "has_existing_pr": existing_pr is not None,
            "pr_number": existing_pr.number if existing_pr else None,
        }

        # ─── Step 2: Check for conflicts ─────────────────────────────────
        add_step("conflict_check", "running", "Checking for merge conflicts...")

        if existing_pr:
            conflict_info = check_merge_conflicts(repo_full_name, existing_pr.number)
        else:
            # Create a temporary PR to check mergeability
            from .github_client import create_pull_request
            temp_pr = create_pull_request(
                repo_full_name,
                title=f"[GitGuardian] Merge {source_branch} into {target_branch}",
                body="Automated merge check by GitGuardian pipeline.",
                head=source_branch,
                base=target_branch,
            )
            if temp_pr:
                conflict_info = check_merge_conflicts(repo_full_name, temp_pr["number"])
                existing_pr = repo.get_pull(temp_pr["number"])
            else:
                steps[-1]["status"] = "failed"
                steps[-1]["detail"] = "Could not create PR to check conflicts"
                update_pipeline_run(run_id, "failed", steps)
                return {"run_id": run_id, "status": "failed", "steps": steps}

        has_conflicts = conflict_info.get("mergeable") is False
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = conflict_info

        pr_number = existing_pr.number

        if has_conflicts:
            # ─── Step 3: Resolve conflicts ───────────────────────────────
            add_step("resolve", "running", "AI resolving merge conflicts...")

            # Get files from both branches
            tree_paths_source = get_tree_paths(repo_full_name, source_branch)
            tree_paths_target = get_tree_paths(repo_full_name, target_branch)

            # Find files that exist in both branches
            common_files = tree_paths_source & tree_paths_target
            conflict_files: list[dict] = []
            source_exts = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs", ".java"}

            for path in sorted(common_files)[:20]:
                ext = "." + path.rsplit(".", 1)[1] if "." in path else ""
                if ext not in source_exts:
                    continue
                source_content = get_file_content(repo_full_name, path, source_branch)
                target_content = get_file_content(repo_full_name, path, target_branch)
                if source_content and target_content and source_content != target_content:
                    conflict_files.append({
                        "file": path,
                        "source_content": source_content,
                        "target_content": target_content,
                    })

            if conflict_files:
                user_msg = (
                    f"Source branch: {source_branch}\nTarget branch: {target_branch}\n\n"
                    + "\n\n---\n\n".join(
                        f"## {f['file']}\n### {source_branch} version:\n```\n{f['source_content']}\n```\n"
                        f"### {target_branch} version:\n```\n{f['target_content']}\n```"
                        for f in conflict_files
                    )
                )
                if len(user_msg) > 150_000:
                    user_msg = user_msg[:150_000] + "\n\n...(truncated)"

                raw = _claude(MERGE_RESOLVE_SYSTEM, user_msg)
                resolution = json.loads(raw)

                # Apply resolved files to source branch
                for resolved_file in resolution.get("resolved_files", []):
                    update_file(
                        repo_full_name,
                        resolved_file["file"],
                        resolved_file["content"],
                        f"resolve: merge conflict in {resolved_file['file']}\n\n{resolved_file['explanation']}",
                        source_branch,
                    )

                steps[-1]["status"] = "done"
                steps[-1]["detail"] = resolution
            else:
                steps[-1]["status"] = "done"
                steps[-1]["detail"] = "No source-level conflicts detected — may be binary or non-code files"
        else:
            add_step("resolve", "skipped", "No conflicts detected")

        # ─── Step 4: Review the merged code ──────────────────────────────
        add_step("review", "running", "Reviewing merged code...")

        diff = get_pr_diff(repo_full_name, pr_number)
        changed_files = get_changed_files(repo_full_name, pr_number)
        head_sha = existing_pr.head.sha
        tree_paths = get_tree_paths(repo_full_name, head_sha)
        repo_tree = get_repo_tree(repo_full_name, head_sha)

        review = await review_pull_request(
            diff=diff,
            pr_title=existing_pr.title,
            pr_body=existing_pr.body or "",
            changed_files=changed_files,
            repo_tree=repo_tree,
        )

        review_data = {
            "approved": review.approved,
            "summary": review.summary,
            "vulnerabilities": [v.model_dump() for v in review.vulnerabilities],
            "contradictions": [c.model_dump() for c in review.contradictions],
        }
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = review_data

        # ─── Step 5: Document ────────────────────────────────────────────
        add_step("document", "running", "Documenting merge...")

        doc = await document_fixes(
            repo_full_name, pr_number,
            existing_pr.title, existing_pr.body or "",
            [], review_data,
        )
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = doc

        # ─── Step 6: Merge decision ──────────────────────────────────────
        if review.approved:
            add_step("merge", "waiting", "Ready to merge — waiting for approval")
            update_pipeline_run(run_id, "awaiting_merge_approval", steps)
            return {
                "run_id": run_id,
                "status": "awaiting_merge_approval",
                "steps": steps,
                "pr_number": pr_number,
                "needs_approval": True,
            }
        else:
            issue_count = len(review.vulnerabilities) + len(review.contradictions)
            add_step("merge", "blocked", f"{issue_count} issues found — needs fixing first")
            update_pipeline_run(run_id, "needs_fixes", steps)
            return {
                "run_id": run_id,
                "status": "needs_fixes",
                "steps": steps,
                "pr_number": pr_number,
                "review": review_data,
            }

    except Exception as e:
        add_step("error", "failed", str(e))
        update_pipeline_run(run_id, "failed", steps)
        logger.exception("Branch merge pipeline failed for %s", repo_full_name)
        return {"run_id": run_id, "status": "failed", "steps": steps, "error": str(e)}


async def approve_merge(run_id: int, repo_full_name: str, pr_number: int) -> dict:
    """Complete a branch merge after user approval."""
    from .database import get_pipeline_run

    run = get_pipeline_run(run_id)
    if not run:
        return {"error": "Pipeline run not found"}

    steps = run["steps"]

    # Remove waiting merge step, add active one
    steps = [s for s in steps if not (s["name"] == "merge" and s["status"] == "waiting")]
    step = {"name": "merge", "status": "running", "detail": "Merging..."}
    steps.append(step)
    update_pipeline_run(run_id, "running", steps)

    try:
        head_sha = _gh().get_repo(repo_full_name).get_pull(pr_number).head.sha
        set_commit_status(repo_full_name, head_sha, "success", "Pipeline passed", settings.status_context)
        merged = merge_pr(repo_full_name, pr_number)

        steps[-1]["status"] = "done" if merged else "failed"
        steps[-1]["detail"] = "Merged successfully" if merged else "Merge failed"
        update_pipeline_run(run_id, "completed" if merged else "merge_failed", steps)

        return {"run_id": run_id, "status": "completed" if merged else "merge_failed", "steps": steps}
    except Exception as e:
        steps[-1]["status"] = "failed"
        steps[-1]["detail"] = str(e)
        update_pipeline_run(run_id, "failed", steps)
        return {"run_id": run_id, "status": "failed", "steps": steps, "error": str(e)}
