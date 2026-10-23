import random
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.interlock import InterlockEvent
from app.models.alert import Alert
from app.models.machine import Machine


# Exact Hardware Interlock Signals as specified by Industrial Damage Prevention standards
SIGNAL_CLEAR_FOR_MACHINING = "CLEAR_FOR_MACHINING"
SIGNAL_EMERGENCY_STOP = "EMERGENCY_STOP_MACHINE"
SIGNAL_HOLD_AND_LOCK = "HOLD_AND_LOCK_STATION"


class InterlockController:
    """
    Industrial Fail-Safe Interlock Controller.
    Emulates a Siemens / Beckhoff Safety PLC & Modbus/OPC-UA safety relay module.
    Prevents equipment crashes and catastrophic tool damage by gating machining cycles.

    Hardware Signals:
      - PASS      -> CLEAR_FOR_MACHINING
      - FAIL      -> EMERGENCY_STOP_MACHINE
      - UNCERTAIN -> HOLD_AND_LOCK_STATION
    """

    def __init__(self):
        # Digital Output Relay State
        self.digital_outputs = {
            "DO_0_GO": True,
            "DO_1_HOLD": False,
            "DO_2_STOP": False,
            "DO_3_DIVERT": False,
            "DO_4_ALARM_STROBE": False,
        }
        self.emergency_stop_tripped = False
        self.plc_connected = True
        self.controller_type = "Siemens S7-1500F Fail-Safe (Safety SIL 3 / PL e)"
        self.last_cycle_time_ms = 12.4

    def evaluate_triage_and_interlock(
        self,
        db: Session,
        machine: Optional[Machine],
        part_code: str,
        defects: List[Dict[str, Any]],
        visual_confidence: float,
        metrology_status: str,
        worst_dev_ratio: float,
        inspection_id: Optional[int] = None
    ) -> Tuple[str, str, float, bool]:
        """
        Executes strict automated damage prevention triage.
        Returns:
            (outcome ['PASS', 'FAIL', 'UNCERTAIN'], hardware_signal ['GO', 'HOLD', 'STOP'], response_time_ms, plc_ack)
        """
        start_time = time.perf_counter()

        # Strict triage evaluation
        has_critical_defect = any(d.get("severity") == "CRITICAL" for d in defects)
        has_warning_defect = any(d.get("severity") == "WARNING" for d in defects)
        is_dim_fail = (metrology_status == "FAIL")
        is_dim_borderline = (metrology_status == "BORDERLINE")

        if self.emergency_stop_tripped:
            outcome = "FAIL"
            signal_type = SIGNAL_EMERGENCY_STOP
            reason = "Manual Emergency STOP active on safety circuit"
        elif is_dim_fail or has_critical_defect:
            outcome = "FAIL"
            signal_type = SIGNAL_EMERGENCY_STOP
            if is_dim_fail and has_critical_defect:
                reason = f"Combined Out-of-Tolerance ({worst_dev_ratio*100:.0f}%) and Critical Flaw"
            elif is_dim_fail:
                reason = f"Dimensional Deviation Exceeded Tolerance ({worst_dev_ratio*100:.0f}% of spec)"
            else:
                defect_names = ", ".join([d.get("class", "defect") for d in defects if d.get("severity") == "CRITICAL"])
                reason = f"Critical Surface Defect Detected: {defect_names}"
        elif is_dim_borderline or has_warning_defect or (visual_confidence < 0.78 and defects):
            outcome = "UNCERTAIN"
            signal_type = SIGNAL_HOLD_AND_LOCK
            reason = "Borderline tolerances or ambiguous defect requiring supervisor sign-off"
        else:
            outcome = "PASS"
            signal_type = SIGNAL_CLEAR_FOR_MACHINING
            reason = "Workpiece validated within specifications. Cleared for CNC spindle entry."

        # Apply Relay Outputs
        if signal_type in [SIGNAL_EMERGENCY_STOP, "STOP"]:
            self.digital_outputs = {
                "DO_0_GO": False,
                "DO_1_HOLD": False,
                "DO_2_STOP": True,
                "DO_3_DIVERT": True,
                "DO_4_ALARM_STROBE": True,
            }
            relay_pin = "DO_2_STOP"
        elif signal_type in [SIGNAL_HOLD_AND_LOCK, "HOLD"]:
            self.digital_outputs = {
                "DO_0_GO": False,
                "DO_1_HOLD": True,
                "DO_2_STOP": False,
                "DO_3_DIVERT": False,
                "DO_4_ALARM_STROBE": False,
            }
            relay_pin = "DO_1_HOLD"
        else:
            self.digital_outputs = {
                "DO_0_GO": True,
                "DO_1_HOLD": False,
                "DO_2_STOP": False,
                "DO_3_DIVERT": False,
                "DO_4_ALARM_STROBE": False,
            }
            relay_pin = "DO_0_GO"

        # Calculate simulated hardware interlock response time (typically 8 to 22 ms)
        elapsed = (time.perf_counter() - start_time) * 1000.0
        response_time_ms = round(max(elapsed, random.uniform(9.5, 16.8)), 2)
        self.last_cycle_time_ms = response_time_ms

        # Record Interlock Event in DB
        event = InterlockEvent(
            machine_id=machine.id if machine else None,
            inspection_id=inspection_id,
            signal_type=signal_type,
            relay_pin=relay_pin,
            reason=reason,
            response_time_ms=response_time_ms,
            plc_acknowledged=True,
            telemetry_snapshot={
                "outputs": self.digital_outputs.copy(),
                "cycle_ms": response_time_ms,
                "emergency_circuit": not self.emergency_stop_tripped
            }
        )
        db.add(event)

        # Trigger Automated Real-time Alerts if non-PASS
        if signal_type in [SIGNAL_EMERGENCY_STOP, "STOP"]:
            alert = Alert(
                severity="CRITICAL",
                title=f"HARD STOP: Damage Prevention Interlock on {part_code}",
                message=f"Interlock tripped in {response_time_ms}ms on {machine.name if machine else 'Station'}. Signal: {signal_type}. Reason: {reason}. Divert solenoid energized.",
                machine_id=machine.id if machine else None,
                inspection_id=inspection_id
            )
            db.add(alert)
        elif signal_type in [SIGNAL_HOLD_AND_LOCK, "HOLD"]:
            alert = Alert(
                severity="WARNING",
                title=f"STATION HOLD: {part_code} Sent to Review Queue",
                message=f"Pneumatic clamp held part on {machine.name if machine else 'Station'}. Signal: {signal_type}. Routed to supervisor triage queue. Reason: {reason}.",
                machine_id=machine.id if machine else None,
                inspection_id=inspection_id
            )
            db.add(alert)

        db.commit()

        return outcome, signal_type, response_time_ms, True

    def trigger_emergency_stop(self, db: Session, machine_id: Optional[int] = None, reason: str = "Manual E-STOP Button Activated") -> InterlockEvent:
        """Immediate hardware emergency stop trigger."""
        self.emergency_stop_tripped = True
        self.digital_outputs = {
            "DO_0_GO": False,
            "DO_1_HOLD": False,
            "DO_2_STOP": True,
            "DO_3_DIVERT": True,
            "DO_4_ALARM_STROBE": True,
        }
        event = InterlockEvent(
            machine_id=machine_id,
            signal_type="EMERGENCY_STOP",
            relay_pin="DO_2_STOP",
            reason=reason,
            response_time_ms=7.8,
            plc_acknowledged=True,
            telemetry_snapshot={"outputs": self.digital_outputs.copy(), "manual_trip": True}
        )
        db.add(event)

        alert = Alert(
            severity="CRITICAL",
            title="EMERGENCY STOP TRIPPED",
            message=f"Station safety circuit broken: {reason}. All CNC spindles and transfer conveyors locked.",
            machine_id=machine_id
        )
        db.add(alert)
        db.commit()
        db.refresh(event)
        return event

    def reset_safety_circuit(self, db: Session, machine_id: Optional[int] = None) -> InterlockEvent:
        """Resets safety circuit after trip or triage clearance."""
        self.emergency_stop_tripped = False
        self.digital_outputs = {
            "DO_0_GO": True,
            "DO_1_HOLD": False,
            "DO_2_STOP": False,
            "DO_3_DIVERT": False,
            "DO_4_ALARM_STROBE": False,
        }
        event = InterlockEvent(
            machine_id=machine_id,
            signal_type="RESET",
            relay_pin="DO_0_GO",
            reason="Operator cleared safety interlock circuit and reset PLC safety latch.",
            response_time_ms=11.2,
            plc_acknowledged=True,
            telemetry_snapshot={"outputs": self.digital_outputs.copy(), "cleared": True}
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def get_hardware_status(self, db: Session) -> Dict[str, Any]:
        """Returns live PLC and relay telemetry."""
        recent_events = db.query(InterlockEvent).order_by(InterlockEvent.timestamp.desc()).limit(10).all()
        
        if self.emergency_stop_tripped:
            state = "HARD_STOP_TRIPPED"
        elif self.digital_outputs["DO_1_HOLD"]:
            state = "HOLD_ENGAGED"
        else:
            state = "ACTIVE_GO"

        return {
            "plc_connected": self.plc_connected,
            "controller_type": self.controller_type,
            "cycle_time_ms": self.last_cycle_time_ms,
            "interlock_state": state,
            "digital_outputs": self.digital_outputs,
            "safety_circuit_ok": not self.emergency_stop_tripped,
            "recent_events": recent_events
        }


interlock_controller = InterlockController()
