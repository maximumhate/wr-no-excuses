import uuid
from datetime import datetime
from pydantic import BaseModel

class UserBase(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    city: str | None = None
    level: str | None = None
    first_name: str | None = None
    last_name: str | None = None

class UserResponse(UserBase):
    id: uuid.UUID
    city: str | None = None
    level: str | None = None
    is_admin: bool = False
    is_active: bool = True
    registered_at: datetime
    last_active_at: datetime

    model_config = {"from_attributes": True}
