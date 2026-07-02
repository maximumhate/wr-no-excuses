"""Add challenges, CMS, difficulty rules, broadcast deliveries

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("achievements", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("achievements", sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")))
    op.add_column("achievements", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))

    op.create_table(
        "challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(256), nullable=True),
        sa.Column("starts_on", sa.Date(), nullable=False),
        sa.Column("ends_on", sa.Date(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'active'")),
        sa.Column("announcement_text", sa.Text(), nullable=True),
        sa.Column("announcement_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("number", name="uq_challenges_number"),
    )
    op.create_index("ix_challenges_number", "challenges", ["number"])
    op.create_index("ix_challenges_starts_on", "challenges", ["starts_on"])
    op.create_index("ix_challenges_ends_on", "challenges", ["ends_on"])

    op.create_table(
        "exercise_difficulty_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("exercise_type", sa.String(32), nullable=False),
        sa.Column("difficulty", sa.String(64), nullable=False),
        sa.Column("title", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("min_value", sa.Integer(), nullable=True),
        sa.Column("max_value", sa.Integer(), nullable=True),
        sa.Column("unit", sa.String(32), nullable=False, server_default=sa.text("'раз'")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("exercise_type", "difficulty", name="uq_exercise_difficulty_rule"),
    )
    op.create_index("ix_exercise_difficulty_rules_exercise_type", "exercise_difficulty_rules", ["exercise_type"])

    op.create_table(
        "user_exercise_difficulties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("exercise_type", sa.String(32), nullable=False),
        sa.Column("difficulty", sa.String(64), nullable=False),
        sa.Column("last_changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "exercise_type", name="uq_user_exercise_difficulty"),
    )
    op.create_index("ix_user_exercise_difficulties_user_id", "user_exercise_difficulties", ["user_id"])

    op.create_table(
        "challenge_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("challenge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenges.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("city", sa.String(256), nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("challenge_id", "user_id", name="uq_challenge_registration_user"),
    )
    op.create_index("ix_challenge_registrations_challenge_id", "challenge_registrations", ["challenge_id"])
    op.create_index("ix_challenge_registrations_user_id", "challenge_registrations", ["user_id"])

    op.create_table(
        "challenge_registration_exercises",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("registration_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenge_registrations.id"), nullable=False),
        sa.Column("exercise_type", sa.String(32), nullable=False),
        sa.Column("difficulty", sa.String(64), nullable=False),
        sa.UniqueConstraint("registration_id", "exercise_type", name="uq_registration_exercise"),
    )
    op.create_index("ix_challenge_registration_exercises_registration_id", "challenge_registration_exercises", ["registration_id"])

    op.add_column("reports", sa.Column("challenge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenges.id"), nullable=True))
    op.add_column("reports", sa.Column("registration_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenge_registrations.id"), nullable=True))
    op.create_index("ix_reports_challenge_id", "reports", ["challenge_id"])
    op.create_index("ix_reports_registration_id", "reports", ["registration_id"])

    op.create_table(
        "subscription_tariffs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("plan", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("currency", sa.String(8), nullable=False, server_default=sa.text("'RUB'")),
        sa.Column("period", sa.String(64), nullable=False, server_default=sa.text("'мес'")),
        sa.Column("features", sa.Text(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("accent", sa.String(64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("plan", name="uq_subscription_tariff_plan"),
    )

    op.create_table(
        "bot_texts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("key", sa.String(128), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("category", sa.String(64), nullable=False, server_default=sa.text("'bot'")),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("key", name="uq_bot_text_key"),
    )

    op.alter_column("broadcasts", "text", existing_type=sa.Text(), nullable=True)
    op.add_column("broadcasts", sa.Column("caption", sa.Text(), nullable=True))
    op.add_column("broadcasts", sa.Column("media_type", sa.String(32), nullable=True))
    op.add_column("broadcasts", sa.Column("file_name", sa.String(256), nullable=True))
    op.add_column("broadcasts", sa.Column("send_mode", sa.String(32), nullable=False, server_default=sa.text("'caption'")))
    op.add_column("broadcasts", sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'pending'")))
    op.add_column("broadcasts", sa.Column("failed_count", sa.Integer(), nullable=False, server_default=sa.text("0")))
    op.add_column("broadcasts", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "broadcast_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("broadcast_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broadcasts.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("telegram_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("message_id", sa.BigInteger(), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("broadcast_id", "telegram_id", name="uq_broadcast_delivery_user"),
    )
    op.create_index("ix_broadcast_deliveries_broadcast_id", "broadcast_deliveries", ["broadcast_id"])
    op.create_index("ix_broadcast_deliveries_user_id", "broadcast_deliveries", ["user_id"])
    op.create_index("ix_broadcast_deliveries_telegram_id", "broadcast_deliveries", ["telegram_id"])


def downgrade() -> None:
    op.drop_index("ix_broadcast_deliveries_telegram_id", table_name="broadcast_deliveries")
    op.drop_index("ix_broadcast_deliveries_user_id", table_name="broadcast_deliveries")
    op.drop_index("ix_broadcast_deliveries_broadcast_id", table_name="broadcast_deliveries")
    op.drop_table("broadcast_deliveries")
    op.drop_column("broadcasts", "completed_at")
    op.drop_column("broadcasts", "failed_count")
    op.drop_column("broadcasts", "status")
    op.drop_column("broadcasts", "send_mode")
    op.drop_column("broadcasts", "file_name")
    op.drop_column("broadcasts", "media_type")
    op.drop_column("broadcasts", "caption")
    op.alter_column("broadcasts", "text", existing_type=sa.Text(), nullable=False)
    op.drop_table("bot_texts")
    op.drop_table("subscription_tariffs")
    op.drop_index("ix_reports_registration_id", table_name="reports")
    op.drop_index("ix_reports_challenge_id", table_name="reports")
    op.drop_column("reports", "registration_id")
    op.drop_column("reports", "challenge_id")
    op.drop_index("ix_challenge_registration_exercises_registration_id", table_name="challenge_registration_exercises")
    op.drop_table("challenge_registration_exercises")
    op.drop_index("ix_challenge_registrations_user_id", table_name="challenge_registrations")
    op.drop_index("ix_challenge_registrations_challenge_id", table_name="challenge_registrations")
    op.drop_table("challenge_registrations")
    op.drop_index("ix_user_exercise_difficulties_user_id", table_name="user_exercise_difficulties")
    op.drop_table("user_exercise_difficulties")
    op.drop_index("ix_exercise_difficulty_rules_exercise_type", table_name="exercise_difficulty_rules")
    op.drop_table("exercise_difficulty_rules")
    op.drop_index("ix_challenges_ends_on", table_name="challenges")
    op.drop_index("ix_challenges_starts_on", table_name="challenges")
    op.drop_index("ix_challenges_number", table_name="challenges")
    op.drop_table("challenges")
    op.drop_column("achievements", "updated_at")
    op.drop_column("achievements", "sort_order")
    op.drop_column("achievements", "is_active")
