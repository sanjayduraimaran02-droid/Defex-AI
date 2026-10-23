import os
import sys
from datetime import datetime, timedelta, timezone
import random

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, SessionLocal, engine
from app.models.user import User
from app.models.part import Part
from app.models.machine import Machine
from app.models.inspection import Inspection
from app.models.alert import Alert
from app.models.interlock import InterlockEvent
from app.core.security import get_password_hash
from app.services.cv_engine import cv_engine
from app.services.metrology import metrology_engine


def seed_database():
    print("Initializing Defex AI Database & Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data if any
    print("Clearing prior database state...")
    db.query(InterlockEvent).delete()
    db.query(Alert).delete()
    db.query(Inspection).delete()
    db.query(Machine).delete()
    db.query(Part).delete()
    db.query(User).delete()
    db.commit()

    # 1. Seed Users
    print("Seeding Users...")
    users = [
        User(
            email="admin@defex.ai",
            username="admin",
            full_name="Dr. Marcus Vance (Chief Automation Engineer)",
            hashed_password=get_password_hash("admin123"),
            role="administrator",
            is_active=True
        ),
        User(
            email="inspector@defex.ai",
            username="inspector",
            full_name="Elena Rostova (Lead Quality Inspector)",
            hashed_password=get_password_hash("inspector123"),
            role="quality_inspector",
            is_active=True
        ),
        User(
            email="operator@defex.ai",
            username="operator",
            full_name="Jack Reynolds (Cell 4 CNC Operator)",
            hashed_password=get_password_hash("operator123"),
            role="operator",
            is_active=True
        )
    ]
    db.add_all(users)
    db.commit()
    admin_user = users[0]
    inspector_user = users[1]
    operator_user = users[2]

    # 2. Seed Industrial Parts
    print("Seeding Industrial Parts...")
    parts = [
        Part(
            code="PRT-BRK-01",
            name="High-Performance Brake Caliper Housing",
            description="Cast billet mono-block brake caliper housing for high-performance automotive braking systems.",
            material="Cast Aluminum 6061-T6",
            defect_classes=["crack", "porosity", "scratch", "dent", "burr"],
            nominal_dimensions={"length": 150.0, "width": 80.0, "height": 45.0, "unit": "mm"},
            tolerances={"length": 0.05, "width": 0.05, "height": 0.08},
            cad_reference="CAD-BRK-REV-D",
            is_active=True
        ),
        Part(
            code="PRT-CAM-08",
            name="Precision Overhead Camshaft",
            description="Precision-ground multi-lobe camshaft for internal combustion valvetrain assembly.",
            material="Forged Alloy Steel 4140 (Nitride Hardened)",
            defect_classes=["scratch", "dent", "micro-crack", "runout", "burr"],
            nominal_dimensions={"length": 420.0, "width": 52.0, "height": 52.0, "unit": "mm"},
            tolerances={"length": 0.03, "width": 0.02, "height": 0.02},
            cad_reference="CAD-CAM-REV-4.1",
            is_active=True
        ),
        Part(
            code="PRT-TRB-44",
            name="Aero-Derivative Turbine Blade",
            description="Single-crystal high-pressure gas turbine blade with thermal barrier coating (TBC).",
            material="Inconel 718 Nickel Superalloy",
            defect_classes=["crack", "porosity", "coating void", "dent", "burr"],
            nominal_dimensions={"length": 185.0, "width": 64.0, "height": 28.0, "unit": "mm"},
            tolerances={"length": 0.015, "width": 0.020, "height": 0.010},
            cad_reference="AERO-TRB-718-SPEC",
            is_active=True
        ),
        Part(
            code="PRT-MNF-12",
            name="Hydraulic Spool Valve Manifold",
            description="High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
            material="Ductile Iron 65-45-12",
            defect_classes=["burr", "porosity", "scratch", "corrosion"],
            nominal_dimensions={"length": 220.0, "width": 140.0, "height": 95.0, "unit": "mm"},
            tolerances={"length": 0.08, "width": 0.06, "height": 0.05},
            cad_reference="HYD-MNF-BLOCK-9",
            is_active=True
        )
    ]
    db.add_all(parts)
    db.commit()

    # 3. Seed Machine Cells
    print("Seeding Machine Stations & Hardware Cells...")
    machines = [
        Machine(
            name="Line 1 Intake Dual-Camera Optical Station",
            code="CELL-01-OPTIC",
            status="CONNECTED",
            station="Line 1 Intake Cell",
            machine_type="camera_station",
            ip_address="192.168.1.101",
            protocol="GigE Vision / OPC-UA",
            telemetry={"temperature_c": 34.2, "illumination_lux": 12500, "sensor_status": "OPTIMAL"}
        ),
        Machine(
            name="Keyence 2D Laser Profilometer Station",
            code="CELL-02-LASER",
            status="CONNECTED",
            station="Line 1 Metrology Cell",
            machine_type="laser_station",
            ip_address="192.168.1.102",
            protocol="Modbus-TCP / Ethernet/IP",
            telemetry={"temperature_c": 31.8, "laser_frequency_khz": 64.0, "calibrated": True}
        ),
        Machine(
            name="Hexagon Multi-Sensor Hybrid Inspection Cell",
            code="CELL-03-HYBRID",
            status="CONNECTED",
            station="Line 2 Final Inspection Bay",
            machine_type="hybrid",
            ip_address="192.168.1.103",
            protocol="OPC-UA Safety / EtherCAT",
            telemetry={"temperature_c": 29.5, "axis_interlock_ready": True, "vibration_g": 0.02}
        ),
        Machine(
            name="Siemens S7-1500F Safety PLC Controller",
            code="CELL-04-PLC",
            status="CONNECTED",
            station="Main Machining Bay Master Interlock",
            machine_type="plc_controller",
            ip_address="192.168.1.120",
            protocol="PROFINET / Safety Integrated SIL 3",
            telemetry={"cycle_time_ms": 12.4, "estop_tripped": False, "relays_armed": True}
        )
    ]
    db.add_all(machines)
    db.commit()

    # 4. Generate Realistic Historical Inspections
    print("Generating Historical Multi-Modal Inspections with Generated CV Overlays...")
    now = datetime.now(timezone.utc)

    sample_scenarios = [
        # Clean PASS items
        {"part": parts[0], "machine": machines[0], "preset": "pass", "time_offset": 6, "count": 5},
        {"part": parts[1], "machine": machines[1], "preset": "pass", "time_offset": 5, "count": 4},
        {"part": parts[2], "machine": machines[2], "preset": "pass", "time_offset": 4, "count": 4},
        {"part": parts[3], "machine": machines[2], "preset": "pass", "time_offset": 3, "count": 5},
        
        # FAIL items (Structural cracks, porosity, out-of-tolerance)
        {"part": parts[1], "machine": machines[0], "preset": "fail_crack", "time_offset": 2, "count": 2},
        {"part": parts[0], "machine": machines[1], "preset": "fail_tolerance", "time_offset": 1, "count": 2},
        {"part": parts[3], "machine": machines[2], "preset": "fail_burr", "time_offset": 1, "count": 1},
        {"part": parts[2], "machine": machines[2], "preset": "fail_porosity", "time_offset": 0, "count": 1},

        # UNCERTAIN items (Borderline measurements, waiting in supervisor review queue)
        {"part": parts[0], "machine": machines[1], "preset": "uncertain_borderline", "time_offset": 0, "count": 3},
        {"part": parts[1], "machine": machines[2], "preset": "uncertain_borderline", "time_offset": 0, "count": 2},
    ]

    inspection_id_counter = 1
    for scen in sample_scenarios:
        p = scen["part"]
        m = scen["machine"]
        preset = scen["preset"]

        for i in range(scen["count"]):
            created_at = now - timedelta(days=scen["time_offset"], hours=random.randint(1, 10), minutes=random.randint(5, 55))
            
            # Process CV & Metrology
            raw_url, annot_url, defects, conf = cv_engine.process_workpiece_image(
                preset_type=preset,
                part_code=p.code,
                defect_classes_allowed=p.defect_classes
            )

            eval_dims, metrology_status, worst_ratio = metrology_engine.validate_measurements(
                nominal_dims=p.nominal_dimensions,
                tolerances=p.tolerances,
                preset_type=preset
            )

            if preset in ["fail_crack", "fail_burr", "fail_porosity", "fail_tolerance"]:
                outcome = "FAIL"
                sig = "EMERGENCY_STOP_MACHINE"
                reviewed = True
                reviewer_notes = "Confirmed critical failure. Workpiece diverted to scrap hopper."
                override_outcome = "FAIL"
                reviewer_id = inspector_user.id
            elif preset == "uncertain_borderline":
                outcome = "UNCERTAIN"
                sig = "HOLD_AND_LOCK_STATION"
                reviewed = False  # Queued for manual triage!
                reviewer_notes = None
                override_outcome = None
                reviewer_id = None
            else:
                outcome = "PASS"
                sig = "CLEAR_FOR_MACHINING"
                reviewed = True
                reviewer_notes = "Automatic pass. Dimensions and surface integrity within class-A tolerance."
                override_outcome = "PASS"
                reviewer_id = None

            insp = Inspection(
                part_id=p.id,
                machine_id=m.id,
                inspector_id=operator_user.id,
                outcome=outcome,
                confidence=conf,
                image_url=raw_url,
                annotated_image_url=annot_url,
                defect_classes=defects,
                measurements=eval_dims,
                hardware_signal=sig,
                interlock_ack=True,
                response_time_ms=round(random.uniform(11.2, 17.5), 2),
                reviewed=reviewed,
                reviewer_id=reviewer_id,
                reviewer_notes=reviewer_notes,
                override_outcome=override_outcome,
                created_at=created_at
            )
            db.add(insp)
            db.flush()

            # Record Interlock Event
            event = InterlockEvent(
                machine_id=m.id,
                inspection_id=insp.id,
                signal_type=sig,
                relay_pin="DO_0_GO" if sig == "GO" else ("DO_1_HOLD" if sig == "HOLD" else "DO_2_STOP"),
                reason=f"Inspection #{insp.id} Result: {outcome} ({preset})",
                response_time_ms=insp.response_time_ms,
                plc_acknowledged=True,
                telemetry_snapshot={"outputs": {"DO_0_GO": sig == "GO", "DO_2_STOP": sig == "STOP"}},
                timestamp=created_at
            )
            db.add(event)

            inspection_id_counter += 1

    db.commit()

    # 5. Seed Real-Time Industrial Alerts
    print("Seeding Alerts & Diagnostics...")
    alerts = [
        Alert(
            severity="CRITICAL",
            title="DAMAGE PREVENTION INTERLOCK STOP",
            message="Line 1 CNC spindle feed hold engaged. Optical scanner detected structural crack on Camshaft (PRT-CAM-08). Divert solenoid energized.",
            machine_id=machines[0].id,
            is_read=False,
            is_resolved=False,
            created_at=now - timedelta(minutes=45)
        ),
        Alert(
            severity="WARNING",
            title="SUPERVISOR QUEUE HOLD",
            message="Keyence Profilometer held workpiece PRT-BRK-01 on Line 1 Metrology Cell. Width tolerance at 95% of allowable limit.",
            machine_id=machines[1].id,
            is_read=False,
            is_resolved=False,
            created_at=now - timedelta(hours=2, minutes=10)
        ),
        Alert(
            severity="WARNING",
            title="SURFACE DISCONTINUITY DETECTED",
            message="Micro-witness mark on valve manifold seal face PRT-MNF-12. Routed to Quality Inspector for manual sign-off.",
            machine_id=machines[2].id,
            is_read=True,
            is_resolved=False,
            created_at=now - timedelta(hours=5)
        ),
        Alert(
            severity="INFO",
            title="TELECENTRIC OPTICAL RE-CALIBRATION COMPLETED",
            message="Cell 1 Dual-Camera optical scale re-calibrated against NIST 10mm glass grid. Standard deviation 0.0004mm.",
            machine_id=machines[0].id,
            is_read=True,
            is_resolved=True,
            resolved_at=now - timedelta(days=1),
            created_at=now - timedelta(days=1, hours=3)
        ),
        Alert(
            severity="INFO",
            title="SIEMENS S7-1500F PLC HEARTBEAT VERIFIED",
            message="Safety bus cycle check: PROFINET I/O response 12.4ms. All dual-channel safety relays armed.",
            machine_id=machines[3].id,
            is_read=True,
            is_resolved=True,
            resolved_at=now - timedelta(days=2),
            created_at=now - timedelta(days=2)
        )
    ]
    db.add_all(alerts)
    db.commit()

    print("\n=======================================================")
    print(" Defex AI Database Seed Complete!")
    print(f" Users: {len(users)} (admin, inspector, operator)")
    print(f" Parts: {len(parts)}")
    print(f" Machines: {len(machines)}")
    print(" Inspections & Triage Queue loaded with real CV imagery.")
    print(" Active alerts and safety interlock logs created.")
    print("=======================================================\n")
    db.close()


if __name__ == "__main__":
    seed_database()
