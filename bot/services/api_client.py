import httpx
from bot.config import settings

class ApiClient:
    def __init__(self):
        self.base_url = settings.app_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=15)

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

    async def create_report(self, user_uuid: str, exercise_type: str, value: int) -> dict | None:
        resp = await self.client.post(
            "/api/reports",
            json={"exercise_type": exercise_type, "value": value},
            cookies={"session": user_uuid},
        )
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_pending_broadcasts(self) -> list[dict]:
        resp = await self.client.get("/api/admin/broadcast/pending")
        if resp.status_code == 200:
            return resp.json()
        return []

    async def get_all_users(self) -> list[dict]:
        resp = await self.client.get("/api/admin/users?limit=9999")
        if resp.status_code == 200:
            return resp.json()
        return []

    async def complete_broadcast(self, broadcast_id: str):
        await self.client.patch(f"/api/admin/broadcast/{broadcast_id}/complete")

    async def close(self):
        await self.client.aclose()
