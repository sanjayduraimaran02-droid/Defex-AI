import {
  ManufacturingMachine,
  ManufacturingMachineType,
  FacilityZone,
  MachineCellStatus,
  MachineParametersConfig,
  ProgramValidationResult,
  ValidationIssue,
  SavedMachineProgram,
} from '../types/machineCells';

export const MACHINE_TYPE_METADATA: Record<
  ManufacturingMachineType,
  { label: string; prefix: string; icon: string; category: string }
> = {
  CNC_MILLING: {
    label: 'CNC Milling Machine',
    prefix: 'CNC-MILL',
    icon: 'Drill',
    category: 'Subtractive Machining',
  },
  CNC_LATHE: {
    label: 'CNC Lathe Machine',
    prefix: 'CNC-LTH',
    icon: 'Disc',
    category: 'Turning & Boring',
  },
  LASER_CUTTING: {
    label: 'Laser Cutting Machine',
    prefix: 'LSR-CUT',
    icon: 'Flame',
    category: 'Thermal & Optical Fabrication',
  },
  ROBOTIC_WELDING: {
    label: 'Robotic Welding Arm',
    prefix: 'ROB-WLD',
    icon: 'Bot',
    category: 'Automated Joining',
  },
  CMM_INSPECTION: {
    label: 'CMM (Coordinate Measuring Machine)',
    prefix: 'CMM-MET',
    icon: 'Ruler',
    category: 'Dimensional Metrology',
  },
  OPTICAL_3D_SCANNER: {
    label: '3D Scanner / Optical Inspection',
    prefix: 'OPT-SCN',
    icon: 'Scan',
    category: 'Visual & Surface Inspection',
  },
  PRESS_BRAKE: {
    label: 'Press Brake Machine',
    prefix: 'PRS-BRK',
    icon: 'Layers',
    category: 'Sheet Metal Forming',
  },
  CONVEYOR_ASSEMBLY: {
    label: 'Conveyor Assembly Line',
    prefix: 'CNV-ASY',
    icon: 'Workflow',
    category: 'Material Handling & Transfer',
  },
  INJECTION_MOLDING: {
    label: 'Injection Molding Machine',
    prefix: 'INJ-MLD',
    icon: 'Boxes',
    category: 'Polymer Processing',
  },
  EDM_MACHINE: {
    label: 'EDM (Electrical Discharge Machine)',
    prefix: 'EDM-PRC',
    icon: 'Zap',
    category: 'High-Precision Spark Erosion',
  },
};

const DEFAULT_FACILITIES: FacilityZone[] = [
  {
    id: 'fac-cell-a',
    name: 'Cell A - High-Speed CNC Zone',
    location: 'Building 1 · East Gantry Bay',
    max_capacity: 6,
    supervisor: 'Elena Rostova (Lead CAM/Machining)',
    notes: 'Heavy-duty 5-axis aerospace and precision automotive components.',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'fac-cell-b',
    name: 'Cell B - Precision Laser & Sheet Fab',
    location: 'Building 1 · South Heavy Bay',
    max_capacity: 4,
    supervisor: 'Marcus Vance (Fabrication Lead)',
    notes: 'Fiber laser cutting, press brake forming, and robotic MIG/TIG welding.',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'fac-bay-3',
    name: 'Bay 3 - Automated Assembly & Conveyor',
    location: 'Building 2 · Assembly Pavilion',
    max_capacity: 5,
    supervisor: 'Dave Kincaid (Automation Specialist)',
    notes: 'High-throughput robotic pick & place and palletized assembly line.',
    created_at: '2026-03-10T08:00:00Z',
  },
  {
    id: 'fac-bay-4',
    name: 'Bay 4 - Clean Metrology & Inspection Lab',
    location: 'Building 2 · Climate Controlled Zone 20°C ± 0.5',
    max_capacity: 4,
    supervisor: 'Dr. Aris Thorne (Quality Assurance Director)',
    notes: 'Laser interferometry, automated CMM scanning, and optical Defex AI cells.',
    created_at: '2026-03-22T08:00:00Z',
  },
];

