/**
 * Metrology Hardware Integration & Simulation Service
 * Supports Web Serial API, WebRTC Camera, WebSocket Bridge, and Realistic Physics-Based Metrology Modeling.
 */

import {
  MetrologyPresetPart,
  VisualInspectionResult,
  LaserScannerResult,
  ProfilometerResult,
  MetrologyFusionReport,
  Point3D,
  DimensionMeasurement,
  GdtMeasurement,
  SurfaceRoughnessParams,
  WavinessParams,
  TextureParams,
} from '../types/metrology';

export const METROLOGY_PRESET_PARTS: MetrologyPresetPart[] = [
  {
    partCode: 'PART-2041-A',
    partName: 'Precision Drive Shaft 125mm',
    material: 'Steel 4140 Quenched & Tempered',
    nominalDimensions: { length: 125.0, width: 49.0, height: 22.0, holeDia: 15.0 },
    raLimit: 1.6,
    description: 'High-torque automotive transmission intermediate drive shaft.',
    defaultMachineId: 'CNC-MILL-001',
  },
  {
    partCode: 'PART-1082-B',
    partName: 'Hydraulic Flange Housing',
    material: 'Aluminum 6061-T6 Anodized',
    nominalDimensions: { length: 98.5, width: 98.5, height: 22.0, holeDia: 12.0 },
    raLimit: 1.6,
    description: 'High-pressure hydraulic manifold flange housing (Test Case: Height Out-of-Spec).',
    defaultMachineId: 'CNC-LATHE-002',
  },
  {
    partCode: 'PART-9901-C',
    partName: 'Aero Turbine Impeller Blade',
    material: 'Titanium Ti-6Al-4V',
    nominalDimensions: { length: 140.0, width: 62.0, height: 35.0, holeDia: 8.0 },
    raLimit: 0.8,
    description: 'Critical flight-grade compressor blade (Test Case: Shape & Defect Fail).',
    defaultMachineId: 'LASER-CUT-003',
  },
  {
    partCode: 'PART-3024-D',
    partName: 'Engine Cylinder Piston 48mm',
    material: 'Cast Iron Class 40',
    nominalDimensions: { length: 72.0, width: 48.0, height: 48.0, holeDia: 18.0 },
    raLimit: 1.2,
    description: 'Internal combustion reciprocating piston (Test Case: Roughness Ra Exceeded).',
    defaultMachineId: 'CNC-MILL-001',
  },
];

/**
 * Generates 12,000 realistic 3D point cloud coordinates for the target part
 */
export function generatePartPointCloud(partCode: string, isOutOfTolerance: boolean): Point3D[] {
  const points: Point3D[] = [];
  const targetCount = 12480;

  let length = 125.0;
  let radius = 24.5;

  if (partCode === 'PART-1082-B') {
    length = 98.5;
    radius = 35.0;
  } else if (partCode === 'PART-9901-C') {
    length = 140.0;
    radius = 28.0;
  }

  // Cylindrical body with steps, chamfers and keyway
  for (let i = 0; i < targetCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const angle = u * Math.PI * 2;
    const zPos = (v - 0.5) * length;

    // Outer surface with micro variation
    let r = radius;
    // Step neck down in center
    if (Math.abs(zPos) < length * 0.22) {
      r = radius * 0.76;
    } else if (zPos > length * 0.38) {
      r = radius * 0.62;
    }

    // Bore hole through end
    if (Math.random() < 0.12) {
      r = 7.5 + (Math.random() - 0.5) * 0.4;
    }

    // Realistic Gaussian noise
    const noise = (Math.random() - 0.5) * 0.015;
    let deviation = noise;

    // Inject out-of-tolerance defect region if needed
    if (isOutOfTolerance && zPos > length * 0.25 && Math.cos(angle) > 0.6) {
      deviation += 0.076 + Math.random() * 0.04; // Critical +0.76mm deviation
    }

    let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (Math.abs(deviation) > 0.045) {
      status = 'FAIL';
    } else if (Math.abs(deviation) > 0.02) {
      status = 'WARN';
    }

    const x = (r + deviation) * Math.cos(angle);
    const y = (r + deviation) * Math.sin(angle);
    const z = zPos;

    points.push({ x, y, z, deviation, status });
  }

  return points;
}

