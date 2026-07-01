import uuid
import hashlib
import logging
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.admin_user import AdminUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin_auth"])

ADMIN_SESSION_COOKIE = "admin_session"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


async def get_current_admin(request: Request, db: AsyncSession = Depends(get_db)) -> AdminUser:
    session_id = request.cookies.get(ADMIN_SESSION_COOKIE)
    if not session_id:
        raise HTTPException(401, "Not authenticated")
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(401, "Invalid session")
    result = await db.execute(select(AdminUser).where(AdminUser.id == uid))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(401, "Admin not found")
    return admin


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateAdminRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def admin_login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    password_hash = hash_password(body.password)
    result = await db.execute(
        select(AdminUser).where(
            AdminUser.username == body.username,
            AdminUser.password_hash == password_hash,
        )
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(403, "Invalid credentials")

    response.set_cookie(
        key=ADMIN_SESSION_COOKIE,
        value=str(admin.id),
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
    )
    return {"ok": True, "username": admin.username}


@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie(ADMIN_SESSION_COOKIE)
    return {"ok": True}


@router.get("/me")
async def admin_me(admin: AdminUser = Depends(get_current_admin)):
    return {"id": str(admin.id), "username": admin.username, "created_at": admin.created_at.isoformat()}


@router.post("/users/create")
async def admin_create_user(
    body: CreateAdminRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdminUser).where(AdminUser.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Username already exists")

    admin = AdminUser(username=body.username, password_hash=hash_password(body.password))
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return {"ok": True, "id": str(admin.id), "username": admin.username}


@router.get("/users/list")
async def admin_list_users(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdminUser).order_by(AdminUser.created_at))
    admins = result.scalars().all()
    return [
        {"id": str(a.id), "username": a.username, "created_at": a.created_at.isoformat()}
        for a in admins
    ]
