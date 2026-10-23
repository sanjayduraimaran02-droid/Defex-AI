from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlertBase(BaseModel):
    severity: str = Field("INFO", example="CRITICAL")  # CRITICAL, WARNING, INFO
    title: str = Field(..., example="Emergency Interlock Halt Triggered")
    message: str = Field(..., example="Tool damage prevention interlock stopped Line 1 CNC due to crack detected.")
    machine_id: Optional[int] = None
    inspection_id: Optional[int] = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_resolved: Optional[bool] = None


class AlertOut(AlertBase):
    id: int
    is_read: bool
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
