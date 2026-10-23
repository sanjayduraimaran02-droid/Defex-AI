from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.report_service import report_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


@router.get("/dashboard")
def get_dashboard_kpis(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return report_service.get_dashboard_stats(db)


@router.get("/trend")
def get_trend_chart(days: int = Query(7, ge=3, le=30), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return report_service.get_trend_chart_data(db, days=days)


@router.get("/defect-distribution")
def get_defect_distribution(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return report_service.get_defect_distribution(db)


@router.get("/export-csv")
def export_csv(
    outcome: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    csv_content = report_service.generate_inspection_csv(db, outcome_filter=outcome)
    filename = "defex_inspection_report.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
