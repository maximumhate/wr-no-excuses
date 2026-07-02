import hashlib
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.admin_user import AdminUser
from app.config import settings
from app.models.cms import BotText, SubscriptionTariff
from app.models.difficulty import ExerciseDifficultyRule
from app.services.challenges import ensure_current_challenge

logger = logging.getLogger(__name__)


async def seed_admin(db: AsyncSession):
    result = await db.execute(select(AdminUser).where(AdminUser.username == "worldrunadmin"))
    if result.scalar_one_or_none():
        return
    password_hash = hashlib.sha256("0829149aA!!!!".encode()).hexdigest()
    admin = AdminUser(username="worldrunadmin", password_hash=password_hash)
    db.add(admin)
    await db.commit()
    logger.info("Admin user 'worldrunadmin' seeded")


DEFAULT_TARIFFS = [
    {
        "plan": "basic",
        "name": "Basic",
        "price": 0,
        "period": "мес",
        "features": ["Ежедневные отчёты", "Базовая статистика", "Стрики"],
        "accent": "slate",
        "sort_order": 0,
    },
    {
        "plan": "silver",
        "name": "Silver",
        "price": 199,
        "period": "мес",
        "features": ["Всё из Basic", "Расширенная статистика", "Цветовое выделение", "Своя аватарка"],
        "accent": "silver",
        "sort_order": 1,
    },
    {
        "plan": "gold",
        "name": "Gold",
        "price": 399,
        "period": "мес",
        "features": ["Всё из Silver", "Лидерборд", "Приоритетная проверка", "Экспорт данных"],
        "accent": "gold",
        "sort_order": 2,
    },
    {
        "plan": "platinum",
        "name": "Platinum",
        "price": 699,
        "period": "мес",
        "features": ["Всё из Gold", "Личный тренер", "VIP-поддержка", "Эксклюзивные челленджи"],
        "accent": "platinum",
        "sort_order": 3,
    },
]

DEFAULT_DIFFICULTIES = [
    ("plank", "novice", "Новичок", "0-30 секунд", None, 30, "сек", 0),
    ("plank", "amateur", "Любитель", "30 секунд - 3 минуты", 31, 180, "сек", 1),
    ("plank", "pro", "Профи", "3 минуты+", 181, None, "сек", 2),
    ("pushups", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("pushups", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("pushups", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("squats", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("squats", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("squats", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("abs", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("abs", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("abs", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("pullups", "novice", "Новичок", "0-5 раз", None, 5, "раз", 0),
    ("pullups", "amateur", "Любитель", "5-15 раз", 6, 15, "раз", 1),
    ("pullups", "pro", "Профи", "15+ раз", 16, None, "раз", 2),
]

DEFAULT_BOT_TEXTS = [
    {
        "key": "daily_post",
        "title": "Ежедневный пост",
        "category": "daily",
        "text": "🌅 <b>Доброе утро, чемпионы!</b>\n\nВ этот тред можно отправлять только отчёты. Любой другой текст будет удалён.\n\n<b>Обязательно:</b> видео или кружок + caption в этом же сообщении.\n\n<pre>{report_format}</pre>\n\n{rules_short}",
    },
    {
        "key": "challenge_announcement",
        "title": "Анонс новой недели",
        "category": "weekly",
        "text": "🏁 <b>Стартует челлендж №{number}</b>\n\nДаты: <b>{starts_on}</b> — <b>{ends_on}</b>.\n\nВыбирай упражнения и уровень в /start. Топ недели: /weekly",
    },
    {
        "key": "evening_reminder",
        "title": "Вечернее напоминание",
        "category": "reminders",
        "text": "⏰ <b>Не забудь оставить отчёт!</b>\n\nСегодняшний пост уже в канале. Напиши отчёт в тред с хештегом упражнения.",
    },
    {
        "key": "streak_warning",
        "title": "Предупреждение о стрике",
        "category": "reminders",
        "text": "⚠️ <b>Стрик сгорит через {days} день!</b>\n\nОставь отчёт сегодня, чтобы сохранить прогресс!",
    },
    {
        "key": "registration_success",
        "title": "Успешная регистрация",
        "category": "registration",
        "text": "✅ <b>Ты зарегистрирован на челлендж №{number}!</b>\n\nУпражнения: {exercises}\n\nУровень сложности нельзя менять чаще одного раза в 3 месяца.",
    },
]


async def seed_default_content(db: AsyncSession):
    await ensure_current_challenge(db)

    for item in DEFAULT_TARIFFS:
        result = await db.execute(select(SubscriptionTariff).where(SubscriptionTariff.plan == item["plan"]))
        if not result.scalar_one_or_none():
            db.add(SubscriptionTariff(
                plan=item["plan"],
                name=item["name"],
                price=item["price"],
                period=item["period"],
                features=json.dumps(item["features"], ensure_ascii=False),
                accent=item["accent"],
                sort_order=item["sort_order"],
            ))

    for exercise_type, difficulty, title, description, min_value, max_value, unit, sort_order in DEFAULT_DIFFICULTIES:
        result = await db.execute(
            select(ExerciseDifficultyRule).where(
                ExerciseDifficultyRule.exercise_type == exercise_type,
                ExerciseDifficultyRule.difficulty == difficulty,
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            db.add(ExerciseDifficultyRule(
                exercise_type=exercise_type,
                difficulty=difficulty,
                title=title,
                description=description,
                min_value=min_value,
                max_value=max_value,
                unit=unit,
                sort_order=sort_order,
                is_active=True,
            ))
        else:
            rule.title = title
            rule.description = description
            rule.min_value = min_value
            rule.max_value = max_value
            rule.unit = unit
            rule.sort_order = sort_order
            rule.is_active = True

    for item in DEFAULT_BOT_TEXTS:
        result = await db.execute(select(BotText).where(BotText.key == item["key"]))
        if not result.scalar_one_or_none():
            db.add(BotText(**item))

    await db.commit()
