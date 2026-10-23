from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PartBase(BaseModel):
    code: str = Field(..., example="PRT-BRK-01")
    name: str = Field(..., example="High-Performance Brake Caliper")
    description: Optional[str] = None
    material: Optional[str] = "Cast Aluminum 6061-T6"
    defect_classes: List[str] = Field(
        default_factory=lambda: ["scratch", "crack", "porosity", "dent", "burr"]
    )
    nominal_dimensions: Dict[str, Any] = Field(
        default_factory=lambda: {
            "length": 150.0,
            "width": 80.0,
            "height": 45.0,
            "unit": "mm",
        }
    )
    tolerances: Dict[str, Any] = Field(
        default_factory=lambda: {
            "length": 0.05,
            "width": 0.05,
            "height": 0.08,
        }
    )
    cad_reference: Optional[str] = None
    sample_image_url: Optional[str] = None
    is_active: bool = True


class PartCreate(PartBase):
    pass


class PartUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    material: Optional[str] = None
    defect_classes: Optional[List[str]] = None
    nominal_dimensions: Optional[Dict[str, Any]] = None
    tolerances: Optional[Dict[str, Any]] = None
    cad_reference: Optional[str] = None
    sample_image_url: Optional[str] = None
    is_active: Optional[bool] = None


class PartOut(PartBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
