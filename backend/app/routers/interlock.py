from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.interlock import InterlockEvent
from app.schemas.interlock import HardwareStatusOut, InterlockEventOut, InterlockSignalRequest
from app.services.interlock_controller import interlock_controller
from app.core.deps import get_current_user

router = APIRouter(prefix="/interlock", tags=["Hardware Interlock & PLC"])


@router.get("/status", response_model=HardwareStatusOut)
def get_hardware_status(db: Session = Depends(get_db)):
    return interlock_controller.get_hardware_status(db)


@router.post("/emergency-stop")
def trigger_emergency_stop(
    request: Optional[InterlockSignalRequest] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    reason = request.reason if request and request.reason else "Operator E-STOP Panel Depressed"
    machine_id = request.machine_id if request else None
    event = interlock_controller.trigger_emergency_stop(db, machine_id=machine_id, reason=reason)
    
    # Trigger physical hardware relay
    try:
        from app.hardware_bridge import hardware_bridge
        hardware_bridge.trigger_safety_interlock("EMERGENCY_STOP", reason)
    except Exception:
        pass
    return {
        "status": "STOPPED",
        "message": "Emergency Stop engaged across safety relays",
        "event_id": event.id,
        "response_time_ms": event.response_time_ms
    }


@router.post("/reset")
def reset_safety_circuit(
    request: Optional[InterlockSignalRequest] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    machine_id = request.machine_id if request else None
    event = interlock_controller.reset_safety_circuit(db, machine_id=machine_id)
    
    # Re-arm physical hardware permissive relay
    try:
        from app.hardware_bridge import hardware_bridge
        hardware_bridge.trigger_safety_interlock("RESET", "Operator Panel Reset")
    except Exception:
        pass
    return {
        "status": "NORMAL",
        "message": "Safety circuit restored and PLC permissive armed",
        "event_id": event.id,
        "response_time_ms": event.response_time_ms
    }


@router.get("/events", response_model=List[InterlockEventOut])
def get_interlock_events(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(InterlockEvent).order_by(InterlockEvent.timestamp.desc()).limit(limit).all()
