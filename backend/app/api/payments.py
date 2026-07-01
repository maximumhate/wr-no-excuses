import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription, PlanType
from app.api.users import get_current_user
from app.services.payment import create_payment, is_yookassa_configured, verify_webhook

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

class CreatePaymentRequest(BaseModel):
    plan: PlanType

@router.post("/create")
async def create_checkout(body: CreatePaymentRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.plan == PlanType.basic:
        raise HTTPException(400, "Basic is free")

    if not is_yookassa_configured():
        raise HTTPException(503, "Платежи временно недоступны")

    return_url = f"{settings.app_url}/subscription"
    result = await create_payment(user.id, body.plan.value, return_url)
    if not result:
        raise HTTPException(502, "Не удалось создать платёж")

    payment = Payment(
        user_id=user.id,
        plan=body.plan,
        amount=19900 if body.plan == PlanType.silver else 39900 if body.plan == PlanType.gold else 69900,
        yookassa_id=result["id"],
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

@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    if not verify_webhook(body):
        raise HTTPException(400, "Invalid signature")

    try:
        data = json.loads(body.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(400, "Invalid JSON")

    event = data.get("event")
    if event != "payment.waiting_for_capture" and event != "payment.succeeded":
        return {"ok": True}

    payment_obj = data.get("object", {})
    yookassa_id = payment_obj.get("id")
    if not yookassa_id:
        return {"ok": True}

    result = await db.execute(select(Payment).where(Payment.yookassa_id == yookassa_id))
    payment = result.scalar_one_or_none()
    if not payment:
        logger.warning(f"Payment not found: {yookassa_id}")
        return {"ok": True}

    payment.status = PaymentStatus.succeeded
    payment.paid_at = datetime.now(timezone.utc)

    result = await db.execute(select(Subscription).where(Subscription.user_id == payment.user_id))
    sub = result.scalar_one_or_none()
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
    logger.info(f"Payment {yookassa_id} succeeded for user {payment.user_id}")
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
