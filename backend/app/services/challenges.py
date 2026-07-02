from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import Challenge

MSK = timezone(timedelta(hours=3))


def today_msk() -> date:
    return datetime.now(MSK).date()


def week_bounds(ref: date) -> tuple[date, date]:
    starts_on = ref - timedelta(days=ref.weekday())
    return starts_on, starts_on + timedelta(days=6)


async def ensure_current_challenge(db: AsyncSession) -> Challenge:
    today = today_msk()
    result = await db.execute(
        select(Challenge)
        .where(Challenge.starts_on <= today, Challenge.ends_on >= today)
        .order_by(Challenge.number.desc())
    )
    challenge = result.scalar_one_or_none()
    if challenge:
        return challenge

    max_number = (await db.execute(select(func.max(Challenge.number)))).scalar() or 0
    starts_on, ends_on = week_bounds(today)
    challenge = Challenge(
        number=max_number + 1,
        title=f"Челлендж №{max_number + 1}",
        starts_on=starts_on,
        ends_on=ends_on,
        status="active",
    )
    db.add(challenge)
    await db.flush()
    return challenge


def serialize_challenge(challenge: Challenge) -> dict:
    return {
        "id": str(challenge.id),
        "number": challenge.number,
        "title": challenge.title or f"Челлендж №{challenge.number}",
        "starts_on": challenge.starts_on.isoformat(),
        "ends_on": challenge.ends_on.isoformat(),
        "status": challenge.status,
        "announcement_text": challenge.announcement_text,
        "announcement_sent_at": challenge.announcement_sent_at.isoformat() if challenge.announcement_sent_at else None,
    }
