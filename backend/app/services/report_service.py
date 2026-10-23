import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.part import Part
from app.models.machine import Machine
from app.models.alert import Alert


class ReportService:
    """Service for calculating inspection KPIs, trends, and CSV exports."""

    def get_dashboard_stats(self, db: Session) -> Dict[str, Any]:
        total_inspections = db.query(func.count(Inspection.id)).scalar() or 0
        pass_count = db.query(func.count(Inspection.id)).filter(Inspection.outcome == "PASS").scalar() or 0
        fail_count = db.query(func.count(Inspection.id)).filter(Inspection.outcome == "FAIL").scalar() or 0
        uncertain_count = db.query(func.count(Inspection.id)).filter(Inspection.outcome == "UNCERTAIN").scalar() or 0

        pass_rate = round((pass_count / total_inspections * 100), 1) if total_inspections > 0 else 0.0

        open_alerts = db.query(func.count(Alert.id)).filter(Alert.is_resolved == False).scalar() or 0
        critical_alerts = db.query(func.count(Alert.id)).filter(Alert.is_resolved == False, Alert.severity == "CRITICAL").scalar() or 0
        
        # Pending review queue count: UNCERTAIN and not yet reviewed
        queue_count = db.query(func.count(Inspection.id)).filter(
            Inspection.outcome == "UNCERTAIN",
            Inspection.reviewed == False
        ).scalar() or 0

        # Machines summary
        total_machines = db.query(func.count(Machine.id)).scalar() or 0
        connected_machines = db.query(func.count(Machine.id)).filter(Machine.status == "CONNECTED").scalar() or 0
        fault_machines = db.query(func.count(Machine.id)).filter(Machine.status == "FAULT").scalar() or 0

        return {
            "total_inspections": total_inspections,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "uncertain_count": uncertain_count,
            "pass_rate_pct": pass_rate,
            "defects_caught": fail_count,
            "open_alerts": open_alerts,
            "critical_alerts": critical_alerts,
            "queue_count": queue_count,
            "machines_total": total_machines,
            "machines_connected": connected_machines,
            "machines_fault": fault_machines,
        }

    def get_trend_chart_data(self, db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """Calculates daily inspection counts and pass/fail distribution for the past N days."""
        today = datetime.now(timezone.utc).date()
        trend = []

        for i in range(days - 1, -1, -1):
            target_date = today - timedelta(days=i)
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())

            day_total = db.query(func.count(Inspection.id)).filter(
                Inspection.created_at >= start_dt,
                Inspection.created_at <= end_dt
            ).scalar() or 0

            day_pass = db.query(func.count(Inspection.id)).filter(
                Inspection.created_at >= start_dt,
                Inspection.created_at <= end_dt,
                Inspection.outcome == "PASS"
            ).scalar() or 0

            day_fail = db.query(func.count(Inspection.id)).filter(
                Inspection.created_at >= start_dt,
                Inspection.created_at <= end_dt,
                Inspection.outcome == "FAIL"
            ).scalar() or 0

            day_uncertain = db.query(func.count(Inspection.id)).filter(
                Inspection.created_at >= start_dt,
                Inspection.created_at <= end_dt,
                Inspection.outcome == "UNCERTAIN"
            ).scalar() or 0

            trend.append({
                "date": target_date.strftime("%b %d"),
                "total": day_total,
                "pass": day_pass,
                "fail": day_fail,
                "uncertain": day_uncertain,
                "pass_rate": round((day_pass / day_total * 100), 1) if day_total > 0 else 100.0
            })

        return trend

    def get_defect_distribution(self, db: Session) -> List[Dict[str, Any]]:
        """Aggregates defect occurrences across all inspections."""
        inspections = db.query(Inspection.defect_classes).filter(Inspection.defect_classes != None).all()
        counts: Dict[str, int] = {}

        for (defect_list,) in inspections:
            if isinstance(defect_list, list):
                for item in defect_list:
                    if isinstance(item, dict):
                        cls = item.get("class", "other").capitalize()
                        counts[cls] = counts.get(cls, 0) + 1

        result = [{"name": k, "count": v} for k, v in counts.items()]
        result.sort(key=lambda x: x["count"], reverse=True)
        return result

    def generate_inspection_csv(self, db: Session, outcome_filter: Optional[str] = None) -> str:
        """Generates RFC 4180 compliant CSV string of inspections."""
        query = db.query(Inspection).order_by(Inspection.created_at.desc())
        if outcome_filter:
            query = query.filter(Inspection.outcome == outcome_filter)

        inspections = query.all()
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Inspection ID",
            "Timestamp",
            "Part Code",
            "Part Name",
            "Machine Station",
            "Outcome",
            "Confidence %",
            "Hardware Interlock Signal",
            "Response Time (ms)",
            "Defect Count",
            "Defect Details",
            "Supervised Review Status",
            "Reviewer Notes",
            "Override Outcome"
        ])

        for insp in inspections:
            part_code = insp.part.code if insp.part else "N/A"
            part_name = insp.part.name if insp.part else "N/A"
            mach_name = insp.machine.name if insp.machine else "N/A"
            
            defects_str = ""
            if isinstance(insp.defect_classes, list) and insp.defect_classes:
                defects_str = "; ".join([
                    f"{d.get('class')}({d.get('severity')})" for d in insp.defect_classes if isinstance(d, dict)
                ])

            review_str = "Reviewed" if insp.reviewed else "Pending Triage" if insp.outcome == "UNCERTAIN" else "Not Required"

            writer.writerow([
                insp.id,
                insp.created_at.strftime("%Y-%m-%d %H:%M:%S") if insp.created_at else "",
                part_code,
                part_name,
                mach_name,
                insp.outcome,
                f"{insp.confidence * 100:.1f}",
                insp.hardware_signal,
                insp.response_time_ms,
                len(insp.defect_classes) if isinstance(insp.defect_classes, list) else 0,
                defects_str,
                review_str,
                insp.reviewer_notes or "",
                insp.override_outcome or ""
            ])

        return output.getvalue()


report_service = ReportService()
