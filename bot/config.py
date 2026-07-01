from pydantic_settings import BaseSettings

class BotSettings(BaseSettings):
    bot_token: str = ""
    telegram_client_id: str = ""
    telegram_client_secret: str = ""
    database_url: str = "postgresql+asyncpg://worldrun:worldrun@db:5432/worldrun"
    channel_id: str = "@wr_no_excuses"
    group_id: str = ""
    domain: str = "wr.idigeneri.ru"
    app_url: str = "https://wr.idigeneri.ru"
    admin_ids: str = ""
    secret_key: str = "change-me"

    @property
    def admin_ids_list(self) -> list[int]:
        return [int(x.strip()) for x in self.admin_ids.split(",") if x.strip()]

    @property
    def group_id_int(self) -> int | None:
        try:
            return int(self.group_id) if self.group_id else None
        except ValueError:
            return None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = BotSettings()