const DEFAULT_MACHINES: ManufacturingMachine[] = [
  {
    id: 'mach-001',
    name: '5-Axis Gantry Mill #1',
    code: 'CNC-MILL-001',
    type: 'CNC_MILLING',
    facility_id: 'fac-cell-a',
    manufacturer: 'Haas Automation',
    model: 'VF-2SS Super-Speed',
    serial_number: 'SN-HAAS-99214',
    install_date: '2024-04-12',
    maintenance_interval_days: 60,
    last_maintenance_date: '2026-09-18',
    operator: 'Marcus Vance',
    notes: 'Equipped with Renishaw wireless touch probe and high-pressure through-spindle coolant.',
    status: 'RUNNING',
    uptime_pct: 99.4,
    cycle_count: 14280,
    parameters: {
      spindle_speed_rpm: 12500,
      feed_rate_mm_min: 2400,
      cutting_depth_mm: 2.5,
      tool_number: 'Tool 4 (12mm Carbide Endmill)',
      coolant_enabled: true,
      work_offset_x: 0.0,
      work_offset_y: -12.45,
      work_offset_z: 145.2,
      program_number: 'O1004',
      gcode_filename: 'AEROSPACE_GEARBOX_HOUSING.NC',
      cycle_time_target_s: 75,
      temperature_limit_c: 70,
      pressure_limit_bar: 35,
      emergency_stop_threshold_ms: 25,
      quality_check_interval_cycles: 5,
    },
    created_at: '2024-04-12T10:00:00Z',
  },
  {
    id: 'mach-002',
    name: 'Precision Twin-Spindle Lathe',
    code: 'CNC-LTH-002',
    type: 'CNC_LATHE',
    facility_id: 'fac-cell-a',
    manufacturer: 'DMG MORI',
    model: 'NLX 2500 | 700',
    serial_number: 'SN-DMG-44102',
    install_date: '2024-06-20',
    maintenance_interval_days: 90,
    last_maintenance_date: '2026-08-30',
    operator: 'Elena Rostova',
    notes: 'Live-tooling turret for turning splines, flanges, and bearing collars.',
    status: 'RUNNING',
    uptime_pct: 98.2,
    cycle_count: 22400,
    parameters: {
      spindle_speed_rpm: 3800,
      feed_rate_mm_min: 650,
      cutting_depth_mm: 1.8,
      tool_number: 'Tool 1 (CNMG 432 Roughing)',
      coolant_enabled: true,
      work_offset_x: 120.0,
      work_offset_y: 0.0,
      work_offset_z: -45.0,
      program_number: 'O2020',
      gcode_filename: 'DRIVE_SHAFT_STEPPED.NC',
      cycle_time_target_s: 48,
      temperature_limit_c: 65,
      pressure_limit_bar: 30,
      emergency_stop_threshold_ms: 20,
      quality_check_interval_cycles: 10,
    },
    created_at: '2024-06-20T11:00:00Z',
  },
  {
    id: 'mach-003',
    name: '6kW Fiber Laser Cutter',
    code: 'LSR-CUT-003',
    type: 'LASER_CUTTING',
    facility_id: 'fac-cell-b',
    manufacturer: 'Trumpf',
    model: 'TruLaser 3030 Fiber',
    serial_number: 'SN-TRMPF-8109',
    install_date: '2024-11-05',
    maintenance_interval_days: 45,
    last_maintenance_date: '2026-10-02',
    operator: 'Klaus Richter',
    notes: 'Nitrogen assist gas for burr-free stainless steel and titanium sheet cutting.',
    status: 'RUNNING',
    uptime_pct: 99.1,
    cycle_count: 31200,
    parameters: {
      laser_power_pct: 85,
      cutting_speed_mm_s: 42,
      focus_distance_mm: 1.2,
      gas_type: 'N2',
      gas_pressure_bar: 18.5,
      pulse_frequency_hz: 5000,
      cycle_time_target_s: 30,
      temperature_limit_c: 60,
      pressure_limit_bar: 25,
      emergency_stop_threshold_ms: 15,
      quality_check_interval_cycles: 20,
    },
    created_at: '2024-11-05T09:00:00Z',
  },
  {
    id: 'mach-004',
    name: '6-Axis Robotic Welder',
    code: 'ROB-WLD-004',
    type: 'ROBOTIC_WELDING',
    facility_id: 'fac-cell-b',
    manufacturer: 'FANUC Robotics',
    model: 'ARC Mate 100iD',
    serial_number: 'SN-FNC-55319',
    install_date: '2025-01-18',
    maintenance_interval_days: 60,
    last_maintenance_date: '2026-09-10',
    operator: 'Dave Kincaid',
    notes: 'Fitted with Fronius TPS 400i pulsed synergic GMAW power source.',
    status: 'SETUP_MODE',
    uptime_pct: 96.8,
    cycle_count: 8940,
    parameters: {
      weld_current_a: 185,
      weld_voltage_v: 24.2,
      wire_feed_speed_m_min: 7.8,
      travel_speed_mm_min: 420,
      gas_flow_l_min: 16.0,
      weld_program_id: 'WELD_JOB_CHASSIS_04',
      cycle_time_target_s: 110,
      temperature_limit_c: 85,
      pressure_limit_bar: 20,
      emergency_stop_threshold_ms: 18,
      quality_check_interval_cycles: 2,
    },
    created_at: '2025-01-18T14:00:00Z',
  },
  {
    id: 'mach-005',
    name: 'Bridge Coordinate Measuring Machine',
    code: 'CMM-MET-005',
    type: 'CMM_INSPECTION',
    facility_id: 'fac-bay-4',
    manufacturer: 'Carl Zeiss',
    model: 'MICURA 5/5/5',
    serial_number: 'SN-ZEISS-2031',
    install_date: '2024-02-10',
    maintenance_interval_days: 180,
    last_maintenance_date: '2026-08-15',
    operator: 'Dr. Aris Thorne',
    notes: 'Sub-micron volumetric accuracy (0.8 µm + L/400) scanning probe.',
    status: 'RUNNING',
    uptime_pct: 99.8,
    cycle_count: 4890,
    parameters: {
      probe_speed_mm_s: 15,
      scan_resolution_um: 0.5,
      cycle_time_target_s: 90,
      temperature_limit_c: 24,
      pressure_limit_bar: 6,
      emergency_stop_threshold_ms: 10,
      quality_check_interval_cycles: 1,
    },
    created_at: '2024-02-10T12:00:00Z',
  },
  {
    id: 'mach-006',
    name: 'Blue Light 3D Optical Scanner',
    code: 'OPT-SCN-006',
    type: 'OPTICAL_3D_SCANNER',
    facility_id: 'fac-bay-4',
    manufacturer: 'GOM / ZEISS',
    model: 'ATOS Q 12M',
    serial_number: 'SN-ATOS-1104',
    install_date: '2025-03-01',
    maintenance_interval_days: 120,
    last_maintenance_date: '2026-09-22',
    operator: 'Sanjay Kumar',
    notes: 'Structured blue LED fringe projection for 12-megapixel surface point clouds.',
    status: 'IDLE',
    uptime_pct: 97.4,
    cycle_count: 3410,
    parameters: {
      points_per_second: 1200000,
      scan_resolution_um: 1.2,
      cycle_time_target_s: 45,
      temperature_limit_c: 26,
      pressure_limit_bar: 5,
      emergency_stop_threshold_ms: 12,
      quality_check_interval_cycles: 1,
    },
    created_at: '2025-03-01T15:00:00Z',
  },
  {
    id: 'mach-007',
    name: '130-Ton CNC Press Brake',
    code: 'PRS-BRK-007',
    type: 'PRESS_BRAKE',
    facility_id: 'fac-cell-b',
    manufacturer: 'Amada',
    model: 'HFE 3i 1303',
    serial_number: 'SN-AMADA-673',
    install_date: '2024-08-14',
    maintenance_interval_days: 90,
    last_maintenance_date: '2026-07-28',
    operator: 'Klaus Richter',
    notes: 'Multi-axis backgauge with automatic laser angle measurement system.',
    status: 'IDLE',
    uptime_pct: 95.9,
    cycle_count: 18700,
    parameters: {
      bending_force_tons: 85,
      backgauge_position_mm: 142.5,
      bend_angle_deg: 90.0,
      cycle_time_target_s: 25,
      temperature_limit_c: 55,
      pressure_limit_bar: 220,
      emergency_stop_threshold_ms: 15,
      quality_check_interval_cycles: 10,
    },
    created_at: '2024-08-14T08:00:00Z',
  },
  {
    id: 'mach-008',
    name: 'Automated Pallet Conveyor Line',
    code: 'CNV-ASY-008',
    type: 'CONVEYOR_ASSEMBLY',
    facility_id: 'fac-bay-3',
    manufacturer: 'Bosch Rexroth',
    model: 'TS 2plus Modular',
    serial_number: 'SN-BSH-8820',
    install_date: '2024-05-10',
    maintenance_interval_days: 30,
    last_maintenance_date: '2026-10-12',
    operator: 'Dave Kincaid',
    notes: 'Dual-strand accumulator chain with pneumatic lift-and-locate transfer stations.',
    status: 'RUNNING',
    uptime_pct: 99.6,
    cycle_count: 85400,
    parameters: {
      conveyor_speed_m_min: 14.5,
      pallet_pitch_mm: 320,
      cycle_time_target_s: 18,
      temperature_limit_c: 50,
      pressure_limit_bar: 7,
      emergency_stop_threshold_ms: 10,
      quality_check_interval_cycles: 50,
    },
    created_at: '2024-05-10T09:00:00Z',
  },
  {
    id: 'mach-009',
    name: 'All-Electric Injection Molding Machine',
    code: 'INJ-MLD-009',
    type: 'INJECTION_MOLDING',
    facility_id: 'fac-bay-3',
    manufacturer: 'ENGEL',
    model: 'e-motion 160T',
    serial_number: 'SN-ENGL-3912',
    install_date: '2024-09-02',
    maintenance_interval_days: 60,
    last_maintenance_date: '2026-08-20',
    operator: 'Sarah Jenkins',
    notes: 'Precision medical and automotive polymer gear tooth molding.',
    status: 'FAULT',
    uptime_pct: 92.1,
    cycle_count: 52100,
    parameters: {
      clamping_force_tons: 150,
      injection_pressure_bar: 1650,
      melt_temperature_c: 245,
      cycle_time_target_s: 22,
      temperature_limit_c: 280,
      pressure_limit_bar: 2000,
      emergency_stop_threshold_ms: 20,
      quality_check_interval_cycles: 25,
    },
    created_at: '2024-09-02T13:00:00Z',
  },
  {
    id: 'mach-010',
    name: 'High-Precision Wire EDM',
    code: 'EDM-PRC-010',
    type: 'EDM_MACHINE',
    facility_id: 'fac-cell-a',
    manufacturer: 'GF Machining Solutions',
    model: 'AgieCharmilles CUT P 550',
    serial_number: 'SN-GF-10992',
    install_date: '2025-02-14',
    maintenance_interval_days: 45,
    last_maintenance_date: '2026-10-05',
    operator: 'Marcus Vance',
    notes: '0.05 mm ultra-fine brass wire for aerospace turbine root slots and tight-radius dies.',
    status: 'OFFLINE',
    uptime_pct: 94.7,
    cycle_count: 7600,
    parameters: {
      spindle_speed_rpm: 0,
      feed_rate_mm_min: 4.5,
      cutting_depth_mm: 45.0,
      tool_number: 'Wire #1 (0.10mm Brass)',
      coolant_enabled: true,
      work_offset_x: 0.0,
      work_offset_y: 0.0,
      work_offset_z: 0.0,
      program_number: 'O7701',
      gcode_filename: 'TURBINE_BLADE_ROOT_SLOT.NC',
      cycle_time_target_s: 240,
      temperature_limit_c: 40,
      pressure_limit_bar: 12,
      emergency_stop_threshold_ms: 15,
      quality_check_interval_cycles: 1,
    },
    created_at: '2025-02-14T11:00:00Z',
  },
];

