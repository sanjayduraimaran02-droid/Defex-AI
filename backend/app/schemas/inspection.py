from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.part import PartOut
from app.schemas.machine import MachineOut
from app.schemas.auth import UserOut


class DefectDetail(BaseModel):
    defect_class: str = Field(..., alias="class")
    confidence: float
    bbox: List[int] = Field(..., description="[x1, y1, x2, y2]")
    severity: str = "CRITICAL"  # CRITICAL, WARNING, MINOR
    area_px: Optional[int] = 0
    description: Optional[str] = None

    class Config:
        populate_by_name = True


class MeasurementItem(BaseModel):
    nominal: float
    measured: float
    tolerance: float
    deviation: float
    status: str  # PASS, BORDERLINE, FAIL
    unit: str = "mm"


class InspectionCreate(BaseModel):
    part_id: int
    machine_id: int
    measurements: Optional[Dict[str, float]] = None  # Raw measured values, e.g. {"length": 150.04, "width": 80.01, "height": 45.02}
    simulated_preset: Optional[str] = None  # "pass", "fail_crack", "fail_tolerance", "uncertain_borderline"


class InspectionReviewInput(BaseModel):
    decision: str = Field(..., description="PASS or FAIL")
    notes: str = Field(..., min_length=3, description="Mandatory supervisor audit notes")


class InspectionOut(BaseModel):
    id: int
    part_id: int
    machine_id: int
    inspector_id: Optional[int] = None
    outcome: str  # PASS, FAIL, UNCERTAIN
    confidence: float
    image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    defect_classes: List[Dict[str, Any]] = Field(default_factory=list)
    measurements: Dict[str, Any] = Field(default_factory=dict)
    hardware_signal: str = "GO"  # GO, STOP, HOLD
    interlock_ack: bool = True
    response_time_ms: float = 12.0
    reviewed: bool = False
    reviewer_id: Optional[int] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    override_outcome: Optional[str] = None
    created_at: datetime
    
    part: Optional[PartOut] = None
    machine: Optional[MachineOut] = None
    inspector: Optional[UserOut] = None
    reviewer: Optional[UserOut] = None

    class Config:
        from_attributes = True


class InspectionFilter(BaseModel):
    outcome: Optional[str] = None
    part_id: Optional[int] = None
    machine_id: Optional[int] = None
    reviewed: Optional[bool] = None
    page: int = 1
    page_size: int = 20
