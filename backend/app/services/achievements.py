import logging
from datetime import date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement
from app.models.report import Report, ExerciseType, ReportStatus
from app.models.streak import Streak
from app.models.subscription import Subscription, PlanType

logger = logging.getLogger(__name__)

ACHIEVEMENT_DEFS: list[dict] = [
    {"slug": "first_report", "title": "Первый шаг", "description": "Отправить первый отчёт", "icon": "🎯"},
    {"slug": "streak_7", "title": "Трудоголик", "description": "Достичь стрика в 7 дней", "icon": "🔥"},
    {"slug": "streak_30", "title": "Железный", "description": "Достичь стрика в 30 дней", "icon": "💪"},
    {"slug": "pushups_1000", "title": "Отжимальщик", "description": "Суммарно 1 000 отжиманий", "icon": "🏋️"},
    {"slug": "squats_1000", "title": "Приседатель", "description": "Суммарно 1 000 приседаний", "icon": "🦵"},
    {"slug": "pullups_1000", "title": "Турникмен", "description": "Суммарно 1 000 подтягиваний", "icon": "💪"},
    {"slug": "abs_1000", "title": "Пресс-качок", "description": "Суммарно 1 000 раз пресс", "icon": "🔥"},
    {"slug": "plank_3600", "title": "Планкист", "description": "Суммарно 1 час планки", "icon": "🧘"},
    {"slug": "triple", "title": "Универсал", "description": "Выполнить все 5 упражнений за один день", "icon": "🏆"},
    {"slug": "reports_100", "title": "Чемпион", "description": "100 одобренных отчётов", "icon": "👑"},
    {"slug": "platinum", "title": "Платиновый", "description": "Оформить Platinum подписку", "icon": "💎"},
]

async def seed_achievements(db: AsyncSession):
    for index, adef in enumerate(ACHIEVEMENT_DEFS):
        result = await db.execute(select(Achievement).where(Achievement.slug == adef["slug"]))
        achievement = result.scalar_one_or_none()
        if not achievement:
            db.add(Achievement(**adef, sort_order=index, is_active=True))
    await db.commit()

async def get_achievement_by_slug(slug: str, db: AsyncSession) -> Achievement | None:
    result = await db.execute(select(Achievement).where(Achievement.slug == slug, Achievement.is_active == True))
    return result.scalar_one_or_none()

async def award(user_id, slug, db):
    ach = await get_achievement_by_slug(slug, db)
    if not ach:
        return None
    result = await db.execute(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == ach.id,
        )
    )
    if result.scalar_one_or_none():
        return None
    ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
    db.add(ua)
    await db.commit()
    return ach

async def check_achievements(user_id, db) -> list[Achievement]:
    """Check all achievement criteria and award new ones. Returns newly awarded achievements."""
    new_achievements = []

    totals = await db.execute(
        select(
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pushups, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.squats, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.plank, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.pullups, Report.status == ReportStatus.approved), 0),
            func.coalesce(func.sum(Report.value).filter(Report.exercise_type == ExerciseType.abs, Report.status == ReportStatus.approved), 0),
            func.count(Report.id).filter(Report.status == ReportStatus.approved),
        ).where(Report.user_id == user_id)
    )
    pushup_total, squat_total, plank_total, pullup_total, abs_total, total_reports = totals.one()

    streak_result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = streak_result.scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0

    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = sub_result.scalar_one_or_none()

    checks = [
        ("first_report", lambda: total_reports >= 1),
        ("streak_7", lambda: current_streak >= 7),
        ("streak_30", lambda: current_streak >= 30),
        ("pushups_1000", lambda: pushup_total >= 1000),
        ("squats_1000", lambda: squat_total >= 1000),
        ("pullups_1000", lambda: pullup_total >= 1000),
        ("abs_1000", lambda: abs_total >= 1000),
        ("plank_3600", lambda: plank_total >= 3600),
        ("reports_100", lambda: total_reports >= 100),
        ("platinum", lambda: sub is not None and sub.plan == PlanType.platinum and sub.is_active),
    ]

    for slug, check_fn in checks:
        if check_fn():
            ach = await award(user_id, slug, db)
            if ach:
                new_achievements.append(ach)

    today = date.today()
    today_ex = await db.execute(
        select(Report.exercise_type).where(
            Report.user_id == user_id,
            Report.report_date == today,
            Report.status == ReportStatus.approved,
        ).distinct()
    )
    done_today = {row[0] for row in today_ex.all()}
    if len(done_today) >= 5:
        ach = await award(user_id, "triple", db)
        if ach:
            new_achievements.append(ach)

    return new_achievements
