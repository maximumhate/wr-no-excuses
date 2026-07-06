import asyncio
import logging
from datetime import datetime, time, timedelta, timezone
from aiogram import Bot
from bot.config import settings
from bot.services.api_client import ApiClient

logger = logging.getLogger(__name__)

def next_at(target_time: time) -> float:
    now = datetime.now(timezone.utc)
    target = datetime.combine(now.date(), target_time, tzinfo=timezone.utc)
    if target <= now:
        target += timedelta(days=1)
    return (target - now).total_seconds()

async def daily_post(bot: Bot):
    """Post daily workout challenge to the channel at 00:01 MSK."""
    from bot.services.notification import send_daily_post
    await send_daily_post(bot)


async def weekly_challenge_announcement(bot: Bot):
    from bot.services.notification import send_weekly_challenge_announcement
    await send_weekly_challenge_announcement(bot)

async def evening_reminder(bot: Bot):
    """Send reminders at 20:00 MSK to users who haven't reported today."""
    from bot.services.notification import send_reminder, send_streak_warning
    api = ApiClient()
    try:
        data = await api.get_pending_reminders()
        if not data:
            return
        
        reminders = data.get("reminders", [])
        streak_warnings = data.get("streak_warnings", [])
        
        logger.info(f"Sending {len(reminders)} regular reminders and {len(streak_warnings)} streak warnings")
        
        # 1. Send streak warnings
        for sw in streak_warnings:
            tg_id = sw.get("telegram_id")
            days = sw.get("days", 1)
            if tg_id:
                await send_streak_warning(bot, tg_id, days)
                await asyncio.sleep(0.05)

        # 2. Send regular reminders
        for rem in reminders:
            tg_id = rem.get("telegram_id")
            if tg_id:
                await send_reminder(bot, tg_id)
                await asyncio.sleep(0.05)
                
    except Exception as e:
        logger.error(f"Evening reminders failed: {e}")
    finally:
        await api.close()

async def process_pending_broadcasts(bot: Bot):
    """Poll backend for pending broadcasts and send them."""
    api = ApiClient()
    try:
        broadcasts = await api.get_pending_broadcasts()
        for b in broadcasts:
            b_id = b["id"]
            text = b["text"]
            total = b["total_users"]
            logger.info(f"Processing broadcast {b_id} to {total} users")

            users = await api.get_all_users()
            sent = 0
            for user in users:
                tg_id = user.get("telegram_id")
                if not tg_id:
                    continue
                try:
                    await bot.send_message(chat_id=tg_id, text=text)
                    sent += 1
                except Exception as e:
                    logger.warning(f"Failed to send to {tg_id}: {e}")

            await api.complete_broadcast(b_id, sent)
            logger.info(f"Broadcast {b_id} done: {sent}/{total} sent")
    except Exception as e:
        logger.error(f"Broadcast polling failed: {e}")
    finally:
        await api.close()

async def run_daily_post_scheduler(bot: Bot):
    post_time = time(21, 1)  # 00:01 MSK = 21:01 UTC
    while True:
        delay = next_at(post_time)
        logger.info(f"Next daily post in {delay:.0f}s")
        await asyncio.sleep(delay)
        try:
            await daily_post(bot)
        except Exception as e:
            logger.error(f"Daily post failed: {e}")


async def run_reminder_scheduler(bot: Bot):
    reminder_time = time(17, 0)  # 20:00 MSK = 17:00 UTC
    while True:
        delay = next_at(reminder_time)
        logger.info(f"Next evening reminder in {delay:.0f}s")
        await asyncio.sleep(delay)
        try:
            await evening_reminder(bot)
        except Exception as e:
            logger.error(f"Reminder failed: {e}")


async def run_scheduler(bot: Bot):
    asyncio.create_task(run_daily_post_scheduler(bot))
    asyncio.create_task(run_reminder_scheduler(bot))

async def run_broadcast_scheduler(bot: Bot):
    while True:
        try:
            await process_pending_broadcasts(bot)
        except Exception as e:
            logger.error(f"Broadcast check failed: {e}")
        await asyncio.sleep(30)


async def run_challenge_scheduler(bot: Bot):
    while True:
        try:
            await weekly_challenge_announcement(bot)
        except Exception as e:
            logger.error(f"Weekly challenge check failed: {e}")
        await asyncio.sleep(3600)
