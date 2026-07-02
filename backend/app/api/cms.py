from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.cms import BotText

router = APIRouter(prefix="/api/cms", tags=["cms"])


def require_bot(request: Request) -> None:
    if request.headers.get("X-Bot-Secret") != settings.secret_key:
        raise HTTPException(403, "Forbidden")


@router.get("/bot-texts/{key}")
async def get_bot_text(key: str, request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    result = await db.execute(select(BotText).where(BotText.key == key, BotText.is_active == True))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Bot text not found")
    return {"key": item.key, "title": item.title, "category": item.category, "text": item.text}


@router.get("/bot-texts")
async def get_bot_texts(request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    result = await db.execute(select(BotText).where(BotText.is_active == True))
    return [
        {"key": item.key, "title": item.title, "category": item.category, "text": item.text}
        for item in result.scalars().all()
    ]
