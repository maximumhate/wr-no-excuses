import httpx
from bot.config import settings

class ApiClient:
    def __init__(self):
        self.base_url = settings.app_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=15)
        self.last_error: str | None = None

    @property
    def bot_headers(self) -> dict[str, str]:
        return {"X-Bot-Secret": settings.secret_key}

    async def get_user(self, telegram_id: int) -> dict | None:
        resp = await self.client.get(f"/api/users/{telegram_id}")
        if resp.status_code == 200:
            return resp.json()
        try:
            detail = resp.json().get("detail")
            self.last_error = detail if isinstance(detail, str) else detail.get("message") if isinstance(detail, dict) else str(detail)
        except Exception:
            self.last_error = resp.text
        return None

    async def get_profile(self, telegram_id: int) -> dict | None:
        resp = await self.client.get(f"/api/challenges/profile/{telegram_id}", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_exercises(self) -> list[dict]:
        resp = await self.client.get("/api/challenges/exercises")
        if resp.status_code == 200:
            return resp.json()
        return []

    async def register_current_challenge(self, payload: dict) -> tuple[dict | None, str | dict | None]:
        resp = await self.client.post("/api/challenges/current/register", json=payload, headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json(), None
        try:
            detail = resp.json().get("detail")
        except Exception:
            detail = resp.text
        return None, detail

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

    async def get_bot_text(self, key: str) -> str | None:
        resp = await self.client.get(f"/api/cms/bot-texts/{key}", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json().get("text")
        return None

    async def get_user_stats(self, user_uuid: str) -> dict | None:
        resp = await self.client.get("/api/reports/stats", cookies={"session": user_uuid})
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_current_stats(self, telegram_id: int) -> dict | None:
        resp = await self.client.get(f"/api/challenges/current/stats/{telegram_id}", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_leaderboard(self, week_start: str = "", week_end: str = "", current_challenge: bool = False, limit: int = 50) -> list[dict]:
        params = {}
        if current_challenge:
            params["current_challenge"] = "true"
        params["limit"] = str(limit)
        if week_start:
            params["week_start"] = week_start
        if week_end:
            params["week_end"] = week_end
        resp = await self.client.get("/api/stats/leaderboard", params=params)
        if resp.status_code == 200:
            return resp.json()
        return []

    async def get_tariffs(self) -> list[dict]:
        resp = await self.client.get("/api/subscriptions/tariffs")
        if resp.status_code == 200:
            return resp.json()
        return []

    async def get_subscription(self, telegram_id: int) -> dict | None:
        resp = await self.client.get(f"/api/subscriptions/bot/{telegram_id}", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return None

    async def create_payment(self, telegram_id: int, plan: str) -> dict | None:
        resp = await self.client.post(
            "/api/payments/bot/create",
            json={"telegram_id": telegram_id, "plan": plan},
            headers=self.bot_headers,
        )
        if resp.status_code == 200:
            return resp.json()
        return None

    async def get_current_announcement(self) -> dict | None:
        resp = await self.client.get("/api/challenges/current/announcement", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return None

    async def mark_current_announcement_sent(self):
        await self.client.post("/api/challenges/current/announcement/sent", headers=self.bot_headers)

    async def get_pending_reminders(self) -> dict | None:
        resp = await self.client.get("/api/challenges/reminders/pending", headers=self.bot_headers)
        if resp.status_code == 200:
            return resp.json()
        return None

    async def close(self):
        await self.client.aclose()
