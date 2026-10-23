export type ManufacturingMachineType =
  | 'CNC_MILLING'
  | 'CNC_LATHE'
  | 'LASER_CUTTING'
  | 'ROBOTIC_WELDING'
  | 'CMM_INSPECTION'
  | 'OPTICAL_3D_SCANNER'
  | 'PRESS_BRAKE'
  | 'CONVEYOR_ASSEMBLY'
  | 'INJECTION_MOLDING'
  | 'EDM_MACHINE';

export type MachineCellStatus =
  | 'RUNNING'
  | 'IDLE'
  | 'FAULT'
  | 'SETUP_MODE'
  | 'OFFLINE';

export interface FacilityZone {
  id: string;
  name: string;
  location: string;
  max_capacity: number;
  supervisor: string;
  notes?: string;
  created_at: string;
}

export interface MachineParametersConfig {
  // CNC Parameters
  spindle_speed_rpm?: number;
  feed_rate_mm_min?: number;
  cutting_depth_mm?: number;
  tool_number?: string;
  coolant_enabled?: boolean;
  work_offset_x?: number;
  work_offset_y?: number;
  work_offset_z?: number;
  program_number?: string;
  gcode_filename?: string;

  // Laser Cutting Parameters
  laser_power_pct?: number;
  cutting_speed_mm_s?: number;
  focus_distance_mm?: number;
  gas_type?: 'N2' | 'O2' | 'Air';
  gas_pressure_bar?: number;
  pulse_frequency_hz?: number;

  // Robotic Welding Parameters
  weld_current_a?: number;
  weld_voltage_v?: number;
  wire_feed_speed_m_min?: number;
  travel_speed_mm_min?: number;
  gas_flow_l_min?: number;
  weld_program_id?: string;

  // Press Brake / Bending
  bending_force_tons?: number;
  backgauge_position_mm?: number;
  bend_angle_deg?: number;

  // Injection Molding
  clamping_force_tons?: number;
  injection_pressure_bar?: number;
  melt_temperature_c?: number;

  // Conveyor / Assembly
  conveyor_speed_m_min?: number;
  pallet_pitch_mm?: number;

  // CMM / 3D Scanner Metrology
  probe_speed_mm_s?: number;
  scan_resolution_um?: number;
  points_per_second?: number;

  // General Parameters (all machines)
  cycle_time_target_s: number;
  temperature_limit_c: number;
  pressure_limit_bar: number;
  emergency_stop_threshold_ms: number;
  quality_check_interval_cycles: number;
}

export interface ManufacturingMachine {
  id: string;
  name: string;
  code: string;
  type: ManufacturingMachineType;
  facility_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  install_date: string;
  maintenance_interval_days: number;
  last_maintenance_date: string;
  operator: string;
  notes: string;
  status: MachineCellStatus;
  uptime_pct: number;
  cycle_count: number;
  parameters: MachineParametersConfig;
  created_at: string;
}

export interface ValidationIssue {
  field: string;
  label: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ProgramValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface SavedMachineProgram {
  id: string;
  name: string;
  program_number: string;
  machine_type: ManufacturingMachineType;
  machine_id?: string;
  part_number_tag?: string;
  material_tag?: string;
  description?: string;
  parameters: MachineParametersConfig;
  created_at: string;
  updated_at: string;
}
