from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ExerciseType, ReportStatus
from app.models.streak import Streak

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/leaderboard")
async def leaderboard(
    db: AsyncSession = Depends(get_db),
    exercise: ExerciseType | None = None,
    period_days: int = Query(default=0, le=365),
    limit: int = Query(default=50, le=200),
):
    from_date = date.today() - timedelta(days=period_days) if period_days > 0 else None

    filters = [Report.status == ReportStatus.approved]
    if from_date:
        filters.append(Report.report_date >= from_date)

    pushups_col = func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pushups, *filters), 0)
    squats_col = func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.squats, *filters), 0)
    plank_col = func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.plank, *filters), 0)
    count_col = func.count(Report.id).filter(*filters)

    base = (
        select(
            User.telegram_id,
            User.first_name,
            User.username,
            User.city,
            User.level,
            pushups_col.label("pushups"),
            squats_col.label("squats"),
            plank_col.label("plank"),
            count_col.label("total_reports"),
        )
        .select_from(User)
        .outerjoin(Report, Report.user_id == User.id)
        .group_by(User.telegram_id, User.first_name, User.username, User.city, User.level)
    )

    result = await db.execute(base)
    rows = result.all()

    streaks = await db.execute(select(Streak.user_id, Streak.current_streak))
    streak_map = {s[0]: s[1] for s in streaks.all()}

    data = []
    for r in rows:
        entry = {
            "telegram_id": r[0],
            "name": r[1] or r[2] or "Unknown",
            "username": r[2],
            "city": r[3],
            "level": r[4],
            "pushups": r[5],
            "squats": r[6],
            "plank_seconds": r[7],
            "total_reports": r[8],
            "streak": streak_map.get(r[0], 0),
        }
        data.append(entry)

    if exercise:
        data.sort(key=lambda x: x[exercise.value], reverse=True)
    else:
        data.sort(key=lambda x: x["pushups"] + x["squats"] + x["plank_seconds"], reverse=True)

    return data[:limit]

@router.get("/admin/users")
async def all_users_summary(db: AsyncSession = Depends(get_db)):
    """Simple user list for admin dropdowns — no auth for internal use."""
    result = await db.execute(select(User.telegram_id, User.id, User.first_name, User.username).order_by(User.first_name))
    return [{"telegram_id": r[0], "id": str(r[1]), "name": r[2] or r[3] or "Unknown"} for r in result.all()]