const STORAGE_FACILITIES_KEY = 'defex_machine_facilities_v1';
const STORAGE_MACHINES_KEY = 'defex_manufacturing_machines_v1';

export function getFacilities(): FacilityZone[] {
  try {
    const raw = localStorage.getItem(STORAGE_FACILITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse facilities from localStorage', e);
  }
  localStorage.setItem(STORAGE_FACILITIES_KEY, JSON.stringify(DEFAULT_FACILITIES));
  return DEFAULT_FACILITIES;
}

export function saveFacility(facility: FacilityZone): FacilityZone {
  const current = getFacilities();
  const existingIdx = current.findIndex((f) => f.id === facility.id);
  let updated: FacilityZone[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = facility;
  } else {
    updated = [...current, facility];
  }
  localStorage.setItem(STORAGE_FACILITIES_KEY, JSON.stringify(updated));
  return facility;
}

export function deleteFacility(id: string): boolean {
  const current = getFacilities();
  const updated = current.filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_FACILITIES_KEY, JSON.stringify(updated));
  return true;
}

export function getMachineCells(): ManufacturingMachine[] {
  try {
    const raw = localStorage.getItem(STORAGE_MACHINES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse machines from localStorage', e);
  }
  localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(DEFAULT_MACHINES));
  return DEFAULT_MACHINES;
}

