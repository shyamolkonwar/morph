"""
Configuration Management for MorphV2 Backend
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "MorphV2 Generative Banner API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # AI Providers
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    
    # Default AI Settings
    default_ai_provider: str = "anthropic"  # "anthropic" or "openai"
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    openai_model: str = "gpt-4o"
    
    # Generation Settings
    max_iterations: int = 5
    default_canvas_width: int = 1200
    default_canvas_height: int = 630
    
    # CORS - accepts comma-separated string or JSON array
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if not self.cors_origins:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

