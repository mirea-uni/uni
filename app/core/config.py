from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "uni"
    env: str = "dev"
    debug: bool = False

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "uni"
    db_user: str = "postgres"
    db_password: SecretStr = SecretStr("")

    @property
    def database_url(self) -> URL:
        # URL hides the password when printed or logged.
        return URL.create(
            "postgresql+psycopg",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )


settings = Settings()
