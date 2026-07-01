import re
import logging
from datetime import date, datetime
from aiogram import Router, types
from aiogram.types import Message
from bot.config import settings
from bot.services.api_client import ApiClient

router = Router()
logger = logging.getLogger(__name__)

EXERCISE_PATTERNS = {
    "pushups": re.compile(r"#отжимания\s+(\d+)", re.IGNORECASE),
    "squats": re.compile(r"#приседания\s+(\d+)", re.IGNORECASE),
    "plank": re.compile(r"#планка\s+(\d+)", re.IGNORECASE),
    "pullups": re.compile(r"#подтягивания\s+(\d+)", re.IGNORECASE),
    "abs": re.compile(r"#пресс\s+(\d+)", re.IGNORECASE),
}

@router.message()
async def handle_report(message: Message):
    if message.chat.type not in ("group", "supergroup"):
        return
    if not message.text:
        return

    text = message.text.strip()
    tg_id = message.from_user.id

    exercises_found = {}
    for ex_type, pattern in EXERCISE_PATTERNS.items():
        match = pattern.search(text)
        if match:
            try:
                value = int(match.group(1))
                if value > 0:
                    exercises_found[ex_type] = value
            except ValueError:
                continue

    if not exercises_found:
        return

    api = ApiClient()
    user_uuid = await api.user_id_from_tg(tg_id)

    if not user_uuid:
        try:
            await message.delete()
        except Exception as e:
            logger.warning(f"Could not delete message: {e}")
        await message.answer(
            f"❌ <b>Вы не зарегистрированы!</b>\n\n"
            f"@{message.from_user.username or message.from_user.first_name}, "
            f"чтобы оставлять отчёты, сначала запустите бота: @wr_no_excuses_reg_bot\n"
            f"Нажмите /start и зарегистрируйтесь.",
        )
        return

    resp = None
    for ex_type, value in exercises_found.items():
        resp = await api.create_report(user_uuid, ex_type, value)

    await api.close()

    try:
        await message.react([types.ReactionTypeEmoji(emoji="🔥")])
    except Exception:
        pass

    parts = []
    emoji_map = {"pushups": "💪", "squats": "🦵", "plank": "🧘", "pullups": "🏋️", "abs": "🔥"}
    labels = {"pushups": "отжимания", "squats": "приседания", "plank": "планка", "pullups": "подтягивания", "abs": "пресс"}
    for ex_type, value in exercises_found.items():
        emoji = emoji_map.get(ex_type, "✅")
        label = labels.get(ex_type, ex_type)
        parts.append(f"{emoji} {label}: <b>{value}</b>")
    confirmation = "\n".join(parts)

    new_ach = resp.get("new_achievements", []) if resp else []
    ach_text = ""
    if new_ach:
        ach_lines = [f"{a['icon']} <b>{a['title']}</b>" for a in new_ach]
        ach_text = "\n\n🏅 <b>Новое достижение!</b>\n" + "\n".join(ach_lines)

    await message.reply(
        f"✅ <b>Отчёт принят!</b>\n\n{confirmation}"
        f"{ach_text}\n\n"
        f"📊 <a href='{settings.app_url}'>Моя статистика</a>"
    )
