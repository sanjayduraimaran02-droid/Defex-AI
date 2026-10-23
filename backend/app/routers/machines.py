from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.schemas.machine import MachineCreate, MachineUpdate, MachineHeartbeat, MachineOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/machines", tags=["Machines & Stations"])


@router.get("", response_model=List[MachineOut])
def list_machines(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Machine)
    if active_only:
        query = query.filter(Machine.is_active == True)
    return query.order_by(Machine.code.asc()).all()


@router.post("", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
def create_machine(
    machine_in: MachineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    existing = db.query(Machine).filter(Machine.code == machine_in.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Machine with code '{machine_in.code}' already exists."
        )

    machine = Machine(
        name=machine_in.name,
        code=machine_in.code,
        status=machine_in.status,
        station=machine_in.station,
        machine_type=machine_in.machine_type,
        ip_address=machine_in.ip_address,
        protocol=machine_in.protocol,
        telemetry=machine_in.telemetry or {
            "temperature_c": 36.4,
            "air_pressure_bar": 6.2,
            "vibration_rms": 0.12,
            "interlock_engaged": False
        },
        is_active=machine_in.is_active,
        last_heartbeat=datetime.now(timezone.utc)
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine


@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(
    machine_id: int,
    machine_in: MachineUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    update_data = machine_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(machine, field, val)

    db.commit()
    db.refresh(machine)
    return machine


@router.post("/{machine_id}/heartbeat", response_model=MachineOut)
def machine_heartbeat(
    machine_id: int,
    heartbeat_data: MachineHeartbeat = None,
    db: Session = Depends(get_db)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    machine.last_heartbeat = datetime.now(timezone.utc)
    if heartbeat_data and heartbeat_data.status:
        machine.status = heartbeat_data.status
    else:
        machine.status = "CONNECTED"

    if heartbeat_data and heartbeat_data.telemetry:
        current_telemetry = machine.telemetry or {}
        current_telemetry.update(heartbeat_data.telemetry)
        machine.telemetry = current_telemetry

    db.commit()
    db.refresh(machine)
    return machine


@router.post("/{machine_id}/toggle-status")
def toggle_machine_status(
    machine_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    allowed = ["CONNECTED", "DISCONNECTED", "FAULT", "MAINTENANCE"]
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    machine.status = new_status
    machine.last_heartbeat = datetime.now(timezone.utc)
    db.commit()
    return {"id": machine.id, "status": machine.status}


@router.delete("/{machine_id}")
def delete_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    machine.is_active = False
    db.commit()
    return {"message": f"Machine cell '{machine.code}' deactivated successfully"}
