from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ExerciseType, ReportStatus
from app.models.streak import Streak
from app.schemas.report import ReportCreate, ReportStats
from app.api.users import get_current_user
from app.services.streak import update_streak
from app.services.achievements import check_achievements

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("")
async def create_report(data: ReportCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    report = Report(
        user_id=user.id,
        exercise_type=data.exercise_type,
        value=data.value,
        report_date=data.report_date or date.today(),
        status=ReportStatus.approved,
    )
    db.add(report)
    await db.flush()
    await update_streak(user.id, db)
    await db.commit()
    await db.refresh(report)
    new_ach = await check_achievements(user.id, db)
    return {
        "id": str(report.id),
        "exercise_type": report.exercise_type.value,
        "value": report.value,
        "report_date": str(report.report_date),
        "status": report.status.value,
        "created_at": report.created_at.isoformat(),
        "new_achievements": [
            {"slug": a.slug, "title": a.title, "icon": a.icon} for a in new_ach
        ] if new_ach else [],
    }

@router.get("/stats", response_model=ReportStats)
async def get_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    totals = await db.execute(
        select(
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pushups, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.squats, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.plank, Report.status == ReportStatus.approved), 0),
        )
    )
    pushup_total, squat_total, plank_total = totals.one()

    count = await db.execute(
        select(func.count(Report.id)).where(Report.user_id == user.id, Report.status == ReportStatus.approved)
    )
    total_reports = count.scalar()

    streak = await db.execute(select(Streak).where(Streak.user_id == user.id))
    s = streak.scalar_one_or_none()

    return ReportStats(
        total_pushups=pushup_total or 0,
        total_squats=squat_total or 0,
        total_plank_seconds=plank_total or 0,
        total_reports=total_reports or 0,
        current_streak=s.current_streak if s else 0,
        longest_streak=s.longest_streak if s else 0,
    )

@router.get("/history", response_model=list[ReportResponse])
async def get_history(user: User = Depends(get_current_user), skip: int = 0, limit: int = 30, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report).where(Report.user_id == user.id).order_by(Report.report_date.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()
