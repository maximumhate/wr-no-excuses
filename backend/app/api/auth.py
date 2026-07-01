from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.auth import verify_telegram_init_data
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class AuthRequest(BaseModel):
    init_data: str

@router.post("/telegram")
async def auth_telegram(body: AuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    data = verify_telegram_init_data(body.init_data)
    if not data:
        raise HTTPException(403, "Invalid auth data")
    tg_id = int(data["id"])
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            telegram_id=tg_id,
            username=data.get("username"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    response.set_cookie(
        key="session",
        value=str(user.id),
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400 * 30,
    )
    return {"ok": True, "user": {"id": str(user.id), "telegram_id": user.telegram_id, "username": user.username}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}
