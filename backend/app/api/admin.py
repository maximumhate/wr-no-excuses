import json
import uuid
from datetime import date, datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin_auth import get_current_admin
from app.config import settings
from app.database import get_db
from app.models.achievement import Achievement, UserAchievement
from app.models.admin_user import AdminUser
from app.models.broadcast import Broadcast, BroadcastDelivery
from app.models.challenge import ChallengeRegistration, ChallengeRegistrationExercise
from app.models.cms import BotText, SubscriptionTariff
from app.models.difficulty import ExerciseDifficultyRule, UserExerciseDifficulty
from app.models.report import ExerciseType, Report, ReportStatus
from app.models.streak import Streak
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.challenges import ensure_current_challenge, serialize_challenge
from app.services.exercises import EXERCISE_TYPES, EXERCISES, get_exercise_label

router = APIRouter(prefix="/api/admin", tags=["admin"])
MSK = timezone(timedelta(hours=3))


async def require_admin(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    return admin


async def require_admin_or_bot(request: Request, db: AsyncSession = Depends(get_db)) -> AdminUser | None:
    if request.headers.get("X-Bot-Secret") == settings.secret_key:
        return None
    return await get_current_admin(request, db)


def parse_features(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return [line.strip() for line in value.splitlines() if line.strip()]


def serialize_tariff(tariff: SubscriptionTariff) -> dict:
    return {
        "id": str(tariff.id),
        "plan": tariff.plan,
        "name": tariff.name,
        "price": tariff.price,
        "currency": tariff.currency,
        "period": tariff.period,
        "features": parse_features(tariff.features),
        "accent": tariff.accent,
        "is_active": tariff.is_active,
        "sort_order": tariff.sort_order,
    }


def serialize_achievement(achievement: Achievement) -> dict:
    return {
        "id": str(achievement.id),
        "slug": achievement.slug,
        "title": achievement.title,
        "description": achievement.description,
        "icon": achievement.icon,
        "is_active": achievement.is_active,
        "sort_order": achievement.sort_order,
    }


def serialize_bot_text(item: BotText) -> dict:
    return {
        "id": str(item.id),
        "key": item.key,
        "title": item.title,
        "category": item.category,
        "text": item.text,
        "is_active": item.is_active,
    }


def serialize_rule(rule: ExerciseDifficultyRule) -> dict:
    return {
        "id": str(rule.id),
        "exercise_type": rule.exercise_type,
        "exercise_label": get_exercise_label(rule.exercise_type),
        "difficulty": rule.difficulty,
        "title": rule.title,
        "description": rule.description,
        "min_value": rule.min_value,
        "max_value": rule.max_value,
        "unit": rule.unit,
        "sort_order": rule.sort_order,
        "is_active": rule.is_active,
    }


def serialize_broadcast(broadcast: Broadcast) -> dict:
    return {
        "id": str(broadcast.id),
        "text": broadcast.text,
        "caption": broadcast.caption,
        "media_type": broadcast.media_type,
        "file_name": broadcast.file_name,
        "send_mode": broadcast.send_mode,
        "status": broadcast.status,
        "total_users": broadcast.total_users,
        "sent_count": broadcast.sent_count,
        "failed_count": broadcast.failed_count,
        "created_at": broadcast.created_at.isoformat() if broadcast.created_at else None,
        "sent_at": broadcast.sent_at.isoformat() if broadcast.sent_at else None,
        "completed_at": broadcast.completed_at.isoformat() if broadcast.completed_at else None,
    }


async def user_difficulty_map(user_ids: list[uuid.UUID], db: AsyncSession) -> dict[uuid.UUID, dict[str, str]]:
    if not user_ids:
        return {}
    result = await db.execute(select(UserExerciseDifficulty).where(UserExerciseDifficulty.user_id.in_(user_ids)))
    data: dict[uuid.UUID, dict[str, str]] = {user_id: {} for user_id in user_ids}
    for item in result.scalars().all():
        data.setdefault(item.user_id, {})[item.exercise_type] = item.difficulty
    return data


def serialize_user(user: User, difficulties: dict[str, str] | None = None) -> dict:
    return {
        "id": str(user.id),
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "city": user.city,
        "level": user.level,
        "is_active": user.is_active,
        "is_participant": user.is_participant,
        "registered_at": user.registered_at.isoformat() if user.registered_at else None,
        "last_active_at": user.last_active_at.isoformat() if user.last_active_at else None,
        "difficulty_levels": difficulties or {},
    }


@router.get("/dashboard")
async def admin_dashboard(auth: AdminUser | None = Depends(require_admin_or_bot), db: AsyncSession = Depends(get_db)):
    challenge = await ensure_current_challenge(db)
    await db.commit()
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_today = (await db.execute(
        select(func.count(User.id)).where(User.last_active_at >= func.now() - text("interval '24 hours'"))
    )).scalar() or 0
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    today_reports = (await db.execute(
        select(func.count(Report.id)).where(Report.report_date == date.today())
    )).scalar() or 0
    challenge_registrations = (await db.execute(
        select(func.count(ChallengeRegistration.id)).where(ChallengeRegistration.challenge_id == challenge.id)
    )).scalar() or 0

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

    exercise_distribution = (await db.execute(
        select(Report.exercise_type, func.coalesce(func.sum(Report.value), 0), func.count(Report.id))
        .where(Report.status == ReportStatus.approved, Report.challenge_id == challenge.id)
        .group_by(Report.exercise_type)
    )).all()

    difficulty_distribution = (await db.execute(
        select(ChallengeRegistrationExercise.exercise_type, ChallengeRegistrationExercise.difficulty, func.count(ChallengeRegistrationExercise.id))
        .join(ChallengeRegistration, ChallengeRegistration.id == ChallengeRegistrationExercise.registration_id)
        .where(ChallengeRegistration.challenge_id == challenge.id)
        .group_by(ChallengeRegistrationExercise.exercise_type, ChallengeRegistrationExercise.difficulty)
    )).all()

    subscriptions = (await db.execute(
        select(Subscription.plan, func.count(Subscription.id))
        .where(Subscription.is_active == True)
        .group_by(Subscription.plan)
    )).all()

    broadcasts = (await db.execute(select(Broadcast).order_by(Broadcast.created_at.desc()).limit(5))).scalars().all()

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
        "challenge_registrations": challenge_registrations,
        "current_challenge": serialize_challenge(challenge),
        "reports_per_day": [{"date": str(r[0]), "count": r[1]} for r in reports_per_day],
        "registrations": [{"date": str(r[0]), "count": r[1]} for r in registrations],
        "exercise_distribution": [
            {"exercise_type": r[0].value, "label": get_exercise_label(r[0].value), "total": r[1], "reports": r[2]}
            for r in exercise_distribution
        ],
        "difficulty_distribution": [
            {"exercise_type": r[0], "label": get_exercise_label(r[0]), "difficulty": r[1], "count": r[2]}
            for r in difficulty_distribution
        ],
        "subscriptions": [{"plan": r[0].value, "count": r[1]} for r in subscriptions],
        "broadcasts": [serialize_broadcast(b) for b in broadcasts],
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
        conditions = [
            User.first_name.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%"),
            User.city.ilike(f"%{search}%"),
        ]
        if search.isdigit():
            conditions.append(User.telegram_id == int(search))
        query = query.where(or_(*conditions))
    query = query.order_by(User.registered_at.desc()).offset(skip).limit(limit)
    users = (await db.execute(query)).scalars().all()
    difficulties = await user_difficulty_map([u.id for u in users], db)
    return [serialize_user(user, difficulties.get(user.id, {})) for user in users]


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
    recent_raw = await db.execute(select(Report).where(Report.user_id == user_id).order_by(Report.report_date.desc()).limit(10))
    difficulties = await user_difficulty_map([user.id], db)
    challenge = await ensure_current_challenge(db)
    registration = (await db.execute(select(ChallengeRegistration).where(
        ChallengeRegistration.user_id == user.id,
        ChallengeRegistration.challenge_id == challenge.id,
    ))).scalar_one_or_none()
    return {
        "user": serialize_user(user, difficulties.get(user.id, {})),
        "totals": {"pushups": pushup_total or 0, "squats": squat_total or 0, "plank_seconds": plank_total or 0, "pullups": pullup_total or 0, "abs": abs_total or 0},
        "streak": {"current": s.current_streak if s else 0, "longest": s.longest_streak if s else 0},
        "current_registration": {
            "challenge": serialize_challenge(challenge),
            "exercises": [
                {"exercise_type": item.exercise_type, "label": get_exercise_label(item.exercise_type), "difficulty": item.difficulty}
                for item in registration.exercises
            ],
        } if registration else None,
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


class AchievementBody(BaseModel):
    slug: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=256)
    description: str | None = None
    icon: str | None = None
    is_active: bool = True
    sort_order: int = 0


class AchievementPatch(BaseModel):
    slug: str | None = None
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


@router.get("/achievements")
async def admin_achievements(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Achievement).order_by(Achievement.sort_order, Achievement.slug))
    return [serialize_achievement(a) for a in result.scalars().all()]


@router.post("/achievements")
async def admin_create_achievement(data: AchievementBody, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    achievement = Achievement(**data.model_dump())
    db.add(achievement)
    await db.commit()
    await db.refresh(achievement)
    return serialize_achievement(achievement)


@router.patch("/achievements/{achievement_id}")
async def admin_update_achievement(achievement_id: uuid.UUID, data: AchievementPatch, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    achievement = await db.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(404, "Achievement not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(achievement, field, value)
    await db.commit()
    await db.refresh(achievement)
    return serialize_achievement(achievement)


@router.delete("/achievements/{achievement_id}")
async def admin_delete_achievement(achievement_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    achievement = await db.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(404, "Achievement not found")
    await db.execute(delete(UserAchievement).where(UserAchievement.achievement_id == achievement_id))
    await db.delete(achievement)
    await db.commit()
    return {"ok": True}


class TariffBody(BaseModel):
    plan: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=128)
    price: int = 0
    currency: str = "RUB"
    period: str = "мес"
    features: list[str] = Field(default_factory=list)
    accent: str | None = None
    is_active: bool = True
    sort_order: int = 0


class TariffPatch(BaseModel):
    name: str | None = None
    price: int | None = None
    currency: str | None = None
    period: str | None = None
    features: list[str] | None = None
    accent: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


@router.get("/tariffs")
async def admin_tariffs(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubscriptionTariff).order_by(SubscriptionTariff.sort_order, SubscriptionTariff.price))
    return [serialize_tariff(t) for t in result.scalars().all()]


@router.post("/tariffs")
async def admin_create_tariff(data: TariffBody, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    tariff = SubscriptionTariff(**{**data.model_dump(exclude={"features"}), "features": json.dumps(data.features, ensure_ascii=False)})
    db.add(tariff)
    await db.commit()
    await db.refresh(tariff)
    return serialize_tariff(tariff)


@router.patch("/tariffs/{tariff_id}")
async def admin_update_tariff(tariff_id: uuid.UUID, data: TariffPatch, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    tariff = await db.get(SubscriptionTariff, tariff_id)
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    payload = data.model_dump(exclude_unset=True)
    if "features" in payload:
        payload["features"] = json.dumps(payload["features"], ensure_ascii=False)
    for field, value in payload.items():
        setattr(tariff, field, value)
    await db.commit()
    await db.refresh(tariff)
    return serialize_tariff(tariff)


@router.delete("/tariffs/{tariff_id}")
async def admin_delete_tariff(tariff_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    tariff = await db.get(SubscriptionTariff, tariff_id)
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    await db.delete(tariff)
    await db.commit()
    return {"ok": True}


class BotTextBody(BaseModel):
    key: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=256)
    category: str = "bot"
    text: str = Field(min_length=1)
    is_active: bool = True


class BotTextPatch(BaseModel):
    key: str | None = None
    title: str | None = None
    category: str | None = None
    text: str | None = None
    is_active: bool | None = None


@router.get("/bot-texts")
async def admin_bot_texts(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotText).order_by(BotText.category, BotText.key))
    return [serialize_bot_text(item) for item in result.scalars().all()]


@router.post("/bot-texts")
async def admin_create_bot_text(data: BotTextBody, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    item = BotText(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return serialize_bot_text(item)


@router.patch("/bot-texts/{item_id}")
async def admin_update_bot_text(item_id: uuid.UUID, data: BotTextPatch, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    item = await db.get(BotText, item_id)
    if not item:
        raise HTTPException(404, "Bot text not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return serialize_bot_text(item)


@router.delete("/bot-texts/{item_id}")
async def admin_delete_bot_text(item_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    item = await db.get(BotText, item_id)
    if not item:
        raise HTTPException(404, "Bot text not found")
    await db.delete(item)
    await db.commit()
    return {"ok": True}


class DifficultyRuleBody(BaseModel):
    exercise_type: str
    difficulty: str
    title: str
    description: str | None = None
    min_value: int | None = None
    max_value: int | None = None
    unit: str = "раз"
    sort_order: int = 0
    is_active: bool = True


class DifficultyRulePatch(BaseModel):
    title: str | None = None
    description: str | None = None
    min_value: int | None = None
    max_value: int | None = None
    unit: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


@router.get("/difficulty-rules")
async def admin_difficulty_rules(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExerciseDifficultyRule).order_by(ExerciseDifficultyRule.exercise_type, ExerciseDifficultyRule.sort_order))
    return {"exercises": EXERCISES, "rules": [serialize_rule(rule) for rule in result.scalars().all()]}


@router.post("/difficulty-rules")
async def admin_create_difficulty_rule(data: DifficultyRuleBody, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if data.exercise_type not in EXERCISE_TYPES:
        raise HTTPException(400, "Unknown exercise")
    rule = ExerciseDifficultyRule(**data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return serialize_rule(rule)


@router.patch("/difficulty-rules/{rule_id}")
async def admin_update_difficulty_rule(rule_id: uuid.UUID, data: DifficultyRulePatch, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    rule = await db.get(ExerciseDifficultyRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.commit()
    await db.refresh(rule)
    return serialize_rule(rule)


@router.delete("/difficulty-rules/{rule_id}")
async def admin_delete_difficulty_rule(rule_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    rule = await db.get(ExerciseDifficultyRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    await db.delete(rule)
    await db.commit()
    return {"ok": True}


class BroadcastRequest(BaseModel):
    text: str


class BroadcastCompleteRequest(BaseModel):
    sent_count: int | None = None
    failed_count: int | None = None


@router.post("/broadcast")
async def admin_broadcast(data: BroadcastRequest, auth: AdminUser | None = Depends(require_admin_or_bot), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total = result.scalar() or 0
    broadcast = Broadcast(text=data.text, created_by=None, total_users=total, status="pending")
    db.add(broadcast)
    await db.commit()
    await db.refresh(broadcast)
    return {
        "ok": True,
        "id": str(broadcast.id),
        "message": f"Рассылка создана, будет отправлена {total} пользователям",
        "text": data.text,
    }


def detect_media_type(upload: UploadFile | None) -> str | None:
    if not upload:
        return None
    content_type = upload.content_type or ""
    if content_type.startswith("image/"):
        return "photo"
    if content_type.startswith("video/"):
        return "video"
    return "document"


async def send_telegram_message(client: httpx.AsyncClient, telegram_id: int, text_value: str) -> tuple[bool, int | None, str | None]:
    resp = await client.post(
        f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
        data={"chat_id": telegram_id, "text": text_value, "parse_mode": "HTML"},
    )
    if resp.status_code == 200:
        data = resp.json()
        return True, data.get("result", {}).get("message_id"), None
    return False, None, resp.text[:1000]


async def send_telegram_media(
    client: httpx.AsyncClient,
    telegram_id: int,
    media_type: str,
    file_name: str,
    file_bytes: bytes,
    content_type: str,
    caption: str | None,
) -> tuple[bool, int | None, str | None]:
    method = {"photo": "sendPhoto", "video": "sendVideo", "document": "sendDocument"}[media_type]
    field = {"photo": "photo", "video": "video", "document": "document"}[media_type]
    data = {"chat_id": str(telegram_id), "parse_mode": "HTML"}
    if caption:
        data["caption"] = caption
    files = {field: (file_name, file_bytes, content_type or "application/octet-stream")}
    resp = await client.post(f"https://api.telegram.org/bot{settings.bot_token}/{method}", data=data, files=files)
    if resp.status_code == 200:
        data_json = resp.json()
        return True, data_json.get("result", {}).get("message_id"), None
    return False, None, resp.text[:1000]


@router.post("/broadcast/send")
async def admin_broadcast_send(
    admin: AdminUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    text_value: str | None = Form(None, alias="text"),
    caption: str | None = Form(None),
    send_mode: str = Form("caption"),
    upload: UploadFile | None = File(None, alias="file"),
):
    text_clean = (text_value or "").strip()
    caption_clean = (caption or "").strip()
    if send_mode not in ("caption", "separate"):
        raise HTTPException(400, "send_mode must be caption or separate")
    if not text_clean and not caption_clean and not upload:
        raise HTTPException(400, "Добавьте текст или файл")
    if not settings.bot_token:
        raise HTTPException(503, "BOT_TOKEN не настроен")

    media_type = detect_media_type(upload)
    file_bytes = await upload.read() if upload else None
    file_name = upload.filename if upload else None
    content_type = upload.content_type if upload else None

    users = (await db.execute(select(User.id, User.telegram_id).where(User.is_active == True).order_by(User.registered_at))).all()
    broadcast = Broadcast(
        text=text_clean or None,
        caption=caption_clean or None,
        media_type=media_type,
        file_name=file_name,
        send_mode=send_mode,
        status="sending",
        total_users=len(users),
    )
    db.add(broadcast)
    await db.flush()

    sent = 0
    failed = 0
    async with httpx.AsyncClient(timeout=30) as client:
        for user_id, telegram_id in users:
            ok = False
            message_id = None
            error = None
            try:
                if media_type and file_bytes is not None and file_name:
                    media_caption = caption_clean or text_clean if send_mode == "caption" else None
                    ok, message_id, error = await send_telegram_media(
                        client,
                        telegram_id,
                        media_type,
                        file_name,
                        file_bytes,
                        content_type or "application/octet-stream",
                        media_caption,
                    )
                    if ok and send_mode == "separate" and text_clean:
                        ok, message_id, error = await send_telegram_message(client, telegram_id, text_clean)
                else:
                    ok, message_id, error = await send_telegram_message(client, telegram_id, text_clean or caption_clean)
            except Exception as exc:
                ok = False
                error = str(exc)[:1000]

            if ok:
                sent += 1
            else:
                failed += 1
            db.add(BroadcastDelivery(
                broadcast_id=broadcast.id,
                user_id=user_id,
                telegram_id=telegram_id,
                status="delivered" if ok else "failed",
                error=error,
                message_id=message_id,
                delivered_at=datetime.now(MSK) if ok else None,
            ))

    broadcast.sent_count = sent
    broadcast.failed_count = failed
    broadcast.status = "completed"
    broadcast.sent_at = datetime.now(MSK)
    broadcast.completed_at = datetime.now(MSK)
    await db.commit()
    await db.refresh(broadcast)

    return {
        "ok": True,
        "message": f"Рассылка завершена: доставлено {sent}, ошибок {failed}",
        "broadcast": serialize_broadcast(broadcast),
    }


@router.get("/broadcast/pending")
async def admin_pending_broadcasts(auth: AdminUser | None = Depends(require_admin_or_bot), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Broadcast).where(Broadcast.status == "pending").order_by(Broadcast.created_at))
    broadcasts = result.scalars().all()
    return [serialize_broadcast(b) for b in broadcasts]


@router.get("/broadcast/users")
async def admin_broadcast_users(auth: AdminUser | None = Depends(require_admin_or_bot), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User.telegram_id).where(User.is_active == True).order_by(User.registered_at))
    return [{"telegram_id": tg_id} for tg_id in result.scalars().all()]


@router.patch("/broadcast/{broadcast_id}/complete")
async def admin_complete_broadcast(
    broadcast_id: uuid.UUID,
    data: BroadcastCompleteRequest | None = None,
    auth: AdminUser | None = Depends(require_admin_or_bot),
    db: AsyncSession = Depends(get_db),
):
    broadcast = await db.get(Broadcast, broadcast_id)
    if not broadcast:
        raise HTTPException(404, "Broadcast not found")
    if data and data.sent_count is not None:
        broadcast.sent_count = data.sent_count
    if data and data.failed_count is not None:
        broadcast.failed_count = data.failed_count
    broadcast.status = "completed"
    broadcast.sent_at = datetime.now(MSK)
    broadcast.completed_at = datetime.now(MSK)
    await db.commit()
    return {"ok": True}


@router.get("/broadcasts")
async def admin_broadcasts(admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Broadcast).order_by(Broadcast.created_at.desc()).limit(50))
    return [serialize_broadcast(b) for b in result.scalars().all()]


@router.get("/broadcasts/{broadcast_id}/deliveries")
async def admin_broadcast_deliveries(broadcast_id: uuid.UUID, admin: AdminUser = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    broadcast = await db.get(Broadcast, broadcast_id)
    if not broadcast:
        raise HTTPException(404, "Broadcast not found")
    result = await db.execute(
        select(BroadcastDelivery, User.first_name, User.username)
        .outerjoin(User, User.id == BroadcastDelivery.user_id)
        .where(BroadcastDelivery.broadcast_id == broadcast_id)
        .order_by(BroadcastDelivery.created_at.desc())
    )
    return {
        "broadcast": serialize_broadcast(broadcast),
        "deliveries": [
            {
                "id": str(row[0].id),
                "telegram_id": row[0].telegram_id,
                "name": row[1] or row[2] or "Unknown",
                "username": row[2],
                "status": row[0].status,
                "error": row[0].error,
                "message_id": row[0].message_id,
                "delivered_at": row[0].delivered_at.isoformat() if row[0].delivered_at else None,
                "created_at": row[0].created_at.isoformat() if row[0].created_at else None,
            }
            for row in result.all()
        ],
    }
