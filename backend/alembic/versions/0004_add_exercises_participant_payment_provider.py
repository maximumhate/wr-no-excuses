"""Add new exercises, is_participant, Platega provider field

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE exercisetype ADD VALUE 'pullups'")
    op.execute("ALTER TYPE exercisetype ADD VALUE 'abs'")

    op.add_column("users", sa.Column("is_participant", sa.Boolean(), server_default=sa.text("false"), nullable=False))

    op.execute("UPDATE users SET is_participant = TRUE WHERE id IN (SELECT DISTINCT user_id FROM reports)")

    op.alter_column("payments", "yookassa_id", new_column_name="provider_payment_id")


def downgrade() -> None:
    op.alter_column("payments", "provider_payment_id", new_column_name="yookassa_id")
    op.drop_column("users", "is_participant")
