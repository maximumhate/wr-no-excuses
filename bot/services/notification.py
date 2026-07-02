import logging
from aiogram import Bot
from bot.config import settings
from bot.services.rules import REPORT_FORMAT_HTML, RULES_SHORT_HTML
from bot.services.api_client import ApiClient

logger = logging.getLogger(__name__)

async def send_daily_post(bot: Bot):
    """Post daily workout challenge to the channel."""
    api = ApiClient()
    try:
        template = await api.get_bot_text("daily_post")
    finally:
        await api.close()
    text = (template or (
        "🌅 <b>Доброе утро, чемпионы!</b>\n\n"
        "В этот тред можно отправлять только отчёты. Любой другой текст будет удалён.\n\n"
        "<b>Обязательно:</b> видео или кружок + caption в этом же сообщении.\n\n"
        f"<pre>{REPORT_FORMAT_HTML}</pre>\n\n"
        f"{RULES_SHORT_HTML}"
    )).format(report_format=REPORT_FORMAT_HTML, rules_short=RULES_SHORT_HTML)
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
        api = ApiClient()
        try:
            text = await api.get_bot_text("evening_reminder")
        finally:
            await api.close()
        await bot.send_message(
            chat_id=user_id,
            text=text or "⏰ <b>Не забудь оставить отчёт!</b>\n\nСегодняшний пост уже в канале. Напиши отчёт в тред.",
        )
    except Exception as e:
        logger.warning(f"Failed to send reminder to {user_id}: {e}")

async def send_streak_warning(bot: Bot, user_id: int, days: int):
    """Warn user that streak is about to expire."""
    try:
        api = ApiClient()
        try:
            template = await api.get_bot_text("streak_warning")
        finally:
            await api.close()
        await bot.send_message(
            chat_id=user_id,
            text=(template or "⚠️ <b>Стрик сгорит через {days} день!</b>\n\nОставь отчёт сегодня, чтобы сохранить прогресс!").format(days=days),
        )
    except Exception as e:
        logger.warning(f"Failed to send streak warning to {user_id}: {e}")


async def send_weekly_challenge_announcement(bot: Bot):
    api = ApiClient()
    try:
        announcement = await api.get_current_announcement()
        if not announcement or not announcement.get("should_send"):
            return None
        challenge = announcement["challenge"]
        template = await api.get_bot_text("challenge_announcement")
        text = (template or "🏁 <b>Стартует челлендж №{number}</b>\n\nДаты: <b>{starts_on}</b> — <b>{ends_on}</b>").format(
            number=challenge["number"],
            starts_on=challenge["starts_on"],
            ends_on=challenge["ends_on"],
        )
        msg = await bot.send_message(chat_id=settings.channel_id, text=text)
        await api.mark_current_announcement_sent()
        logger.info(f"Weekly challenge announcement sent, message_id={msg.message_id}")
        return msg
    except Exception as e:
        logger.error(f"Failed to send weekly announcement: {e}")
        return None
    finally:
        await api.close()
