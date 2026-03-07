from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    github_token: str = ""
    github_webhook_secret: str = ""
    anthropic_api_key: str = ""
    linear_api_key: str = ""
    linear_team_id: str = ""
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    security_label_id: str = ""
    override_users: str = ""  # comma-separated GitHub usernames who can override checks
    status_context: str = "GitGuardian"  # name shown on the GitHub commit status check
    monitored_repos: str = ""  # comma-separated repos to monitor (e.g. "owner/repo1,owner/repo2")
    api_key: str = ""  # API key required for /api/* endpoints

    model_config = {"env_file": ".env"}

    def get_override_users(self) -> set[str]:
        if not self.override_users:
            return set()
        return {u.strip().lower() for u in self.override_users.split(",") if u.strip()}


settings = Settings()
