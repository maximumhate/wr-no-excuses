import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(256))
    starts_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    ends_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    announcement_text: Mapped[str | None] = mapped_column(Text)
    announcement_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    registrations = relationship("ChallengeRegistration", back_populates="challenge", lazy="selectin")


class ChallengeRegistration(Base):
    __tablename__ = "challenge_registrations"
    __table_args__ = (UniqueConstraint("challenge_id", "user_id", name="uq_challenge_registration_user"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    city: Mapped[str] = mapped_column(String(256), nullable=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    challenge = relationship("Challenge", back_populates="registrations")
    user = relationship("User", back_populates="challenge_registrations")
    exercises = relationship(
        "ChallengeRegistrationExercise",
        back_populates="registration",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ChallengeRegistrationExercise(Base):
    __tablename__ = "challenge_registration_exercises"
    __table_args__ = (UniqueConstraint("registration_id", "exercise_type", name="uq_registration_exercise"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    registration_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenge_registrations.id"), nullable=False, index=True)
    exercise_type: Mapped[str] = mapped_column(String(32), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(64), nullable=False)

    registration = relationship("ChallengeRegistration", back_populates="exercises")
