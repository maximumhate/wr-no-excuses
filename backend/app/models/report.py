import uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, BigInteger, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
import enum

class ExerciseType(str, enum.Enum):
    pushups = "pushups"
    squats = "squats"
    plank = "plank"
    pullups = "pullups"
    abs = "abs"

class ReportStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    telegram_message_id: Mapped[int | None] = mapped_column(BigInteger)
    thread_message_id: Mapped[int | None] = mapped_column(BigInteger)
    exercise_type: Mapped[ExerciseType] = mapped_column(SAEnum(ExerciseType), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[ReportStatus] = mapped_column(SAEnum(ReportStatus), default=ReportStatus.pending)
    reviewed_by: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reports")
