import logging
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.streak import Streak
from app.models.report import Report, ReportStatus

logger = logging.getLogger(__name__)

async def update_streak(user_id, db: AsyncSession):
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=user_id)
        db.add(streak)

    today = date.today()
    if streak.last_report_date == today:
        return streak

    if streak.last_report_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.last_report_date = today
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    await db.commit()
    await db.refresh(streak)
    return streak
