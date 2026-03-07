"""Deep context gathering for maximal PR review quality.

Collects: repo tree, import graph, related tests, config files,
base-branch file versions, commit messages, and PR discussion.
"""

import logging
import re

from github import Repository, GithubException

from .github_client import _gh

logger = logging.getLogger(__name__)

# Config / meta files worth including for project context
CONFIG_FILENAMES = {
    "README.md",
    "readme.md",
    "README.rst",
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    "setup.cfg",
    "setup.py",
    "requirements.txt",
    "Pipfile",
    "Cargo.toml",
    "go.mod",
    "Makefile",
    "Dockerfile",
    ".eslintrc.json",
    ".eslintrc.js",
    "eslint.config.js",
    "biome.json",
    "ruff.toml",
    ".flake8",
    "tox.ini",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "pytest.ini",
    "conftest.py",
    ".env.example",
}

# Regex patterns for extracting imports per language
IMPORT_PATTERNS = {
    ".py": [
        re.compile(r"^\s*from\s+([\w.]+)\s+import", re.MULTILINE),
        re.compile(r"^\s*import\s+([\w.]+)", re.MULTILINE),
    ],
    ".ts": [
        re.compile(r"""from\s+['"]([^'"]+)['"]"""),
        re.compile(r"""import\s+['"]([^'"]+)['"]"""),
        re.compile(r"""require\(['"]([^'"]+)['"]\)"""),
    ],
    ".tsx": [
        re.compile(r"""from\s+['"]([^'"]+)['"]"""),
        re.compile(r"""import\s+['"]([^'"]+)['"]"""),
    ],
    ".js": [
        re.compile(r"""from\s+['"]([^'"]+)['"]"""),
        re.compile(r"""require\(['"]([^'"]+)['"]\)"""),
    ],
    ".jsx": [
        re.compile(r"""from\s+['"]([^'"]+)['"]"""),
    ],
    ".go": [
        re.compile(r'"([^"]+)"'),
    ],
    ".rs": [
        re.compile(r"use\s+([\w:]+)"),
    ],
}

# Test directory / file naming conventions
TEST_PATTERNS = [
    "test_{name}",
    "{name}_test",
    "{name}.test",
    "{name}.spec",
    "tests/test_{name}",
    "tests/{name}_test",
    "__tests__/{name}.test",
    "__tests__/{name}.spec",
    "test/{name}",
    "spec/{name}.spec",
]

MAX_FILE_SIZE = 100_000  # skip files larger than 100KB


def _safe_decode(repo: Repository.Repository, path: str, ref: str) -> str | None:
    try:
        content = repo.get_contents(path, ref=ref)
        if isinstance(content, list):
            return None
        if content.size and content.size > MAX_FILE_SIZE:
            return None
        return content.decoded_content.decode("utf-8", errors="replace")
    except (GithubException, Exception):
        return None


def get_repo_tree(repo_full_name: str, ref: str, max_depth: int = 4) -> str:
    """Get a directory tree listing of the repo (up to max_depth)."""
    repo = _gh().get_repo(repo_full_name)
    try:
        tree = repo.get_git_tree(ref, recursive=True)
    except GithubException:
        return "(could not fetch repo tree)"

    lines = []
    for item in tree.tree:
        depth = item.path.count("/")
        if depth >= max_depth:
            continue
        prefix = "  " * depth
        name = item.path.split("/")[-1]
        suffix = "/" if item.type == "tree" else ""
        lines.append(f"{prefix}{name}{suffix}")

    return "\n".join(lines[:500])  # cap at 500 lines


def get_config_files(repo_full_name: str, ref: str) -> list[dict]:
    """Fetch common config/meta files from the repo root."""
    repo = _gh().get_repo(repo_full_name)
    results = []
    try:
        root_contents = repo.get_contents("", ref=ref)
        if isinstance(root_contents, list):
            root_names = {c.path for c in root_contents}
        else:
            root_names = {root_contents.path}
    except GithubException:
        return results

    for name in CONFIG_FILENAMES & root_names:
        text = _safe_decode(repo, name, ref)
        if text:
            results.append({"filename": name, "content": text})
    return results


def resolve_import_to_path(
    import_str: str, source_file: str, tree_paths: set[str]
) -> str | None:
    """Try to resolve a relative/local import string to a repo file path."""
    # Skip stdlib / third-party (no dot-prefix for Python relative, or starts with node_modules)
    ext = _get_ext(source_file)

    if ext == ".py":
        # Convert dotted module path to file path
        parts = import_str.split(".")
        # Try as package (dir/__init__.py) or module (.py)
        candidates = [
            "/".join(parts) + ".py",
            "/".join(parts) + "/__init__.py",
        ]
        # Also try relative to source file's directory
        source_dir = "/".join(source_file.split("/")[:-1])
        if source_dir:
            candidates += [
                source_dir + "/" + "/".join(parts) + ".py",
                source_dir + "/" + "/".join(parts) + "/__init__.py",
            ]
    elif ext in (".ts", ".tsx", ".js", ".jsx"):
        if not import_str.startswith("."):
            return None  # third-party
        source_dir = "/".join(source_file.split("/")[:-1])
        base = source_dir + "/" + import_str if source_dir else import_str
        # Normalize ../
        parts = base.split("/")
        resolved = []
        for p in parts:
            if p == "..":
                if resolved:
                    resolved.pop()
            elif p != ".":
                resolved.append(p)
        base = "/".join(resolved)
        candidates = [
            base + ".ts",
            base + ".tsx",
            base + ".js",
            base + ".jsx",
            base + "/index.ts",
            base + "/index.tsx",
            base + "/index.js",
        ]
    else:
        return None

    for c in candidates:
        if c in tree_paths:
            return c
    return None


