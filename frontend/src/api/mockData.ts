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
    email: 'admin@partsight.ai',
    username: 'admin',
    full_name: 'Dr. Marcus Vance (Chief Automation Engineer)',
    role: 'administrator',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  },
  quality_inspector: {
    id: 2,
    email: 'inspector@partsight.ai',
    username: 'inspector',
    full_name: 'Elena Rostova (Lead Quality Inspector)',
    role: 'quality_inspector',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  },
  operator: {
    id: 3,
    email: 'operator@partsight.ai',
    username: 'operator',
    full_name: 'Jack Reynolds (Cell 4 CNC Operator)',
    role: 'operator',
    is_active: true,
    created_at: '2026-10-23T05:16:27.046Z',
  },
};

export const mockParts: Part[] = [
  {
    "id": 1,
    "code": "PRT-BRK-01",
    "name": "HMI",
    "description": "It was spread the diesel in the engine",
    "material": "METAL ",
    "defect_classes": [
      "crack",
      "porosity",
      "scratch",
      "dent",
      "burr"
    ],
    "nominal_dimensions": {
      "length": 35,
      "width": 17.5,
      "height": 25,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.05,
      "width": 0.05,
      "height": 0.08
    },
    "cad_reference": "CAD-BRK-REV-D",
    "sample_image_url": null,
    "is_active": true,
    "created_at": "2026-10-23T05:16:27.053332Z"
  },
  {
    "id": 2,
    "code": "PRT-CAM-08",
    "name": "N-HMI",
    "description": "It was spred the diesel for engine ",
    "material": "Metal",
    "defect_classes": [
      "scratch",
      "dent",
      "micro-crack",
      "runout",
      "burr"
    ],
    "nominal_dimensions": {
      "length": 35,
      "width": 20,
      "height": 30,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.03,
      "width": 0.02,
      "height": 0.02
    },
    "cad_reference": "CAD-CAM-REV-4.1",
    "sample_image_url": null,
    "is_active": true,
    "created_at": "2026-10-23T05:16:27.053336Z"
  },
  {
    "id": 3,
    "code": "PRT-TRB-44",
    "name": "Aero-Derivative Turbine Blade",
    "description": "Single-crystal high-pressure gas turbine blade with thermal barrier coating (TBC).",
    "material": "Inconel 718 Nickel Superalloy",
    "defect_classes": [
      "crack",
      "porosity",
      "coating void",
      "dent",
      "burr"
    ],
    "nominal_dimensions": {
      "length": 185.0,
      "width": 64.0,
      "height": 28.0,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.015,
      "width": 0.02,
      "height": 0.01
    },
    "cad_reference": "AERO-TRB-718-SPEC",
    "sample_image_url": null,
    "is_active": false,
    "created_at": "2026-10-23T05:16:27.053337Z"
  },
  {
    "id": 4,
    "code": "PRT-MNF-12",
    "name": "Hydraulic Spool Valve Manifold",
    "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
    "material": "Ductile Iron 65-45-12",
    "defect_classes": [
      "burr",
      "porosity",
      "scratch",
      "corrosion"
    ],
    "nominal_dimensions": {
      "length": 220.0,
      "width": 140.0,
      "height": 95.0,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.08,
      "width": 0.06,
      "height": 0.05
    },
    "cad_reference": "HYD-MNF-BLOCK-9",
    "sample_image_url": null,
    "is_active": false,
    "created_at": "2026-10-23T05:16:27.053338Z"
  },
  {
    "id": 5,
    "code": "PRT-TST-8B64E5",
    "name": "Updated Shaft",
    "description": "",
    "material": "Stainless Steel 316",
    "defect_classes": [
      "crack",
      "burr",
      "scratch"
    ],
    "nominal_dimensions": {
      "length": 200.0,
      "width": 40.0,
      "height": 40.0,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.04,
      "width": 0.02,
      "height": 0.02
    },
    "cad_reference": null,
    "sample_image_url": null,
    "is_active": false,
    "created_at": "2026-10-23T05:16:30.718658Z"
  },
  {
    "id": 6,
    "code": "PRT-TST-5B8312",
    "name": "Updated Shaft",
    "description": "",
    "material": "Stainless Steel 316",
    "defect_classes": [
      "crack",
      "burr",
      "scratch"
    ],
    "nominal_dimensions": {
      "length": 200.0,
      "width": 40.0,
      "height": 40.0,
      "unit": "mm"
    },
    "tolerances": {
      "length": 0.04,
      "width": 0.02,
      "height": 0.02
    },
    "cad_reference": null,
    "sample_image_url": null,
    "is_active": false,
    "created_at": "2026-10-23T05:38:32.858288Z"
  }
];

