import httpx
from bot.config import settings

class ApiClient:
    def __init__(self):
        self.base_url = settings.app_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=15)

    @property
    def bot_headers(self) -> dict[str, str]:
        return {"X-Bot-Secret": settings.secret_key}

    async def get_user(self, telegram_id: int) -> dict | None:
        resp = await self.client.get(f"/api/users/{telegram_id}")
        if resp.status_code == 200:
            return resp.json()
        return None

    async def user_id_from_tg(self, telegram_id: int) -> str | None:
        user = await self.get_user(telegram_id)
        if user:
            return user["id"]
        return None

    async def create_report(
        self,
        user_uuid: str,
        exercise_type: str,
        value: int,
        telegram_chat_id: int | None = None,
        telegram_message_id: int | None = None,
        thread_message_id: int | None = None,
    ) -> dict | None:
        resp = await self.client.post(
            "/api/reports",
            json={
                "exercise_type": exercise_type,
                "value": value,
                "telegram_chat_id": telegram_chat_id,
                "telegram_message_id": telegram_message_id,
                "thread_message_id": thread_message_id,
            },
            cookies={"session": user_uuid},
        )
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_pending_broadcasts(self) -> list[dict]:
        resp = await self.client.get("/api/admin/broadcast/pending", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return []

    async def get_all_users(self) -> list[dict]:
        resp = await self.client.get("/api/admin/broadcast/users", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return []

    async def complete_broadcast(self, broadcast_id: str, sent_count: int):
        await self.client.patch(
            f"/api/admin/broadcast/{broadcast_id}/complete",
            json={"sent_count": sent_count},
            headers=self.bot_headers,
        )

    async def get_user_stats(self, user_uuid: str) -> dict | None:
        resp = await self.client.get("/api/reports/stats", cookies={"session": user_uuid})
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_leaderboard(self, week_start: str = "", week_end: str = "") -> list[dict]:
        params = {}
        if week_start:
            params["week_start"] = week_start
        if week_end:
            params["week_end"] = week_end
        resp = await self.client.get("/api/stats/leaderboard", params=params)
        if resp.status_code == 200:
            return resp.json()
        return []

    async def close(self):
        await self.client.aclose()
