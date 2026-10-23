import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inspection import Inspection
from app.models.part import Part
from app.models.machine import Machine
from app.schemas.inspection import InspectionOut, InspectionReviewInput
from app.services.cv_engine import cv_engine
from app.services.metrology import metrology_engine
from app.services.interlock_controller import interlock_controller
from app.core.deps import get_current_user

router = APIRouter(prefix="/inspections", tags=["Inspections"])


@router.post("", response_model=InspectionOut, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    part_id: int = Form(...),
    machine_id: int = Form(...),
    measurements_json: Optional[str] = Form(None),
    preset_type: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Executes an end-to-end multi-modal visual inspection and laser metrology verification.
    Triggers automated hardware damage prevention interlock (STOP / HOLD / GO).
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part profile not found")

    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Read image bytes if uploaded
    image_bytes = None
    if image:
        image_bytes = await image.read()

    # Parse measurements if provided as JSON string
    measured_dict = None
    if measurements_json:
        try:
            measured_dict = json.loads(measurements_json)
        except Exception:
            measured_dict = None

    # 1. Computer Vision Processing
    raw_img_url, annot_img_url, defects, visual_conf = cv_engine.process_workpiece_image(
        image_bytes=image_bytes,
        preset_type=preset_type,
        part_code=part.code,
        defect_classes_allowed=part.defect_classes or []
    )

    # 2. Precision Laser Metrology Verification
    evaluated_dims, metrology_status, worst_ratio = metrology_engine.validate_measurements(
        nominal_dims=part.nominal_dimensions or {},
        tolerances=part.tolerances or {},
        measured_values=measured_dict,
        preset_type=preset_type
    )

    # 3. Create initial Inspection record
    inspection = Inspection(
        part_id=part.id,
        machine_id=machine.id,
        inspector_id=current_user.id if current_user else None,
        outcome="UNCERTAIN",
        confidence=visual_conf,
        image_url=raw_img_url,
        annotated_image_url=annot_img_url,
        defect_classes=defects,
        measurements=evaluated_dims,
        reviewed=False
    )
    db.add(inspection)
    db.flush()

    # 4. Strict Damage Prevention & Hardware Interlock
    outcome, hardware_signal, resp_time_ms, plc_ack = interlock_controller.evaluate_triage_and_interlock(
        db=db,
        machine=machine,
        part_code=part.code,
        defects=defects,
        visual_confidence=visual_conf,
        metrology_status=metrology_status,
        worst_dev_ratio=worst_ratio,
        inspection_id=inspection.id
    )

    # 5. Finalize Inspection with triage result
    inspection.outcome = outcome
    inspection.hardware_signal = hardware_signal
    inspection.response_time_ms = resp_time_ms
    inspection.interlock_ack = plc_ack
    
    # Auto-flag reviewed=True only if clean PASS
    if outcome == "PASS":
        inspection.reviewed = True

    db.commit()
    db.refresh(inspection)

    # Broadcast event via hardware bridge to live WebSocket subscribers
    try:
        from app.hardware_bridge import hardware_bridge
        hardware_bridge.broadcast("inspection_completed", {
            "id": inspection.id,
            "part_code": part.code,
            "part_name": part.name,
            "outcome": outcome,
            "confidence": inspection.confidence,
            "hardware_signal": hardware_signal,
            "response_time_ms": resp_time_ms,
            "created_at": inspection.created_at.isoformat() if hasattr(inspection.created_at, "isoformat") else str(inspection.created_at)
        })
        if outcome == "FAIL":
            hardware_bridge.trigger_safety_interlock(
                "EMERGENCY_STOP",
                f"Inspection #{inspection.id} on {part.code} Failed Quality Check",
                machine.code if machine else None
            )
    except Exception:
        pass

    return inspection


@router.get("", response_model=List[InspectionOut])
def list_inspections(
    outcome: Optional[str] = Query(None),
    part_id: Optional[int] = Query(None),
    machine_id: Optional[int] = Query(None),
    reviewed: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)

    if outcome:
        query = query.filter(Inspection.outcome == outcome)
    if part_id:
        query = query.filter(Inspection.part_id == part_id)
    if machine_id:
        query = query.filter(Inspection.machine_id == machine_id)
    if reviewed is not None:
        query = query.filter(Inspection.reviewed == reviewed)

    return query.order_by(Inspection.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/queue", response_model=List[InspectionOut])
def get_triage_queue(db: Session = Depends(get_db)):
    """Returns unreviewed UNCERTAIN inspections waiting for supervisor triage."""
    return db.query(Inspection).filter(
        Inspection.outcome == "UNCERTAIN",
        Inspection.reviewed == False
    ).order_by(Inspection.created_at.asc()).all()


@router.get("/{inspection_id}", response_model=InspectionOut)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


@router.post("/{inspection_id}/review", response_model=InspectionOut)
def review_inspection(
    inspection_id: int,
    review_in: InspectionReviewInput,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Supervisor Human-in-the-Loop triage override.
    Permits manual sign-off with audit logging and updates hardware interlock state.
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

    # Re-evaluate hardware interlock signal based on supervisor command
    if decision == "PASS":
        inspection.hardware_signal = "CLEAR_FOR_MACHINING"
        interlock_controller.digital_outputs = {
            "DO_0_GO": True,
            "DO_1_HOLD": False,
            "DO_2_STOP": False,
            "DO_3_DIVERT": False,
            "DO_4_ALARM_STROBE": False,
        }
    else:
        inspection.hardware_signal = "EMERGENCY_STOP_MACHINE"
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
def delete_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    db.delete(inspection)
    db.commit()
    return {"message": f"Inspection #{inspection_id} deleted successfully"}
