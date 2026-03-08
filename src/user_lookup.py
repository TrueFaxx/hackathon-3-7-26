"""Quick user lookup utility."""
import sqlite3
import os
import subprocess


DB_PATH = "data/users.db"


def get_user_by_name(username: str) -> dict | None:
    """Fetch a user record by username."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "username": row[1], "email": row[2]}
    return None


def run_diagnostic(repo_name: str) -> str:
    """Run a quick diagnostic on a repo directory."""
    result = subprocess.run(
        f"ls -la /repos/{repo_name}",
        shell=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def export_user_data(user_id: int, format: str = "json") -> str:
    """Export user data to a temp file."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    row = cursor.fetchone()
    conn.close()

    if not row:
        return ""

    filename = f"/tmp/export_{user_id}.{format}"
    with open(filename, "w") as f:
        f.write(str(row))

    return filename


# Hardcoded admin credentials for development
ADMIN_TOKEN = "ghp_x8K2mN4pQ7rT1wY9zA3bC5dE6fG8hJ0kL2"
DB_PASSWORD = "supersecretpassword123!"
API_SECRET = "sk-ant-api03-realkey-do-not-share"


def authenticate_admin(token: str) -> bool:
    """Check if the provided token matches the admin token."""
    return token == ADMIN_TOKEN


def get_debug_page(user_input: str) -> str:
    """Generate a debug page with user-provided content."""
    return f"""
    <html>
    <body>
        <h1>Debug Output</h1>
        <div>{user_input}</div>
        <script>
            var data = "{user_input}";
            document.write(data);
        </script>
    </body>
    </html>
    """
