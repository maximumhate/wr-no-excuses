import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription, PlanType
from app.api.users import get_current_user
from app.services.payment import create_payment, is_platega_configured, verify_webhook

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

class CreatePaymentRequest(BaseModel):
    plan: PlanType

@router.post("/create")
async def create_checkout(body: CreatePaymentRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.plan == PlanType.basic:
        raise HTTPException(400, "Basic is free")

    if not is_platega_configured():
        raise HTTPException(503, "Платежи временно недоступны")

    return_url = f"{settings.app_url}/subscription"
    result = await create_payment(user.id, body.plan.value, return_url)
    if not result:
        raise HTTPException(502, "Не удалось создать платёж")

    amount_map = {"silver": 19900, "gold": 39900, "platinum": 69900}

    payment = Payment(
        user_id=user.id,
        plan=body.plan,
        amount=amount_map.get(body.plan.value, 0),
        provider_payment_id=result["id"],
        confirmation_url=result["confirmation_url"],
        description=f"WorldRun {body.plan.value.capitalize()}",
    )
    db.add(payment)
    await db.commit()

    return {
        "ok": True,
        "payment_id": str(payment.id),
        "confirmation_url": result["confirmation_url"],
    }

def normalize_status(status: str) -> str:
    s = status.lower().strip()
    if s in ("paid", "succeeded", "completed", "approved", "confirmed", "1", "true"):
        return "succeeded"
    if s in ("cancelled", "canceled", "failed", "expired", "0", "false"):
        return "cancelled"
    return "pending"

@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_merchantid: str = Header(default=""),
    x_merchant_id: str = Header(default=""),
    x_secret: str = Header(default=""),
):
    headers = {
        "x-merchantid": x_merchantid or x_merchant_id,
        "x-secret": x_secret,
    }
    body = await request.body()
    if not verify_webhook(headers, body):
        raise HTTPException(400, "Invalid signature")

    try:
        data = json.loads(body.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(400, "Invalid JSON")

    provider_payment_id = data.get("transactionId") or data.get("id")
    if not provider_payment_id:
        return {"ok": True}

    result = await db.execute(select(Payment).where(Payment.provider_payment_id == provider_payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        logger.warning(f"Payment not found: {provider_payment_id}")
        return {"ok": True}

    new_status = normalize_status(data.get("status", ""))
    if new_status == "succeeded":
        payment.status = PaymentStatus.succeeded
        payment.paid_at = datetime.now(timezone.utc)

        sub_result = await db.execute(select(Subscription).where(Subscription.user_id == payment.user_id))
        sub = sub_result.scalar_one_or_none()
        if sub:
            sub.plan = payment.plan
            sub.is_active = True
            sub.started_at = datetime.now(timezone.utc)
            sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            sub = Subscription(
                user_id=payment.user_id,
                plan=payment.plan,
                is_active=True,
                started_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            )
            db.add(sub)

        await db.commit()
        logger.info(f"Payment {provider_payment_id} succeeded for user {payment.user_id}")
    elif new_status == "cancelled":
        payment.status = PaymentStatus.cancelled
        await db.commit()
        logger.info(f"Payment {provider_payment_id} cancelled")

    return {"ok": True}

@router.get("/status")
async def get_payment_status(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payment).where(Payment.user_id == user.id).order_by(Payment.created_at.desc()).limit(10)
    )
    payments = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "plan": p.plan.value,
            "amount": p.amount,
            "status": p.status.value,
            "created_at": p.created_at.isoformat(),
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        }
        for p in payments
    ]
