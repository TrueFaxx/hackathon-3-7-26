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
