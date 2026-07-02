from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.challenge import Challenge, ChallengeRegistration, ChallengeRegistrationExercise
from app.models.difficulty import ExerciseDifficultyRule, UserExerciseDifficulty
from app.models.report import ExerciseType, Report
from app.models.streak import Streak
from app.models.subscription import Subscription
from app.models.user import User
from app.api.users import get_current_user
from app.services.challenges import ensure_current_challenge, serialize_challenge
from app.services.exercises import EXERCISE_TYPES, EXERCISES, get_exercise_label

router = APIRouter(prefix="/api/challenges", tags=["challenges"])
MSK = timezone(timedelta(hours=3))


class RegistrationExercise(BaseModel):
    exercise_type: str
    difficulty: str


class ChallengeRegistrationRequest(BaseModel):
    telegram_id: int
    username: str = ""
    first_name: str = ""
    last_name: str = ""
    name: str = Field(min_length=1, max_length=256)
    city: str = Field(min_length=1, max_length=256)
    exercises: list[RegistrationExercise] = Field(min_length=1)


def require_bot(request: Request) -> None:
    if request.headers.get("X-Bot-Secret") != settings.secret_key:
        raise HTTPException(403, "Forbidden")


def now_msk() -> datetime:
    return datetime.now(MSK)


def serialize_rule(rule: ExerciseDifficultyRule) -> dict:
    return {
        "id": str(rule.id),
        "exercise_type": rule.exercise_type,
        "difficulty": rule.difficulty,
        "title": rule.title,
        "description": rule.description,
        "min_value": rule.min_value,
        "max_value": rule.max_value,
        "unit": rule.unit,
        "sort_order": rule.sort_order,
        "is_active": rule.is_active,
    }


def serialize_registration(registration: ChallengeRegistration | None) -> dict | None:
    if not registration:
        return None
    return {
        "id": str(registration.id),
        "challenge_id": str(registration.challenge_id),
        "name": registration.name,
        "city": registration.city,
        "registered_at": registration.registered_at.isoformat() if registration.registered_at else None,
        "exercises": [
            {
                "exercise_type": item.exercise_type,
                "label": get_exercise_label(item.exercise_type),
                "difficulty": item.difficulty,
            }
            for item in registration.exercises
        ],
    }


async def get_current_registration(user_id, challenge_id, db: AsyncSession) -> ChallengeRegistration | None:
    result = await db.execute(
        select(ChallengeRegistration).where(
            ChallengeRegistration.user_id == user_id,
            ChallengeRegistration.challenge_id == challenge_id,
        )
    )
    return result.scalar_one_or_none()


@router.get("/current")
async def current_challenge(db: AsyncSession = Depends(get_db)):
    challenge = await ensure_current_challenge(db)
    await db.commit()
    return serialize_challenge(challenge)


@router.get("/me")
async def my_current_challenge(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    challenge = await ensure_current_challenge(db)
    registration = await get_current_registration(user.id, challenge.id, db)
    await db.commit()
    return {
        "challenge": serialize_challenge(challenge),
        "registration": serialize_registration(registration),
        "is_registered": registration is not None,
    }


@router.get("/exercises")
async def exercise_catalog(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExerciseDifficultyRule)
        .where(ExerciseDifficultyRule.is_active == True)
        .order_by(ExerciseDifficultyRule.exercise_type, ExerciseDifficultyRule.sort_order, ExerciseDifficultyRule.title)
    )
    rules = result.scalars().all()
    by_exercise: dict[str, list[dict]] = {item["type"]: [] for item in EXERCISES}
    for rule in rules:
        by_exercise.setdefault(rule.exercise_type, []).append(serialize_rule(rule))
    return [
        {
            **exercise,
            "difficulties": by_exercise.get(exercise["type"], []),
        }
        for exercise in EXERCISES
    ]


