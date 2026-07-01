import logging
from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from bot.config import settings

logger = logging.getLogger(__name__)

async def send_daily_post(bot: Bot):
    """Post daily workout challenge to the channel."""
    text = (
        "🌅 <b>Доброе утро, чемпионы!</b>\n\n"
        "Сегодняшние задания:\n"
        "💪 #отжимания — сколько сможешь\n"
        "🦵 #приседания — количество\n"
        "🧘 #планка — время в секундах\n\n"
        "👇 Отвечай в этом треде с хештегом и числом"
    )
    try:
        msg = await bot.send_message(
            chat_id=settings.channel_id,
            text=text,
        )
        logger.info(f"Daily post sent, message_id={msg.message_id}")
        return msg
    except Exception as e:
        logger.error(f"Failed to send daily post: {e}")
        return None

async def send_reminder(bot: Bot, user_id: int):
    """Send reminder to a user who hasn't reported today."""
    try:
        await bot.send_message(
            chat_id=user_id,
            text="⏰ <b>Не забудь оставить отчёт!</b>\n\n"
                 "Сегодняшний пост уже в канале. "
                 "Напиши в тред с хештегом упражнения.",
        )
    except Exception as e:
        logger.warning(f"Failed to send reminder to {user_id}: {e}")

async def send_streak_warning(bot: Bot, user_id: int, days: int):
    """Warn user that streak is about to expire."""
    try:
        await bot.send_message(
            chat_id=user_id,
            text=f"⚠️ <b>Стрик сгорит через {days} день!</b>\n\n"
                 "Оставь отчёт сегодня, чтобы сохранить прогресс!",
        )
    except Exception as e:
        logger.warning(f"Failed to send streak warning to {user_id}: {e}")
