from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    outcome = Column(String(50), nullable=False, index=True)  # PASS, FAIL, UNCERTAIN
    confidence = Column(Float, default=1.0)
    image_url = Column(String(500), nullable=True)
    annotated_image_url = Column(String(500), nullable=True)
    
    defect_classes = Column(JSON, default=list)
    measurements = Column(JSON, default=dict)
    
    hardware_signal = Column(String(50), default="CLEAR_FOR_MACHINING")  # CLEAR_FOR_MACHINING, EMERGENCY_STOP_MACHINE, HOLD_AND_LOCK_STATION
    interlock_ack = Column(Boolean, default=True)
    response_time_ms = Column(Float, default=15.0)
    
    reviewed = Column(Boolean, default=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    override_outcome = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    part = relationship("Part", backref="inspections")
    machine = relationship("Machine", backref="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id], backref="conducted_inspections")
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="reviewed_inspections")
