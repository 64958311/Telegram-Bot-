from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LogBase(BaseModel):
    push_id: int
    user_id: int
    status: str
    error_message: Optional[str] = None

class LogCreate(LogBase):
    pass

class Log(LogBase):
    log_id: int
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True