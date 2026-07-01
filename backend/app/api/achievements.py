from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.achievement import Achievement, UserAchievement
from app.api.users import get_current_user

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

@router.get("")
async def list_achievements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Achievement).order_by(Achievement.slug))
    return [
        {
            "slug": a.slug,
            "title": a.title,
            "description": a.description,
            "icon": a.icon,
        }
        for a in result.scalars().all()
    ]

@router.get("/mine")
async def my_achievements(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user.id)
    )
    ua_list = result.scalars().all()
    slugs = {ua.achievement_id for ua in ua_list}
    all_ach = await db.execute(select(Achievement))
    return [
        {
            "slug": a.slug,
            "title": a.title,
            "description": a.description,
            "icon": a.icon,
            "achieved": a.id in slugs,
            "achieved_at": next(
                (ua.achieved_at.isoformat() for ua in ua_list if ua.achievement_id == a.id),
                None,
            ),
        }
        for a in all_ach.scalars().all()
    ]
