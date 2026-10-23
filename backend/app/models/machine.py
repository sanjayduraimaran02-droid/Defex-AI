from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="CONNECTED")  # CONNECTED, DISCONNECTED, FAULT, MAINTENANCE
    station = Column(String(150), nullable=False)  # e.g. Line 1 Intake, Machining Cell 3
    machine_type = Column(String(50), default="hybrid")  # camera_station, laser_station, plc_controller, hybrid
    ip_address = Column(String(100), default="192.168.1.100")
    protocol = Column(String(50), default="OPC-UA / Modbus")
    last_heartbeat = Column(DateTime, default=utc_now)
    telemetry = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
