from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    DATABASE_URL: str = 'mysql+pymysql://root:root@localhost:3306/soccer_ml'
    BACKEND_CORS_ORIGINS: str = 'http://localhost:5173'

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(',') if origin.strip()]


settings = Settings()
