from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertOut, AlertCreate, AlertUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts & Diagnostics"])


@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)

    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    alert = Alert(
        severity=alert_in.severity.upper(),
        title=alert_in.title,
        message=alert_in.message,
        machine_id=alert_in.machine_id,
        inspection_id=alert_in.inspection_id,
        is_read=False,
        is_resolved=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = alert_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(alert, field, val)

    if alert_in.is_resolved:
        alert.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": f"Alert #{alert_id} deleted successfully"}


@router.post("/{alert_id}/read", response_model=AlertOut)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    alert.is_read = True
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/resolve-all")
def resolve_all_alerts(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.is_resolved == False).update({
        Alert.is_resolved: True,
        Alert.is_read: True,
        Alert.resolved_at: datetime.now(timezone.utc)
    })
    db.commit()
    return {"message": "All active alerts marked resolved."}
