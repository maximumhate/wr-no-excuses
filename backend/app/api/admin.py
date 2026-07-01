from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.schemas.user import UserResponse
from app.api.users import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Admin access required")
    return user

@router.get("/users", response_model=list[UserResponse])
async def admin_list_users(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 50):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/dashboard")
async def admin_dashboard(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar()
    today_reports = (await db.execute(
        select(func.count(Report.id)).where(Report.report_date == func.current_date())
    )).scalar()
    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "today_reports": today_reports,
    }
