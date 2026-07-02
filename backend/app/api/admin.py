import uuid
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database import get_db
from app.models.admin_user import AdminUser
from app.models.user import User
from app.models.report import Report, ExerciseType, ReportStatus
from app.models.streak import Streak
from app.models.broadcast import Broadcast
from app.schemas.user import UserResponse, UserUpdate
from app.api.admin_auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

async def require_admin(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    return admin

@router.get("/dashboard")
async def admin_dashboard(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    active_today = (await db.execute(
        select(func.count(User.id)).where(User.last_active_at >= func.now() - text("interval '24 hours'"))
    )).scalar()
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar()
    today_reports = (await db.execute(
        select(func.count(Report.id)).where(Report.report_date == date.today())
    )).scalar()

    fourteen_days_ago = date.today() - timedelta(days=13)
    reports_per_day = (await db.execute(
        select(Report.report_date, func.count(Report.id))
        .where(Report.report_date >= fourteen_days_ago)
        .group_by(Report.report_date)
        .order_by(Report.report_date)
    )).all()

    registrations = (await db.execute(
        select(func.date(User.registered_at), func.count(User.id))
        .where(User.registered_at >= fourteen_days_ago)
        .group_by(func.date(User.registered_at))
        .order_by(func.date(User.registered_at))
    )).all()

    streak_leaders_raw = (await db.execute(
        select(User.first_name, User.username, Streak.current_streak)
        .join(Streak, Streak.user_id == User.id)
        .order_by(Streak.current_streak.desc())
        .limit(10)
    )).all()

    return {
        "total_users": total_users,
        "active_today": active_today,
        "total_reports": total_reports,
        "today_reports": today_reports,
        "reports_per_day": [{"date": str(r[0]), "count": r[1]} for r in reports_per_day],
        "registrations": [{"date": str(r[0]), "count": r[1]} for r in registrations],
        "streak_leaders": [
            {"name": r[0] or r[1] or "Unknown", "username": r[1], "streak": r[2]}
            for r in streak_leaders_raw
        ],
    }

@router.get("/users")
async def admin_list_users(
    admin: AdminUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    search: str = "",
    skip: int = 0,
    limit: int = 50,
):
    query = select(User)
    if search:
        query = query.where(
            User.first_name.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%") |
            User.city.ilike(f"%{search}%")
        )
    query = query.order_by(User.registered_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/users/{user_id}")
async def admin_get_user(user_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    totals = await db.execute(
        select(
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pushups, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.squats, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.plank, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pullups, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.abs, Report.status == ReportStatus.approved), 0),
        ).where(Report.user_id == user_id)
    )
    pushup_total, squat_total, plank_total, pullup_total, abs_total = totals.one()
    streak = await db.execute(select(Streak).where(Streak.user_id == user_id))
    s = streak.scalar_one_or_none()
    recent_raw = await db.execute(
        select(Report).where(Report.user_id == user_id).order_by(Report.report_date.desc()).limit(10)
    )
    return {
        "user": user,
        "totals": {"pushups": pushup_total or 0, "squats": squat_total or 0, "plank_seconds": plank_total or 0, "pullups": pullup_total or 0, "abs": abs_total or 0},
        "streak": {"current": s.current_streak if s else 0, "longest": s.longest_streak if s else 0},
        "recent_reports": recent_raw.scalars().all(),
    }

@router.patch("/users/{user_id}", response_model=UserResponse)
async def admin_update_user(user_id: uuid.UUID, data: UserUpdate, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user

class ReportUpdate(BaseModel):
    value: int | None = None
    status: ReportStatus | None = None
    exercise_type: ExerciseType | None = None
    report_date: date | None = None

@router.get("/reports")
async def admin_list_reports(
    admin: AdminUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    status: ReportStatus | None = None,
    exercise: ExerciseType | None = None,
    user_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    if exercise:
        query = query.where(Report.exercise_type == exercise)
    if user_id:
        query = query.where(Report.user_id == user_id)
    query = query.order_by(Report.report_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/reports/{report_id}")
async def admin_update_report(report_id: uuid.UUID, data: ReportUpdate, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    await db.commit()
    await db.refresh(report)
    return report

class BroadcastRequest(BaseModel):
    text: str

@router.post("/broadcast")
async def admin_broadcast(data: BroadcastRequest, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total = result.scalar() or 0
    broadcast = Broadcast(text=data.text, created_by=None, total_users=total)
    db.add(broadcast)
    await db.commit()
    await db.refresh(broadcast)
    return {
        "ok": True,
        "id": str(broadcast.id),
        "message": f"Рассылка создана, будет отправлена {total} пользователям",
        "text": data.text,
    }

@router.get("/broadcast/pending")
async def admin_pending_broadcasts(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Broadcast).where(Broadcast.sent_at.is_(None)).order_by(Broadcast.created_at)
    )
    broadcasts = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "text": b.text,
            "total_users": b.total_users,
            "created_at": b.created_at.isoformat(),
        }
        for b in broadcasts
    ]

@router.patch("/broadcast/{broadcast_id}/complete")
async def admin_complete_broadcast(broadcast_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    broadcast = await db.get(Broadcast, broadcast_id)
    if not broadcast:
        raise HTTPException(404, "Broadcast not found")
    broadcast.sent_at = func.now()
    await db.commit()
    return {"ok": True}
