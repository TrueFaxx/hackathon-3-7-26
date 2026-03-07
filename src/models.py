from enum import Enum

from pydantic import BaseModel


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Vulnerability(BaseModel):
    file: str
    line: int | None = None
    severity: Severity
    description: str
    suggestion: str


class Contradiction(BaseModel):
    file: str
    description: str
    resolution: str


class ReviewResult(BaseModel):
    approved: bool
    summary: str
    vulnerabilities: list[Vulnerability] = []
    contradictions: list[Contradiction] = []
    comments: list[str] = []
