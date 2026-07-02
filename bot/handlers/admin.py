import logging
from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import Message

from bot.config import settings
from bot.services.api_client import ApiClient

router = Router()
logger = logging.getLogger(__name__)

def is_admin(user_id: int) -> bool:
    return user_id in settings.admin_ids_list

@router.message(Command("admin"))
async def cmd_admin(message: Message):
    if not is_admin(message.from_user.id):
        await message.answer("❌ У вас нет доступа к админ-панели.")
        return
    text = (
        "🔧 <b>Админ-панель</b>\n\n"
        "Доступные команды:\n"
        "• /broadcast <текст> — рассылка всем пользователям\n"
        "• /stats — общая статистика"
    )
    await message.answer(text)

@router.message(Command("chatid"))
async def cmd_chatid(message: Message):
    if not is_admin(message.from_user.id):
        return
    await message.answer(f"ID этого чата: <code>{message.chat.id}</code>")

@router.message(Command("broadcast"))
async def cmd_broadcast(message: Message):
    if not is_admin(message.from_user.id):
        return
    text = message.text.removeprefix("/broadcast").strip()
    if not text:
        await message.answer("Укажите текст рассылки: /broadcast <текст>")
        return
    api = ApiClient()
    try:
        resp = await api.client.post("/api/admin/broadcast", json={"text": text})
        if resp.status_code == 200:
            data = resp.json()
            await message.answer(f"✅ {data['message']}")
        else:
            await message.answer("❌ Ошибка при создании рассылки")
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        await message.answer("❌ Ошибка при создании рассылки")
    finally:
        await api.close()

@router.message(Command("stats"))
async def cmd_stats(message: Message):
    if not is_admin(message.from_user.id):
        return
    api = ApiClient()
    try:
        resp = await api.client.get("/api/admin/dashboard")
        if resp.status_code == 200:
            data = resp.json()
            text = (
                "📊 <b>Статистика</b>\n\n"
                f"👥 Всего пользователей: <b>{data['total_users']}</b>\n"
                f"✅ Активных сегодня: <b>{data['active_today']}</b>\n"
                f"📝 Всего отчётов: <b>{data['total_reports']}</b>\n"
                f"📊 Отчётов сегодня: <b>{data['today_reports']}</b>"
            )
            await message.answer(text)
        else:
            await message.answer("❌ Ошибка получения статистики")
    except Exception as e:
        logger.error(f"Stats error: {e}")
        await message.answer("❌ Ошибка получения статистики")
    finally:
        await api.close()