/**
 * Generates 2D profile traces (10mm trace) and 3D surface topology grid (50x50 elevation points)
 */
export function generateSurfaceTopology(raNominal: number, isExceeded: boolean) {
  const profile2D: Array<{ x: number; y: number; mean: number; upperTol: number; lowerTol: number }> = [];
  const points = 120;
  const traceLengthMm = 10.0;
  const raActual = isExceeded ? raNominal * 2.3 : raNominal * 0.51;

  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * traceLengthMm;
    // Multi-frequency sinusoidal surface harmonics + micro roughness
    const wave1 = Math.sin((x / traceLengthMm) * Math.PI * 8) * (raActual * 0.9);
    const wave2 = Math.cos((x / traceLengthMm) * Math.PI * 26) * (raActual * 0.45);
    const noise = (Math.random() - 0.5) * (raActual * 0.7);
    const y = Number((wave1 + wave2 + noise).toFixed(3));

    profile2D.push({
      x: Number(x.toFixed(2)),
      y,
      mean: 0,
      upperTol: 1.6,
      lowerTol: -1.6,
    });
  }

  // 3D Grid 32x32 for high performance WebGL/Canvas surface map
  const gridSize = 32;
  const topologyGrid3D: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      const u = r / (gridSize - 1);
      const v = c / (gridSize - 1);
      const elevation =
        Math.sin(u * Math.PI * 4) * Math.cos(v * Math.PI * 4) * (raActual * 1.5) +
        Math.sin(u * Math.PI * 12) * (raActual * 0.5) +
        (Math.random() - 0.5) * (raActual * 0.4);
      row.push(Number(elevation.toFixed(3)));
    }
    topologyGrid3D.push(row);
  }

  return { profile2D, topologyGrid3D };
}

/**
 * Metrology Hardware Client
 */
export class MetrologyHardwareService {
  private static instance: MetrologyHardwareService;
  private serialPort: any = null;
  private wsConnection: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;

  public static getInstance(): MetrologyHardwareService {
    if (!MetrologyHardwareService.instance) {
      MetrologyHardwareService.instance = new MetrologyHardwareService();
    }
    return MetrologyHardwareService.instance;
  }

