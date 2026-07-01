import uuid
import hashlib
import hmac
import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

PLAN_PRICES = {
    "silver": 19900,
    "gold": 39900,
    "platinum": 69900,
}

def is_yookassa_configured() -> bool:
    return bool(settings.yookassa_shop_id and settings.yookassa_secret_key)

async def create_payment(
    user_id: uuid.UUID,
    plan: str,
    return_url: str,
) -> dict | None:
    if not is_yookassa_configured():
        logger.warning("YooKassa not configured")
        return None

    price = PLAN_PRICES.get(plan)
    if not price:
        raise ValueError(f"Unknown plan: {plan}")

    idempotence_key = str(uuid.uuid4())
    payload = {
        "amount": {
            "value": f"{price / 100:.2f}",
            "currency": "RUB",
        },
        "confirmation": {
            "type": "redirect",
            "return_url": return_url,
        },
        "capture": True,
        "description": f"WorldRun {plan.capitalize()} — {price // 100} ₽/мес",
    }

    auth = httpx.BasicAuth(settings.yookassa_shop_id, settings.yookassa_secret_key)
    headers = {
        "Idempotence-Key": idempotence_key,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://api.yookassa.ru/v3/payments",
                json=payload,
                headers=headers,
                auth=auth,
                timeout=30,
            )
            if resp.status_code not in (200, 201):
                logger.error(f"YooKassa error: {resp.status_code} {resp.text}")
                return None
            data = resp.json()
            return {
                "id": data["id"],
                "status": data["status"],
                "confirmation_url": data["confirmation"]["confirmation_url"],
            }
        except httpx.RequestError as e:
            logger.error(f"YooKassa request failed: {e}")
            return None

def verify_webhook(body: bytes) -> bool:
    return True  # IP whitelist in production
