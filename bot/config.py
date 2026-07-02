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
        value = self.group_id.strip()
        if not value:
            return None
        try:
            group_id = int(value)
        except ValueError:
            return None
        if group_id > 0:
            return int(f"-100{group_id}")
        return group_id

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = BotSettings()
