from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.part import Part
from app.schemas.part import PartCreate, PartUpdate, PartOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/parts", tags=["Parts Catalog"])


@router.get("", response_model=List[PartOut])
def list_parts(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Part)
    if active_only:
        query = query.filter(Part.is_active == True)
    return query.order_by(Part.code.asc()).all()


@router.post("", response_model=PartOut, status_code=status.HTTP_201_CREATED)
def create_part(
    part_in: PartCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    existing = db.query(Part).filter(Part.code == part_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Part with code '{part_in.code}' already exists."
        )

    part = Part(
        code=part_in.code,
        name=part_in.name,
        description=part_in.description,
        material=part_in.material,
        defect_classes=part_in.defect_classes,
        nominal_dimensions=part_in.nominal_dimensions,
        tolerances=part_in.tolerances,
        cad_reference=part_in.cad_reference,
        sample_image_url=part_in.sample_image_url,
        is_active=part_in.is_active
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@router.get("/{part_id}", response_model=PartOut)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part


@router.put("/{part_id}", response_model=PartOut)
def update_part(
    part_id: int,
    part_in: PartUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    update_data = part_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(part, field, val)

    db.commit()
    db.refresh(part)
    return part


@router.delete("/{part_id}")
def delete_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    part.is_active = False
    db.commit()
    return {"message": f"Part {part.code} deactivated successfully"}
