import uuid
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

def is_platega_configured() -> bool:
    return bool(settings.platega_merchant_id and settings.platega_api_key)

async def create_payment(
    user_id: uuid.UUID,
    plan: str,
    return_url: str,
) -> dict | None:
    if not is_platega_configured():
        logger.warning("Platega not configured")
        return None

    price = PLAN_PRICES.get(plan)
    if not price:
        raise ValueError(f"Unknown plan: {plan}")

    order_id = str(uuid.uuid4())
    headers = {
        "X-MerchantId": settings.platega_merchant_id,
        "X-Secret": settings.platega_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "paymentDetails": {
            "amount": price,
            "currency": "RUB",
        },
        "description": f"WorldRun {plan.capitalize()}",
        "return": f"{return_url}?order_id={order_id}",
        "failedUrl": f"{return_url}?order_id={order_id}&error=failed",
        "payload": json.dumps({
            "orderId": order_id,
            "plan": plan,
        }),
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{settings.platega_base_url}/v2/transaction/process",
                json=payload,
                headers=headers,
                timeout=30,
            )
            if resp.status_code not in (200, 201):
                logger.error(f"Platega error: {resp.status_code} {resp.text}")
                return None
            data = resp.json()
            return {
                "id": data.get("transactionId") or data.get("id"),
                "status": data.get("status", "pending"),
                "confirmation_url": data.get("redirect") or data.get("url"),
                "order_id": order_id,
            }
        except httpx.RequestError as e:
            logger.error(f"Platega request failed: {e}")
            return None

async def get_payment_status(provider_payment_id: str) -> dict | None:
    if not is_platega_configured():
        return None

    headers = {
        "X-MerchantId": settings.platega_merchant_id,
        "X-Secret": settings.platega_api_key,
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{settings.platega_base_url}/transaction/{provider_payment_id}",
                headers=headers,
                timeout=30,
            )
            if resp.status_code != 200:
                logger.error(f"Platega status error: {resp.status_code} {resp.text}")
                return None
            return resp.json()
        except httpx.RequestError as e:
            logger.error(f"Platega status request failed: {e}")
            return None

def verify_webhook(request_headers: dict, body: bytes | None = None) -> bool:
    merchant_id = request_headers.get("x-merchantid") or request_headers.get("x-merchant-id") or ""
    secret = request_headers.get("x-secret") or ""
    if merchant_id or secret:
        if (
            merchant_id != settings.platega_merchant_id
            or secret != settings.platega_api_key
        ):
            logger.warning("Platega webhook credentials mismatch")
            return False
        return True
    return True
