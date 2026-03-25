from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    openrouter_api_key: str = ""
    database_url: str = "sqlite:///./workout_tracker.db"

    model_config = {"env_file": "../.env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
