import {
  User,
  Part,
  Machine,
  Inspection,
  Alert,
  HardwareStatus,
  InterlockEvent,
  DashboardStats,
  TrendDataPoint,
} from '../types';

export const mockUsers: Record<string, User> = {
  administrator: {
    id: 1,
    email: 'admin@defex.ai',
    username: 'admin',
    full_name: 'Dr. Marcus Vance (Chief Automation Engineer)',
    role: 'administrator',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  quality_inspector: {
    id: 2,
    email: 'inspector@defex.ai',
    username: 'inspector',
    full_name: 'Elena Rostova (Lead Quality Inspector)',
    role: 'quality_inspector',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  operator: {
    id: 3,
    email: 'operator@defex.ai',
    username: 'operator',
    full_name: 'Jack Reynolds (Cell 4 CNC Operator)',
    role: 'operator',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
};

export const mockParts: Part[] = [
  {
    id: 1,
    code: 'PRT-BRK-01',
    name: 'High-Performance Brake Caliper Housing',
    description: 'Cast billet mono-block brake caliper housing for high-performance automotive braking systems.',
    material: 'Cast Aluminum 6061-T6',
    defect_classes: ['crack', 'porosity', 'scratch', 'dent', 'burr'],
    nominal_dimensions: { length: 150.0, width: 80.0, height: 45.0, unit: 'mm' },
    tolerances: { length: 0.05, width: 0.05, height: 0.08 },
    cad_reference: 'CAD-BRK-REV-D',
    sample_image_url: null,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 2,
    code: 'PRT-CAM-08',
    name: 'Precision Overhead Camshaft',
    description: 'Precision-ground multi-lobe camshaft for internal combustion valvetrain assembly.',
    material: 'Forged Alloy Steel 4140 (Nitride Hardened)',
    defect_classes: ['scratch', 'dent', 'micro-crack', 'runout', 'burr'],
    nominal_dimensions: { length: 420.0, width: 52.0, height: 52.0, unit: 'mm' },
    tolerances: { length: 0.03, width: 0.02, height: 0.02 },
    cad_reference: 'CAD-CAM-REV-4.1',
    sample_image_url: null,
    is_active: true,
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 3,
    code: 'PRT-TRB-44',
    name: 'Aero-Derivative Turbine Blade',
    description: 'Single-crystal high-pressure gas turbine blade with thermal barrier coating (TBC).',
    material: 'Inconel 718 Nickel Superalloy',
    defect_classes: ['crack', 'porosity', 'coating void', 'dent', 'burr'],
    nominal_dimensions: { length: 185.0, width: 64.0, height: 28.0, unit: 'mm' },
    tolerances: { length: 0.015, width: 0.02, height: 0.01 },
    cad_reference: 'AERO-TRB-718-SPEC',
    sample_image_url: null,
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 4,
    code: 'PRT-MNF-12',
    name: 'Hydraulic Spool Valve Manifold',
    description: 'High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.',
    material: 'Ductile Iron 65-45-12',
    defect_classes: ['burr', 'porosity', 'scratch', 'corrosion'],
    nominal_dimensions: { length: 220.0, width: 140.0, height: 95.0, unit: 'mm' },
    tolerances: { length: 0.08, width: 0.06, height: 0.05 },
    cad_reference: 'HYD-MNF-BLOCK-9',
    sample_image_url: null,
    is_active: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const mockMachines: Machine[] = [
  {
    id: 1,
    name: 'Line 1 Intake Dual-Camera Optical Station',
    code: 'CELL-01-OPTIC',
    status: 'CONNECTED',
    station: 'Line 1 Intake Cell',
    machine_type: 'camera_station',
    ip_address: '192.168.1.101',
    protocol: 'GigE Vision / OPC-UA',
    telemetry: { temperature_c: 34.2, illumination_lux: 12500, sensor_status: 'OPTIMAL' },
    is_active: true,
    last_heartbeat: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Keyence 2D Laser Profilometer Station',
    code: 'CELL-02-LASER',
    status: 'CONNECTED',
    station: 'Line 1 Metrology Cell',
    machine_type: 'laser_station',
    ip_address: '192.168.1.102',
    protocol: 'Modbus-TCP / Ethernet/IP',
    telemetry: { temperature_c: 31.8, laser_frequency_khz: 64.0, calibrated: true },
    is_active: true,
    last_heartbeat: new Date().toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: 'Hexagon Multi-Sensor Hybrid Inspection Cell',
    code: 'CELL-03-HYBRID',
    status: 'CONNECTED',
    station: 'Line 2 Final Inspection Bay',
    machine_type: 'hybrid',
    ip_address: '192.168.1.103',
    protocol: 'OPC-UA Safety / EtherCAT',
    telemetry: { temperature_c: 29.5, axis_interlock_ready: true, vibration_g: 0.02 },
    is_active: true,
    last_heartbeat: new Date().toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 4,
    name: 'Siemens S7-1500F Safety PLC Controller',
    code: 'CELL-04-PLC',
    status: 'CONNECTED',
    station: 'Main Machining Bay Master Interlock',
    machine_type: 'plc_controller',
    ip_address: '192.168.1.120',
    protocol: 'PROFINET / Safety Integrated SIL 3',
    telemetry: { cycle_time_ms: 12.4, estop_tripped: false, relays_armed: true },
    is_active: true,
    last_heartbeat: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// Helper to generate SVG workpiece image data URIs
export function createWorkpieceSvg(partName: string, status: string, defectType?: string): string {
  const color = status === 'PASS' ? '#10B981' : status === 'FAIL' ? '#F43F5E' : '#F59E0B';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#0A0F1D"/>
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" stroke-width="0.7"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="url(#grid)" />
    <!-- Workpiece outline -->
    <rect x="90" y="80" width="420" height="240" rx="14" fill="#131C31" stroke="#334155" stroke-width="2.5"/>
    <circle cx="160" cy="150" r="26" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
    <circle cx="440" cy="150" r="26" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
    <rect x="230" y="130" width="140" height="140" rx="8" fill="#0E1626" stroke="#475569" stroke-width="1.5"/>
    <!-- Laser Metrology Scanning Line -->
    <line x1="90" y1="200" x2="510" y2="200" stroke="#06B6D4" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.7"/>
    ${defectType ? `
      <!-- Defect Bounding Box -->
      <rect x="250" y="150" width="100" height="70" rx="4" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="5,3"/>
      <rect x="250" y="130" width="100" height="18" fill="${color}" opacity="0.9" rx="2"/>
      <text x="300" y="143" text-anchor="middle" fill="#FFFFFF" font-family="monospace" font-size="11" font-weight="bold">${defectType.toUpperCase()}</text>
    ` : ''}
    <text x="300" y="360" text-anchor="middle" fill="#94A3B8" font-family="monospace" font-size="13">${partName}</text>
    <rect x="460" y="24" width="115" height="28" rx="4" fill="${color}20" stroke="${color}" stroke-width="1.5"/>
    <text x="517" y="43" text-anchor="middle" fill="${color}" font-family="monospace" font-size="12" font-weight="bold">[${status}]</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const mockInspections: Inspection[] = [
  {
    id: 101,
    part_id: 1,
    machine_id: 1,
    inspector_id: 1,
    outcome: 'FAIL',
    confidence: 0.94,
    image_url: createWorkpieceSvg('PRT-BRK-01 (Brake Caliper)', 'FAIL', 'crack'),
    annotated_image_url: createWorkpieceSvg('PRT-BRK-01 (Brake Caliper)', 'FAIL', 'crack'),
    defect_classes: [
      {
        class: 'crack',
        confidence: 0.94,
        bbox: [250, 150, 350, 220],
        severity: 'CRITICAL',
        area_px: 1240,
        description: 'Transverse fatigue stress crack on high-pressure piston port land.',
      },
    ],
    measurements: {
      length: {
        nominal: 150.0,
        measured: 150.12,
        tolerance: 0.05,
        deviation: 0.12,
        ratio_pct: 240.0,
        status: 'FAIL',
        unit: 'mm',
        upper_limit: 150.05,
        lower_limit: 149.95,
      },
      width: {
        nominal: 80.0,
        measured: 80.015,
        tolerance: 0.05,
        deviation: 0.015,
        ratio_pct: 30.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 80.05,
        lower_limit: 79.95,
      },
      height: {
        nominal: 45.0,
        measured: 45.032,
        tolerance: 0.08,
        deviation: 0.032,
        ratio_pct: 40.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 45.08,
        lower_limit: 44.92,
      },
    },
    hardware_signal: 'STOP',
    interlock_ack: true,
    response_time_ms: 18.2,
    reviewed: false,
    reviewer_notes: null,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    part: mockParts[0],
    machine: mockMachines[0],
  },
  {
    id: 102,
    part_id: 2,
    machine_id: 2,
    inspector_id: 2,
    outcome: 'UNCERTAIN',
    confidence: 0.65,
    image_url: createWorkpieceSvg('PRT-CAM-08 (Camshaft)', 'UNCERTAIN', 'micro-burr'),
    annotated_image_url: createWorkpieceSvg('PRT-CAM-08 (Camshaft)', 'UNCERTAIN', 'micro-burr'),
    defect_classes: [
      {
        class: 'micro-burr',
        confidence: 0.65,
        bbox: [260, 160, 320, 200],
        severity: 'WARNING',
        area_px: 380,
        description: 'Borderline chamfer edge reflection flagged for supervisor confirmation.',
      },
    ],
    measurements: {
      length: {
        nominal: 420.0,
        measured: 420.027,
        tolerance: 0.03,
        deviation: 0.027,
        ratio_pct: 90.0,
        status: 'BORDERLINE',
        unit: 'mm',
        upper_limit: 420.03,
        lower_limit: 419.97,
      },
      width: {
        nominal: 52.0,
        measured: 52.008,
        tolerance: 0.02,
        deviation: 0.008,
        ratio_pct: 40.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 52.02,
        lower_limit: 51.98,
      },
      height: {
        nominal: 52.0,
        measured: 52.011,
        tolerance: 0.02,
        deviation: 0.011,
        ratio_pct: 55.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 52.02,
        lower_limit: 51.98,
      },
    },
    hardware_signal: 'HOLD',
    interlock_ack: true,
    response_time_ms: 19.5,
    reviewed: false,
    reviewer_notes: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    part: mockParts[1],
    machine: mockMachines[1],
  },
  {
    id: 103,
    part_id: 3,
    machine_id: 3,
    inspector_id: 1,
    outcome: 'PASS',
    confidence: 0.98,
    image_url: createWorkpieceSvg('PRT-TRB-44 (Turbine Blade)', 'PASS'),
    annotated_image_url: createWorkpieceSvg('PRT-TRB-44 (Turbine Blade)', 'PASS'),
    defect_classes: [],
    measurements: {
      length: {
        nominal: 185.0,
        measured: 185.004,
        tolerance: 0.015,
        deviation: 0.004,
        ratio_pct: 26.7,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 185.015,
        lower_limit: 184.985,
      },
      width: {
        nominal: 64.0,
        measured: 64.006,
        tolerance: 0.02,
        deviation: 0.006,
        ratio_pct: 30.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 64.02,
        lower_limit: 63.98,
      },
      height: {
        nominal: 28.0,
        measured: 28.002,
        tolerance: 0.01,
        deviation: 0.002,
        ratio_pct: 20.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 28.01,
        lower_limit: 27.99,
      },
    },
    hardware_signal: 'GO',
    interlock_ack: true,
    response_time_ms: 14.8,
    reviewed: true,
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    part: mockParts[2],
    machine: mockMachines[2],
  },
  {
    id: 104,
    part_id: 4,
    machine_id: 3,
    inspector_id: 3,
    outcome: 'PASS',
    confidence: 0.96,
    image_url: createWorkpieceSvg('PRT-MNF-12 (Valve Manifold)', 'PASS'),
    annotated_image_url: createWorkpieceSvg('PRT-MNF-12 (Valve Manifold)', 'PASS'),
    defect_classes: [],
    measurements: {
      length: {
        nominal: 220.0,
        measured: 220.022,
        tolerance: 0.08,
        deviation: 0.022,
        ratio_pct: 27.5,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 220.08,
        lower_limit: 219.92,
      },
      width: {
        nominal: 140.0,
        measured: 140.015,
        tolerance: 0.06,
        deviation: 0.015,
        ratio_pct: 25.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 140.06,
        lower_limit: 139.94,
      },
      height: {
        nominal: 95.0,
        measured: 95.018,
        tolerance: 0.05,
        deviation: 0.018,
        ratio_pct: 36.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 95.05,
        lower_limit: 94.95,
      },
    },
    hardware_signal: 'GO',
    interlock_ack: true,
    response_time_ms: 16.1,
    reviewed: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    part: mockParts[3],
    machine: mockMachines[2],
  },
  {
    id: 105,
    part_id: 1,
    machine_id: 2,
    inspector_id: 1,
    outcome: 'UNCERTAIN',
    confidence: 0.68,
    image_url: createWorkpieceSvg('PRT-BRK-01 (Brake Caliper)', 'UNCERTAIN', 'porosity'),
    annotated_image_url: createWorkpieceSvg('PRT-BRK-01 (Brake Caliper)', 'UNCERTAIN', 'porosity'),
    defect_classes: [
      {
        class: 'porosity',
        confidence: 0.68,
        bbox: [240, 160, 310, 210],
        severity: 'WARNING',
        area_px: 520,
        description: 'Sub-surface micro-void detected near secondary port seal.',
      },
    ],
    measurements: {
      length: {
        nominal: 150.0,
        measured: 150.044,
        tolerance: 0.05,
        deviation: 0.044,
        ratio_pct: 88.0,
        status: 'BORDERLINE',
        unit: 'mm',
        upper_limit: 150.05,
        lower_limit: 149.95,
      },
      width: {
        nominal: 80.0,
        measured: 80.021,
        tolerance: 0.05,
        deviation: 0.021,
        ratio_pct: 42.0,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 80.05,
        lower_limit: 79.95,
      },
      height: {
        nominal: 45.0,
        measured: 45.035,
        tolerance: 0.08,
        deviation: 0.035,
        ratio_pct: 43.8,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 45.08,
        lower_limit: 44.92,
      },
    },
    hardware_signal: 'HOLD',
    interlock_ack: true,
    response_time_ms: 21.0,
    reviewed: false,
    reviewer_notes: null,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    part: mockParts[0],
    machine: mockMachines[1],
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 1,
    severity: 'CRITICAL',
    title: 'EMERGENCY STOP Tripped on CELL-01-OPTIC',
    message: 'Surface fatigue crack detected on PRT-BRK-01 #101. Hardware relay pin 12 tripped.',
    machine_id: 1,
    inspection_id: 101,
    is_read: false,
    is_resolved: false,
    resolved_at: null,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 2,
    severity: 'WARNING',
    title: 'Borderline Laser Metrology on CELL-02-LASER',
    message: 'PRT-CAM-08 #102 length reached 90% of allowable tolerance band (420.027mm vs max 420.030mm). Station locked.',
    machine_id: 2,
    inspection_id: 102,
    is_read: false,
    is_resolved: false,
    resolved_at: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 3,
    severity: 'INFO',
    title: 'Master Interlock Health Check Acknowledged',
    message: 'Siemens S7-1500F Safety PLC controller returned optimal cycle heartbeat (12.4ms). All relays armed.',
    machine_id: 4,
    inspection_id: null,
    is_read: true,
    is_resolved: true,
    resolved_at: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

export const mockHardwareStatus: HardwareStatus = {
  plc_connected: true,
  controller_type: 'Siemens S7-1500F / Safety Integrated SIL 3',
  cycle_time_ms: 12.4,
  interlock_state: 'ACTIVE_GO',
  digital_outputs: {
    DO_0_GO: true,
    DO_1_HOLD: false,
    DO_2_STOP: false,
    DO_3_DIVERT: false,
    DO_4_ALARM_STROBE: false,
  },
  safety_circuit_ok: true,
  recent_events: [
    {
      id: 1,
      machine_id: 1,
      inspection_id: 101,
      signal_type: 'STOP',
      relay_pin: 'DO_2_STOP',
      reason: 'Critical crack detected on workpiece PRT-BRK-01',
      response_time_ms: 18.2,
      plc_acknowledged: true,
      telemetry_snapshot: { cycle_ms: 12.4, e_stop_tripped: true },
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 2,
      machine_id: 2,
      inspection_id: 102,
      signal_type: 'HOLD',
      relay_pin: 'DO_1_HOLD',
      reason: 'Uncertain borderline metrology tolerance',
      response_time_ms: 19.5,
      plc_acknowledged: true,
      telemetry_snapshot: { cycle_ms: 12.1, station_locked: true },
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ],
};

export function getMockDashboardStats(): DashboardStats {
  const total = mockInspections.length;
  const pass = mockInspections.filter((i) => i.outcome === 'PASS').length;
  const fail = mockInspections.filter((i) => i.outcome === 'FAIL').length;
  const uncertain = mockInspections.filter((i) => i.outcome === 'UNCERTAIN').length;
  const openAlerts = mockAlerts.filter((a) => !a.is_resolved).length;
  const criticalAlerts = mockAlerts.filter((a) => a.severity === 'CRITICAL' && !a.is_resolved).length;
  const queueCount = mockInspections.filter((i) => (i.outcome === 'UNCERTAIN' || i.outcome === 'FAIL') && !i.reviewed).length;

  return {
    total_inspections: total,
    pass_count: pass,
    fail_count: fail,
    uncertain_count: uncertain,
    pass_rate_pct: total > 0 ? parseFloat(((pass / total) * 100).toFixed(1)) : 0,
    defects_caught: fail + uncertain,
    open_alerts: openAlerts,
    critical_alerts: criticalAlerts,
    queue_count: queueCount,
    machines_total: mockMachines.length,
    machines_connected: mockMachines.filter((m) => m.status === 'CONNECTED').length,
    machines_fault: mockMachines.filter((m) => m.status === 'FAULT').length,
  };
}

export function getMockTrend(days: number = 7): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Realistic trend profile
    const total = 18 + ((i * 3) % 7);
    const fail = (i % 3 === 0) ? 2 : 1;
    const uncertain = (i % 2 === 0) ? 2 : 1;
    const pass = total - fail - uncertain;
    const passRate = parseFloat(((pass / total) * 100).toFixed(1));

    points.push({
      date: dateStr,
      total,
      pass,
      fail,
      uncertain,
      pass_rate: passRate,
    });
  }

  return points;
}

export function getMockDefectDistribution(): { name: string; count: number }[] {
  return [
    { name: 'crack', count: 14 },
    { name: 'porosity', count: 9 },
    { name: 'scratch', count: 7 },
    { name: 'burr', count: 5 },
    { name: 'out-of-spec', count: 4 },
  ];
}

export function generateMockCsv(outcomeFilter?: string): string {
  const filtered = outcomeFilter && outcomeFilter !== 'ALL'
    ? mockInspections.filter((i) => i.outcome === outcomeFilter)
    : mockInspections;

  const headers = ['ID', 'Date', 'Part Code', 'Machine', 'Outcome', 'Signal', 'Confidence', 'Reviewed'];
  const rows = filtered.map((i) => [
    i.id,
    i.created_at,
    i.part?.code || 'N/A',
    i.machine?.code || 'N/A',
    i.outcome,
    i.hardware_signal,
    (i.confidence * 100).toFixed(1) + '%',
    i.reviewed ? 'YES' : 'NO',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Interactive Mock Handlers
export function handleMockCreateInspection(formData: FormData): Inspection {
  const partId = Number(formData.get('part_id')) || 1;
  const machineId = Number(formData.get('machine_id')) || 1;
  const presetType = String(formData.get('preset_type') || 'pass');
  const measurementsRaw = formData.get('measurements_json');

  const part = mockParts.find((p) => p.id === partId) || mockParts[0];
  const machine = mockMachines.find((m) => m.id === machineId) || mockMachines[0];

  let measurementsInput: Record<string, number> = {};
  if (typeof measurementsRaw === 'string') {
    try {
      measurementsInput = JSON.parse(measurementsRaw);
    } catch {
      // fallback
    }
  }

  let outcome: 'PASS' | 'FAIL' | 'UNCERTAIN' = 'PASS';
  let hardware_signal: 'GO' | 'STOP' | 'HOLD' = 'GO';
  let confidence = 0.97;
  let defects: any[] = [];

  if (presetType.includes('fail') || presetType === 'fail_crack' || presetType === 'fail_tolerance' || presetType === 'fail_porosity' || presetType === 'fail_burr') {
    outcome = 'FAIL';
    hardware_signal = 'STOP';
    confidence = 0.92;
    const defectType = presetType.includes('crack') ? 'crack' : presetType.includes('burr') ? 'burr' : presetType.includes('porosity') ? 'porosity' : 'out-of-tolerance';
    defects = [
      {
        class: defectType,
        confidence: 0.92,
        bbox: [240, 150, 360, 230],
        severity: 'CRITICAL',
        area_px: 1100,
        description: `Automated detection: ${defectType.toUpperCase()} exceeds critical threshold.`,
      },
    ];
  } else if (presetType.includes('uncertain') || presetType === 'uncertain_borderline') {
    outcome = 'UNCERTAIN';
    hardware_signal = 'HOLD';
    confidence = 0.64;
    defects = [
      {
        class: 'surface-variation',
        confidence: 0.64,
        bbox: [260, 170, 320, 210],
        severity: 'WARNING',
        area_px: 390,
        description: 'Borderline profile variation flagged for supervisor review queue.',
      },
    ];
  }

  // Build measurements
  const measurements: Record<string, any> = {};
  const nominals = part.nominal_dimensions || {};
  const tols = part.tolerances || {};

  ['length', 'width', 'height'].forEach((axis) => {
    const nom = (nominals as any)[axis] ?? 100.0;
    const tol = (tols as any)[axis] ?? 0.05;
    const measuredVal = measurementsInput[axis] !== undefined ? measurementsInput[axis] : nom;
    const dev = parseFloat(Math.abs(measuredVal - nom).toFixed(4));
    const ratio = parseFloat(((dev / tol) * 100).toFixed(1));
    const isOut = dev > tol;
    const isBorder = dev > tol * 0.8 && !isOut;

    measurements[axis] = {
      nominal: nom,
      measured: measuredVal,
      tolerance: tol,
      deviation: dev,
      ratio_pct: ratio,
      status: isOut ? 'FAIL' : isBorder ? 'BORDERLINE' : 'PASS',
      unit: nominals.unit || 'mm',
      upper_limit: nom + tol,
      lower_limit: nom - tol,
    };

    if (isOut) {
      outcome = 'FAIL';
      hardware_signal = 'STOP';
    } else if (isBorder && outcome !== 'FAIL') {
      outcome = 'UNCERTAIN';
      hardware_signal = 'HOLD';
    }
  });

  const newInspection: Inspection = {
    id: Date.now(),
    part_id: part.id,
    machine_id: machine.id,
    inspector_id: 1,
    outcome,
    confidence,
    image_url: createWorkpieceSvg(`${part.code} (${part.name})`, outcome, defects[0]?.class),
    annotated_image_url: createWorkpieceSvg(`${part.code} (${part.name})`, outcome, defects[0]?.class),
    defect_classes: defects,
    measurements,
    hardware_signal,
    interlock_ack: true,
    response_time_ms: 17.5,
    reviewed: outcome === 'PASS',
    reviewer_notes: null,
    created_at: new Date().toISOString(),
    part,
    machine,
  };

  mockInspections.unshift(newInspection);

  // If FAIL or UNCERTAIN, add to hardware events & alerts
  if (outcome === 'FAIL') {
    mockHardwareStatus.interlock_state = 'HARD_STOP_TRIPPED';
    mockHardwareStatus.digital_outputs = {
      DO_0_GO: false,
      DO_1_HOLD: false,
      DO_2_STOP: true,
      DO_3_DIVERT: true,
      DO_4_ALARM_STROBE: true,
    };
    mockAlerts.unshift({
      id: Date.now(),
      severity: 'CRITICAL',
      title: `EMERGENCY STOP Tripped on ${machine.code}`,
      message: `Inspection #${newInspection.id} triggered STOP signal on ${part.code}. Interlock engaged.`,
      machine_id: machine.id,
      inspection_id: newInspection.id,
      is_read: false,
      is_resolved: false,
      resolved_at: null,
      created_at: new Date().toISOString(),
    });
  } else if (outcome === 'UNCERTAIN') {
    mockHardwareStatus.interlock_state = 'HOLD_ENGAGED';
    mockHardwareStatus.digital_outputs = {
      DO_0_GO: false,
      DO_1_HOLD: true,
      DO_2_STOP: false,
      DO_3_DIVERT: false,
      DO_4_ALARM_STROBE: false,
    };
    mockAlerts.unshift({
      id: Date.now(),
      severity: 'WARNING',
      title: `HOLD Signal Engaged on ${machine.code}`,
      message: `Inspection #${newInspection.id} flagged UNCERTAIN for ${part.code}. Routed to review queue.`,
      machine_id: machine.id,
      inspection_id: newInspection.id,
      is_read: false,
      is_resolved: false,
      resolved_at: null,
      created_at: new Date().toISOString(),
    });
  }

  return newInspection;
}

export function handleMockReviewInspection(id: number, decision: 'PASS' | 'FAIL', notes: string): Inspection {
  const item = mockInspections.find((i) => i.id === id);
  if (!item) {
    throw new Error(`Inspection #${id} not found`);
  }

  item.reviewed = true;
  item.override_outcome = decision;
  item.reviewer_notes = notes;
  item.reviewed_at = new Date().toISOString();
  item.hardware_signal = decision === 'PASS' ? 'GO' : 'STOP';

  if (decision === 'PASS') {
    mockHardwareStatus.interlock_state = 'ACTIVE_GO';
    mockHardwareStatus.digital_outputs = {
      DO_0_GO: true,
      DO_1_HOLD: false,
      DO_2_STOP: false,
      DO_3_DIVERT: false,
      DO_4_ALARM_STROBE: false,
    };
  }

  return item;
}

export function triggerMockEmergencyStop(reason?: string, machine_id?: number): HardwareStatus {
  mockHardwareStatus.interlock_state = 'HARD_STOP_TRIPPED';
  mockHardwareStatus.digital_outputs = {
    DO_0_GO: false,
    DO_1_HOLD: false,
    DO_2_STOP: true,
    DO_3_DIVERT: true,
    DO_4_ALARM_STROBE: true,
  };

  const newEvent: InterlockEvent = {
    id: Date.now(),
    machine_id: machine_id ?? 1,
    inspection_id: null,
    signal_type: 'EMERGENCY_STOP',
    relay_pin: 'DO_2_STOP',
    reason: reason || 'Manual Emergency Stop triggered via Hardware Manager',
    response_time_ms: 12.0,
    plc_acknowledged: true,
    telemetry_snapshot: { manual_estop: true },
    timestamp: new Date().toISOString(),
  };

  mockHardwareStatus.recent_events.unshift(newEvent);

  mockAlerts.unshift({
    id: Date.now(),
    severity: 'CRITICAL',
    title: 'MANUAL EMERGENCY STOP TRIGGERED',
    message: reason || 'Manual E-Stop triggered from Station Manager.',
    machine_id: machine_id ?? 1,
    inspection_id: null,
    is_read: false,
    is_resolved: false,
    resolved_at: null,
    created_at: new Date().toISOString(),
  });

  return { ...mockHardwareStatus };
}

export function resetMockInterlock(_machine_id?: number): HardwareStatus {
  mockHardwareStatus.interlock_state = 'ACTIVE_GO';
  mockHardwareStatus.digital_outputs = {
    DO_0_GO: true,
    DO_1_HOLD: false,
    DO_2_STOP: false,
    DO_3_DIVERT: false,
    DO_4_ALARM_STROBE: false,
  };

  const newEvent: InterlockEvent = {
    id: Date.now(),
    machine_id: _machine_id ?? 4,
    inspection_id: null,
    signal_type: 'RESET_CLEAR',
    relay_pin: 'DO_0_GO',
    reason: 'Safety circuit interlock reset by supervisor',
    response_time_ms: 14.2,
    plc_acknowledged: true,
    telemetry_snapshot: { circuit_cleared: true },
    timestamp: new Date().toISOString(),
  };

  mockHardwareStatus.recent_events.unshift(newEvent);
  return { ...mockHardwareStatus };
}

export function handleMockDeleteInspection(id: number): { message: string } {
  const index = mockInspections.findIndex((i) => i.id === id);
  if (index !== -1) {
    mockInspections.splice(index, 1);
  }
  return { message: `Inspection #${id} deleted successfully` };
}
