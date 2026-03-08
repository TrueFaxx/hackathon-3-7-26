import hashlib
import logging
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "gitguardian.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _connect()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            repo_full_name TEXT NOT NULL,
            added_at TEXT NOT NULL,
            UNIQUE(user_id, repo_full_name)
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            key_hash TEXT UNIQUE NOT NULL,
            key_prefix TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT 'default',
            created_at TEXT NOT NULL,
            last_used_at TEXT,
            revoked INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS review_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo TEXT NOT NULL,
            pr_number INTEGER NOT NULL,
            pr_title TEXT NOT NULL,
            pr_author TEXT NOT NULL,
            head_sha TEXT NOT NULL,
            result TEXT NOT NULL,
            vuln_count INTEGER NOT NULL DEFAULT 0,
            summary TEXT NOT NULL DEFAULT '',
            reviewed_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_review_logs_repo ON review_logs(repo);
        CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);
    """)
    conn.commit()
    conn.close()
    logger.info("Database initialized at %s", DB_PATH)


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def create_user(username: str, email: str, password: str) -> int | None:
    """Create a user. Returns user ID or None if username/email already exists."""
    conn = _connect()
    try:
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (username, email.lower(), _hash_password(password), datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def authenticate_user(username: str, password: str) -> int | None:
    """Verify username/password. Returns user ID or None."""
    conn = _connect()
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    conn.close()
    if row and secrets.compare_digest(row["password_hash"], _hash_password(password)):
        return row["id"]
    return None


def generate_api_key(user_id: int, name: str = "default") -> str:
    """Generate a new API key for a user. Returns the raw key (only shown once)."""
    raw_key = f"gg_{secrets.token_urlsafe(32)}"
    conn = _connect()
    conn.execute(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, name, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, _hash_key(raw_key), raw_key[:10], name, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()
    return raw_key


def validate_api_key(key: str) -> dict | None:
    """Validate an API key. Returns user info or None."""
    conn = _connect()
    row = conn.execute(
        """SELECT ak.id as key_id, ak.user_id, u.username, u.email
           FROM api_keys ak JOIN users u ON ak.user_id = u.id
           WHERE ak.key_hash = ? AND ak.revoked = 0""",
        (_hash_key(key),),
    ).fetchone()
    if row:
        conn.execute(
            "UPDATE api_keys SET last_used_at = ? WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), row["key_id"]),
        )
        conn.commit()
        conn.close()
        return {"user_id": row["user_id"], "username": row["username"], "email": row["email"]}
    conn.close()
    return None


def list_user_keys(user_id: int) -> list[dict]:
    """List all API keys for a user (without the actual key)."""
    conn = _connect()
    rows = conn.execute(
        "SELECT key_prefix, name, created_at, last_used_at, revoked FROM api_keys WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def revoke_api_key(user_id: int, key_prefix: str) -> bool:
    """Revoke an API key by its prefix."""
    conn = _connect()
    cursor = conn.execute(
        "UPDATE api_keys SET revoked = 1 WHERE user_id = ? AND key_prefix = ? AND revoked = 0",
        (user_id, key_prefix),
    )
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


# ─── User Repos ──────────────────────────────────────────────────────────────


def add_user_repo(user_id: int, repo_full_name: str) -> bool:
    """Add a repo to a user's account. Returns False if already added."""
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO user_repos (user_id, repo_full_name, added_at) VALUES (?, ?, ?)",
            (user_id, repo_full_name, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def remove_user_repo(user_id: int, repo_full_name: str) -> bool:
    """Remove a repo from a user's account."""
    conn = _connect()
    cursor = conn.execute(
        "DELETE FROM user_repos WHERE user_id = ? AND repo_full_name = ?",
        (user_id, repo_full_name),
    )
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


def log_review(
    repo: str,
    pr_number: int,
    pr_title: str,
    pr_author: str,
    head_sha: str,
    result: str,
    vuln_count: int = 0,
    summary: str = "",
) -> int:
    """Log a PR review result. Returns the log ID."""
    conn = _connect()
    cursor = conn.execute(
        """INSERT INTO review_logs
           (repo, pr_number, pr_title, pr_author, head_sha, result, vuln_count, summary, reviewed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (repo, pr_number, pr_title, pr_author, head_sha, result, vuln_count, summary,
         datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    return log_id


def get_review_logs(repo: str | None = None, limit: int = 50) -> list[dict]:
    """Get review logs, optionally filtered by repo."""
    conn = _connect()
    if repo:
        rows = conn.execute(
            "SELECT * FROM review_logs WHERE repo = ? ORDER BY reviewed_at DESC LIMIT ?",
            (repo, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM review_logs ORDER BY reviewed_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_review_stats(repo: str | None = None) -> dict:
    """Get aggregate review stats, optionally filtered by repo."""
    conn = _connect()
    where = "WHERE repo = ?" if repo else ""
    params: tuple = (repo,) if repo else ()

    total = conn.execute(f"SELECT COUNT(*) as c FROM review_logs {where}", params).fetchone()["c"]
    approved = conn.execute(f"SELECT COUNT(*) as c FROM review_logs {where} {'AND' if repo else 'WHERE'} result = 'approved'", params).fetchone()["c"]
    failed = conn.execute(f"SELECT COUNT(*) as c FROM review_logs {where} {'AND' if repo else 'WHERE'} result = 'failed'", params).fetchone()["c"]
    overridden = conn.execute(f"SELECT COUNT(*) as c FROM review_logs {where} {'AND' if repo else 'WHERE'} result = 'overridden'", params).fetchone()["c"]
    total_vulns = conn.execute(f"SELECT COALESCE(SUM(vuln_count), 0) as c FROM review_logs {where}", params).fetchone()["c"]

    conn.close()
    return {
        "total_reviews": total,
        "approved": approved,
        "failed": failed,
        "overridden": overridden,
        "total_vulns_found": total_vulns,
    }


def get_user_repos(user_id: int) -> list[str]:
    """Get all repos for a user."""
    conn = _connect()
    rows = conn.execute(
        "SELECT repo_full_name FROM user_repos WHERE user_id = ? ORDER BY added_at",
        (user_id,),
    ).fetchall()
    conn.close()
    return [r["repo_full_name"] for r in rows]
