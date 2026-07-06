import logging
import re
import asyncio

from aiogram import Router, types
from aiogram.types import Message

from bot.config import settings
from bot.services.api_client import ApiClient

router = Router()
logger = logging.getLogger(__name__)

REPORT_TAG_RE = re.compile(r"(?:^|\s)#отч[её]т\b", re.IGNORECASE)

EXERCISES = {
    "pushups": {
        "label": "отжимания",
        "aliases": ("отжимания", "отжиманий", "отжимание"),
        "emoji": "💪",
        "unit": "раз",
    },
    "squats": {
        "label": "приседания",
        "aliases": ("приседания", "приседаний", "приседание"),
        "emoji": "🦵",
        "unit": "раз",
    },
    "plank": {
        "label": "планка",
        "aliases": ("планка", "планку"),
        "emoji": "🧘",
        "unit": "сек",
    },
    "pullups": {
        "label": "подтягивания",
        "aliases": ("подтягивания", "подтягиваний", "подтягивание"),
        "emoji": "🏋️",
        "unit": "раз",
    },
    "abs": {
        "label": "пресс",
        "aliases": ("пресс", "скручивания", "скручиваний"),
        "emoji": "🔥",
        "unit": "раз",
    },
}


async def safe_delete(message: Message) -> None:
    try:
        await message.delete()
    except Exception as e:
        logger.warning(f"Could not delete message {message.message_id}: {e}")


async def warn_and_delete(message: Message, reason: str) -> None:
    logger.info(f"Handling invalid report message {message.message_id}: {reason}")
    
    # 1. Prepare tag
    user_tag = "Участник"
    if message.from_user:
        if message.from_user.username:
            user_tag = f"@{message.from_user.username}"
        else:
            user_tag = f'<a href="tg://user?id={message.from_user.id}">{message.from_user.first_name}</a>'
            
    # 2. Format explanation
    formatted_reason = reason[0].upper() + reason[1:]
    warning_text = f"⚠️ {user_tag}, сообщение не принято: <b>{formatted_reason}</b>."
    
    # If the user is not registered, highlight starting the bot
    if "зарегистрирован" in reason.lower():
        warning_text = f"⚠️ {user_tag}, вы не зарегистрированы!\n👉 Сначала перейдите в бот @wr_no_excuses_reg_bot и нажмите /start."

    # 3. Send the warning to the chat/thread
    warning_msg = None
    try:
        thread_id = getattr(message, "message_thread_id", None)
        warning_msg = await message.bot.send_message(
            chat_id=message.chat.id,
            text=warning_text,
            parse_mode="HTML",
            message_thread_id=thread_id
        )
    except Exception as e:
        logger.warning(f"Could not send warning message: {e}")
        
    # 4. Delete the invalid user message
    await safe_delete(message)
    
    # 5. Wait for 60 seconds and delete the warning message (to avoid spam)
    if warning_msg:
        async def delete_warning_later(msg_to_delete):
            await asyncio.sleep(60)
            try:
                await msg_to_delete.delete()
                logger.info(f"Deleted warning message {msg_to_delete.message_id} after timeout")
            except Exception as e:
                logger.warning(f"Could not delete warning message {msg_to_delete.message_id}: {e}")
        
        asyncio.create_task(delete_warning_later(warning_msg))


def parse_duration_seconds(value_text: str) -> int | None:
    text = value_text.lower().replace(",", " ")

    colon_match = re.search(r"\b(\d{1,2})\s*[:.]\s*(\d{1,2})\b", text)
    if colon_match:
        return int(colon_match.group(1)) * 60 + int(colon_match.group(2))

    minutes = 0
    seconds = 0
    minute_match = re.search(r"(\d+)\s*(?:мин|минута|минуты|минут)", text)
    second_match = re.search(r"(\d+)\s*(?:сек|секунда|секунды|секунд)", text)
    if minute_match:
        minutes = int(minute_match.group(1))
    if second_match:
        seconds = int(second_match.group(1))
    if minutes or seconds:
        return minutes * 60 + seconds

    plain_number = re.search(r"\b(\d+)\b", text)
    if plain_number:
        return int(plain_number.group(1))
    return None


def parse_report(text: str) -> dict[str, int]:
    if not REPORT_TAG_RE.search(text):
        return {}

    found: dict[str, int] = {}
    for ex_type, meta in EXERCISES.items():
        alias_pattern = "|".join(re.escape(alias) for alias in meta["aliases"])
        match = re.search(
            rf"(?:#(?:{alias_pattern})\b|\b(?:{alias_pattern})\b)\s*(?::|-|—)?\s*([^\n#;]+)",
            text,
            re.IGNORECASE,
        )
        if not match:
            continue

        raw_value = match.group(1)
        if ex_type == "plank":
            value = parse_duration_seconds(raw_value)
        else:
            number_match = re.search(r"\b(\d+)\b", raw_value)
            value = int(number_match.group(1)) if number_match else None

        if value and value > 0:
            found[ex_type] = value

    return found


def has_required_video(message: Message) -> bool:
    return bool(message.video or message.video_note)


@router.message()
async def handle_report(message: Message):
    if message.chat.type not in ("group", "supergroup"):
        return
    if message.is_automatic_forward or (message.from_user and message.from_user.id == 777000):
        return
    if message.from_user and message.from_user.is_bot:
        return

    group_id = settings.group_id_int
    if group_id and message.chat.id != group_id:
        logger.info(f"Ignoring message from chat {message.chat.id}; expected {group_id}")
        return

    content = (message.caption or message.text or "").strip()
    if not REPORT_TAG_RE.search(content):
        await warn_and_delete(message, "это не отчёт")
        return

    if not has_required_video(message):
        await warn_and_delete(message, "отчёт должен быть видео или кружком")
        return

    if not message.caption:
        await warn_and_delete(message, "формат должен быть именно caption к видео/кружку")
        return

    exercises_found = parse_report(message.caption)
    if not exercises_found:
        await warn_and_delete(message, "отчёт не соответствует форме")
        return

    if not message.from_user:
        await warn_and_delete(message, "не могу определить автора отчёта")
        return

    api = ApiClient()
    try:
        user_uuid = await api.user_id_from_tg(message.from_user.id)

        if not user_uuid:
            await warn_and_delete(
                message,
                "вы не зарегистрированы. Сначала запустите @wr_no_excuses_reg_bot и нажмите /start",
            )
            return

        thread_message_id = getattr(message, "message_thread_id", None)
        responses = []
        for ex_type, value in exercises_found.items():
            resp = await api.create_report(
                user_uuid,
                ex_type,
                value,
                telegram_chat_id=message.chat.id,
                telegram_message_id=message.message_id,
                thread_message_id=thread_message_id,
            )
            if not resp:
                logger.warning(f"Could not save report message {message.message_id}: {api.last_error}")
                return
            responses.append(resp)
    finally:
        await api.close()

    try:
        await message.react([types.ReactionTypeEmoji(emoji="🔥")])
    except Exception:
        pass

    achievements = {}
    for resp in responses:
        for ach in resp.get("new_achievements", []) or []:
            achievements[ach["slug"]] = ach
    if achievements:
        logger.info(f"New achievements for message {message.message_id}: {', '.join(achievements)}")