@router.get("/profile/{telegram_id}")
async def bot_profile(telegram_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    challenge = await ensure_current_challenge(db)
    registration = await get_current_registration(user.id, challenge.id, db)
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    difficulties = await db.execute(select(UserExerciseDifficulty).where(UserExerciseDifficulty.user_id == user.id))
    await db.commit()

    return {
        "user": {
            "id": str(user.id),
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "city": user.city,
            "is_participant": user.is_participant,
        },
        "challenge": serialize_challenge(challenge),
        "registration": serialize_registration(registration),
        "subscription": {
            "plan": sub.plan.value if sub else "basic",
            "is_active": sub.is_active if sub else True,
            "expires_at": sub.expires_at.isoformat() if sub and sub.expires_at else None,
        },
        "difficulties": [
            {
                "exercise_type": d.exercise_type,
                "difficulty": d.difficulty,
                "locked_until": d.locked_until.isoformat() if d.locked_until else None,
            }
            for d in difficulties.scalars().all()
        ],
    }


@router.post("/current/register")
async def register_current_challenge(
    body: ChallengeRegistrationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    require_bot(request)

    selected: dict[str, str] = {}
    for item in body.exercises:
        if item.exercise_type not in EXERCISE_TYPES:
            raise HTTPException(400, f"Unknown exercise: {item.exercise_type}")
        if item.exercise_type in selected:
            raise HTTPException(400, f"Exercise duplicated: {item.exercise_type}")
        selected[item.exercise_type] = item.difficulty

    rules_result = await db.execute(
        select(ExerciseDifficultyRule).where(
            ExerciseDifficultyRule.exercise_type.in_(selected.keys()),
            ExerciseDifficultyRule.difficulty.in_(selected.values()),
            ExerciseDifficultyRule.is_active == True,
        )
    )
    existing_rules = {(r.exercise_type, r.difficulty) for r in rules_result.scalars().all()}
    missing = [f"{exercise}:{difficulty}" for exercise, difficulty in selected.items() if (exercise, difficulty) not in existing_rules]
    if missing:
        raise HTTPException(400, "Некорректный уровень сложности: " + ", ".join(missing))

    user_result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = user_result.scalar_one_or_none()
    if not user:
        user = User(
            telegram_id=body.telegram_id,
            username=body.username or None,
            first_name=body.first_name or body.name,
            last_name=body.last_name or None,
            city=body.city,
            is_participant=True,
        )
        db.add(user)
        await db.flush()
    else:
        user.username = body.username or user.username
        user.first_name = body.first_name or body.name or user.first_name
        user.last_name = body.last_name or user.last_name
        user.city = body.city
        user.is_participant = True

    challenge = await ensure_current_challenge(db)
    registration = await get_current_registration(user.id, challenge.id, db)
    if registration:
        raise HTTPException(409, "Ты уже зарегистрирован на текущий челлендж")

    now = now_msk()
    locked_changes = []
    for exercise_type, difficulty in selected.items():
        diff_result = await db.execute(
            select(UserExerciseDifficulty).where(
                UserExerciseDifficulty.user_id == user.id,
                UserExerciseDifficulty.exercise_type == exercise_type,
            )
        )
        current = diff_result.scalar_one_or_none()
        if current and current.difficulty != difficulty and current.locked_until and current.locked_until > now:
            locked_changes.append({
                "exercise_type": exercise_type,
                "current": current.difficulty,
                "requested": difficulty,
                "locked_until": current.locked_until.isoformat(),
            })

    if locked_changes:
        raise HTTPException(
            409,
            {
                "message": "Уровень сложности нельзя менять чаще одного раза в 3 месяца",
                "locked": locked_changes,
            },
        )

    registration = ChallengeRegistration(
        challenge_id=challenge.id,
        user_id=user.id,
        name=body.name.strip(),
        city=body.city.strip(),
    )
    db.add(registration)
    await db.flush()

    for exercise_type, difficulty in selected.items():
        db.add(ChallengeRegistrationExercise(
            registration_id=registration.id,
            exercise_type=exercise_type,
            difficulty=difficulty,
        ))

        diff_result = await db.execute(
            select(UserExerciseDifficulty).where(
                UserExerciseDifficulty.user_id == user.id,
                UserExerciseDifficulty.exercise_type == exercise_type,
            )
        )
        current = diff_result.scalar_one_or_none()
        if current:
            if current.difficulty != difficulty:
                current.difficulty = difficulty
                current.last_changed_at = now
                current.locked_until = now + timedelta(days=90)
        else:
            db.add(UserExerciseDifficulty(
                user_id=user.id,
                exercise_type=exercise_type,
                difficulty=difficulty,
                last_changed_at=now,
                locked_until=now + timedelta(days=90),
            ))

    await db.commit()
    await db.refresh(registration)

    return {
        "ok": True,
        "user_id": str(user.id),
        "challenge": serialize_challenge(challenge),
        "registration": serialize_registration(registration),
    }


@router.get("/current/stats/{telegram_id}")
async def current_stats_for_bot(telegram_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    user_result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    challenge = await ensure_current_challenge(db)
    registration = await get_current_registration(user.id, challenge.id, db)
    if not registration:
        raise HTTPException(404, "Not registered for current challenge")

    from sqlalchemy import func

    totals = await db.execute(
        select(Report.exercise_type, func.coalesce(func.sum(Report.value), 0), func.count(Report.id))
        .where(
            Report.user_id == user.id,
            Report.challenge_id == challenge.id,
        )
        .group_by(Report.exercise_type)
    )
    streak_result = await db.execute(select(Streak).where(Streak.user_id == user.id))
    streak = streak_result.scalar_one_or_none()
    by_exercise = {row[0].value: {"total": row[1], "reports": row[2]} for row in totals.all()}
    return {
        "challenge": serialize_challenge(challenge),
        "registration": serialize_registration(registration),
        "totals": by_exercise,
        "total_reports": sum(item["reports"] for item in by_exercise.values()),
        "current_streak": streak.current_streak if streak else 0,
        "longest_streak": streak.longest_streak if streak else 0,
    }


@router.get("/current/announcement")
async def current_announcement(request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    challenge = await ensure_current_challenge(db)
    await db.commit()
    return {"challenge": serialize_challenge(challenge), "should_send": challenge.announcement_sent_at is None}


@router.post("/current/announcement/sent")
async def mark_current_announcement_sent(request: Request, db: AsyncSession = Depends(get_db)):
    require_bot(request)
    challenge = await ensure_current_challenge(db)
    challenge.announcement_sent_at = now_msk()
    await db.commit()
    return {"ok": True, "challenge": serialize_challenge(challenge)}


async def validate_report_registration(user: User, exercise_type: ExerciseType, value: int, db: AsyncSession):
    challenge = await ensure_current_challenge(db)
    registration = await get_current_registration(user.id, challenge.id, db)
    if not registration:
        raise HTTPException(403, "Ты не зарегистрирован на текущий челлендж. Открой /start в боте")

    selected = next((item for item in registration.exercises if item.exercise_type == exercise_type.value), None)
    if not selected:
        raise HTTPException(403, "Это упражнение не выбрано в регистрации на текущий челлендж")

    rule_result = await db.execute(
        select(ExerciseDifficultyRule).where(
            ExerciseDifficultyRule.exercise_type == exercise_type.value,
            ExerciseDifficultyRule.difficulty == selected.difficulty,
            ExerciseDifficultyRule.is_active == True,
        )
    )
    rule = rule_result.scalar_one_or_none()
    if rule:
        if rule.min_value is not None and value < rule.min_value:
            raise HTTPException(400, f"Минимум для уровня {rule.title}: {rule.min_value} {rule.unit}")
        if rule.max_value is not None and value > rule.max_value:
            raise HTTPException(400, f"Максимум для уровня {rule.title}: {rule.max_value} {rule.unit}")

    return challenge, registration