export const mockMachines: Machine[] = [
  {
    "id": 1,
    "name": "Line 1 Intake Dual-Camera Optical Station",
    "code": "CELL-01-OPTIC",
    "status": "CONNECTED",
    "station": "Line 1 Intake Cell",
    "machine_type": "camera_station",
    "ip_address": "192.168.1.101",
    "protocol": "GigE Vision / OPC-UA",
    "telemetry": {
      "temperature_c": 34.2,
      "illumination_lux": 12500,
      "sensor_status": "OPTIMAL"
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T05:16:27.058134Z",
    "created_at": "2026-10-23T05:16:27.058139Z"
  },
  {
    "id": 2,
    "name": "Keyence 2D Laser Profilometer Station",
    "code": "CELL-02-LASER",
    "status": "CONNECTED",
    "station": "Line 1 Metrology Cell",
    "machine_type": "laser_station",
    "ip_address": "192.168.1.102",
    "protocol": "Modbus-TCP / Ethernet/IP",
    "telemetry": {
      "temperature_c": 31.8,
      "laser_frequency_khz": 64.0,
      "calibrated": true
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T05:16:27.058139Z",
    "created_at": "2026-10-23T05:16:27.058140Z"
  },
  {
    "id": 3,
    "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
    "code": "CELL-03-HYBRID",
    "status": "CONNECTED",
    "station": "Line 2 Final Inspection Bay",
    "machine_type": "hybrid",
    "ip_address": "192.168.1.103",
    "protocol": "OPC-UA Safety / EtherCAT",
    "telemetry": {
      "temperature_c": 29.5,
      "axis_interlock_ready": true,
      "vibration_g": 0.02
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T05:16:27.058141Z",
    "created_at": "2026-10-23T05:16:27.058141Z"
  },
  {
    "id": 4,
    "name": "Siemens S7-1500F Safety PLC Controller",
    "code": "CELL-04-PLC",
    "status": "CONNECTED",
    "station": "Main Machining Bay Master Interlock",
    "machine_type": "plc_controller",
    "ip_address": "192.168.1.120",
    "protocol": "PROFINET / Safety Integrated SIL 3",
    "telemetry": {
      "cycle_time_ms": 12.4,
      "estop_tripped": false,
      "relays_armed": true
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T05:16:27.058142Z",
    "created_at": "2026-10-23T05:16:27.058142Z"
  },
  {
    "id": 5,
    "name": "Updated Scanner",
    "code": "CELL-TST-8B64E5",
    "status": "CONNECTED",
    "station": "Test Bay 9",
    "machine_type": "camera_station",
    "ip_address": "192.168.1.199",
    "protocol": "GigE Vision / OPC-UA",
    "telemetry": {
      "temperature_c": 36.4,
      "air_pressure_bar": 6.2,
      "vibration_rms": 0.12,
      "interlock_engaged": false
    },
    "is_active": false,
    "last_heartbeat": "2026-10-23T05:16:30.767035Z",
    "created_at": "2026-10-23T05:16:30.767827Z"
  },
  {
    "id": 6,
    "name": "Updated Scanner",
    "code": "CELL-TST-5B8312",
    "status": "CONNECTED",
    "station": "Test Bay 9",
    "machine_type": "camera_station",
    "ip_address": "192.168.1.199",
    "protocol": "GigE Vision / OPC-UA",
    "telemetry": {
      "temperature_c": 36.4,
      "air_pressure_bar": 6.2,
      "vibration_rms": 0.12,
      "interlock_engaged": false
    },
    "is_active": false,
    "last_heartbeat": "2026-10-23T05:38:32.905865Z",
    "created_at": "2026-10-23T05:38:32.906717Z"
  },
  {
    "id": 7,
    "name": "bore and sheet",
    "code": "CELL-05-OPTIC",
    "status": "CONNECTED",
    "station": "Line 2 Station 5",
    "machine_type": "camera_station",
    "ip_address": "192.168.1.105",
    "protocol": "GigE Vision / OPC-UA",
    "telemetry": {
      "temperature_c": 36.4,
      "air_pressure_bar": 6.2,
      "vibration_rms": 0.12,
      "interlock_engaged": false
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T07:56:25.760636Z",
    "created_at": "2026-10-23T07:56:25.762718Z"
  },
  {
    "id": 8,
    "name": "bore and sheet",
    "code": "CELL-06-OPTIC",
    "status": "CONNECTED",
    "station": "Line 2 Station 6",
    "machine_type": "camera_station",
    "ip_address": "192.168.1.105",
    "protocol": "GigE Vision / OPC-UA",
    "telemetry": {
      "temperature_c": 36.4,
      "air_pressure_bar": 6.2,
      "vibration_rms": 0.12,
      "interlock_engaged": false
    },
    "is_active": true,
    "last_heartbeat": "2026-10-23T07:56:46.445506Z",
    "created_at": "2026-10-23T07:56:46.446076Z"
  }
];

export const mockInspections: Inspection[] = [
  {
    "id": 5,
    "part_id": 1,
    "machine_id": 1,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-BRK-01_1328152871bc_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_1328152871bc_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 149.9928,
        "tolerance": 0.05,
        "deviation": -0.0072,
        "ratio_pct": 14.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 79.9938,
        "tolerance": 0.05,
        "deviation": -0.0062,
        "ratio_pct": 12.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 44.9673,
        "tolerance": 0.08,
        "deviation": -0.0327,
        "ratio_pct": 40.9,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 11.26,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-17T02:59:27.061248Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  },
  {
    "id": 6,
    "part_id": 2,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-CAM-08_1dac07e78d47_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-CAM-08_1dac07e78d47_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 420.0,
        "measured": 420.0091,
        "tolerance": 0.03,
        "deviation": 0.0091,
        "ratio_pct": 30.3,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 420.03,
        "lower_limit": 419.97
      },
      "width": {
        "nominal": 52.0,
        "measured": 51.9947,
        "tolerance": 0.02,
        "deviation": -0.0053,
        "ratio_pct": 26.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      },
      "height": {
        "nominal": 52.0,
        "measured": 51.9988,
        "tolerance": 0.02,
        "deviation": -0.0012,
        "ratio_pct": 6.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 13.61,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-17T19:00:27.061248Z",
    "part": {
      "id": 2,
      "code": "PRT-CAM-08",
      "name": "N-HMI",
      "description": "It was spred the diesel for engine ",
      "material": "Metal",
      "defect_classes": [
        "scratch",
        "dent",
        "micro-crack",
        "runout",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 20,
        "height": 30,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.03,
        "width": 0.02,
        "height": 0.02
      },
      "cad_reference": "CAD-CAM-REV-4.1",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053336Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 8,
    "part_id": 2,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-CAM-08_c49d18d7bcb1_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-CAM-08_c49d18d7bcb1_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 420.0,
        "measured": 419.9895,
        "tolerance": 0.03,
        "deviation": -0.0105,
        "ratio_pct": 35.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 420.03,
        "lower_limit": 419.97
      },
      "width": {
        "nominal": 52.0,
        "measured": 51.993,
        "tolerance": 0.02,
        "deviation": -0.007,
        "ratio_pct": 35.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      },
      "height": {
        "nominal": 52.0,
        "measured": 52.0028,
        "tolerance": 0.02,
        "deviation": 0.0028,
        "ratio_pct": 14.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 15.71,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-17T19:02:27.061248Z",
    "part": {
      "id": 2,
      "code": "PRT-CAM-08",
      "name": "N-HMI",
      "description": "It was spred the diesel for engine ",
      "material": "Metal",
      "defect_classes": [
        "scratch",
        "dent",
        "micro-crack",
        "runout",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 20,
        "height": 30,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.03,
        "width": 0.02,
        "height": 0.02
      },
      "cad_reference": "CAD-CAM-REV-4.1",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053336Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 14,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-MNF-12_9eb821269cf3_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_9eb821269cf3_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 219.9999,
        "tolerance": 0.08,
        "deviation": -0.0001,
        "ratio_pct": 0.1,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 139.9844,
        "tolerance": 0.06,
        "deviation": -0.0156,
        "ratio_pct": 26.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 95.0158,
        "tolerance": 0.05,
        "deviation": 0.0158,
        "ratio_pct": 31.6,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 11.83,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-20T00:03:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 15,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-MNF-12_aea5428c45c8_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_aea5428c45c8_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 219.9895,
        "tolerance": 0.08,
        "deviation": -0.0105,
        "ratio_pct": 13.1,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 140.0057,
        "tolerance": 0.06,
        "deviation": 0.0057,
        "ratio_pct": 9.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 95.0332,
        "tolerance": 0.05,
        "deviation": 0.0332,
        "ratio_pct": 66.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 15.89,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-20T02:54:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 16,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-MNF-12_0b9e576cb9f7_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_0b9e576cb9f7_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 220.0087,
        "tolerance": 0.08,
        "deviation": 0.0087,
        "ratio_pct": 10.9,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 139.995,
        "tolerance": 0.06,
        "deviation": -0.005,
        "ratio_pct": 8.3,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 95.0063,
        "tolerance": 0.05,
        "deviation": 0.0063,
        "ratio_pct": 12.6,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 11.92,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-19T21:48:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 17,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-MNF-12_75fa01f4f87b_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_75fa01f4f87b_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 220.0375,
        "tolerance": 0.08,
        "deviation": 0.0375,
        "ratio_pct": 46.9,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 140.0011,
        "tolerance": 0.06,
        "deviation": 0.0011,
        "ratio_pct": 1.8,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 94.9933,
        "tolerance": 0.05,
        "deviation": -0.0067,
        "ratio_pct": 13.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 12.52,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-19T19:49:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 18,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-MNF-12_8385d2433e76_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_8385d2433e76_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 219.9935,
        "tolerance": 0.08,
        "deviation": -0.0065,
        "ratio_pct": 8.1,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 140.0138,
        "tolerance": 0.06,
        "deviation": 0.0138,
        "ratio_pct": 23.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 94.99,
        "tolerance": 0.05,
        "deviation": -0.01,
        "ratio_pct": 20.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 13.02,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": "Automatic pass. Dimensions and surface integrity within class-A tolerance.",
    "override_outcome": "PASS",
    "created_at": "2026-10-20T00:00:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 19,
    "part_id": 2,
    "machine_id": 1,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.96,
    "image_url": "./uploads/part_PRT-CAM-08_cf5527f996af_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-CAM-08_cf5527f996af_annotated.png",
    "defect_classes": [
      {
        "class": "crack",
        "confidence": 0.96,
        "bbox": [
          280,
          170,
          460,
          250
        ],
        "severity": "CRITICAL",
        "area_px": 1420,
        "description": "High-severity structural fatigue fracture crossing stress riser"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 420.0,
        "measured": 419.9855,
        "tolerance": 0.03,
        "deviation": -0.0145,
        "ratio_pct": 48.3,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 420.03,
        "lower_limit": 419.97
      },
      "width": {
        "nominal": 52.0,
        "measured": 51.9997,
        "tolerance": 0.02,
        "deviation": -0.0003,
        "ratio_pct": 1.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      },
      "height": {
        "nominal": 52.0,
        "measured": 52.0014,
        "tolerance": 0.02,
        "deviation": 0.0014,
        "ratio_pct": 7.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 11.45,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-20T22:56:27.061248Z",
    "part": {
      "id": 2,
      "code": "PRT-CAM-08",
      "name": "N-HMI",
      "description": "It was spred the diesel for engine ",
      "material": "Metal",
      "defect_classes": [
        "scratch",
        "dent",
        "micro-crack",
        "runout",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 20,
        "height": 30,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.03,
        "width": 0.02,
        "height": 0.02
      },
      "cad_reference": "CAD-CAM-REV-4.1",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053336Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  },
  {
    "id": 20,
    "part_id": 2,
    "machine_id": 1,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.96,
    "image_url": "./uploads/part_PRT-CAM-08_27a7dc2c532e_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-CAM-08_27a7dc2c532e_annotated.png",
    "defect_classes": [
      {
        "class": "crack",
        "confidence": 0.96,
        "bbox": [
          280,
          170,
          460,
          250
        ],
        "severity": "CRITICAL",
        "area_px": 1420,
        "description": "High-severity structural fatigue fracture crossing stress riser"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 420.0,
        "measured": 420.0038,
        "tolerance": 0.03,
        "deviation": 0.0038,
        "ratio_pct": 12.7,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 420.03,
        "lower_limit": 419.97
      },
      "width": {
        "nominal": 52.0,
        "measured": 51.9949,
        "tolerance": 0.02,
        "deviation": -0.0051,
        "ratio_pct": 25.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      },
      "height": {
        "nominal": 52.0,
        "measured": 52.0017,
        "tolerance": 0.02,
        "deviation": 0.0017,
        "ratio_pct": 8.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 52.02,
        "lower_limit": 51.98
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 17.09,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-21T00:28:27.061248Z",
    "part": {
      "id": 2,
      "code": "PRT-CAM-08",
      "name": "N-HMI",
      "description": "It was spred the diesel for engine ",
      "material": "Metal",
      "defect_classes": [
        "scratch",
        "dent",
        "micro-crack",
        "runout",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 20,
        "height": 30,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.03,
        "width": 0.02,
        "height": 0.02
      },
      "cad_reference": "CAD-CAM-REV-4.1",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053336Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  },
  {
    "id": 21,
    "part_id": 1,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.972,
    "image_url": "./uploads/part_PRT-BRK-01_baf8603f4f55_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_baf8603f4f55_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 150.12,
        "tolerance": 0.05,
        "deviation": 0.12,
        "ratio_pct": 240.0,
        "status": "FAIL",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 80.0001,
        "tolerance": 0.05,
        "deviation": 0.0001,
        "ratio_pct": 0.2,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 44.9854,
        "tolerance": 0.08,
        "deviation": -0.0146,
        "ratio_pct": 18.2,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 16.55,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-21T19:42:27.061248Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 22,
    "part_id": 1,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.972,
    "image_url": "./uploads/part_PRT-BRK-01_c0170a05547a_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_c0170a05547a_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 150.12,
        "tolerance": 0.05,
        "deviation": 0.12,
        "ratio_pct": 240.0,
        "status": "FAIL",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 79.9974,
        "tolerance": 0.05,
        "deviation": -0.0026,
        "ratio_pct": 5.2,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 44.9404,
        "tolerance": 0.08,
        "deviation": -0.0596,
        "ratio_pct": 74.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 12.87,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-22T03:44:27.061248Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 23,
    "part_id": 4,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.91,
    "image_url": "./uploads/part_PRT-MNF-12_f354b4d4f358_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-MNF-12_f354b4d4f358_annotated.png",
    "defect_classes": [
      {
        "class": "burr",
        "confidence": 0.91,
        "bbox": [
          135,
          310,
          195,
          470
        ],
        "severity": "CRITICAL",
        "area_px": 860,
        "description": "Excessive machining flash / burr protruding beyond tolerance zone"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 220.0,
        "measured": 220.0156,
        "tolerance": 0.08,
        "deviation": 0.0156,
        "ratio_pct": 19.5,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 220.08,
        "lower_limit": 219.92
      },
      "width": {
        "nominal": 140.0,
        "measured": 140.0048,
        "tolerance": 0.06,
        "deviation": 0.0048,
        "ratio_pct": 8.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 140.06,
        "lower_limit": 139.94
      },
      "height": {
        "nominal": 95.0,
        "measured": 94.9972,
        "tolerance": 0.05,
        "deviation": -0.0028,
        "ratio_pct": 5.6,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 95.05,
        "lower_limit": 94.95
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 14.78,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-21T23:50:27.061248Z",
    "part": {
      "id": 4,
      "code": "PRT-MNF-12",
      "name": "Hydraulic Spool Valve Manifold",
      "description": "High-pressure multi-port hydraulic control manifold with fine-lapped sealing lands.",
      "material": "Ductile Iron 65-45-12",
      "defect_classes": [
        "burr",
        "porosity",
        "scratch",
        "corrosion"
      ],
      "nominal_dimensions": {
        "length": 220.0,
        "width": 140.0,
        "height": 95.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.08,
        "width": 0.06,
        "height": 0.05
      },
      "cad_reference": "HYD-MNF-BLOCK-9",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053338Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 24,
    "part_id": 3,
    "machine_id": 3,
    "inspector_id": 3,
    "outcome": "FAIL",
    "confidence": 0.89,
    "image_url": "./uploads/part_PRT-TRB-44_59c3d4b6252b_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-TRB-44_59c3d4b6252b_annotated.png",
    "defect_classes": [
      {
        "class": "porosity",
        "confidence": 0.89,
        "bbox": [
          430,
          260,
          520,
          360
        ],
        "severity": "CRITICAL",
        "area_px": 620,
        "description": "Cluster of sub-surface gas voids exposed during face milling"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 185.0,
        "measured": 184.9959,
        "tolerance": 0.015,
        "deviation": -0.0041,
        "ratio_pct": 27.3,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 185.015,
        "lower_limit": 184.985
      },
      "width": {
        "nominal": 64.0,
        "measured": 64.0054,
        "tolerance": 0.02,
        "deviation": 0.0054,
        "ratio_pct": 27.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 64.02,
        "lower_limit": 63.98
      },
      "height": {
        "nominal": 28.0,
        "measured": 27.9967,
        "tolerance": 0.01,
        "deviation": -0.0033,
        "ratio_pct": 33.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 28.01,
        "lower_limit": 27.99
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 11.86,
    "reviewed": true,
    "reviewer_id": 2,
    "reviewer_notes": "Confirmed critical failure. Workpiece diverted to scrap hopper.",
    "override_outcome": "FAIL",
    "created_at": "2026-10-23T01:00:27.061248Z",
    "part": {
      "id": 3,
      "code": "PRT-TRB-44",
      "name": "Aero-Derivative Turbine Blade",
      "description": "Single-crystal high-pressure gas turbine blade with thermal barrier coating (TBC).",
      "material": "Inconel 718 Nickel Superalloy",
      "defect_classes": [
        "crack",
        "porosity",
        "coating void",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 185.0,
        "width": 64.0,
        "height": 28.0,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.015,
        "width": 0.02,
        "height": 0.01
      },
      "cad_reference": "AERO-TRB-718-SPEC",
      "sample_image_url": null,
      "is_active": false,
      "created_at": "2026-10-23T05:16:27.053337Z"
    },
    "machine": {
      "id": 3,
      "name": "Hexagon Multi-Sensor Hybrid Inspection Cell",
      "code": "CELL-03-HYBRID",
      "status": "CONNECTED",
      "station": "Line 2 Final Inspection Bay",
      "machine_type": "hybrid",
      "ip_address": "192.168.1.103",
      "protocol": "OPC-UA Safety / EtherCAT",
      "telemetry": {
        "temperature_c": 29.5,
        "axis_interlock_ready": true,
        "vibration_g": 0.02
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058141Z",
      "created_at": "2026-10-23T05:16:27.058141Z"
    }
  },
  {
    "id": 25,
    "part_id": 1,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "UNCERTAIN",
    "confidence": 0.64,
    "image_url": "./uploads/part_PRT-BRK-01_19f80602f2aa_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_19f80602f2aa_annotated.png",
    "defect_classes": [
      {
        "class": "scratch",
        "confidence": 0.64,
        "bbox": [
          330,
          360,
          480,
          410
        ],
        "severity": "WARNING",
        "area_px": 310,
        "description": "Borderline surface tooling witness mark near sealing gasket plane"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 150.0019,
        "tolerance": 0.05,
        "deviation": 0.0019,
        "ratio_pct": 3.8,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 80.047,
        "tolerance": 0.05,
        "deviation": 0.047,
        "ratio_pct": 94.0,
        "status": "BORDERLINE",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 44.9906,
        "tolerance": 0.08,
        "deviation": -0.0094,
        "ratio_pct": 11.8,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "HOLD",
    "interlock_ack": true,
    "response_time_ms": 16.62,
    "reviewed": false,
    "reviewer_id": null,
    "reviewer_notes": null,
    "override_outcome": null,
    "created_at": "2026-10-23T01:24:27.061248Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 27,
    "part_id": 1,
    "machine_id": 2,
    "inspector_id": 3,
    "outcome": "UNCERTAIN",
    "confidence": 0.64,
    "image_url": "./uploads/part_PRT-BRK-01_940c24b8a768_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_940c24b8a768_annotated.png",
    "defect_classes": [
      {
        "class": "scratch",
        "confidence": 0.64,
        "bbox": [
          330,
          360,
          480,
          410
        ],
        "severity": "WARNING",
        "area_px": 310,
        "description": "Borderline surface tooling witness mark near sealing gasket plane"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 149.9868,
        "tolerance": 0.05,
        "deviation": -0.0132,
        "ratio_pct": 26.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 80.047,
        "tolerance": 0.05,
        "deviation": 0.047,
        "ratio_pct": 94.0,
        "status": "BORDERLINE",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 44.9718,
        "tolerance": 0.08,
        "deviation": -0.0282,
        "ratio_pct": 35.2,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "HOLD",
    "interlock_ack": true,
    "response_time_ms": 11.6,
    "reviewed": false,
    "reviewer_id": null,
    "reviewer_notes": null,
    "override_outcome": null,
    "created_at": "2026-10-23T03:26:27.061248Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 2,
      "name": "Keyence 2D Laser Profilometer Station",
      "code": "CELL-02-LASER",
      "status": "CONNECTED",
      "station": "Line 1 Metrology Cell",
      "machine_type": "laser_station",
      "ip_address": "192.168.1.102",
      "protocol": "Modbus-TCP / Ethernet/IP",
      "telemetry": {
        "temperature_c": 31.8,
        "laser_frequency_khz": 64.0,
        "calibrated": true
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058139Z",
      "created_at": "2026-10-23T05:16:27.058140Z"
    }
  },
  {
    "id": 31,
    "part_id": 1,
    "machine_id": 1,
    "inspector_id": 1,
    "outcome": "PASS",
    "confidence": 0.985,
    "image_url": "./uploads/part_PRT-BRK-01_39e0b7274dc8_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_39e0b7274dc8_annotated.png",
    "defect_classes": [],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 149.9953,
        "tolerance": 0.05,
        "deviation": -0.0047,
        "ratio_pct": 9.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 80.001,
        "tolerance": 0.05,
        "deviation": 0.001,
        "ratio_pct": 2.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 45.0046,
        "tolerance": 0.08,
        "deviation": 0.0046,
        "ratio_pct": 5.7,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 12.34,
    "reviewed": true,
    "reviewer_id": null,
    "reviewer_notes": null,
    "override_outcome": null,
    "created_at": "2026-10-23T05:16:31.043662Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  },
  {
    "id": 32,
    "part_id": 1,
    "machine_id": 1,
    "inspector_id": 1,
    "outcome": "UNCERTAIN",
    "confidence": 0.64,
    "image_url": "./uploads/part_PRT-BRK-01_656c21acbb41_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_656c21acbb41_annotated.png",
    "defect_classes": [
      {
        "class": "scratch",
        "confidence": 0.64,
        "bbox": [
          330,
          360,
          480,
          410
        ],
        "severity": "WARNING",
        "area_px": 310,
        "description": "Borderline surface tooling witness mark near sealing gasket plane"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 150.0079,
        "tolerance": 0.05,
        "deviation": 0.0079,
        "ratio_pct": 15.8,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 80.047,
        "tolerance": 0.05,
        "deviation": 0.047,
        "ratio_pct": 94.0,
        "status": "BORDERLINE",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 45.0171,
        "tolerance": 0.08,
        "deviation": 0.0171,
        "ratio_pct": 21.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "GO",
    "interlock_ack": true,
    "response_time_ms": 15.91,
    "reviewed": true,
    "reviewer_id": 1,
    "reviewer_notes": "Cosmetic witness mark outside O-ring sealing groove. Cleared for milling.",
    "override_outcome": "PASS",
    "created_at": "2026-10-23T05:16:31.155483Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  },
  {
    "id": 33,
    "part_id": 1,
    "machine_id": 1,
    "inspector_id": 1,
    "outcome": "FAIL",
    "confidence": 0.96,
    "image_url": "./uploads/part_PRT-BRK-01_3ff573190dda_raw.png",
    "annotated_image_url": "./uploads/annotated/part_PRT-BRK-01_3ff573190dda_annotated.png",
    "defect_classes": [
      {
        "class": "crack",
        "confidence": 0.96,
        "bbox": [
          280,
          170,
          460,
          250
        ],
        "severity": "CRITICAL",
        "area_px": 1420,
        "description": "High-severity structural fatigue fracture crossing stress riser"
      }
    ],
    "measurements": {
      "length": {
        "nominal": 150.0,
        "measured": 149.9823,
        "tolerance": 0.05,
        "deviation": -0.0177,
        "ratio_pct": 35.4,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 150.05,
        "lower_limit": 149.95
      },
      "width": {
        "nominal": 80.0,
        "measured": 79.984,
        "tolerance": 0.05,
        "deviation": -0.016,
        "ratio_pct": 32.0,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 80.05,
        "lower_limit": 79.95
      },
      "height": {
        "nominal": 45.0,
        "measured": 45.0031,
        "tolerance": 0.08,
        "deviation": 0.0031,
        "ratio_pct": 3.9,
        "status": "PASS",
        "unit": "mm",
        "upper_limit": 45.08,
        "lower_limit": 44.92
      }
    },
    "hardware_signal": "STOP",
    "interlock_ack": true,
    "response_time_ms": 9.8,
    "reviewed": false,
    "reviewer_id": null,
    "reviewer_notes": null,
    "override_outcome": null,
    "created_at": "2026-10-23T05:38:33.059570Z",
    "part": {
      "id": 1,
      "code": "PRT-BRK-01",
      "name": "HMI",
      "description": "It was spread the diesel in the engine",
      "material": "METAL ",
      "defect_classes": [
        "crack",
        "porosity",
        "scratch",
        "dent",
        "burr"
      ],
      "nominal_dimensions": {
        "length": 35,
        "width": 17.5,
        "height": 25,
        "unit": "mm"
      },
      "tolerances": {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08
      },
      "cad_reference": "CAD-BRK-REV-D",
      "sample_image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:16:27.053332Z"
    },
    "machine": {
      "id": 1,
      "name": "Line 1 Intake Dual-Camera Optical Station",
      "code": "CELL-01-OPTIC",
      "status": "CONNECTED",
      "station": "Line 1 Intake Cell",
      "machine_type": "camera_station",
      "ip_address": "192.168.1.101",
      "protocol": "GigE Vision / OPC-UA",
      "telemetry": {
        "temperature_c": 34.2,
        "illumination_lux": 12500,
        "sensor_status": "OPTIMAL"
      },
      "is_active": true,
      "last_heartbeat": "2026-10-23T05:16:27.058134Z",
      "created_at": "2026-10-23T05:16:27.058139Z"
    }
  }
];

export const mockAlerts: Alert[] = [
  {
    "id": 1,
    "severity": "CRITICAL",
    "title": "DAMAGE PREVENTION INTERLOCK STOP",
    "message": "Line 1 CNC spindle feed hold engaged. Optical scanner detected structural crack on Camshaft (PRT-CAM-08). Divert solenoid energized.",
    "machine_id": 1,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:36:02.092188Z",
    "created_at": "2026-10-23T04:31:27.061248Z"
  },
  {
    "id": 2,
    "severity": "WARNING",
    "title": "SUPERVISOR QUEUE HOLD",
    "message": "Keyence Profilometer held workpiece PRT-BRK-01 on Line 1 Metrology Cell. Width tolerance at 95% of allowable limit.",
    "machine_id": 2,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:36:02.092188Z",
    "created_at": "2026-10-23T03:06:27.061248Z"
  },
  {
    "id": 3,
    "severity": "WARNING",
    "title": "SURFACE DISCONTINUITY DETECTED",
    "message": "Micro-witness mark on valve manifold seal face PRT-MNF-12. Routed to Quality Inspector for manual sign-off.",
    "machine_id": 3,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:36:02.092188Z",
    "created_at": "2026-10-23T00:16:27.061248Z"
  },
  {
    "id": 4,
    "severity": "INFO",
    "title": "TELECENTRIC OPTICAL RE-CALIBRATION COMPLETED",
    "message": "Cell 1 Dual-Camera optical scale re-calibrated against NIST 10mm glass grid. Standard deviation 0.0004mm.",
    "machine_id": 1,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-22T05:16:27.061248Z",
    "created_at": "2026-10-22T02:16:27.061248Z"
  },
  {
    "id": 5,
    "severity": "INFO",
    "title": "SIEMENS S7-1500F PLC HEARTBEAT VERIFIED",
    "message": "Safety bus cycle check: PROFINET I/O response 12.4ms. All dual-channel safety relays armed.",
    "machine_id": 4,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-21T05:16:27.061248Z",
    "created_at": "2026-10-21T05:16:27.061248Z"
  },
  {
    "id": 6,
    "severity": "CRITICAL",
    "title": "HARD STOP: Damage Prevention Interlock on PRT-BRK-01",
    "message": "Interlock tripped in 9.75ms on Line 1 Intake Dual-Camera Optical Station. Signal: EMERGENCY_STOP_MACHINE. Reason: Critical Surface Defect Detected: crack. Divert solenoid energized.",
    "machine_id": 1,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:36:02.092188Z",
    "created_at": "2026-10-23T05:16:30.931453Z"
  },
  {
    "id": 7,
    "severity": "WARNING",
    "title": "STATION HOLD: PRT-BRK-01 Sent to Review Queue",
    "message": "Pneumatic clamp held part on Line 1 Intake Dual-Camera Optical Station. Signal: HOLD_AND_LOCK_STATION. Routed to supervisor triage queue. Reason: Borderline tolerances or ambiguous defect requiring supervisor sign-off.",
    "machine_id": 1,
    "inspection_id": 32,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:35:54.397580Z",
    "created_at": "2026-10-23T05:16:31.158589Z"
  },
  {
    "id": 8,
    "severity": "CRITICAL",
    "title": "EMERGENCY STOP TRIPPED",
    "message": "Station safety circuit broken: Manual E-STOP Test. All CNC spindles and transfer conveyors locked.",
    "machine_id": null,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:35:45.244934Z",
    "created_at": "2026-10-23T05:16:31.259336Z"
  },
  {
    "id": 9,
    "severity": "CRITICAL",
    "title": "HARD STOP: Damage Prevention Interlock on PRT-BRK-01",
    "message": "Interlock tripped in 9.8ms on Line 1 Intake Dual-Camera Optical Station. Signal: EMERGENCY_STOP_MACHINE. Reason: Critical Surface Defect Detected: crack. Divert solenoid energized.",
    "machine_id": 1,
    "inspection_id": 33,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:35:43.663400Z",
    "created_at": "2026-10-23T05:38:33.061318Z"
  },
  {
    "id": 10,
    "severity": "WARNING",
    "title": "STATION HOLD: PRT-BRK-01 Sent to Review Queue",
    "message": "Pneumatic clamp held part on Line 1 Intake Dual-Camera Optical Station. Signal: HOLD_AND_LOCK_STATION. Routed to supervisor triage queue. Reason: Borderline tolerances or ambiguous defect requiring supervisor sign-off.",
    "machine_id": 1,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:35:43.460299Z",
    "created_at": "2026-10-23T05:38:33.289742Z"
  },
  {
    "id": 11,
    "severity": "CRITICAL",
    "title": "EMERGENCY STOP TRIPPED",
    "message": "Station safety circuit broken: Manual E-STOP Test. All CNC spindles and transfer conveyors locked.",
    "machine_id": null,
    "inspection_id": null,
    "is_read": true,
    "is_resolved": true,
    "resolved_at": "2026-10-23T08:35:40.463324Z",
    "created_at": "2026-10-23T05:38:33.390760Z"
  }
];

export const mockHardwareStatus: HardwareStatus = {
  plc_connected: true,
  controller_type: 'Siemens S7-1500F Safety Integrated SIL 3',
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
    "id": 1,
    "machine_id": 1,
    "inspection_id": 1,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #1 Result: PASS (pass)",
    "response_time_ms": 17.47,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-16T20:57:27.061248Z"
  },
  {
    "id": 2,
    "machine_id": 1,
    "inspection_id": 2,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #2 Result: PASS (pass)",
    "response_time_ms": 15.12,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-17T02:35:27.061248Z"
  },
  {
    "id": 3,
    "machine_id": 1,
    "inspection_id": 3,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #3 Result: PASS (pass)",
    "response_time_ms": 11.29,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-16T19:55:27.061248Z"
  },
  {
    "id": 4,
    "machine_id": 1,
    "inspection_id": 4,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #4 Result: PASS (pass)",
    "response_time_ms": 16.4,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-16T21:52:27.061248Z"
  },
  {
    "id": 5,
    "machine_id": 1,
    "inspection_id": 5,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #5 Result: PASS (pass)",
    "response_time_ms": 11.26,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-17T02:59:27.061248Z"
  },
  {
    "id": 6,
    "machine_id": 2,
    "inspection_id": 6,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #6 Result: PASS (pass)",
    "response_time_ms": 13.61,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-17T19:00:27.061248Z"
  },
  {
    "id": 7,
    "machine_id": 2,
    "inspection_id": 7,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #7 Result: PASS (pass)",
    "response_time_ms": 11.47,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-18T01:41:27.061248Z"
  },
  {
    "id": 8,
    "machine_id": 2,
    "inspection_id": 8,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #8 Result: PASS (pass)",
    "response_time_ms": 15.71,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-17T19:02:27.061248Z"
  },
  {
    "id": 9,
    "machine_id": 2,
    "inspection_id": 9,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #9 Result: PASS (pass)",
    "response_time_ms": 14.19,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-17T19:02:27.061248Z"
  },
  {
    "id": 10,
    "machine_id": 3,
    "inspection_id": 10,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #10 Result: PASS (pass)",
    "response_time_ms": 15.11,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-19T00:10:27.061248Z"
  },
  {
    "id": 11,
    "machine_id": 3,
    "inspection_id": 11,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #11 Result: PASS (pass)",
    "response_time_ms": 13.05,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-19T01:40:27.061248Z"
  },
  {
    "id": 12,
    "machine_id": 3,
    "inspection_id": 12,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #12 Result: PASS (pass)",
    "response_time_ms": 12.15,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-18T20:06:27.061248Z"
  },
  {
    "id": 13,
    "machine_id": 3,
    "inspection_id": 13,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #13 Result: PASS (pass)",
    "response_time_ms": 12.03,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-19T00:41:27.061248Z"
  },
  {
    "id": 14,
    "machine_id": 3,
    "inspection_id": 14,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #14 Result: PASS (pass)",
    "response_time_ms": 11.83,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-20T00:03:27.061248Z"
  },
  {
    "id": 15,
    "machine_id": 3,
    "inspection_id": 15,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #15 Result: PASS (pass)",
    "response_time_ms": 15.89,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-20T02:54:27.061248Z"
  },
  {
    "id": 16,
    "machine_id": 3,
    "inspection_id": 16,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #16 Result: PASS (pass)",
    "response_time_ms": 11.92,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-19T21:48:27.061248Z"
  },
  {
    "id": 17,
    "machine_id": 3,
    "inspection_id": 17,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #17 Result: PASS (pass)",
    "response_time_ms": 12.52,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-19T19:49:27.061248Z"
  },
  {
    "id": 18,
    "machine_id": 3,
    "inspection_id": 18,
    "signal_type": "CLEAR_FOR_MACHINING",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #18 Result: PASS (pass)",
    "response_time_ms": 13.02,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-20T00:00:27.061248Z"
  },
  {
    "id": 19,
    "machine_id": 1,
    "inspection_id": 19,
    "signal_type": "EMERGENCY_STOP_MACHINE",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #19 Result: FAIL (fail_crack)",
    "response_time_ms": 11.45,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-20T22:56:27.061248Z"
  },
  {
    "id": 20,
    "machine_id": 1,
    "inspection_id": 20,
    "signal_type": "EMERGENCY_STOP_MACHINE",
    "relay_pin": "DO_2_STOP",
    "reason": "Inspection #20 Result: FAIL (fail_crack)",
    "response_time_ms": 17.09,
    "plc_acknowledged": true,
    "telemetry_snapshot": {
      "outputs": {
        "DO_0_GO": false,
        "DO_2_STOP": false
      }
    },
    "timestamp": "2026-10-21T00:28:27.061248Z"
  }
],
};

export function getMockDashboardStats(): DashboardStats {
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

  return {
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
  };
}

export function getMockTrend(days: number = 7): TrendDataPoint[] {
  // Group real inspections by date
  const dayMap: Record<string, { passed: number; failed: number; uncertain: number }> = {};

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    dayMap[dateStr] = { passed: 0, failed: 0, uncertain: 0 };
  }

  mockInspections.forEach((insp) => {
    const dStr = insp.created_at.split('T')[0];
    if (dayMap[dStr]) {
      if (insp.outcome === 'PASS') dayMap[dStr].passed++;
      else if (insp.outcome === 'FAIL') dayMap[dStr].failed++;
      else dayMap[dStr].uncertain++;
    }
  });

  return Object.entries(dayMap).map(([date, counts]) => {
    const total = counts.passed + counts.failed + counts.uncertain;
    const rate = total > 0 ? (counts.passed / total) * 100 : 100.0;

    return {
      date,
      total,
      pass: counts.passed,
      fail: counts.failed,
      uncertain: counts.uncertain,
      pass_rate: Number(rate.toFixed(1)),
    };
  });
}

export function getMockDefectDistribution(): { name: string; count: number }[] {
  const defectCounts: Record<string, number> = {
    crack: 4,
    burr: 3,
    porosity: 2,
    scratch: 2,
    dent: 1,
    tolerance_deviation: 3,
  };

  mockInspections.forEach((insp) => {
    if (Array.isArray(insp.defect_classes)) {
      insp.defect_classes.forEach((d: any) => {
        const cName = typeof d === 'string' ? d : d.class || 'other';
        defectCounts[cName] = (defectCounts[cName] || 0) + 1;
      });
    }
  });

  return Object.entries(defectCounts).map(([name, count]) => ({
    name: name.replace(/_/g, ' ').toUpperCase(),
    count,
  }));
}

export function generateMockCsv(outcome?: string): string {
  const filtered = outcome && outcome !== 'ALL'
    ? mockInspections.filter((i) => i.outcome === outcome)
    : mockInspections;

  const headers = ['ID', 'Part_Code', 'Part_Name', 'Machine_Code', 'Outcome', 'Confidence', 'Signal', 'Reviewed', 'Created_At'];
  const rows = filtered.map((i) => [
    i.id,
    i.part?.code || 'N/A',
    `"${i.part?.name || 'N/A'}"`,
    i.machine?.code || 'N/A',
    i.outcome,
    i.confidence,
    i.hardware_signal,
    i.reviewed ? 'YES' : 'NO',
    i.created_at,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function handleMockCreateInspection(formData: FormData): Inspection {
  const partId = Number(formData.get('part_id')) || 1;
  const machineId = Number(formData.get('machine_id')) || 1;
  const presetType = formData.get('preset_type') as string || 'pass';

  const part = mockParts.find((p) => p.id === partId) || mockParts[0];
  const machine = mockMachines.find((m) => m.id === machineId) || mockMachines[0];

  let outcome: 'PASS' | 'FAIL' | 'UNCERTAIN' = 'PASS';
  let signal: 'GO' | 'HOLD' | 'STOP' = 'GO';
  let conf = 0.985;
  let defects: any[] = [];

  if (presetType.includes('fail')) {
    outcome = 'FAIL';
    signal = 'STOP';
    conf = 0.96;
    defects = [{ class: 'crack', severity: 'CRITICAL', description: 'Critical fracture detected' }];
  } else if (presetType.includes('uncertain')) {
    outcome = 'UNCERTAIN';
    signal = 'HOLD';
    conf = 0.64;
    defects = [{ class: 'porosity', severity: 'WARNING', description: 'Surface porosity near tolerance limit' }];
  }

  const newInsp: Inspection = {
    id: Date.now(),
    part_id: partId,
    machine_id: machineId,
    inspector_id: 1,
    outcome,
    confidence: conf,
    image_url: './uploads/part_PRT-BRK-01_1328152871bc_raw.png',
    annotated_image_url: './uploads/annotated/part_PRT-BRK-01_1328152871bc_annotated.png',
    defect_classes: defects,
    measurements: {
      length: {
        nominal: 35.0,
        measured: 35.01,
        tolerance: 0.05,
        deviation: 0.01,
        ratio_pct: 20,
        status: 'PASS',
        unit: 'mm',
        upper_limit: 35.05,
        lower_limit: 34.95,
      },
    },
    hardware_signal: signal,
    interlock_ack: true,
    response_time_ms: 11.5,
    reviewed: outcome === 'PASS',
    created_at: new Date().toISOString(),
    part,
    machine,
  };

  mockInspections.unshift(newInsp);
  return newInsp;
}

export function handleMockReviewInspection(id: number, decision: 'PASS' | 'FAIL', notes: string): Inspection {
  const found = mockInspections.find((i) => i.id === id);
  if (found) {
    found.reviewed = true;
    found.reviewer_notes = notes;
    found.override_outcome = decision;
    found.reviewed_at = new Date().toISOString();
    return found;
  }
  return mockInspections[0];
}

export function handleMockDeleteInspection(id: number): { message: string } {
  const idx = mockInspections.findIndex((i) => i.id === id);
  if (idx !== -1) {
    mockInspections.splice(idx, 1);
  }
  return { message: `Inspection ${id} deleted successfully` };
}

export function triggerMockEmergencyStop(reason?: string, machineId?: number): any {
  mockHardwareStatus.interlock_state = 'HARD_STOP_TRIPPED';
  mockHardwareStatus.safety_circuit_ok = false;
  mockHardwareStatus.digital_outputs.DO_0_GO = false;
  mockHardwareStatus.digital_outputs.DO_2_STOP = true;

  const event: InterlockEvent = {
    id: Date.now(),
    machine_id: machineId || 1,
    inspection_id: null,
    signal_type: 'EMERGENCY_STOP',
    relay_pin: 'DO_2_STOP',
    reason: reason || 'Manual E-STOP triggered',
    response_time_ms: 11.2,
    plc_acknowledged: true,
    telemetry_snapshot: { outputs: mockHardwareStatus.digital_outputs },
    timestamp: new Date().toISOString(),
  };

  mockHardwareStatus.recent_events.unshift(event);
  return { status: 'STOP_ENGAGED', event };
}

export function resetMockInterlock(machineId?: number): any {
  mockHardwareStatus.interlock_state = 'ACTIVE_GO';
  mockHardwareStatus.safety_circuit_ok = true;
  mockHardwareStatus.digital_outputs.DO_0_GO = true;
  mockHardwareStatus.digital_outputs.DO_2_STOP = false;

  const event: InterlockEvent = {
    id: Date.now(),
    machine_id: machineId || 1,
    inspection_id: null,
    signal_type: 'RESET',
    relay_pin: 'DO_0_GO',
    reason: 'Safety circuit reset',
    response_time_ms: 12.0,
    plc_acknowledged: true,
    telemetry_snapshot: { outputs: mockHardwareStatus.digital_outputs },
    timestamp: new Date().toISOString(),
  };

  mockHardwareStatus.recent_events.unshift(event);
  return { status: 'PERMISSIVE_ARMED', event };
}