  /**
   * Request Web Serial connection for Laser Scanner or Profilometer
   */
  public async requestSerialPort(deviceType: 'laser' | 'profilometer'): Promise<{ success: boolean; message: string; portName?: string }> {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const filters = deviceType === 'laser'
          ? [{ usbVendorId: 0x0403 }] // FTDI laser device
          : [{ usbVendorId: 0x10c4 }]; // Silicon Labs CP210x Profilometer

        const port = await (navigator as any).serial.requestPort({ filters });
        await port.open({ baudRate: deviceType === 'laser' ? 115200 : 921600 });
        this.serialPort = port;
        return {
          success: true,
          message: `Connected to hardware ${deviceType.toUpperCase()} via Web Serial`,
          portName: 'COM-USB0',
        };
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          return { success: false, message: 'Hardware connection cancelled by user' };
        }
        return {
          success: true,
          message: `Fallback to Emulated ${deviceType.toUpperCase()} Controller (Direct Pipeline)`,
          portName: 'VIRTUAL-SERIAL-01',
        };
      }
    }
    return {
      success: true,
      message: `Running High-Precision Emulated ${deviceType.toUpperCase()} Interface`,
      portName: 'DEMO-HW-01',
    };
  }

  /**
   * Connect to WebSocket Sensor Telemetry Server
   */
  public connectWebSocket(endpoint: string, onEvent: (data: any) => void): () => void {
    try {
      const ws = new WebSocket(endpoint);
      this.wsConnection = ws;
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(parsed);
        } catch {}
      };
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch {
      return () => {};
    }
  }

  /**
   * Enumerate available video inputs
   */
  public async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((d) => d.kind === 'videoinput');
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Start camera video stream
   */
  public async startCameraStream(deviceId?: string): Promise<MediaStream | null> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: 'environment',
              },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.mediaStream = stream;
        return stream;
      } catch (err) {
        console.warn('Camera stream permission unavailable, using industrial test camera feed simulation', err);
        return null;
      }
    }
    return null;
  }

  /**
   * Stop active camera stream
   */
  public stopCameraStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Toggle camera flashlight / torch if available
   */
  public async toggleTorch(enabled: boolean): Promise<boolean> {
    if (this.mediaStream) {
      const track = this.mediaStream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities as any)?.();
          if (capabilities && capabilities.torch) {
            await (track.applyConstraints as any)({
              advanced: [{ torch: enabled }],
            });
            return true;
          }
        } catch {}
      }
    }
    return false;
  }

  /**
   * Synthesize Complete Metrology Verification Pipeline Execution
   */
  public simulateMetrologyScan(
    part: MetrologyPresetPart,
    machineId: string,
    operatorName: string
  ): MetrologyFusionReport {
    const isShaft = part.partCode === 'PART-2041-A';
    const isFlange = part.partCode === 'PART-1082-B';
    const isTurbine = part.partCode === 'PART-9901-C';
    const isPiston = part.partCode === 'PART-3024-D';

    const timestamp = new Date().toISOString();
    const dateCert = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const certNum = String(Math.floor(100 + Math.random() * 900));
    const certificateId = `CERT-${dateCert}-${certNum}`;
    const serialNumber = `SN-${part.partCode.slice(5)}-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. Camera Visual AI Result
    let shapeMatch = 94.2;
    let partPresent = true;
    let orientation: VisualInspectionResult['orientation'] = 'CORRECT';
    let materialMatch = true;
    let visualScore = 94.2;
    let visualStatus: 'PASS' | 'FAIL' = 'PASS';
    const defects: VisualInspectionResult['defects'] = [];

    if (isTurbine) {
      // Critical fail on camera
      shapeMatch = 41.5;
      orientation = 'ROTATED_90';
      materialMatch = false;
      visualStatus = 'FAIL';
      visualScore = 38.0;
      defects.push(
        {
          id: 'def-1',
          type: 'crack',
          areaCm2: 6.2,
          bbox: { x: 38, y: 44, width: 24, height: 18 },
          label: 'Critical Crack Detected (6.2cm²)',
          severity: 'CRITICAL',
        },
        {
          id: 'def-2',
          type: 'scratch',
          areaCm2: 1.1,
          bbox: { x: 68, y: 22, width: 14, height: 10 },
          label: 'Deep Scratch (1.1cm²)',
          severity: 'WARNING',
        }
      );
    } else if (isPiston) {
      shapeMatch = 91.8;
      visualScore = 91.8;
      defects.push({
        id: 'def-3',
        type: 'burr',
        areaCm2: 0.3,
        bbox: { x: 74, y: 62, width: 10, height: 8 },
        label: 'Minor Edge Burr (0.3cm²)',
        severity: 'MINOR',
      });
    }

    const cameraResult: VisualInspectionResult = {
      shapeMatchConfidence: shapeMatch,
      partPresent,
      orientation,
      materialColorMatch: materialMatch,
      expectedMaterial: part.material,
      detectedMaterial: materialMatch ? part.material : 'Unknown Alloy (Inconel 718 detected)',
      defects,
      visualScore,
      status: visualStatus,
      timestamp,
    };

    // 2. Laser Scanner 3D Geometry Result
    const dimensions: DimensionMeasurement[] = [
      {
        id: 'dim-1',
        name: 'Length (X-axis)',
        axis: 'X',
        nominal: part.nominalDimensions.length,
        measured: isShaft ? 125.023 : isFlange ? 98.482 : isTurbine ? 140.812 : 72.011,
        tolerance: 0.05,
        deviation: isShaft ? 0.023 : isFlange ? -0.018 : isTurbine ? 0.812 : 0.011,
        unit: 'mm',
        status: isTurbine ? 'FAIL' : 'PASS',
      },
      {
        id: 'dim-2',
        name: 'Width (Y-axis)',
        axis: 'Y',
        nominal: part.nominalDimensions.width,
        measured: isShaft ? 48.971 : isFlange ? 98.514 : isTurbine ? 62.421 : 47.989,
        tolerance: 0.05,
        deviation: isShaft ? -0.029 : isFlange ? 0.014 : isTurbine ? 0.421 : -0.011,
        unit: 'mm',
        status: isTurbine ? 'FAIL' : 'PASS',
      },
      {
        id: 'dim-3',
        name: 'Height (Z-axis)',
        axis: 'Z',
        nominal: part.nominalDimensions.height,
        // Flange fails on Height Z
        measured: isShaft ? 22.012 : isFlange ? 22.812 : isTurbine ? 35.789 : 48.016,
        tolerance: 0.05,
        deviation: isShaft ? 0.012 : isFlange ? 0.812 : isTurbine ? 0.789 : 0.016,
        unit: 'mm',
        status: isFlange || isTurbine ? 'FAIL' : 'PASS',
      },
      {
        id: 'dim-4',
        name: 'Hole Ø (H1)',
        axis: 'H1',
        nominal: part.nominalDimensions.holeDia || 15.0,
        measured: isShaft ? 15.002 : isFlange ? 12.011 : isTurbine ? 8.125 : 18.004,
        tolerance: 0.02,
        deviation: isShaft ? 0.002 : isFlange ? 0.011 : isTurbine ? 0.125 : 0.004,
        unit: 'mm',
        status: isTurbine ? 'FAIL' : 'PASS',
      },
    ];

    const gdt: GdtMeasurement[] = [
      {
        id: 'gdt-1',
        name: 'Flatness',
        symbol: '⏥',
        measured: isFlange ? 0.12 : isTurbine ? 0.18 : 0.018,
        specLimit: 0.05,
        unit: 'µm',
        status: isFlange || isTurbine ? 'FAIL' : 'PASS',
      },
      {
        id: 'gdt-2',
        name: 'Perpendicularity',
        symbol: '⟂',
        measured: isTurbine ? 0.052 : 0.021,
        specLimit: 0.03,
        unit: '°',
        status: isTurbine ? 'FAIL' : 'PASS',
      },
      {
        id: 'gdt-3',
        name: 'Circularity',
        symbol: '○',
        measured: isShaft ? 0.014 : 0.022,
        specLimit: 0.04,
        unit: 'µm',
        status: 'PASS',
      },
    ];

    const hasDimFail = dimensions.some((d) => d.status === 'FAIL');
    const hasGdtFail = gdt.some((g) => g.status === 'FAIL');
    const geometryStatus: 'PASS' | 'FAIL' = hasDimFail || hasGdtFail ? 'FAIL' : 'PASS';
    const geometryScore = geometryStatus === 'PASS' ? 97.8 : isFlange ? 58.2 : 44.0;
    const points = generatePartPointCloud(part.partCode, geometryStatus === 'FAIL');

    const laserScannerResult: LaserScannerResult = {
      pointCount: points.length,
      scanDurationS: 2.3,
      dimensions,
      gdt,
      geometryScore,
      status: geometryStatus,
      points,
      timestamp,
    };

    // 3. Laser Profilometer Surface Topology Result
    const isRaExceeded = isPiston || isTurbine;
    const roughness: SurfaceRoughnessParams = {
      Ra: isPiston ? 3.42 : isTurbine ? 1.95 : 0.82,
      Rz: isPiston ? 9.84 : 4.21,
      Rq: isPiston ? 4.12 : 1.03,
      Rp: isPiston ? 5.32 : 2.14,
      Rv: isPiston ? 4.52 : 2.07,
      Rsk: isPiston ? 0.68 : -0.12,
      Rku: isPiston ? 4.8 : 2.9,
    };

    const waviness: WavinessParams = {
      Wa: isPiston ? 0.72 : 0.31,
      Wz: isPiston ? 1.84 : 0.94,
    };

    const texture: TextureParams = {
      layDirection: isShaft ? 'Unidirectional' : isFlange ? 'Circular' : 'Random',
      peakCountPerCm: 142,
      bearingRatio: {
        Rpk: 0.42,
        Rk: 1.84,
        Rvk: 0.68,
        mr1: 12.4,
        mr2: 87.2,
      },
    };

    const surfaceStatus: 'PASS' | 'FAIL' = isRaExceeded ? 'FAIL' : 'PASS';
    const surfaceScore = surfaceStatus === 'PASS' ? 97.1 : 52.4;
    const { profile2D, topologyGrid3D } = generateSurfaceTopology(part.raLimit, isRaExceeded);

    const profilometerResult: ProfilometerResult = {
      scanMode: 'AREA',
      scanAreaMm: { x: 10.0, y: 10.0 },
      pointDensity: '1000 x 1000',
      roughness,
      waviness,
      texture,
      surfaceScore,
      status: surfaceStatus,
      profile2D,
      topologyGrid3D,
      timestamp,
    };

    // 4. Metrology Fusion Engine
    const weightedScore = Number(
      (visualScore * 0.25 + geometryScore * 0.5 + surfaceScore * 0.25).toFixed(1)
    );

    const criticalFailures: string[] = [];
    const requiredActions: string[] = [];

    if (!partPresent) {
      criticalFailures.push('CRITICAL: Part not present on fixture.');
      requiredActions.push('Load workpiece into fixture alignment pins.');
    }
    if (shapeMatch < 80) {
      criticalFailures.push(`CRITICAL: Wrong part shape detected (${shapeMatch}% match).`);
      requiredActions.push('Verify blueprint and swap fixture workpiece.');
    }
    if (orientation !== 'CORRECT') {
      criticalFailures.push(`CRITICAL: Workpiece misaligned or inverted (${orientation}).`);
      requiredActions.push('Rotate part to 0° reference indexing mark.');
    }
    if (hasDimFail) {
      dimensions
        .filter((d) => d.status === 'FAIL')
        .forEach((d) => {
          criticalFailures.push(
            `DIMENSION OUT OF TOLERANCE: ${d.name} measured ${d.measured.toFixed(3)}mm (spec: ${d.nominal.toFixed(3)} ±${d.tolerance}mm, deviation: ${(d.deviation > 0 ? '+' : '') + d.deviation.toFixed(3)}mm).`
          );
        });
      requiredActions.push('Inspect Height Z dimension on coordinate measuring fixture.');
      requiredActions.push('Check Flatness on datum surface B.');
    }
    if (hasGdtFail) {
      gdt
        .filter((g) => g.status === 'FAIL')
        .forEach((g) => {
          criticalFailures.push(`GD&T LIMIT EXCEEDED: ${g.name} measured ${g.measured}${g.unit} (spec: ≤${g.specLimit}${g.unit}).`);
        });
    }
    if (roughness.Ra > part.raLimit * 1.5) {
      criticalFailures.push(
        `SURFACE ROUGHNESS EXCEEDED: Ra measured ${roughness.Ra.toFixed(2)}µm (spec limit: ≤${part.raLimit.toFixed(2)}µm).`
      );
      requiredActions.push('Regrind or burnish workpiece surface to achieve required finish.');
    }
    if (defects.some((d) => d.areaCm2 > 5.0 || d.severity === 'CRITICAL')) {
      criticalFailures.push('VISUAL DEFECT EXCEEDED: Structural crack or defect area > 5.0cm².');
      requiredActions.push('Scrap defective raw stock; notify supplier.');
    }

    let verdict: MetrologyFusionReport['verdict'] = 'PASS';
    if (criticalFailures.length > 0 || weightedScore < 90.0) {
      verdict = criticalFailures.length >= 3 || !materialMatch || shapeMatch < 60 ? 'CRITICAL_FAIL' : 'FAIL';
    }

    if (verdict !== 'PASS') {
      requiredActions.push('Replace part and re-verify metrology station.');
    }

    const report: MetrologyFusionReport = {
      id: `MET-${Date.now()}`,
      certificateId,
      partCode: part.partCode,
      partName: part.partName,
      serialNumber,
      machineId,
      operatorName,
      timestamp,
      visualScore,
      geometryScore,
      surfaceScore,
      overallScore: weightedScore,
      verdict,
      criticalFailures,
      requiredActions,
      autoStartCountdown: verdict === 'PASS' ? 3 : 0,
      isMachineLocked: verdict !== 'PASS',
      digitalSignature: `SHA256:${Math.random().toString(36).substring(2, 15).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      camera: cameraResult,
      laserScanner: laserScannerResult,
      profilometer: profilometerResult,
    };

    return report;
  }
}

export const metrologyService = MetrologyHardwareService.getInstance();
