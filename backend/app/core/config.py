"""
Configuración de la aplicación usando Pydantic Settings
"""

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración principal de la aplicación"""

    # App
    APP_NAME: str = "LeirEye"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://leireye:leireye_secret@localhost:5432/leireye"
    )
    DATABASE_SYNC_URL: str = (
        "postgresql://leireye:leireye_secret@localhost:5432/leireye"
    )

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ]

    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    
    # Development
    SEED_DEFAULT_USER: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        
        @classmethod
        def settings_customise_sources(cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings):
            """Cargar .env.development si existe para desarrollo"""
            if os.getenv('ENV') == 'development' or os.path.exists('.env.development'):
                # Intentar cargar .env.development
                from pydantic_settings import DotEnv
                dev_env = DotEnv('.env.development')
                dev_settings = dev_env.read_env()
                env_settings = {**env_settings, **dev_settings}
            
            return (
                init_settings,
                env_settings,
                dotenv_settings,
                file_secret_settings,
            )


@lru_cache()
def get_settings() -> Settings:
    """Obtener configuración cacheada"""
    return Settings()


settings = get_settings()
settings = get_settings()
