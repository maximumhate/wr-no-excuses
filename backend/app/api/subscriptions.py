from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.api.users import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

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
