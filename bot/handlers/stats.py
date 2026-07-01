import logging
from datetime import date, timedelta
from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import Message
from bot.services.api_client import ApiClient

router = Router()
logger = logging.getLogger(__name__)

EXERCISE_LABELS = {
    "pushups": "💪 Отжимания",
    "squats": "🦵 Приседания",
    "plank": "🧘 Планка",
    "pullups": "🏋️ Подтягивания",
    "abs": "🔥 Пресс",
}

@router.message(Command("mystats"))
async def cmd_mystats(message: Message):
    tg_id = message.from_user.id
    api = ApiClient()
    user = await api.get_user(tg_id)
    if not user:
        await message.answer("❌ Ты не зарегистрирован. Нажми /start")
        return

    stats = await api.get_user_stats(user["id"])
    await api.close()

    if not stats:
        await message.answer("❌ Не удалось получить статистику")
        return

    lines = [
        "📊 <b>Твоя статистика</b>",
        "",
    ]
    for ex, label in EXERCISE_LABELS.items():
        val = stats.get(f"total_{ex}", 0)
        unit = "сек" if ex == "plank" else "раз"
        lines.append(f"{label}: <b>{val:,}</b> {unit}")

    lines.extend([
        "",
        f"📋 Всего отчётов: <b>{stats['total_reports']}</b>",
        f"🔥 Текущий стрик: <b>{stats['current_streak']}</b> дней",
        f"🏆 Рекорд: <b>{stats['longest_streak']}</b> дней",
    ])

    await message.answer("\n".join(lines))

@router.message(Command("weekly"))
async def cmd_weekly(message: Message):
    api = ApiClient()
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    lb = await api.get_leaderboard(week_start=monday.isoformat(), week_end=sunday.isoformat())
    await api.close()

    if not lb:
        await message.answer("📭 На этой неделе пока нет отчётов")
        return

    lines = [
        f"📅 <b>Неделя {monday.strftime('%d.%m')}–{sunday.strftime('%d.%m')}</b>",
        "",
    ]

    for i, entry in enumerate(lb[:10], 1):
        total = entry["pushups"] + entry["squats"] + entry["plank_seconds"] + entry["pullups"] + entry["abs"]
        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(i, f"{i}.")
        name = entry["name"]
        lines.append(f"{medal} <b>{name}</b> — {total:,} всего")

    await message.answer("\n".join(lines))
