import os
import sys
import uuid
import warnings

# Suppress external library warnings during automated tests
warnings.filterwarnings("ignore")

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system():
    print("=======================================================")
    print(" Testing Defex AI Backend & Interlock Service")
    print("=======================================================\n")

    # 1. Root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print(" [OK] 1. Root Operational Status:", res.json()["status"])

    # 2. Auth Demo Switch
    res = client.post("/api/auth/demo-switch/administrator")
    assert res.status_code == 200, f"Auth failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(" [OK] 2. JWT Authentication: Logged in as Administrator.")

    uid = uuid.uuid4().hex[:6].upper()

    # 3. Full CRUD: Parts
    # Create
    part_payload = {
        "code": f"PRT-TST-{uid}",
        "name": "Test Hydraulic Actuator Shaft",
        "material": "Stainless Steel 316",
        "defect_classes": ["crack", "burr", "scratch"],
        "nominal_dimensions": {"length": 200.0, "width": 40.0, "height": 40.0, "unit": "mm"},
        "tolerances": {"length": 0.04, "width": 0.02, "height": 0.02}
    }
    res = client.post("/api/parts", json=part_payload, headers=headers)
    assert res.status_code == 201
    created_part = res.json()
    part_id = created_part["id"]

    # Read
    res = client.get(f"/api/parts/{part_id}")
    assert res.status_code == 200
    assert res.json()["code"] == f"PRT-TST-{uid}"

    # Update
    res = client.put(f"/api/parts/{part_id}", json={"name": "Updated Shaft"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Shaft"

    # Delete
    res = client.delete(f"/api/parts/{part_id}", headers=headers)
    assert res.status_code == 200
    print(" [OK] 3. Parts CRUD (Create, Read, Update, Delete) validated.")

    # 4. Full CRUD: Machines
    mach_payload = {
        "name": "Test Optical Scanner",
        "code": f"CELL-TST-{uid}",
        "station": "Test Bay 9",
        "machine_type": "camera_station",
        "ip_address": "192.168.1.199",
        "protocol": "GigE Vision / OPC-UA"
    }
    res = client.post("/api/machines", json=mach_payload, headers=headers)
    assert res.status_code == 201
    created_mach = res.json()
    mach_id = created_mach["id"]

    res = client.get(f"/api/machines/{mach_id}")
    assert res.status_code == 200

    res = client.put(f"/api/machines/{mach_id}", json={"name": "Updated Scanner"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Scanner"

    res = client.delete(f"/api/machines/{mach_id}", headers=headers)
    assert res.status_code == 200
    print(" [OK] 4. Machines CRUD (Create, Read, Update, Delete) validated.")

    # Get active parts and machines for inspection tests
    parts = client.get("/api/parts").json()
    machines = client.get("/api/machines").json()
    p_id = parts[0]["id"]
    m_id = machines[0]["id"]

    # 5. Damage Prevention Interlock: FAIL -> EMERGENCY_STOP_MACHINE
    res = client.post("/api/inspections", data={
        "part_id": p_id,
        "machine_id": m_id,
        "preset_type": "fail_crack"
    }, headers=headers)
    assert res.status_code == 201
    crack_insp = res.json()
    assert crack_insp["outcome"] == "FAIL"
    assert crack_insp["hardware_signal"] == "EMERGENCY_STOP_MACHINE"
    print(f" [OK] 5. Interlock Engine: FAIL -> Signal: EMERGENCY_STOP_MACHINE ({crack_insp['response_time_ms']}ms).")

    # 6. Damage Prevention Interlock: PASS -> CLEAR_FOR_MACHINING
    res = client.post("/api/inspections", data={
        "part_id": p_id,
        "machine_id": m_id,
        "preset_type": "pass"
    }, headers=headers)
    assert res.status_code == 201
    pass_insp = res.json()
    assert pass_insp["outcome"] == "PASS"
    assert pass_insp["hardware_signal"] == "CLEAR_FOR_MACHINING"
    print(f" [OK] 6. Interlock Engine: PASS -> Signal: CLEAR_FOR_MACHINING ({pass_insp['response_time_ms']}ms).")

    # 7. Damage Prevention Interlock: UNCERTAIN -> HOLD_AND_LOCK_STATION
    res = client.post("/api/inspections", data={
        "part_id": p_id,
        "machine_id": m_id,
        "preset_type": "uncertain_borderline"
    }, headers=headers)
    assert res.status_code == 201
    uncertain_insp = res.json()
    assert uncertain_insp["outcome"] == "UNCERTAIN"
    assert uncertain_insp["hardware_signal"] == "HOLD_AND_LOCK_STATION"
    print(f" [OK] 7. Interlock Engine: UNCERTAIN -> Signal: HOLD_AND_LOCK_STATION ({uncertain_insp['response_time_ms']}ms).")

    # 8. Full CRUD & Actions: Triage Queue (/api/queue)
    res = client.get("/api/queue")
    assert res.status_code == 200
    queue_items = res.json()
    assert len(queue_items) >= 1
    queued_id = uncertain_insp["id"]

    res = client.get(f"/api/queue/{queued_id}")
    assert res.status_code == 200

    # Supervisor Triage Override -> PASS
    res = client.post(f"/api/queue/{queued_id}/triage", json={
        "decision": "PASS",
        "notes": "Cosmetic witness mark outside O-ring sealing groove. Cleared for milling."
    }, headers=headers)
    assert res.status_code == 200
    triaged = res.json()
    assert triaged["reviewed"] == True
    assert triaged["override_outcome"] == "PASS"
    assert triaged["hardware_signal"] == "CLEAR_FOR_MACHINING"
    print(" [OK] 8. Triage Queue CRUD: Listed, Read, and Overridden to PASS (CLEAR_FOR_MACHINING).")

    # 9. Full CRUD: Alerts
    alert_payload = {
        "severity": "CRITICAL",
        "title": "Test Critical Interlock Alert",
        "message": "Emergency feed hold test alert",
        "machine_id": m_id
    }
    res = client.post("/api/alerts", json=alert_payload, headers=headers)
    assert res.status_code == 201
    created_alert = res.json()
    alert_id = created_alert["id"]

    res = client.get(f"/api/alerts/{alert_id}")
    assert res.status_code == 200

    res = client.put(f"/api/alerts/{alert_id}", json={"is_read": True}, headers=headers)
    assert res.status_code == 200
    assert res.json()["is_read"] == True

    res = client.post(f"/api/alerts/{alert_id}/resolve", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_resolved"] == True

    res = client.delete(f"/api/alerts/{alert_id}", headers=headers)
    assert res.status_code == 200
    print(" [OK] 9. Alerts CRUD (Create, Read, Update, Resolve, Delete) validated.")

    # 10. Interlock E-STOP & Reset
    res = client.post("/api/interlock/emergency-stop", json={"reason": "Manual E-STOP Test"}, headers=headers)
    assert res.status_code == 200

    res = client.post("/api/interlock/reset", headers=headers)
    assert res.status_code == 200
    print(" [OK] 10. Interlock E-STOP Trip and Safety Circuit Reset validated.")

    print("\n=======================================================")
    print(" ALL 10 TESTS PASSED WITH 100% SUCCESS!")
    print("=======================================================\n")


if __name__ == "__main__":
    test_system()
