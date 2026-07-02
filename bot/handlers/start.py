import logging
from html import escape

from aiogram import Router, types
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from bot.services.api_client import ApiClient
from bot.services.rules import REPORT_FORMAT_TEXT

router = Router()
logger = logging.getLogger(__name__)


class Registration(StatesGroup):
    name = State()
    city = State()
    exercises = State()
    difficulty = State()


def challenge_dates(challenge: dict) -> str:
    return f"{challenge['starts_on']} — {challenge['ends_on']}"


def difficulty_title(catalog: list[dict], exercise_type: str, difficulty: str) -> str:
    for exercise in catalog:
        if exercise["type"] != exercise_type:
            continue
        for item in exercise.get("difficulties", []):
            if item["difficulty"] == difficulty:
                return item.get("title") or difficulty
    return difficulty


def exercise_label(catalog: list[dict], exercise_type: str) -> str:
    for exercise in catalog:
        if exercise["type"] == exercise_type:
            return exercise.get("label") or exercise_type
    return exercise_type


def profile_text(profile: dict) -> str:
    user = profile["user"]
    challenge = profile["challenge"]
    registration = profile.get("registration")
    sub = profile.get("subscription") or {"plan": "basic"}
    lines = [
        f"🏆 <b>Профиль</b>",
        "",
        f"Имя: <b>{escape(registration['name'] if registration else user.get('first_name') or '—')}</b>",
        f"Город: <b>{escape(registration['city'] if registration else user.get('city') or '—')}</b>",
        f"TG ID: <code>{user['telegram_id']}</code>",
        f"Тариф: <b>{escape(sub.get('plan') or 'basic')}</b>",
        "",
        f"Текущий челлендж: <b>№{challenge['number']}</b>",
        f"Даты: <b>{challenge_dates(challenge)}</b>",
    ]
    if registration:
        lines.append("")
        lines.append("Упражнения:")
        for item in registration["exercises"]:
            lines.append(f"• {escape(item['label'])}: <b>{escape(item['difficulty'])}</b>")
        lines.extend(["", "Команды: /mystats, /weekly, /subscription"])
    else:
        lines.extend(["", "Ты ещё не зарегистрирован на текущий челлендж. Нажми /start."])
    return "\n".join(lines)


async def load_profile(telegram_id: int) -> dict | None:
    api = ApiClient()
    try:
        return await api.get_profile(telegram_id)
    finally:
        await api.close()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    profile = await load_profile(message.from_user.id)
    if profile and profile.get("registration"):
        await message.answer(profile_text(profile))
        return

    if profile:
        challenge = profile["challenge"]
    else:
        api = ApiClient()
        try:
            current = await api.client.get("/api/challenges/current")
            challenge = current.json() if current.status_code == 200 else {"number": 1, "starts_on": "—", "ends_on": "—"}
        finally:
            await api.close()

    text = (
        f"🏁 <b>Челлендж №{challenge['number']}</b>\n"
        f"Даты: <b>{challenge_dates(challenge)}</b>\n\n"
        "Регистрация займёт минуту: имя, город, упражнения и уровни сложности.\n"
        "Уровень нельзя менять чаще одного раза в 3 месяца."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Зарегистрироваться", callback_data="reg:start")],
    ])
    await message.answer(text, reply_markup=kb)


@router.message(Command("profile"))
async def cmd_profile(message: Message):
    profile = await load_profile(message.from_user.id)
    if not profile:
        await message.answer("Ты ещё не зарегистрирован. Нажми /start")
        return
    await message.answer(profile_text(profile))


@router.callback_query(lambda c: c.data == "reg:start")
async def register_start(callback: types.CallbackQuery, state: FSMContext):
    profile = await load_profile(callback.from_user.id)
    if profile and profile.get("registration"):
        await callback.message.edit_text("Ты уже зарегистрирован на текущий челлендж.\n\n" + profile_text(profile))
        await callback.answer()
        return
    await state.set_state(Registration.name)
    await state.update_data(selected=[], difficulties={})
    await callback.message.edit_text("Как тебя записать в таблицу? Напиши имя.")
    await callback.answer()


@router.message(Registration.name)
async def registration_name(message: Message, state: FSMContext):
    name = (message.text or "").strip()
    if len(name) < 2:
        await message.answer("Имя слишком короткое. Напиши ещё раз.")
        return
    await state.update_data(name=name)
    await state.set_state(Registration.city)
    await message.answer("Из какого ты города?")


@router.message(Registration.city)
async def registration_city(message: Message, state: FSMContext):
    city = (message.text or "").strip()
    if len(city) < 2:
        await message.answer("Город слишком короткий. Напиши ещё раз.")
        return
    api = ApiClient()
    try:
        catalog = await api.get_exercises()
    finally:
        await api.close()
    await state.update_data(city=city, catalog=catalog, selected=[])
    await state.set_state(Registration.exercises)
    await message.answer("Выбери одно или несколько упражнений:", reply_markup=exercise_keyboard(catalog, []))


