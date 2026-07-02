from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.cms import SubscriptionTariff
from app.models.user import User
from app.models.subscription import Subscription
from app.api.users import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


def parse_features(value: str | None) -> list[str]:
    if not value:
        return []
    import json
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


@router.get("/tariffs")
async def list_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SubscriptionTariff)
        .where(SubscriptionTariff.is_active == True)
        .order_by(SubscriptionTariff.sort_order, SubscriptionTariff.price)
    )
    return [
        {
            "plan": tariff.plan,
            "name": tariff.name,
            "price": tariff.price,
            "currency": tariff.currency,
            "period": tariff.period,
            "features": parse_features(tariff.features),
            "accent": tariff.accent,
        }
        for tariff in result.scalars().all()
    ]

@router.get("/me")
async def get_my_subscription(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        return {"plan": "basic", "is_active": True, "started_at": None, "expires_at": None}
    return {
        "plan": sub.plan.value,
        "is_active": sub.is_active,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
    }


@router.get("/bot/{telegram_id}")
async def get_subscription_for_bot(telegram_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    if request.headers.get("X-Bot-Secret") != settings.secret_key:
        raise HTTPException(403, "Forbidden")
    user_result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        return {"plan": "basic", "is_active": True, "started_at": None, "expires_at": None}
    return {
        "plan": sub.plan.value,
        "is_active": sub.is_active,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
    }
