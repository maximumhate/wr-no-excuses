import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.subscription import PlanType

class SubscriptionBase(BaseModel):
    plan: PlanType = PlanType.basic

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    started_at: datetime
    expires_at: datetime | None = None

    model_config = {"from_attributes": True}
