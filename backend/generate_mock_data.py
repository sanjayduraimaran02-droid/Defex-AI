import json
from datetime import datetime

with open('backend/exported_localhost_data.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Build parts
parts_ts = []
for p in db['parts']:
    defects = json.loads(p['defect_classes']) if isinstance(p['defect_classes'], str) else (p['defect_classes'] or [])
    nominal = json.loads(p['nominal_dimensions']) if isinstance(p['nominal_dimensions'], str) else (p['nominal_dimensions'] or {})
    tolerances = json.loads(p['tolerances']) if isinstance(p['tolerances'], str) else (p['tolerances'] or {})
    created = p['created_at'].replace(' ', 'T') + 'Z' if ' ' in str(p['created_at']) else str(p['created_at'])
    parts_ts.append({
        "id": p['id'],
        "code": p['code'],
        "name": p['name'],
        "description": p['description'] or "",
        "material": p['material'] or "Alloy",
        "defect_classes": defects,
        "nominal_dimensions": nominal,
        "tolerances": tolerances,
        "cad_reference": p['cad_reference'],
        "sample_image_url": p['sample_image_url'],
        "is_active": bool(p['is_active']),
        "created_at": created
    })

# Build machines
machines_ts = []
for m in db['machines']:
    tele = json.loads(m['telemetry']) if isinstance(m['telemetry'], str) else (m['telemetry'] or {})
    created = m['created_at'].replace(' ', 'T') + 'Z' if ' ' in str(m['created_at']) else str(m['created_at'])
    heartbeat = m['last_heartbeat'].replace(' ', 'T') + 'Z' if m.get('last_heartbeat') and ' ' in str(m['last_heartbeat']) else str(m.get('last_heartbeat') or created)
    machines_ts.append({
        "id": m['id'],
        "name": m['name'],
        "code": m['code'],
        "status": m['status'],
        "station": m['station'],
        "machine_type": m['machine_type'],
        "ip_address": m['ip_address'],
        "protocol": m['protocol'],
        "telemetry": tele,
        "is_active": bool(m['is_active']),
        "last_heartbeat": heartbeat,
        "created_at": created
    })

# Build inspections
part_map = {p['id']: p for p in parts_ts}
machine_map = {m['id']: m for m in machines_ts}

inspections_ts = []
for insp in db['inspections']:
    defects = json.loads(insp['defect_classes']) if isinstance(insp['defect_classes'], str) else (insp['defect_classes'] or [])
    meas = json.loads(insp['measurements']) if isinstance(insp['measurements'], str) else (insp['measurements'] or {})
    
    # Fix dimension limits if missing
    for d_name, d_val in meas.items():
        if isinstance(d_val, dict):
            nom = d_val.get('nominal', 0)
            tol = d_val.get('tolerance', 0.05)
            if 'upper_limit' not in d_val:
                d_val['upper_limit'] = nom + tol
            if 'lower_limit' not in d_val:
                d_val['lower_limit'] = nom - tol

    created = insp['created_at'].replace(' ', 'T') + 'Z' if ' ' in str(insp['created_at']) else str(insp['created_at'])
    
    # Use relative image url so it works on GitHub Pages
    img_url = insp['image_url']
    if img_url and img_url.startswith('/'):
        img_url = '.' + img_url
    annot_url = insp['annotated_image_url']
    if annot_url and annot_url.startswith('/'):
        annot_url = '.' + annot_url

    p_obj = part_map.get(insp['part_id'])
    m_obj = machine_map.get(insp['machine_id'])

    # Map signal string to HardwareSignal 'GO' | 'HOLD' | 'STOP'
    raw_sig = str(insp['hardware_signal'] or '').upper()
    if 'STOP' in raw_sig:
        hw_sig = 'STOP'
    elif 'HOLD' in raw_sig:
        hw_sig = 'HOLD'
    else:
        hw_sig = 'GO'

    inspections_ts.append({
        "id": insp['id'],
        "part_id": insp['part_id'],
        "machine_id": insp['machine_id'],
        "inspector_id": insp['inspector_id'],
        "outcome": insp['outcome'],
        "confidence": float(insp['confidence']),
        "image_url": img_url,
        "annotated_image_url": annot_url,
        "defect_classes": defects,
        "measurements": meas,
        "hardware_signal": hw_sig,
        "interlock_ack": bool(insp['interlock_ack']),
        "response_time_ms": float(insp['response_time_ms'] or 12.0),
        "reviewed": bool(insp['reviewed']),
        "reviewer_id": insp['reviewer_id'],
        "reviewer_notes": insp['reviewer_notes'],
        "override_outcome": insp['override_outcome'],
        "created_at": created,
        "part": p_obj,
        "machine": m_obj
    })

# Build alerts
alerts_ts = []
for a in db['alerts']:
    created = a['created_at'].replace(' ', 'T') + 'Z' if ' ' in str(a['created_at']) else str(a['created_at'])
    resolved = a['resolved_at'].replace(' ', 'T') + 'Z' if a.get('resolved_at') and ' ' in str(a['resolved_at']) else None
    alerts_ts.append({
        "id": a['id'],
        "severity": a['severity'],
        "title": a['title'],
        "message": a['message'],
        "machine_id": a['machine_id'],
        "inspection_id": a['inspection_id'],
        "is_read": bool(a['is_read']),
        "is_resolved": bool(a['is_resolved']),
        "resolved_at": resolved,
        "created_at": created
    })

# Build interlock events
events_ts = []
for ev in db['interlock_events']:
    snap = json.loads(ev['telemetry_snapshot']) if isinstance(ev['telemetry_snapshot'], str) else (ev['telemetry_snapshot'] or {})
    ts = ev['timestamp'].replace(' ', 'T') + 'Z' if ' ' in str(ev['timestamp']) else str(ev['timestamp'])
    events_ts.append({
        "id": ev['id'],
        "machine_id": ev['machine_id'],
        "inspection_id": ev['inspection_id'],
        "signal_type": ev['signal_type'],
        "relay_pin": ev['relay_pin'],
        "reason": ev['reason'],
        "response_time_ms": float(ev['response_time_ms'] or 12.0),
        "plc_acknowledged": bool(ev['plc_acknowledged']),
        "telemetry_snapshot": snap,
        "timestamp": ts
    })

output_ts = f"""import {{
  User,
  Part,
  Machine,
  Inspection,
  Alert,
  HardwareStatus,
  InterlockEvent,
  DashboardStats,
  TrendDataPoint,
}} from '../types';

export const mockUsers: Record<string, User> = {{
  administrator: {{
    id: 1,
    email: 'admin@partsight.ai',
    username: 'admin',
    full_name: 'Dr. Marcus Vance (Chief Automation Engineer)',
    role: 'administrator',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  }},
  quality_inspector: {{
    id: 2,
    email: 'inspector@partsight.ai',
    username: 'inspector',
    full_name: 'Elena Rostova (Lead Quality Inspector)',
    role: 'quality_inspector',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  }},
  operator: {{
    id: 3,
    email: 'operator@partsight.ai',
    username: 'operator',
    full_name: 'Jack Reynolds (Cell 4 CNC Operator)',
    role: 'operator',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  }},
}};

export const mockParts: Part[] = {json.dumps(parts_ts, indent=2)};

export const mockMachines: Machine[] = {json.dumps(machines_ts, indent=2)};

export const mockInspections: Inspection[] = {json.dumps(inspections_ts, indent=2)};

export const mockAlerts: Alert[] = {json.dumps(alerts_ts, indent=2)};

export const mockHardwareStatus: HardwareStatus = {{
  plc_connected: true,
  controller_type: 'Siemens S7-1500F Safety Integrated SIL 3',
  cycle_time_ms: 12.4,
  interlock_state: 'ACTIVE_GO',
  digital_outputs: {{
    DO_0_GO: true,
    DO_1_HOLD: false,
    DO_2_STOP: false,
    DO_3_DIVERT: false,
    DO_4_ALARM_STROBE: false,
  }},
  safety_circuit_ok: true,
  recent_events: {json.dumps(events_ts[:20], indent=2)},
}};

export function getMockDashboardStats(): DashboardStats {{
  const total = mockInspections.length;
  const passCount = mockInspections.filter((i) => i.outcome === 'PASS').length;
  const failCount = mockInspections.filter((i) => i.outcome === 'FAIL').length;
  const uncertainCount = mockInspections.filter((i) => i.outcome === 'UNCERTAIN').length;
  const queueCount = mockInspections.filter((i) => !i.reviewed && (i.outcome === 'UNCERTAIN' || i.outcome === 'FAIL')).length;
  const openAlerts = mockAlerts.filter((a) => !a.is_resolved).length;
  const criticalAlerts = mockAlerts.filter((a) => !a.is_resolved && a.severity === 'CRITICAL').length;
  const passRate = total > 0 ? (passCount / total) * 100 : 0;
  const onlineMachines = mockMachines.filter((m) => m.status === 'CONNECTED').length;
  const faultMachines = mockMachines.filter((m) => m.status === 'FAULT').length;

  return {{
    total_inspections: total,
    pass_count: passCount,
    fail_count: failCount,
    uncertain_count: uncertainCount,
    pass_rate_pct: Number(passRate.toFixed(1)),
    defects_caught: failCount,
    open_alerts: openAlerts,
    critical_alerts: criticalAlerts,
    queue_count: queueCount,
    machines_total: mockMachines.length,
    machines_connected: onlineMachines,
    machines_fault: faultMachines,
  }};
}}

export function getMockTrend(days: number = 7): TrendDataPoint[] {{
  // Group real inspections by date
  const dayMap: Record<string, {{ passed: number; failed: number; uncertain: number }}> = {{}};

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {{
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    dayMap[dateStr] = {{ passed: 0, failed: 0, uncertain: 0 }};
  }}

  mockInspections.forEach((insp) => {{
    const dStr = insp.created_at.split('T')[0];
    if (dayMap[dStr]) {{
      if (insp.outcome === 'PASS') dayMap[dStr].passed++;
      else if (insp.outcome === 'FAIL') dayMap[dStr].failed++;
      else dayMap[dStr].uncertain++;
    }}
  }});

  return Object.entries(dayMap).map(([date, counts]) => {{
    const total = counts.passed + counts.failed + counts.uncertain;
    const rate = total > 0 ? (counts.passed / total) * 100 : 100.0;

    return {{
      date,
      total,
      pass: counts.passed,
      fail: counts.failed,
      uncertain: counts.uncertain,
      pass_rate: Number(rate.toFixed(1)),
    }};
  }});
}}

export function getMockDefectDistribution(): {{ name: string; count: number }}[] {{
  const defectCounts: Record<string, number> = {{
    crack: 4,
    burr: 3,
    porosity: 2,
    scratch: 2,
    dent: 1,
    tolerance_deviation: 3,
  }};

  mockInspections.forEach((insp) => {{
    if (Array.isArray(insp.defect_classes)) {{
      insp.defect_classes.forEach((d: any) => {{
        const cName = typeof d === 'string' ? d : d.class || 'other';
        defectCounts[cName] = (defectCounts[cName] || 0) + 1;
      }});
    }}
  }});

  return Object.entries(defectCounts).map(([name, count]) => ({{
    name: name.replace(/_/g, ' ').toUpperCase(),
    count,
  }}));
}}

export function generateMockCsv(outcome?: string): string {{
  const filtered = outcome && outcome !== 'ALL'
    ? mockInspections.filter((i) => i.outcome === outcome)
    : mockInspections;

  const headers = ['ID', 'Part_Code', 'Part_Name', 'Machine_Code', 'Outcome', 'Confidence', 'Signal', 'Reviewed', 'Created_At'];
  const rows = filtered.map((i) => [
    i.id,
    i.part?.code || 'N/A',
    `"${{i.part?.name || 'N/A'}}"`,
    i.machine?.code || 'N/A',
    i.outcome,
    i.confidence,
    i.hardware_signal,
    i.reviewed ? 'YES' : 'NO',
    i.created_at,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\\n');
}}

export function handleMockCreateInspection(formData: FormData): Inspection {{
  const partId = Number(formData.get('part_id')) || 1;
  const machineId = Number(formData.get('machine_id')) || 1;
  const presetType = formData.get('preset_type') as string || 'pass';

  const part = mockParts.find((p) => p.id === partId) || mockParts[0];
  const machine = mockMachines.find((m) => m.id === machineId) || mockMachines[0];

  let outcome: 'PASS' | 'FAIL' | 'UNCERTAIN' = 'PASS';
  let signal: 'GO' | 'HOLD' | 'STOP' = 'GO';
  let conf = 0.985;
  let defects: any[] = [];

  if (presetType.includes('fail')) {{
    outcome = 'FAIL';
    signal = 'STOP';
    conf = 0.96;
    defects = [{{ class: 'crack', severity: 'CRITICAL', description: 'Critical fracture detected' }}];
  }} else if (presetType.includes('uncertain')) {{
    outcome = 'UNCERTAIN';
    signal = 'HOLD';
    conf = 0.64;
    defects = [{{ class: 'porosity', severity: 'WARNING', description: 'Surface porosity near tolerance limit' }}];
  }}

  const newInsp: Inspection = {{
    id: Date.now(),
    part_id: partId,
    machine_id: machineId,
    inspector_id: 1,
    outcome,
    confidence: conf,
    image_url: './uploads/part_PRT-BRK-01_1328152871bc_raw.png',
    annotated_image_url: './uploads/annotated/part_PRT-BRK-01_1328152871bc_annotated.png',
    defect_classes: defects,
    measurements: {{
      length: {{
        nominal: 35.0,
        measured: 35.01,
        tolerance: 0.05,
        deviation: 0.01,
        ratio_pct: 20,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 35.05,
        lower_limit: 34.95,
      }},
    }},
    hardware_signal: signal,
    interlock_ack: true,
    response_time_ms: 11.5,
    reviewed: outcome === 'PASS',
    created_at: new Date().toISOString(),
    part,
    machine,
  }};

  mockInspections.unshift(newInsp);
  return newInsp;
}}

export function handleMockReviewInspection(id: number, decision: 'PASS' | 'FAIL', notes: string): Inspection {{
  const found = mockInspections.find((i) => i.id === id);
  if (found) {{
    found.reviewed = true;
    found.reviewer_notes = notes;
    found.override_outcome = decision;
    found.reviewed_at = new Date().toISOString();
    return found;
  }}
  return mockInspections[0];
}}

export function handleMockDeleteInspection(id: number): {{ message: string }} {{
  const idx = mockInspections.findIndex((i) => i.id === id);
  if (idx !== -1) {{
    mockInspections.splice(idx, 1);
  }}
  return {{ message: `Inspection ${{id}} deleted successfully` }};
}}

export function triggerMockEmergencyStop(reason?: string, machineId?: number): any {{
  mockHardwareStatus.interlock_state = 'HARD_STOP_TRIPPED';
  mockHardwareStatus.safety_circuit_ok = false;
  mockHardwareStatus.digital_outputs.DO_0_GO = false;
  mockHardwareStatus.digital_outputs.DO_2_STOP = true;

  const event: InterlockEvent = {{
    id: Date.now(),
    machine_id: machineId || 1,
    inspection_id: null,
    signal_type: 'EMERGENCY_STOP',
    relay_pin: 'DO_2_STOP',
    reason: reason || 'Manual E-STOP triggered',
    response_time_ms: 11.2,
    plc_acknowledged: true,
    telemetry_snapshot: {{ outputs: mockHardwareStatus.digital_outputs }},
    timestamp: new Date().toISOString(),
  }};

  mockHardwareStatus.recent_events.unshift(event);
  return {{ status: 'STOP_ENGAGED', event }};
}}

export function resetMockInterlock(machineId?: number): any {{
  mockHardwareStatus.interlock_state = 'ACTIVE_GO';
  mockHardwareStatus.safety_circuit_ok = true;
  mockHardwareStatus.digital_outputs.DO_0_GO = true;
  mockHardwareStatus.digital_outputs.DO_2_STOP = false;

  const event: InterlockEvent = {{
    id: Date.now(),
    machine_id: machineId || 1,
    inspection_id: null,
    signal_type: 'RESET',
    relay_pin: 'DO_0_GO',
    reason: 'Safety circuit reset',
    response_time_ms: 12.0,
    plc_acknowledged: true,
    telemetry_snapshot: {{ outputs: mockHardwareStatus.digital_outputs }},
    timestamp: new Date().toISOString(),
  }};

  mockHardwareStatus.recent_events.unshift(event);
  return {{ status: 'PERMISSIVE_ARMED', event }};
}}
"""

with open('frontend/src/api/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(output_ts)

print("Generated frontend/src/api/mockData.ts successfully!")
