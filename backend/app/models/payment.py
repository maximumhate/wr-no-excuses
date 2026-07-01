import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.models.subscription import PlanType
import enum

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    cancelled = "cancelled"
    failed = "failed"

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan: Mapped[PlanType] = mapped_column(SAEnum(PlanType), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), default=PaymentStatus.pending)
    yookassa_id: Mapped[str | None] = mapped_column(String(128), unique=True)
    confirmation_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
