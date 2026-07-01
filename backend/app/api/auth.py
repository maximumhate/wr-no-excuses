from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.services.auth import verify_telegram_id_token, verify_telegram_init_data
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class AuthRequest(BaseModel):
    init_data: str | None = None
    id_token: str | None = None

class RegisterRequest(BaseModel):
    telegram_id: int
    username: str = ""
    first_name: str = ""
    last_name: str = ""

@router.post("/register")
async def register_bot(body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    if request.headers.get("X-Bot-Secret") != settings.secret_key:
        raise HTTPException(403, "Forbidden")
    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = result.scalar_one_or_none()
    if user:
        return {"ok": True, "user_id": str(user.id)}
    user = User(
        telegram_id=body.telegram_id,
        username=body.username or None,
        first_name=body.first_name or None,
        last_name=body.last_name or None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"ok": True, "user_id": str(user.id)}

@router.post("/telegram")
async def auth_telegram(body: AuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    if body.id_token:
        data = verify_telegram_id_token(body.id_token)
    elif body.init_data:
        data = verify_telegram_init_data(body.init_data)
    else:
        data = None
    if not data:
        raise HTTPException(403, "Invalid auth data")

    tg_id = int(data.get("id") or data["sub"])
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            telegram_id=tg_id,
            username=data.get("username") or data.get("preferred_username"),
            first_name=data.get("first_name") or data.get("given_name") or data.get("name"),
            last_name=data.get("last_name") or data.get("family_name"),
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