export function getMachineCellById(id: string): ManufacturingMachine | undefined {
  const machines = getMachineCells();
  return machines.find((m) => m.id === id || m.code === id);
}

export function saveMachineCell(machine: ManufacturingMachine): ManufacturingMachine {
  const current = getMachineCells();
  const existingIdx = current.findIndex((m) => m.id === machine.id);
  let updated: ManufacturingMachine[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = machine;
  } else {
    updated = [machine, ...current];
  }
  localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(updated));
  return machine;
}

export function updateMachineCellStatus(
  id: string,
  status: MachineCellStatus
): ManufacturingMachine | undefined {
  const current = getMachineCells();
  const existingIdx = current.findIndex((m) => m.id === id);
  if (existingIdx === -1) return undefined;
  const updated = [...current];
  updated[existingIdx] = { ...updated[existingIdx], status };
  localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(updated));
  return updated[existingIdx];
}

export function updateMachineParameters(
  id: string,
  params: Partial<MachineParametersConfig>
): ManufacturingMachine | undefined {
  const current = getMachineCells();
  const existingIdx = current.findIndex((m) => m.id === id);
  if (existingIdx === -1) return undefined;
  const updated = [...current];
  updated[existingIdx] = {
    ...updated[existingIdx],
    parameters: {
      ...updated[existingIdx].parameters,
      ...params,
    },
  };
  localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(updated));
  return updated[existingIdx];
}

