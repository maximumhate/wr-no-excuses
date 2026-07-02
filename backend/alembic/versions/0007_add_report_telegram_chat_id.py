"""Add telegram chat id to reports

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-02
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("telegram_chat_id", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "telegram_chat_id")
