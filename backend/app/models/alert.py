from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String(50), default="INFO", index=True)  # CRITICAL, WARNING, INFO
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    
    is_read = Column(Boolean, default=False, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    machine = relationship("Machine", backref="alerts")
    inspection = relationship("Inspection", backref="alerts")
