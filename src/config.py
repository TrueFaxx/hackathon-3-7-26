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

    model_config = {"env_file": ".env"}


settings = Settings()