def exercise_keyboard(catalog: list[dict], selected: list[str]) -> InlineKeyboardMarkup:
    rows = []
    for exercise in catalog:
        checked = "✅" if exercise["type"] in selected else "▫️"
        rows.append([InlineKeyboardButton(text=f"{checked} {exercise['label']}", callback_data=f"reg:ex:{exercise['type']}")])
    rows.append([InlineKeyboardButton(text="Дальше", callback_data="reg:done")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


@router.callback_query(Registration.exercises, lambda c: c.data and c.data.startswith("reg:ex:"))
async def toggle_exercise(callback: types.CallbackQuery, state: FSMContext):
    exercise_type = callback.data.split(":")[-1]
    data = await state.get_data()
    selected = list(data.get("selected", []))
    if exercise_type in selected:
        selected.remove(exercise_type)
    else:
        selected.append(exercise_type)
    await state.update_data(selected=selected)
    await callback.message.edit_reply_markup(reply_markup=exercise_keyboard(data.get("catalog", []), selected))
    await callback.answer()


@router.callback_query(Registration.exercises, lambda c: c.data == "reg:done")
async def exercises_done(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    selected = data.get("selected", [])
    if not selected:
        await callback.answer("Выбери хотя бы одно упражнение", show_alert=True)
        return
    await state.update_data(difficulty_index=0, difficulties={})
    await state.set_state(Registration.difficulty)
    await ask_difficulty(callback.message, state)
    await callback.answer()


async def ask_difficulty(message: Message, state: FSMContext):
    data = await state.get_data()
    catalog = data.get("catalog", [])
    selected = data.get("selected", [])
    index = data.get("difficulty_index", 0)
    exercise_type = selected[index]
    exercise = next(item for item in catalog if item["type"] == exercise_type)
    rows = []
    for rule in exercise.get("difficulties", []):
        suffix = f" — {rule['description']}" if rule.get("description") else ""
        rows.append([InlineKeyboardButton(text=f"{rule['title']}{suffix}", callback_data=f"reg:diff:{rule['difficulty']}")])
    await message.edit_text(
        f"Уровень для упражнения <b>{exercise['label']}</b>\n\n"
        "Напоминание: менять уровень можно не чаще одного раза в 3 месяца.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=rows),
    )


@router.callback_query(Registration.difficulty, lambda c: c.data and c.data.startswith("reg:diff:"))
async def choose_difficulty(callback: types.CallbackQuery, state: FSMContext):
    difficulty = callback.data.split(":")[-1]
    data = await state.get_data()
    selected = data.get("selected", [])
    index = data.get("difficulty_index", 0)
    exercise_type = selected[index]
    difficulties = dict(data.get("difficulties", {}))
    difficulties[exercise_type] = difficulty
    index += 1
    await state.update_data(difficulties=difficulties, difficulty_index=index)
    if index < len(selected):
        await ask_difficulty(callback.message, state)
        await callback.answer()
        return

    await finish_registration(callback, state)


async def finish_registration(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    catalog = data.get("catalog", [])
    difficulties = data.get("difficulties", {})
    payload = {
        "telegram_id": callback.from_user.id,
        "username": callback.from_user.username or "",
        "first_name": callback.from_user.first_name or "",
        "last_name": callback.from_user.last_name or "",
        "name": data["name"],
        "city": data["city"],
        "exercises": [
            {"exercise_type": exercise_type, "difficulty": difficulty}
            for exercise_type, difficulty in difficulties.items()
        ],
    }
    api = ApiClient()
    try:
        result, error = await api.register_current_challenge(payload)
    finally:
        await api.close()

    if not result:
        if isinstance(error, dict):
            message = error.get("message") or str(error)
        else:
            message = str(error or "Ошибка регистрации")
        await callback.message.edit_text(f"❌ {escape(message)}")
        await state.clear()
        await callback.answer()
        return

    challenge = result["challenge"]
    lines = [
        f"✅ <b>Ты зарегистрирован на челлендж №{challenge['number']}!</b>",
        f"Даты: <b>{challenge_dates(challenge)}</b>",
        "",
        "Упражнения:",
    ]
    for exercise_type, difficulty in difficulties.items():
        lines.append(f"• {escape(exercise_label(catalog, exercise_type))}: <b>{escape(difficulty_title(catalog, exercise_type, difficulty))}</b>")
    lines.extend([
        "",
        "Формат отчёта:",
        f"<pre>{REPORT_FORMAT_TEXT}</pre>",
        "",
        "Статистика: /mystats, топ: /weekly",
    ])
    await callback.message.edit_text("\n".join(lines))
    await state.clear()
    await callback.answer()
