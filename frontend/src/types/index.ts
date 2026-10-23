export type UserRole = 'administrator' | 'quality_inspector' | 'operator';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface NominalDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
  [key: string]: any;
}

export interface Tolerances {
  length?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface Part {
  id: number;
  code: string;
  name: string;
  description: string | null;
  material: string | null;
  defect_classes: string[];
  nominal_dimensions: NominalDimensions;
  tolerances: Tolerances;
  cad_reference?: string | null;
  sample_image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export type MachineStatus = 'CONNECTED' | 'DISCONNECTED' | 'FAULT' | 'MAINTENANCE';
export type MachineType = 'camera_station' | 'laser_station' | 'plc_controller' | 'hybrid';

export interface Machine {
  id: number;
  name: string;
  code: string;
  status: MachineStatus;
  station: string;
  machine_type: MachineType;
  ip_address?: string;
  protocol?: string;
  telemetry?: Record<string, any>;
  is_active: boolean;
  last_heartbeat: string;
  created_at: string;
}

export interface DefectItem {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  severity: 'CRITICAL' | 'WARNING' | 'MINOR';
  area_px?: number;
  description?: string;
}

export interface DimensionValidation {
  nominal: number;
  measured: number;
  tolerance: number;
  deviation: number;
  ratio_pct: number;
  status: 'PASS' | 'BORDERLINE' | 'FAIL';
  unit: string;
  upper_limit: number;
  lower_limit: number;
}

export type InspectionOutcome = 'PASS' | 'FAIL' | 'UNCERTAIN';
export type HardwareSignal = 'GO' | 'HOLD' | 'STOP';

export interface Inspection {
  id: number;
  part_id: number;
  machine_id: number;
  inspector_id?: number | null;
  outcome: InspectionOutcome;
  confidence: number;
  image_url: string | null;
  annotated_image_url: string | null;
  defect_classes: DefectItem[];
  measurements: Record<string, DimensionValidation>;
  hardware_signal: HardwareSignal;
  interlock_ack: boolean;
  response_time_ms: number;
  reviewed: boolean;
  reviewer_id?: number | null;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
  override_outcome?: string | null;
  created_at: string;
  part?: Part;
  machine?: Machine;
  inspector?: User;
  reviewer?: User;
}

export interface Alert {
  id: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  machine_id?: number | null;
  inspection_id?: number | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
}

export interface InterlockEvent {
  id: number;
  machine_id?: number | null;
  inspection_id?: number | null;
  signal_type: string;
  relay_pin: string;
  reason: string;
  response_time_ms: number;
  plc_acknowledged: boolean;
  telemetry_snapshot: Record<string, any>;
  timestamp: string;
}

export interface HardwareStatus {
  plc_connected: boolean;
  controller_type: string;
  cycle_time_ms: number;
  interlock_state: 'ACTIVE_GO' | 'HOLD_ENGAGED' | 'HARD_STOP_TRIPPED';
  digital_outputs: {
    DO_0_GO: boolean;
    DO_1_HOLD: boolean;
    DO_2_STOP: boolean;
    DO_3_DIVERT: boolean;
    DO_4_ALARM_STROBE: boolean;
  };
  safety_circuit_ok: boolean;
  recent_events: InterlockEvent[];
}

export interface DashboardStats {
  total_inspections: number;
  pass_count: number;
  fail_count: number;
  uncertain_count: number;
  pass_rate_pct: number;
  defects_caught: number;
  open_alerts: number;
  critical_alerts: number;
  queue_count: number;
  machines_total: number;
  machines_connected: number;
  machines_fault: number;
}

export interface TrendDataPoint {
  date: string;
  total: number;
  pass: number;
  fail: number;
  uncertain: number;
  pass_rate: number;
}