export function deleteMachineCell(id: string): boolean {
  const current = getMachineCells();
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(updated));
  return true;
}

export function validateMachineProgram(
  type: ManufacturingMachineType,
  params: Partial<MachineParametersConfig>
): ProgramValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // General Validation
  if (!params.cycle_time_target_s || params.cycle_time_target_s <= 0) {
    errors.push({
      field: 'cycle_time_target_s',
      label: 'Cycle Time Target',
      message: 'Cycle time target must be specified and greater than 0s.',
      severity: 'ERROR',
    });
  }

  if (!params.temperature_limit_c) {
    errors.push({
      field: 'temperature_limit_c',
      label: 'Temperature Limit',
      message: 'Thermal limit is required for fail-safe damage prevention.',
      severity: 'ERROR',
    });
  } else if (params.temperature_limit_c > 90) {
    warnings.push({
      field: 'temperature_limit_c',
      label: 'Temperature Limit',
      message: 'Temperature limit exceeds 90°C. High risk of thermal distortion.',
      severity: 'WARNING',
    });
  }

  // Type-Specific Validation
  if (type === 'CNC_MILLING' || type === 'CNC_LATHE' || type === 'EDM_MACHINE') {
    if (type !== 'EDM_MACHINE') {
      if (params.spindle_speed_rpm === undefined || params.spindle_speed_rpm <= 0) {
        errors.push({
          field: 'spindle_speed_rpm',
          label: 'Spindle Speed (RPM)',
          message: 'Spindle speed is mandatory for CNC machining.',
          severity: 'ERROR',
        });
      } else if (params.spindle_speed_rpm > 15000) {
        warnings.push({
          field: 'spindle_speed_rpm',
          label: 'Spindle Speed (RPM)',
          message: 'Spindle speed exceeds recommended max (15,000 RPM) for standard tooling.',
          severity: 'WARNING',
        });
      } else if (params.spindle_speed_rpm > 20000) {
        errors.push({
          field: 'spindle_speed_rpm',
          label: 'Spindle Speed (RPM)',
          message: 'Spindle speed cannot exceed hardware bearing rating of 20,000 RPM.',
          severity: 'ERROR',
        });
      }
    }

    if (!params.feed_rate_mm_min || params.feed_rate_mm_min <= 0) {
      errors.push({
        field: 'feed_rate_mm_min',
        label: 'Feed Rate (mm/min)',
        message: 'Feed rate must be defined.',
        severity: 'ERROR',
      });
    } else if (params.feed_rate_mm_min > 3500) {
      warnings.push({
        field: 'feed_rate_mm_min',
        label: 'Feed Rate (mm/min)',
        message: 'High feed rate (>3500 mm/min) may compromise surface finish.',
        severity: 'WARNING',
      });
    }

    if (params.cutting_depth_mm !== undefined && params.cutting_depth_mm > 5.0) {
      warnings.push({
        field: 'cutting_depth_mm',
        label: 'Cutting Depth (mm)',
        message: 'Cutting depth exceeds 5.0mm. Ensure aggressive chip clearance.',
        severity: 'WARNING',
      });
    }
  } else if (type === 'LASER_CUTTING') {
    if (params.laser_power_pct === undefined || params.laser_power_pct <= 0) {
      errors.push({
        field: 'laser_power_pct',
        label: 'Laser Power (%)',
        message: 'Laser power must be between 1% and 100%.',
        severity: 'ERROR',
      });
    } else if (params.laser_power_pct > 92) {
      warnings.push({
        field: 'laser_power_pct',
        label: 'Laser Power (%)',
        message: 'Continuous duty >92% reduces optical fiber lifetime.',
        severity: 'WARNING',
      });
    }

    if (!params.gas_pressure_bar || params.gas_pressure_bar <= 0) {
      errors.push({
        field: 'gas_pressure_bar',
        label: 'Gas Pressure (bar)',
        message: 'Assist gas pressure is required to eject molten kerf.',
        severity: 'ERROR',
      });
    }
  } else if (type === 'ROBOTIC_WELDING') {
    if (!params.weld_current_a || params.weld_current_a <= 0) {
      errors.push({
        field: 'weld_current_a',
        label: 'Weld Current (A)',
        message: 'Weld current must be specified.',
        severity: 'ERROR',
      });
    } else if (params.weld_current_a > 300) {
      warnings.push({
        field: 'weld_current_a',
        label: 'Weld Current (A)',
        message: 'Current exceeds 300A. Verify torch water cooling circuit is active.',
        severity: 'WARNING',
      });
    }

    if (!params.weld_program_id || !params.weld_program_id.trim()) {
      errors.push({
        field: 'weld_program_id',
        label: 'Weld Program ID',
        message: 'Robotic trajectory weld program ID is required.',
        severity: 'ERROR',
      });
    }
  } else if (type === 'INJECTION_MOLDING') {
    if (!params.clamping_force_tons || params.clamping_force_tons <= 0) {
      errors.push({
        field: 'clamping_force_tons',
        label: 'Clamping Force (Tons)',
        message: 'Platen clamp tonnage must be specified to prevent flashing.',
        severity: 'ERROR',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

const STORAGE_PROGRAMS_KEY = 'defex_saved_machine_programs_v1';

const DEFAULT_PROGRAMS: SavedMachineProgram[] = [
  {
    id: 'prog-p1042',
    name: 'P1042 - Shaft Turning v2',
    program_number: 'P1042',
    machine_type: 'CNC_LATHE',
    part_number_tag: 'APG-400',
    material_tag: '4140 Alloy Steel',
    description: 'High-precision stepped shaft turning with dual-pass roughing and carbide finishing.',
    parameters: {
      spindle_speed_rpm: 3800,
      feed_rate_mm_min: 650,
      cutting_depth_mm: 1.8,
      tool_number: 'Tool 1 (CNMG 432 Roughing)',
      coolant_enabled: true,
      work_offset_x: 120.0,
      work_offset_y: 0.0,
      work_offset_z: -45.0,
      program_number: 'P1042',
      gcode_filename: 'DRIVE_SHAFT_STEPPED_V2.NC',
      cycle_time_target_s: 48,
      temperature_limit_c: 65,
      pressure_limit_bar: 30,
      emergency_stop_threshold_ms: 20,
      quality_check_interval_cycles: 10,
    },
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-03-01T14:20:00Z',
  },
  {
    id: 'prog-p1004',
    name: 'P1004 - Aerospace Gearbox Housing v1',
    program_number: 'P1004',
    machine_type: 'CNC_MILLING',
    part_number_tag: 'APG-400',
    material_tag: 'Al 7075-T6',
    description: '5-axis pocketing and high-speed face milling with Renishaw wireless touch probing.',
    parameters: {
      spindle_speed_rpm: 12500,
      feed_rate_mm_min: 2400,
      cutting_depth_mm: 2.5,
      tool_number: 'Tool 4 (12mm Carbide Endmill)',
      coolant_enabled: true,
      work_offset_x: 0.0,
      work_offset_y: -12.45,
      work_offset_z: 145.2,
      program_number: 'P1004',
      gcode_filename: 'AEROSPACE_GEARBOX_HOUSING.NC',
      cycle_time_target_s: 75,
      temperature_limit_c: 70,
      pressure_limit_bar: 35,
      emergency_stop_threshold_ms: 25,
      quality_check_interval_cycles: 5,
    },
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-02-15T11:30:00Z',
  },
  {
    id: 'prog-l3030',
    name: 'L3030 - Titanium Sheet Bracket v3',
    program_number: 'L3030',
    machine_type: 'LASER_CUTTING',
    part_number_tag: 'BKT-500',
    material_tag: 'Ti-6Al-4V Titanium',
    description: 'High-purity Nitrogen assist gas cut with micro-tabs to avoid tip tilt.',
    parameters: {
      laser_power_pct: 85,
      cutting_speed_mm_s: 42,
      focus_distance_mm: 1.2,
      gas_type: 'N2',
      gas_pressure_bar: 18.5,
      pulse_frequency_hz: 5000,
      cycle_time_target_s: 30,
      temperature_limit_c: 60,
      pressure_limit_bar: 25,
      emergency_stop_threshold_ms: 15,
      quality_check_interval_cycles: 20,
    },
    created_at: '2026-02-28T08:30:00Z',
    updated_at: '2026-03-12T16:00:00Z',
  },
  {
    id: 'prog-w400',
    name: 'W400 - Seam Chassis Fillet Weld v1',
    program_number: 'W400',
    machine_type: 'ROBOTIC_WELDING',
    part_number_tag: 'CHS-100',
    material_tag: 'Q235 Steel',
    description: 'Pulsed synergic GMAW fillet weld trajectory for heavy frame sub-assembly.',
    parameters: {
      weld_current_a: 185,
      weld_voltage_v: 24.2,
      wire_feed_speed_m_min: 7.8,
      travel_speed_mm_min: 420,
      gas_flow_l_min: 16.0,
      weld_program_id: 'WELD_JOB_CHASSIS_04',
      cycle_time_target_s: 110,
      temperature_limit_c: 85,
      pressure_limit_bar: 20,
      emergency_stop_threshold_ms: 18,
      quality_check_interval_cycles: 2,
    },
    created_at: '2026-03-05T13:10:00Z',
    updated_at: '2026-03-20T10:45:00Z',
  },
];

export function getSavedPrograms(machineType?: ManufacturingMachineType): SavedMachineProgram[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRAMS_KEY);
    if (raw) {
      const parsed: SavedMachineProgram[] = JSON.parse(raw);
      if (machineType) {
        return parsed.filter((p) => p.machine_type === machineType);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved programs from localStorage', e);
  }
  localStorage.setItem(STORAGE_PROGRAMS_KEY, JSON.stringify(DEFAULT_PROGRAMS));
  if (machineType) {
    return DEFAULT_PROGRAMS.filter((p) => p.machine_type === machineType);
  }
  return DEFAULT_PROGRAMS;
}

export function saveProgram(program: SavedMachineProgram): SavedMachineProgram {
  const current = getSavedPrograms();
  const existingIdx = current.findIndex((p) => p.id === program.id);
  let updated: SavedMachineProgram[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...program, updated_at: new Date().toISOString() };
  } else {
    updated = [program, ...current];
  }
  localStorage.setItem(STORAGE_PROGRAMS_KEY, JSON.stringify(updated));
  return program;
}

export function duplicateProgram(id: string): SavedMachineProgram | null {
  const current = getSavedPrograms();
  const existing = current.find((p) => p.id === id);
  if (!existing) return null;

  const duplicated: SavedMachineProgram = {
    ...existing,
    id: `prog-${Date.now()}`,
    name: `${existing.name} (Copy)`,
    program_number: `${existing.program_number}-CPY`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [duplicated, ...current];
  localStorage.setItem(STORAGE_PROGRAMS_KEY, JSON.stringify(updated));
  return duplicated;
}

export function deleteProgram(id: string): boolean {
  const current = getSavedPrograms();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_PROGRAMS_KEY, JSON.stringify(updated));
  return true;
}

