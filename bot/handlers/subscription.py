import logging
from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup

from bot.config import settings

router = Router()
logger = logging.getLogger(__name__)

PLANS = {
    "basic": {"name": "Basic", "price": "0 ₽", "color": "⚪"},
    "silver": {"name": "Silver", "price": "199 ₽/мес", "color": "🥈"},
    "gold": {"name": "Gold", "price": "399 ₽/мес", "color": "🥇"},
    "platinum": {"name": "Platinum", "price": "699 ₽/мес", "color": "💎"},
}

@router.message(Command("subscription"))
async def cmd_subscription(message: Message):
    text = "<b>💎 Подписки WorldRun</b>\n\n"
    for key, plan in PLANS.items():
        text += f"{plan['color']} <b>{plan['name']}</b> — {plan['price']}\n"
    text += "\nВыбери уровень в личном кабинете на сайте:"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Открыть сайт", url=settings.app_url)],
    ])
    await message.answer(text, reply_markup=kb)
