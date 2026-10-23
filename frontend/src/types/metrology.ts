/**
 * Metrology Verification System Types
 * Multi-sensor pipeline: Camera (Visual AI) + Laser Scanner (3D Geometry) + Laser Profilometer (Surface Topology)
 */

export type SensorState = 'DISCONNECTED' | 'CONNECTED' | 'SCANNING' | 'COMPLETE' | 'ERROR';

export type MetrologyVerdict = 'IDLE' | 'SCANNING' | 'PASS' | 'FAIL' | 'CRITICAL_FAIL';

export interface VisualDefect {
  id: string;
  type: 'scratch' | 'crack' | 'discoloration' | 'burr' | 'dent';
  areaCm2: number;
  bbox: { x: number; y: number; width: number; height: number }; // percentage coords (0-100)
  label: string;
  severity: 'CRITICAL' | 'WARNING' | 'MINOR';
}

export interface VisualInspectionResult {
  shapeMatchConfidence: number; // 0-100
  partPresent: boolean;
  orientation: 'CORRECT' | 'ROTATED_90' | 'ROTATED_180' | 'INVERTED';
  materialColorMatch: boolean;
  expectedMaterial: string;
  detectedMaterial: string;
  defects: VisualDefect[];
  visualScore: number; // 0-100
  status: 'PASS' | 'FAIL';
  timestamp: string;
}

export interface DimensionMeasurement {
  id: string;
  name: string;
  axis?: 'X' | 'Y' | 'Z' | 'H1' | 'H2' | 'BOSS' | 'ANGLE' | 'RADIUS';
  nominal: number;
  measured: number;
  tolerance: number; // ± tol
  deviation: number;
  unit: 'mm' | '°' | 'µm';
  status: 'PASS' | 'FAIL' | 'WARN';
}

export interface GdtMeasurement {
  id: string;
  name: 'Flatness' | 'Straightness' | 'Circularity' | 'Cylindricity' | 'Perpendicularity' | 'Parallelism' | 'Runout';
  symbol: string;
  measured: number;
  specLimit: number; // max allowable
  unit: 'µm' | '°';
  status: 'PASS' | 'FAIL';
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  deviation: number; // deviation from CAD surface in mm
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface LaserScannerResult {
  pointCount: number;
  scanDurationS: number;
  dimensions: DimensionMeasurement[];
  gdt: GdtMeasurement[];
  geometryScore: number; // 0-100
  status: 'PASS' | 'FAIL';
  points: Point3D[];
  timestamp: string;
}

export interface SurfaceRoughnessParams {
  Ra: number; // Arithmetic mean roughness (µm) - limit e.g. <= 1.6
  Rz: number; // Maximum height of profile (µm) - limit e.g. <= 6.3
  Rq: number; // Root mean square roughness (µm) - limit e.g. <= 2.0
  Rp: number; // Maximum peak height (µm)
  Rv: number; // Maximum valley depth (µm)
  Rsk: number; // Skewness - limit e.g. ±0.5
  Rku: number; // Kurtosis - sharpness of peaks
}

export interface WavinessParams {
  Wa: number; // Waviness mean deviation (µm) - limit <= 0.5
  Wz: number; // Waviness height (µm)
}

export interface TextureParams {
  layDirection: 'Unidirectional' | 'Circular' | 'Random';
  peakCountPerCm: number;
  bearingRatio: {
    Rpk: number; // Reduced peak height (µm)
    Rk: number; // Core roughness depth (µm)
    Rvk: number; // Reduced valley depth (µm)
    mr1: number; // Peak material portion (%)
    mr2: number; // Valley material portion (%)
  };
}

export interface ProfilometerResult {
  scanMode: 'AREA' | 'LINE' | 'MULTI_POINT';
  scanAreaMm: { x: number; y: number };
  pointDensity: string;
  roughness: SurfaceRoughnessParams;
  waviness: WavinessParams;
  texture: TextureParams;
  surfaceScore: number; // 0-100
  status: 'PASS' | 'FAIL';
  profile2D: Array<{ x: number; y: number; mean: number; upperTol: number; lowerTol: number }>;
  topologyGrid3D: number[][]; // elevation map (µm)
  timestamp: string;
}

export interface MetrologyFusionReport {
  id: string;
  certificateId: string;
  partCode: string;
  partName: string;
  serialNumber: string;
  machineId: string;
  operatorName: string;
  timestamp: string;
  visualScore: number; // weight 25%
  geometryScore: number; // weight 50%
  surfaceScore: number; // weight 25%
  overallScore: number; // weighted average
  verdict: MetrologyVerdict;
  criticalFailures: string[];
  requiredActions: string[];
  autoStartCountdown: number; // e.g. 3, 2, 1
  isMachineLocked: boolean;
  digitalSignature: string;
  camera: VisualInspectionResult;
  laserScanner: LaserScannerResult;
  profilometer: ProfilometerResult;
}

export interface MetrologyPresetPart {
  partCode: string;
  partName: string;
  material: string;
  nominalDimensions: {
    length: number;
    width: number;
    height: number;
    holeDia?: number;
  };
  raLimit: number;
  description: string;
  defaultMachineId: string;
}

export interface HistoricalVerificationRecord {
  id: string;
  timestamp: string;
  partCode: string;
  machineId: string;
  overallScore: number;
  visualScore: number;
  geometryScore: number;
  surfaceScore: number;
  verdict: 'PASS' | 'FAIL';
  primaryFailureMode?: string;
  durationS: number;
}
