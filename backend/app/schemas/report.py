import uuid
from datetime import date, datetime
from pydantic import BaseModel
from app.models.report import ExerciseType, ReportStatus

class ReportCreate(BaseModel):
    exercise_type: ExerciseType
    value: int
    report_date: date | None = None
    telegram_chat_id: int | None = None
    telegram_message_id: int | None = None
    thread_message_id: int | None = None

class ReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    exercise_type: ExerciseType
    value: int
    telegram_chat_id: int | None = None
    telegram_message_id: int | None = None
    thread_message_id: int | None = None
    report_date: date
    status: ReportStatus
    created_at: datetime

    model_config = {"from_attributes": True}

class ReportStats(BaseModel):
    total_pushups: int = 0
    total_squats: int = 0
    total_plank_seconds: int = 0
    total_pullups: int = 0
    total_abs: int = 0
    total_reports: int = 0
    current_streak: int = 0
    longest_streak: int = 0
