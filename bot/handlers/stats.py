import logging

from aiogram import Router
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
    api = ApiClient()
    try:
        stats = await api.get_current_stats(message.from_user.id)
    finally:
        await api.close()

    if not stats:
        await message.answer("Ты не зарегистрирован на текущий челлендж. Нажми /start")
        return

    challenge = stats["challenge"]
    lines = [
        f"📊 <b>Челлендж №{challenge['number']}</b>",
        f"Даты: <b>{challenge['starts_on']} — {challenge['ends_on']}</b>",
        "",
    ]
    registration = stats.get("registration") or {}
    if registration.get("exercises"):
        lines.append("Твои упражнения:")
        for item in registration["exercises"]:
            lines.append(f"• {item['label']}: <b>{item['difficulty']}</b>")
        lines.append("")

    totals = stats.get("totals") or {}
    for key, label in EXERCISE_LABELS.items():
        item = totals.get(key)
        if not item:
            continue
        unit = "сек" if key == "plank" else "раз"
        lines.append(f"{label}: <b>{item['total']:,}</b> {unit} ({item['reports']} отч.)")

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
    try:
        lb = await api.get_leaderboard(current_challenge=True, limit=10)
        announcement = await api.get_current_announcement()
    finally:
        await api.close()

    challenge = (announcement or {}).get("challenge") or {"number": "?", "starts_on": "—", "ends_on": "—"}
    if not lb:
        await message.answer(f"📭 В челлендже №{challenge['number']} пока нет отчётов")
        return

    lines = [
        f"🏁 <b>Топ-10 челленджа №{challenge['number']}</b>",
        f"{challenge['starts_on']} — {challenge['ends_on']}",
        "",
    ]
    for i, entry in enumerate(lb[:10], 1):
        total = entry["pushups"] + entry["squats"] + entry["plank_seconds"] + entry["pullups"] + entry["abs"]
        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(i, f"{i}.")
        lines.append(f"{medal} <b>{entry['name']}</b> — {total:,}")

    await message.answer("\n".join(lines))
