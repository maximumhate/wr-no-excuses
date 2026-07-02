"""Fix fixed exercise difficulty rules

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-02
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


RULES = [
    ("plank", "novice", "Новичок", "0-30 секунд", None, 30, "сек", 0),
    ("plank", "amateur", "Любитель", "30 секунд - 3 минуты", 31, 180, "сек", 1),
    ("plank", "pro", "Профи", "3 минуты+", 181, None, "сек", 2),
    ("pushups", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("pushups", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("pushups", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("squats", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("squats", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("squats", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("abs", "novice", "Новичок", "0-30 раз", None, 30, "раз", 0),
    ("abs", "amateur", "Любитель", "30-60 раз", 31, 60, "раз", 1),
    ("abs", "pro", "Профи", "60+ раз", 61, None, "раз", 2),
    ("pullups", "novice", "Новичок", "0-5 раз", None, 5, "раз", 0),
    ("pullups", "amateur", "Любитель", "5-15 раз", 6, 15, "раз", 1),
    ("pullups", "pro", "Профи", "15+ раз", 16, None, "раз", 2),
]


def upgrade() -> None:
    for exercise_type, difficulty, title, description, min_value, max_value, unit, sort_order in RULES:
        op.execute(
            """
            INSERT INTO exercise_difficulty_rules
                (exercise_type, difficulty, title, description, min_value, max_value, unit, sort_order, is_active)
            VALUES
                (%(exercise_type)s, %(difficulty)s, %(title)s, %(description)s, %(min_value)s, %(max_value)s, %(unit)s, %(sort_order)s, true)
            ON CONFLICT (exercise_type, difficulty) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                min_value = EXCLUDED.min_value,
                max_value = EXCLUDED.max_value,
                unit = EXCLUDED.unit,
                sort_order = EXCLUDED.sort_order,
                is_active = true,
                updated_at = now()
            """ % {
                "exercise_type": repr(exercise_type),
                "difficulty": repr(difficulty),
                "title": repr(title),
                "description": repr(description),
                "min_value": "NULL" if min_value is None else min_value,
                "max_value": "NULL" if max_value is None else max_value,
                "unit": repr(unit),
                "sort_order": sort_order,
            }
        )


def downgrade() -> None:
    pass