def get_imported_files(
    changed_files: list[dict], repo_full_name: str, ref: str, tree_paths: set[str]
) -> list[dict]:
    """Parse imports from changed files and fetch the local dependencies."""
    repo = _gh().get_repo(repo_full_name)
    already_have = {f["filename"] for f in changed_files}
    to_fetch: set[str] = set()

    for f in changed_files:
        content = f.get("content", "")
        if not content or content.startswith("("):
            continue
        ext = _get_ext(f["filename"])
        patterns = IMPORT_PATTERNS.get(ext, [])
        for pat in patterns:
            for match in pat.findall(content):
                resolved = resolve_import_to_path(match, f["filename"], tree_paths)
                if resolved and resolved not in already_have:
                    to_fetch.add(resolved)

    results = []
    for path in sorted(to_fetch)[:30]:  # cap at 30 dependency files
        text = _safe_decode(repo, path, ref)
        if text:
            results.append({"filename": path, "content": text, "reason": "imported"})
    return results


def get_related_test_files(
    changed_files: list[dict], repo_full_name: str, ref: str, tree_paths: set[str]
) -> list[dict]:
    """Find test files that likely correspond to the changed source files."""
    repo = _gh().get_repo(repo_full_name)
    already_have = {f["filename"] for f in changed_files}
    to_fetch: set[str] = set()

    for f in changed_files:
        fname = f["filename"]
        ext = _get_ext(fname)
        if not ext:
            continue
        # Get the base name without extension
        base = fname.rsplit("/", 1)[-1].rsplit(".", 1)[0]
        parent_dir = "/".join(fname.rsplit("/", 1)[:-1])

        for pattern in TEST_PATTERNS:
            candidate_base = pattern.format(name=base)
            # Try with same extension
            candidates = [candidate_base + ext]
            if ext in (".ts", ".tsx"):
                candidates.append(candidate_base + ".ts")
                candidates.append(candidate_base + ".tsx")

            for candidate in candidates:
                # Try relative to file's directory
                if parent_dir:
                    full = parent_dir + "/" + candidate
                else:
                    full = candidate
                if full in tree_paths and full not in already_have:
                    to_fetch.add(full)
                # Also try at repo root
                if candidate in tree_paths and candidate not in already_have:
                    to_fetch.add(candidate)

    results = []
    for path in sorted(to_fetch)[:15]:  # cap at 15 test files
        text = _safe_decode(repo, path, ref)
        if text:
            results.append({"filename": path, "content": text, "reason": "test"})
    return results


def get_base_file_versions(
    changed_files: list[dict], repo_full_name: str, base_ref: str
) -> list[dict]:
    """Fetch the base-branch version of each changed file for before/after comparison."""
    repo = _gh().get_repo(repo_full_name)
    results = []
    for f in changed_files:
        if f.get("status") == "added":
            continue
        text = _safe_decode(repo, f["filename"], base_ref)
        if text:
            results.append({"filename": f["filename"], "content": text})
    return results


def get_pr_commits(repo_full_name: str, pr_number: int) -> list[dict]:
    """Fetch all commit messages in the PR."""
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    return [
        {"sha": c.sha[:8], "message": c.commit.message}
        for c in pr.get_commits()
    ]


def get_pr_comments(repo_full_name: str, pr_number: int) -> list[dict]:
    """Fetch existing review comments and issue comments on the PR."""
    repo = _gh().get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    comments = []
    for c in pr.get_issue_comments():
        comments.append({"author": c.user.login, "body": c.body})
    for c in pr.get_comments():
        comments.append({
            "author": c.user.login,
            "body": c.body,
            "path": c.path,
            "line": c.line,
        })
    return comments[:50]  # cap


def get_tree_paths(repo_full_name: str, ref: str) -> set[str]:
    """Get all file paths in the repo tree (used for import resolution)."""
    repo = _gh().get_repo(repo_full_name)
    try:
        tree = repo.get_git_tree(ref, recursive=True)
        return {item.path for item in tree.tree if item.type == "blob"}
    except GithubException:
        return set()


def _get_ext(filename: str) -> str:
    if "." in filename:
        return "." + filename.rsplit(".", 1)[1]
    return ""
