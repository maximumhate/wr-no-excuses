import logging
from aiogram import Router, types
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup

from bot.config import settings

router = Router()
logger = logging.getLogger(__name__)

@router.message(CommandStart())
async def cmd_start(message: Message):
    tg_id = message.from_user.id
    name = message.from_user.first_name or "друг"
    # Check if user is registered by calling backend API
    # For now, show registration welcome
    text = (
        f"🏆 <b>Привет, {name}!</b>\n\n"
        "Добро пожаловать в <b>WorldRun No Excuses</b> — фитнес-челлендж, "
        "где ты соревнуешься сам с собой и с другими.\n\n"
        "📌 <b>Как это работает:</b>\n"
        "• Каждый день в 00:01 я публикую пост с заданиями\n"
        "• Ты отвечаешь в треде с хештегом упражнения: #отжимания #приседания #планка\n"
        "• Я проверяю отчёт и засчитываю результат\n"
        "• За регулярность — стрики и достижения\n\n"
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

    # TODO: POST to backend /api/auth/telegram to register user
    await callback.message.edit_text(
        "✅ <b>Ты зарегистрирован!</b>\n\n"
        "Теперь ты можешь оставлять отчёты в чате канала.\n\n"
        "📌 <b>Формат отчёта:</b>\n"
        "Напиши в ответ на пост дня:\n"
        "#отжимания 50\n"
        "#приседания 100\n"
        "#планка 120\n\n"
        "Цифры — количество раз или секунд для планки."
    )
    await callback.answer()
