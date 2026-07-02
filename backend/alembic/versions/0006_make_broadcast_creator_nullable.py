"""Make broadcast creator nullable

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-02
"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "broadcasts",
        "created_by",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "broadcasts",
        "created_by",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
