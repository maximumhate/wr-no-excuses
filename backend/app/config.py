from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://worldrun:worldrun@db:5432/worldrun"
    bot_token: str = ""
    telegram_client_id: str = ""
    telegram_client_secret: str = ""
    channel_id: str = "@wr_no_excuses"
    group_id: str = ""
    domain: str = "wr.idigeneri.ru"
    app_url: str = "https://wr.idigeneri.ru"
    platega_merchant_id: str = ""
    platega_api_key: str = ""
    platega_base_url: str = "https://app.platega.io"
    admin_ids: str = ""
    secret_key: str = "change-me"

    @property
    def admin_ids_list(self) -> list[int]:
        return [int(x.strip()) for x in self.admin_ids.split(",") if x.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
