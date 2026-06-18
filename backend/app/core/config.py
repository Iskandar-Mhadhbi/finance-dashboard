from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    db_host: str
    db_port: int = 5432
    db_user: str
    db_password: str
    db_name: str

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 10080  # 7 days

    # App
    app_env: str = "development"
    frontend_url: str = "http://localhost"
    frontend_url_prod: str  

    # AI
    groq_api_key: str
    marketaux_api_key: str


settings = Settings() # type: ignore
