from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class InterlockSignalRequest(BaseModel):
    machine_id: Optional[int] = None
    signal_type: Optional[str] = "EMERGENCY_STOP"
    reason: Optional[str] = "Operator E-STOP Panel Depressed"


class InterlockEventOut(BaseModel):
    id: int
    machine_id: Optional[int] = None
    inspection_id: Optional[int] = None
    signal_type: str
    relay_pin: str
    reason: str
    response_time_ms: float
    plc_acknowledged: bool
    telemetry_snapshot: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True


class HardwareStatusOut(BaseModel):
    plc_connected: bool
    controller_type: str
    cycle_time_ms: float
    interlock_state: str  # ACTIVE_GO, HOLD_ENGAGED, HARD_STOP_TRIPPED
    digital_outputs: Dict[str, bool]  # e.g. {"DO_0_GO": True, "DO_1_HOLD": False, "DO_2_STOP": False, "DO_3_DIVERT": False}
    safety_circuit_ok: bool
    recent_events: List[InterlockEventOut] = []
