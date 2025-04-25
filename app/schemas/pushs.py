from pydantic import BaseModel
from typing import Optional, List, Union, Dict, Any
from datetime import datetime

class PushBase(BaseModel):
    title: str
    content: str
    content_type: Optional[str] = "text"
    media_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    use_markdown: Optional[bool] = False
    buttons: Optional[str] = None  # JSON 字符串

class PushCreate(PushBase):
    target_user_ids: List[int]
    status: Optional[str] = "draft"

class PushUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_type: Optional[str] = None
    media_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = None
    target_user_ids: Optional[List[int]] = None
    use_markdown: Optional[bool] = None
    buttons: Optional[str] = None

class Push(PushBase):
    push_id: int
    status: str
    target_user_ids: Union[List[int], str]
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    sent_count: int
    delivered_count: int
    read_count: int

    class Config:
        from_attributes = True