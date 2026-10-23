from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class InterlockEvent(Base):
    __tablename__ = "interlock_events"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    signal_type = Column(String(50), nullable=False)  # CLEAR_FOR_MACHINING, HOLD_AND_LOCK_STATION, EMERGENCY_STOP_MACHINE, RESET
    relay_pin = Column(String(50), nullable=False)    # DO_0_GO, DO_1_HOLD, DO_2_STOP, DO_3_DIVERT
    reason = Column(String(255), nullable=False)
    response_time_ms = Column(Float, default=12.4)
    plc_acknowledged = Column(Boolean, default=True)
    telemetry_snapshot = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utc_now, index=True)
