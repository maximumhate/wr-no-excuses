import logging
from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import Message

from bot.config import settings

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

@router.message(Command("broadcast"))
async def cmd_broadcast(message: Message):
    if not is_admin(message.from_user.id):
        return
    text = message.text.removeprefix("/broadcast").strip()
    if not text:
        await message.answer("Укажите текст рассылки: /broadcast <текст>")
        return
    # TODO: implement actual broadcast via backend API
    await message.answer(f"✅ Рассылка отправлена:\n\n{text}")

@router.message(Command("stats"))
async def cmd_stats(message: Message):
    if not is_admin(message.from_user.id):
        return
    # TODO: fetch stats from backend API
    await message.answer("📊 Статистика будет доступна после подключения к API.")
