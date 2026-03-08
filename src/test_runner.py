"""AI Test Runner — generates test code, executes it, and reports results.

Supports:
- API endpoint testing (makes real HTTP requests)
- Code logic testing (runs generated Python test scripts)
- UI smoke testing (fetches frontend pages and checks content)
"""

import asyncio
import json
import logging
import subprocess
import tempfile
import textwrap
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)


async def execute_api_tests(
    tests: list[dict],
    backend_url: str = "http://localhost:8000",
    api_key: str = "",
) -> list[dict]:
    """Execute API endpoint tests by making real HTTP requests."""
    results = []
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key

    async with httpx.AsyncClient(base_url=backend_url, timeout=30.0) as client:
        for test in tests:
            test_result = {**test, "executed": True}
            try:
                method = test.get("method", "GET").upper()
                path = test.get("endpoint", "/health")
                body = test.get("body")
                expected_status = test.get("expected_status", 200)
                expected_body_contains = test.get("expected_body_contains")

                if method == "GET":
                    resp = await client.get(path, headers=headers)
                elif method == "POST":
                    resp = await client.post(path, headers=headers, json=body)
                elif method == "DELETE":
                    resp = await client.delete(path, headers=headers)
                else:
                    resp = await client.request(method, path, headers=headers, json=body)

                actual_status = resp.status_code
                try:
                    actual_body = resp.json()
                except Exception:
                    actual_body = resp.text

                # Check status code
                status_ok = actual_status == expected_status

                # Check body content if specified
                body_ok = True
                if expected_body_contains and isinstance(actual_body, dict):
                    body_str = json.dumps(actual_body)
                    if isinstance(expected_body_contains, str):
                        body_ok = expected_body_contains in body_str
                    elif isinstance(expected_body_contains, list):
                        body_ok = all(s in body_str for s in expected_body_contains)

                passed = status_ok and body_ok

                test_result["actual"] = (
                    f"HTTP {actual_status} — {json.dumps(actual_body)[:300]}"
                )
                test_result["status"] = "pass" if passed else "fail"
                if not status_ok:
                    test_result["actual"] = (
                        f"Expected HTTP {expected_status}, got {actual_status}. "
                        f"Body: {json.dumps(actual_body)[:200]}"
                    )
                if not body_ok:
                    test_result["actual"] += (
                        f" — Missing expected content: {expected_body_contains}"
                    )

            except httpx.ConnectError:
                test_result["status"] = "fail"
                test_result["actual"] = "Connection refused — is the backend running?"
            except httpx.TimeoutException:
                test_result["status"] = "fail"
                test_result["actual"] = "Request timed out after 30s"
            except Exception as e:
                test_result["status"] = "fail"
                test_result["actual"] = f"Error: {str(e)}"

            results.append(test_result)

    return results


async def execute_ui_tests(
    tests: list[dict],
    frontend_url: str = "http://localhost:3000",
) -> list[dict]:
    """Execute UI smoke tests by fetching pages and checking content."""
    results = []

    async with httpx.AsyncClient(base_url=frontend_url, timeout=15.0, follow_redirects=True) as client:
        for test in tests:
            test_result = {**test, "executed": True}
            try:
                path = test.get("path", "/")
                expected_status = test.get("expected_status", 200)
                expected_contains = test.get("expected_contains", [])
                expected_not_contains = test.get("expected_not_contains", [])

                resp = await client.get(path)
                html = resp.text
                actual_status = resp.status_code

                status_ok = actual_status == expected_status

                # Check for expected content in HTML
                missing = []
                if isinstance(expected_contains, str):
                    expected_contains = [expected_contains]
                for needle in expected_contains:
                    if needle.lower() not in html.lower():
                        missing.append(needle)

                # Check for content that should NOT be present
                found_unwanted = []
                if isinstance(expected_not_contains, str):
                    expected_not_contains = [expected_not_contains]
                for needle in expected_not_contains:
                    if needle.lower() in html.lower():
                        found_unwanted.append(needle)

                passed = status_ok and not missing and not found_unwanted

                test_result["status"] = "pass" if passed else "fail"
                parts = [f"HTTP {actual_status}"]
                if missing:
                    parts.append(f"Missing content: {missing}")
                if found_unwanted:
                    parts.append(f"Unwanted content found: {found_unwanted}")
                if passed:
                    parts.append("Page loaded with all expected content")
                test_result["actual"] = " — ".join(parts)

            except httpx.ConnectError:
                test_result["status"] = "fail"
                test_result["actual"] = "Connection refused — is the frontend running?"
            except Exception as e:
                test_result["status"] = "fail"
                test_result["actual"] = f"Error: {str(e)}"

            results.append(test_result)

    return results


def execute_code_test(test_code: str, timeout: int = 30) -> dict:
    """Execute a generated Python test script and capture output."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, prefix="gg_test_"
    ) as f:
        f.write(test_code)
        test_file = f.name

    try:
        result = subprocess.run(
            ["python", test_file],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(Path(__file__).parent.parent),
        )
        return {
            "exit_code": result.returncode,
            "stdout": result.stdout[:2000],
            "stderr": result.stderr[:2000],
            "passed": result.returncode == 0,
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Test timed out after {timeout}s",
            "passed": False,
        }
    except Exception as e:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": str(e),
            "passed": False,
        }
    finally:
        Path(test_file).unlink(missing_ok=True)
