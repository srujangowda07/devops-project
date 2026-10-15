from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CloudPulse API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://cloudpulse:cloudpulse@localhost:5432/cloudpulse"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
