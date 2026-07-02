import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, BigInteger, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    username: Mapped[str | None] = mapped_column(String(128))
    first_name: Mapped[str | None] = mapped_column(String(256))
    last_name: Mapped[str | None] = mapped_column(String(256))
    city: Mapped[str | None] = mapped_column(String(256))
    level: Mapped[str | None] = mapped_column(String(32))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_participant: Mapped[bool] = mapped_column(Boolean, default=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reports = relationship("Report", back_populates="user", lazy="selectin")
    streaks = relationship("Streak", back_populates="user", lazy="selectin")
    subscription = relationship("Subscription", back_populates="user", uselist=False, lazy="selectin")
    achievements = relationship("UserAchievement", back_populates="user", lazy="selectin")
    challenge_registrations = relationship("ChallengeRegistration", back_populates="user", lazy="selectin")
    exercise_difficulties = relationship("UserExerciseDifficulty", back_populates="user", lazy="selectin")
