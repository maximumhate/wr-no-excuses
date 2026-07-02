import logging
import httpx
from aiogram import Router, types
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup

from bot.config import settings
from bot.services.rules import REPORT_FORMAT_TEXT, RULES_SHORT_HTML

router = Router()
logger = logging.getLogger(__name__)

@router.message(CommandStart())
async def cmd_start(message: Message):
    tg_id = message.from_user.id
    name = message.from_user.first_name or "друг"

    # Check if already registered
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.app_url}/api/users/{tg_id}", timeout=10)
        if resp.status_code == 200:
            await message.answer(
                f"🏆 <b>С возвращением, {name}!</b>\n\n"
                "Ты уже зарегистрирован. Открывай сайт и смотри статистику!",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="📊 Сайт", url=settings.app_url)],
                ])
            )
            return

    text = (
        f"🏆 <b>Привет, {name}!</b>\n\n"
        "Добро пожаловать в <b>WorldRun No Excuses</b> — фитнес-челлендж, "
        "где ты соревнуешься сам с собой и с другими.\n\n"
        "📌 <b>Как это работает:</b>\n"
        "• Каждый день в 00:01 я публикую пост с заданиями\n"
        "• Ты отвечаешь в треде видео/кружком с caption #отчет\n"
        "• Я проверяю отчёт и засчитываю результат\n"
        "• За регулярность — стрики и достижения\n\n"
        f"{RULES_SHORT_HTML}\n\n"
        "👇 Нажми <b>Зарегистрироваться</b>, чтобы начать!"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Зарегистрироваться", callback_data="register")],
        [InlineKeyboardButton(text="📊 Сайт", url=settings.app_url)],
    ])
    await message.answer(text, reply_markup=kb)

@router.callback_query(lambda c: c.data == "register")
async def register_start(callback: types.CallbackQuery):
    tg_id = callback.from_user.id
    name = callback.from_user.first_name or ""
    username = callback.from_user.username or ""

    # Register user via backend API using bot's secret key for auth
    async with httpx.AsyncClient() as client:
        register_data = {
            "telegram_id": tg_id,
            "first_name": callback.from_user.first_name or "",
            "last_name": callback.from_user.last_name or "",
            "username": username,
        }
        resp = await client.post(
            f"{settings.app_url}/api/auth/register",
            json=register_data,
            headers={"X-Bot-Secret": settings.secret_key},
            timeout=10,
        )
        if resp.status_code != 200:
            await callback.message.edit_text(
                "❌ <b>Ошибка регистрации.</b>\n\nПопробуй позже или напиши администратору."
            )
            await callback.answer()
            return

    await callback.message.edit_text(
        "✅ <b>Ты зарегистрирован!</b>\n\n"
        "Теперь ты можешь оставлять отчёты в чате канала.\n\n"
        "📌 <b>Формат отчёта:</b>\n"
        "Отправь видео/кружок с caption:\n"
        f"<pre>{REPORT_FORMAT_TEXT}</pre>\n\n"
        "Для планки можно писать секунды или минуты/секунды."
    )
    await callback.answer()
