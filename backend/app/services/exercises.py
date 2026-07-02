EXERCISES = [
    {"type": "pushups", "label": "Отжимания", "unit": "раз", "short": "Отж."},
    {"type": "squats", "label": "Приседания", "unit": "раз", "short": "Прис."},
    {"type": "plank", "label": "Планка", "unit": "сек", "short": "План."},
    {"type": "pullups", "label": "Подтягивания", "unit": "раз", "short": "Подт."},
    {"type": "abs", "label": "Пресс", "unit": "раз", "short": "Пресс"},
]

EXERCISE_TYPES = {item["type"] for item in EXERCISES}


def get_exercise_label(exercise_type: str) -> str:
    return next((item["label"] for item in EXERCISES if item["type"] == exercise_type), exercise_type)
