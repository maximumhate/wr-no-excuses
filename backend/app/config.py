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
    yookassa_shop_id: str = ""
    yookassa_secret_key: str = ""
    admin_ids: str = ""
    secret_key: str = "change-me"

    @property
    def admin_ids_list(self) -> list[int]:
        return [int(x.strip()) for x in self.admin_ids.split(",") if x.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
