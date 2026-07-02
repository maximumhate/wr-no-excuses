import logging

from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from bot.services.api_client import ApiClient

router = Router()
logger = logging.getLogger(__name__)


def price_text(tariff: dict) -> str:
    if tariff["price"] <= 0:
        return "0 ₽"
    return f"{tariff['price']} ₽/{tariff.get('period') or 'мес'}"


@router.message(Command("subscription"))
async def cmd_subscription(message: Message):
    api = ApiClient()
    try:
        tariffs = await api.get_tariffs()
        current = await api.get_subscription(message.from_user.id)
    finally:
        await api.close()

    current_plan = (current or {}).get("plan", "basic")
    lines = ["💎 <b>Подписка</b>", "", f"Текущий тариф: <b>{current_plan}</b>", ""]
    rows = []
    for tariff in tariffs:
        lines.append(f"<b>{tariff['name']}</b> — {price_text(tariff)}")
        for feature in tariff.get("features", []):
            lines.append(f"• {feature}")
        lines.append("")
        if tariff["plan"] != "basic" and tariff["plan"] != current_plan:
            rows.append([InlineKeyboardButton(text=f"Оплатить {tariff['name']} — {price_text(tariff)}", callback_data=f"pay:{tariff['plan']}")])

    await message.answer("\n".join(lines), reply_markup=InlineKeyboardMarkup(inline_keyboard=rows) if rows else None)


@router.callback_query(lambda c: c.data and c.data.startswith("pay:"))
async def pay_subscription(callback: types.CallbackQuery):
    plan = callback.data.split(":", 1)[1]
    api = ApiClient()
    try:
        payment = await api.create_payment(callback.from_user.id, plan)
    finally:
        await api.close()
    if not payment:
        await callback.answer("Не удалось создать платёж", show_alert=True)
        return
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Перейти к оплате", url=payment["confirmation_url"])],
    ])
    await callback.message.answer("Ссылка на оплату готова.", reply_markup=kb)
    await callback.answer()
