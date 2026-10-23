from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inspection import Inspection
from app.schemas.inspection import InspectionOut, InspectionReviewInput
from app.services.interlock_controller import (
    interlock_controller,
    SIGNAL_CLEAR_FOR_MACHINING,
    SIGNAL_EMERGENCY_STOP,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/queue", tags=["Human-in-the-Loop Triage Queue"])


@router.get("", response_model=List[InspectionOut])
def get_triage_queue(db: Session = Depends(get_db)):
    """Returns all UNCERTAIN or borderline inspections held on pneumatic clamps awaiting supervisor triage."""
    return db.query(Inspection).filter(
        Inspection.outcome == "UNCERTAIN",
        Inspection.reviewed == False
    ).order_by(Inspection.created_at.asc()).all()


@router.get("/{inspection_id}", response_model=InspectionOut)
def get_queue_item(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id,
        Inspection.outcome == "UNCERTAIN"
    ).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return inspection


@router.post("/{inspection_id}/triage", response_model=InspectionOut)
def triage_queue_item(
    inspection_id: int,
    review_in: InspectionReviewInput,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Supervisor Human-in-the-Loop triage override.
    - PASS -> Emits CLEAR_FOR_MACHINING (Releases clamps and arms CNC spindle)
    - FAIL -> Emits EMERGENCY_STOP_MACHINE (Trips feed hold and fires divert solenoid)
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    decision = review_in.decision.upper()
    if decision not in ["PASS", "FAIL"]:
        raise HTTPException(status_code=400, detail="Decision must be PASS or FAIL")

    inspection.reviewed = True
    inspection.reviewer_id = current_user.id if current_user else None
    inspection.reviewer_notes = review_in.notes
    inspection.reviewed_at = datetime.now(timezone.utc)
    inspection.override_outcome = decision

    if decision == "PASS":
        inspection.hardware_signal = SIGNAL_CLEAR_FOR_MACHINING
        interlock_controller.digital_outputs = {
            "DO_0_GO": True,
            "DO_1_HOLD": False,
            "DO_2_STOP": False,
            "DO_3_DIVERT": False,
            "DO_4_ALARM_STROBE": False,
        }
    else:
        inspection.hardware_signal = SIGNAL_EMERGENCY_STOP
        interlock_controller.digital_outputs = {
            "DO_0_GO": False,
            "DO_1_HOLD": False,
            "DO_2_STOP": True,
            "DO_3_DIVERT": True,
            "DO_4_ALARM_STROBE": True,
        }

    db.commit()
    db.refresh(inspection)
    return inspection


@router.delete("/{inspection_id}")
def dismiss_queue_item(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Removes an item from active triage queue by marking it reviewed."""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Queue item not found")

    inspection.reviewed = True
    inspection.reviewer_id = current_user.id if current_user else None
    inspection.reviewer_notes = "Dismissed by supervisor without state change."
    inspection.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Inspection #{inspection_id} dismissed from review queue"}
