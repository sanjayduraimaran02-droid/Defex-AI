from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class MachineBase(BaseModel):
    name: str = Field(..., example="Keyence 2D Laser Profilometer")
    code: str = Field(..., example="CELL-02-LASER")
    status: str = "CONNECTED"  # CONNECTED, DISCONNECTED, FAULT, MAINTENANCE
    station: str = Field(..., example="Line 1 Metrology Cell")
    machine_type: str = "hybrid"  # camera_station, laser_station, plc_controller, hybrid
    ip_address: Optional[str] = "192.168.1.100"
    protocol: Optional[str] = "OPC-UA / Modbus"
    telemetry: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = True


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    station: Optional[str] = None
    machine_type: Optional[str] = None
    ip_address: Optional[str] = None
    protocol: Optional[str] = None
    telemetry: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class MachineHeartbeat(BaseModel):
    status: Optional[str] = "CONNECTED"
    telemetry: Optional[Dict[str, Any]] = None


class MachineOut(MachineBase):
    id: int
    last_heartbeat: datetime
    created_at: datetime

    class Config:
        from_attributes = True
