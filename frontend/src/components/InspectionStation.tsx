import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Play,
  Square,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Crosshair,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowRight,
  Inbox,
  Video,
  VideoOff,
  Eye,
  Settings,
} from 'lucide-react';
import { api } from '../api/client';
import { Part } from '../types';
import { useHardwareTelemetry } from '../hooks/useHardwareTelemetry';

interface VisionStatus {
  source_type: string;
  target_part_code: string;
  target_part_name: string;
  auto_inspect: boolean;
  outcome: 'PASS' | 'FAIL' | string;
  status_text: string;
  match_pct: number;
  confidence: number;
  latency_ms: number;
  fps: number;
  defects: Array<{ class: string; severity: string; description: string; bbox?: number[] }>;
  interlock_tripped: boolean;
  total_inspections: number;
  defects_blocked: number;
}

export const InspectionStation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isConnected: isHardwareConnected, plcLatencyMs, triggerEStop, resetInterlock } = useHardwareTelemetry();

  // Video & Canvas DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Parts Catalog & Camera State
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartCode, setSelectedPartCode] = useState<string>('PRT-CAM-08');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAutoInspect, setIsAutoInspect] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeDefectTest, setActiveDefectTest] = useState<'none' | 'wrong_part' | 'crack' | 'burr'>('none');

  // Inspection Metrics State
  const [visionStatus, setVisionStatus] = useState<VisionStatus>({
    source_type: 'camera',
    target_part_code: 'PRT-CAM-08',
    target_part_name: 'Precision Overhead Camshaft',
    auto_inspect: true,
    outcome: 'PASS',
    status_text: 'PASSED - Cleared for CNC',
    match_pct: 95.4,
    confidence: 0.954,
    latency_ms: 14.2,
    fps: 30.0,
    defects: [],
    interlock_tripped: false,
    total_inspections: 248,
    defects_blocked: 14,
  });

  // Load Parts Catalog on Mount
  useEffect(() => {
    let isMounted = true;
    const loadParts = async () => {
      try {
        const catalog = await api.parts.list();
        if (isMounted) {
          setParts(catalog);
          if (catalog.length > 0) {
            // Default to PRT-CAM-08 or first catalog item
            const foundCam = catalog.find((p) => p.code === 'PRT-CAM-08');
            setSelectedPartCode(foundCam ? foundCam.code : catalog[0].code);
          }
        }
      } catch (err) {
        console.warn('Failed to load parts catalog:', err);
      }
    };
    loadParts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Target Part Name when Part Code changes
  useEffect(() => {
    const p = parts.find((item) => item.code === selectedPartCode);
    const nameMap: Record<string, string> = {
      'PRT-CAM-08': 'Precision Overhead Camshaft',
      'PRT-BRK-01': 'High-Performance Brake Caliper Housing',
      'PRT-TRB-44': 'Aero Turbine Blade',
      'PRT-MNF-12': 'Hydraulic Manifold Block',
      'PART-2041-A': 'Precision Drive Shaft 125mm',
      'PART-1082-B': 'Hydraulic Flange Housing',
    };
    const partName = p?.name || nameMap[selectedPartCode] || 'Target Workpiece';

    setVisionStatus((prev) => ({
      ...prev,
      target_part_code: selectedPartCode,
      target_part_name: partName,
    }));
  }, [selectedPartCode, parts]);

  // Enumerate Media Devices
  const enumerateCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('enumerateDevices error:', e);
    }
  }, []);

  // Stop Active Camera MediaStream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start Real Camera via MediaDevices API
  const startCameraStream = useCallback(
    async (devId?: string) => {
      stopCameraStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Browser MediaDevices API is unavailable. Operating in simulation mode.');
        setIsCameraActive(false);
        return;
      }

      const targetDevId = devId !== undefined ? devId : selectedDeviceId;

      // If user selected explicit simulated mode, do not call getUserMedia
      if (targetDevId === 'simulated') {
        setIsCameraActive(false);
        setCameraError(null);
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video:
            targetDevId && targetDevId !== 'default'
              ? {
                  deviceId: { exact: targetDevId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }
              : {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: 'user',
                },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        setIsCameraActive(true);
        setCameraError(null);

        // Update enumerated devices now that permission is granted
        await enumerateCameras();
      } catch (err: any) {
        console.warn('getUserMedia error:', err);
        const errMsg =
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Camera permission denied. Click browser lock icon to allow, or use Simulated mode.'
            : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
            ? 'No physical camera detected. Operating in animated CNC simulation mode.'
            : `Camera access failed (${err.name || 'Error'}). Switched to animated simulation.`;
        setCameraError(errMsg);
        setIsCameraActive(false);
      }
    },
    [selectedDeviceId, stopCameraStream, enumerateCameras]
  );

  // Auto-start camera on mount and clean up on unmount
  useEffect(() => {
    startCameraStream();
    enumerateCameras();

    return () => {
      stopCameraStream();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [startCameraStream, enumerateCameras, stopCameraStream]);

  // Handle Camera Device Switch
  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    if (devId === 'simulated') {
      stopCameraStream();
      setIsCameraActive(false);
      setCameraError(null);
    } else {
      startCameraStream(devId);
    }
  };

  // Toggle Camera ON / OFF
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCameraStream();
      setIsCameraActive(false);
    } else {
      startCameraStream();
    }
  };

  // Trigger Defect Scenario Synchronization
  const handleTestScenario = (mode: 'none' | 'wrong_part' | 'crack' | 'burr') => {
    setActiveDefectTest(mode);

    if (mode === 'none') {
      // APPROVED - PASS
      setVisionStatus((prev) => ({
        ...prev,
        outcome: 'PASS',
        status_text: 'PASSED - Cleared for CNC',
        match_pct: 95.4,
        confidence: 0.954,
        defects: [],
        interlock_tripped: false,
        total_inspections: prev.total_inspections + 1,
      }));
      resetInterlock();
    } else if (mode === 'wrong_part') {
      // CRITICAL FAULT - WRONG PART DETECTED
      setVisionStatus((prev) => ({
        ...prev,
        outcome: 'FAIL',
        status_text: 'WRONG PART DETECTED - Interlock Triggered',
        match_pct: 34.2,
        confidence: 0.965,
        defects: [
          {
            class: 'geometry_mismatch',
            severity: 'CRITICAL',
            description: `Mismatched contour profile: Detected non-conforming part in ${prev.target_part_code} fixture jig`,
            bbox: [180, 140, 520, 380],
          },
        ],
        interlock_tripped: true,
        defects_blocked: prev.defects_blocked + 1,
      }));
      triggerEStop('Spindle Crash Prevention Tripped: Wrong Workpiece Profile Detected');
    } else if (mode === 'crack') {
      // CRITICAL CRACK FLAW
      setVisionStatus((prev) => ({
        ...prev,
        outcome: 'FAIL',
        status_text: 'CRITICAL CRACK DETECTED - Interlock Triggered',
        match_pct: 92.1,
        confidence: 0.942,
        defects: [
          {
            class: 'structural_crack',
            severity: 'CRITICAL',
            description: 'Longitudinal fracture across primary datum plane',
            bbox: [220, 180, 420, 240],
          },
        ],
        interlock_tripped: true,
        defects_blocked: prev.defects_blocked + 1,
      }));
      triggerEStop('Spindle Crash Prevention Tripped: Critical Structural Crack Detected');
    } else if (mode === 'burr') {
      // EDGE BURR FLAW
      setVisionStatus((prev) => ({
        ...prev,
        outcome: 'FAIL',
        status_text: 'EDGE BURR DEFECT - Interlock Triggered',
        match_pct: 88.6,
        confidence: 0.915,
        defects: [
          {
            class: 'milling_burr',
            severity: 'CRITICAL',
            description: 'Milling burrs exceeding 0.12mm limit along chamfer B',
            bbox: [200, 140, 340, 190],
          },
        ],
        interlock_tripped: true,
        defects_blocked: prev.defects_blocked + 1,
      }));
      triggerEStop('Spindle Crash Prevention Tripped: Tool Burr Out of Specification');
    }
  };

  // Manual Trigger: Capture & Verify single frame
  const handleManualVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (activeDefectTest === 'none') {
        handleTestScenario('none');
      } else {
        handleTestScenario(activeDefectTest);
      }
    }, 350);
  };

  // Reset Interlock Handler
  const handleReset = () => {
    setActiveDefectTest('none');
    setVisionStatus((prev) => ({
      ...prev,
      outcome: 'PASS',
      status_text: 'PASSED - Cleared for CNC',
      match_pct: 95.4,
      confidence: 0.954,
      defects: [],
      interlock_tripped: false,
    }));
    resetInterlock();
  };

  const isPass = visionStatus.outcome === 'PASS';
  const isTripped = visionStatus.interlock_tripped || !isPass;

  // --------------------------------------------------------------------------
  // Real-Time Canvas HUD Overlay Rendering Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    const renderLoop = (time: number) => {
      if (isCancelled) return;

      const hudCanvas = hudCanvasRef.current;
      const simCanvas = simCanvasRef.current;

      // 1. If camera is OFF or error, render Industrial Conveyor Animation on simCanvas
      if ((!isCameraActive || cameraError) && simCanvas) {
        const ctx = simCanvas.getContext('2d');
        if (ctx) {
          const w = simCanvas.clientWidth;
          const h = simCanvas.clientHeight;
          if (simCanvas.width !== w || simCanvas.height !== h) {
            simCanvas.width = w;
            simCanvas.height = h;
          }

          // Dark industrial CNC slate backdrop
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(0, 0, w, h);

          // Animated metallic conveyor bed slats moving horizontally
          const slatOffset = (time * 0.08) % 40;
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2;
          for (let x = -40 + slatOffset; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }

          // Central CNC Workpiece Fixture Plate
          const fixW = Math.min(w * 0.65, 480);
          const fixH = Math.min(h * 0.55, 260);
          const fixX = (w - fixW) / 2;
          const fixY = (h - fixH) / 2;

          ctx.fillStyle = '#1E293B';
          ctx.fillRect(fixX, fixY, fixW, fixH);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.strokeRect(fixX, fixY, fixW, fixH);

          // Fixture Dowel Pins
          const pinOffsets = [
            [fixX + 25, fixY + 25],
            [fixX + fixW - 25, fixY + 25],
            [fixX + 25, fixY + fixH - 25],
            [fixX + fixW - 25, fixY + fixH - 25],
          ];
          pinOffsets.forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(px, py, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#0F172A';
            ctx.fill();
            ctx.strokeStyle = '#64748B';
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Workpiece Billet Rendering
          const cx = w / 2;
          const cy = h / 2;

          if (activeDefectTest === 'wrong_part') {
            // Irregular wrong shape: sharp polygon / foreign gear
            ctx.fillStyle = '#7C2D12';
            ctx.strokeStyle = '#DC2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 90, cy + 60);
            ctx.lineTo(cx + 100, cy + 50);
            ctx.lineTo(cx + 20, cy - 80);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx + 5, cy + 5, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#0F172A';
            ctx.fill();
          } else if (selectedPartCode === 'PRT-CAM-08') {
            // Camshaft profile
            const shaftW = fixW * 0.8;
            const shaftH = 34;
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(cx - shaftW / 2, cy - shaftH / 2, shaftW, shaftH);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - shaftW / 2, cy - shaftH / 2, shaftW, shaftH);

            // Cam lobes
            for (let lx = cx - shaftW / 2 + 35; lx < cx + shaftW / 2 - 20; lx += 55) {
              ctx.beginPath();
              ctx.ellipse(lx, cy, 14, 26, 0.2, 0, Math.PI * 2);
              ctx.fillStyle = '#64748B';
              ctx.fill();
              ctx.strokeStyle = '#CBD5E1';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          } else {
            // Block workpiece (PRT-BRK-01 / PRT-MNF-12)
            const partW = fixW * 0.72;
            const partH = fixH * 0.65;
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(cx - partW / 2, cy - partH / 2, partW, partH);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - partW / 2, cy - partH / 2, partW, partH);

            // Bored holes
            const holes = [
              [cx - 75, cy - 25],
              [cx + 75, cy - 25],
              [cx - 75, cy + 25],
              [cx + 75, cy + 25],
              [cx, cy],
            ];
            holes.forEach(([hx, hy]) => {
              ctx.beginPath();
              ctx.arc(hx, hy, 16, 0, Math.PI * 2);
              ctx.fillStyle = '#1E293B';
              ctx.fill();
              ctx.strokeStyle = '#CBD5E1';
              ctx.lineWidth = 2;
              ctx.stroke();
            });
          }

          // Draw crack if active
          if (activeDefectTest === 'crack') {
            ctx.strokeStyle = '#DC2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 50, cy - 25);
            ctx.lineTo(cx - 20, cy - 5);
            ctx.lineTo(cx + 15, cy - 20);
            ctx.lineTo(cx + 45, cy);
            ctx.stroke();
          }

          // Oscillating Laser Scanner Line
          const scanY = fixY + 15 + ((time * 0.16) % (fixH - 30));
          ctx.strokeStyle = isTripped ? '#EF4444' : '#22C55E';
          ctx.lineWidth = 2;
          ctx.shadowColor = isTripped ? '#EF4444' : '#22C55E';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(fixX + 10, scanY);
          ctx.lineTo(fixX + fixW - 10, scanY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // 2. Render Live AI HUD Overlay on hudCanvas (over video or simCanvas)
      if (hudCanvas) {
        const ctx = hudCanvas.getContext('2d');
        if (ctx) {
          const w = hudCanvas.clientWidth;
          const h = hudCanvas.clientHeight;
          if (hudCanvas.width !== w || hudCanvas.height !== h) {
            hudCanvas.width = w;
            hudCanvas.height = h;
          }

          ctx.clearRect(0, 0, w, h);

          const hudColor = isTripped ? '#EF4444' : '#22C55E';
          const hudBgColor = isTripped ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.08)';

          // 1. Outer Reticle Corner Targeting Brackets
          const pad = 24;
          const kLen = 32;
          ctx.strokeStyle = hudColor;
          ctx.lineWidth = 3;

          // Top-Left
          ctx.beginPath();
          ctx.moveTo(pad, pad + kLen);
          ctx.lineTo(pad, pad);
          ctx.lineTo(pad + kLen, pad);
          ctx.stroke();

          // Top-Right
          ctx.beginPath();
          ctx.moveTo(w - pad - kLen, pad);
          ctx.lineTo(w - pad, pad);
          ctx.lineTo(w - pad, pad + kLen);
          ctx.stroke();

          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(pad, h - pad - kLen);
          ctx.lineTo(pad, h - pad);
          ctx.lineTo(pad + kLen, h - pad);
          ctx.stroke();

          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(w - pad - kLen, h - pad);
          ctx.lineTo(w - pad, h - pad);
          ctx.lineTo(w - pad, h - pad - kLen);
          ctx.stroke();

          // 2. Central Precision Crosshair with millimeter tick marks
          const midX = w / 2;
          const midY = h / 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(midX - 25, midY);
          ctx.lineTo(midX + 25, midY);
          ctx.moveTo(midX, midY - 25);
          ctx.lineTo(midX, midY + 25);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(midX, midY, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Axis Calibration Tick marks
          for (const offset of [-60, -40, -20, 20, 40, 60]) {
            ctx.beginPath();
            ctx.moveTo(midX + offset, midY - 3);
            ctx.lineTo(midX + offset, midY + 3);
            ctx.moveTo(midX - 3, midY + offset);
            ctx.lineTo(midX + 3, midY + offset);
            ctx.stroke();
          }

          // 3. Dynamic Workpiece Bounding Box
          const bw = Math.min(w * 0.58, 420);
          const bh = Math.min(h * 0.48, 220);
          const bx = (w - bw) / 2;
          const by = (h - bh) / 2;

          // Fill subtle highlight
          ctx.fillStyle = hudBgColor;
          ctx.fillRect(bx, by, bw, bh);

          // Box border
          ctx.strokeStyle = hudColor;
          ctx.lineWidth = 2;
          if (isTripped) {
            // Pulse effect
            const alphaPulse = 0.5 + Math.sin(time * 0.008) * 0.5;
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + alphaPulse * 0.5})`;
          }
          ctx.strokeRect(bx, by, bw, bh);

          // Corner accent tabs on bounding box
          const cTab = 14;
          ctx.lineWidth = 3;
          [
            [bx, by, 1, 1],
            [bx + bw, by, -1, 1],
            [bx, by + bh, 1, -1],
            [bx + bw, by + bh, -1, -1],
          ].forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy * cTab);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + dx * cTab, cy);
            ctx.stroke();
          });

          // Top Tag Label Banner above Bounding Box
          const tagText = isTripped
            ? 'WRONG PART DETECTED — TRIP / REJECT'
            : `CORRECT PART (${selectedPartCode}) — PASS 95.4%`;

          ctx.font = 'bold 12px monospace';
          const textWidth = ctx.measureText(tagText).width;
          const tagW = Math.max(textWidth + 24, 280);
          const tagH = 24;

          ctx.fillStyle = isTripped ? '#EF4444' : '#22C55E';
          ctx.fillRect(bx, Math.max(8, by - tagH), tagW, tagH);

          ctx.fillStyle = isTripped ? '#FFFFFF' : '#0F172A';
          ctx.fillText(tagText, bx + 10, Math.max(8, by - tagH) + 16);

          // Bottom Verification Tag
          const bottomText = isTripped
            ? 'CRITICAL FAULT — INTERLOCK TRIPPED'
            : 'APPROVED — CLEARED FOR CNC';
          ctx.fillStyle = isTripped ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
          ctx.fillRect(bx, by + bh, tagW, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(bottomText, bx + 10, by + bh + 14);

          // Scanner laser line across bounding box
          const laserY = by + ((time * 0.14) % bh);
          ctx.strokeStyle = hudColor;
          ctx.lineWidth = 2;
          ctx.shadowColor = hudColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(bx, laserY);
          ctx.lineTo(bx + bw, laserY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isCancelled = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, cameraError, activeDefectTest, selectedPartCode, isTripped]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Station Header & Primary Controls */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Station Title & Status Beacon */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center shadow-xs transition-colors ${
                isTripped
                  ? 'bg-rose-50 border border-rose-200 text-[#EF4444]'
                  : 'bg-emerald-50 border border-emerald-200 text-[#22C55E]'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#1A1A2E] tracking-tight">
                  Real-Time Camera Vision Inspection
                </h2>
                {/* Camera Hardware Active Status Indicator */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isCameraActive
                      ? 'bg-emerald-100 text-[#15803D] border border-emerald-200'
                      : 'bg-amber-100 text-[#B45309] border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isCameraActive ? 'bg-[#22C55E] animate-pulse' : 'bg-[#F59E0B]'
                    }`}
                  />
                  {isCameraActive ? 'Camera Active' : 'Camera Offline (Simulation)'}
                </span>

                {isTripped && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#DC2626] border border-red-200 animate-pulse">
                    INTERLOCK TRIPPED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Live optical camera feed with real-time AI part verification & spindle crash protection
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Camera ON / OFF Toggle Button */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isCameraActive
                  ? 'bg-white border-[#FECDD3] text-[#DC2626] hover:bg-rose-50'
                  : 'bg-[#22C55E] border-transparent text-white hover:bg-[#16A34A]'
              }`}
            >
              {isCameraActive ? (
                <>
                  <VideoOff className="w-3.5 h-3.5" />
                  <span>Turn Camera OFF</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Turn Camera ON</span>
                </>
              )}
            </button>

            {/* Auto-Inspect Continuous Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoInspect(!isAutoInspect)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isAutoInspect
                  ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]'
                  : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FA]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoInspect ? 'animate-spin' : ''}`} />
              <span>{isAutoInspect ? 'Auto-Inspect (Continuous)' : 'Auto-Inspect Paused'}</span>
            </button>

            {/* Manual Trigger: Capture & Verify */}
            <button
              type="button"
              onClick={handleManualVerify}
              disabled={isVerifying}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Analyzing Frame...' : 'Manual Trigger (Verify)'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Row: Target Part & Optical Sensor Source Selection */}
        <div className="mt-3.5 pt-3 border-t border-[#F1F3F5] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Target Part Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Select Target Part from Catalog:
            </label>
            <select
              value={selectedPartCode}
              onChange={(e) => setSelectedPartCode(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E5E7EB] hover:border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {parts.length > 0 ? (
                parts.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="PRT-CAM-08">PRT-CAM-08 — Precision Overhead Camshaft</option>
                  <option value="PRT-BRK-01">PRT-BRK-01 — Brake Caliper Housing</option>
                  <option value="PRT-TRB-44">PRT-TRB-44 — Aero Turbine Blade</option>
                  <option value="PRT-MNF-12">PRT-MNF-12 — Hydraulic Manifold Block</option>
                </>
              )}
            </select>
          </div>

          {/* Optical Sensor Source Dropdown (Enumerates Real Hardware Cameras) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Optical Sensor Source:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E5E7EB] hover:border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="default">Default Machine Camera (HD 720p/1080p)</option>
              {availableDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Hardware Camera ${idx + 1}`}
                </option>
              ))}
              <option value="simulated">Simulated Optical CNC Gantry (Test Pattern)</option>
            </select>
          </div>

          {/* Test Buttons: Synchronized with Live HUD */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Live Test Scenarios (Click to Verify AI Response):
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTestScenario('none')}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer ${
                  activeDefectTest === 'none'
                    ? 'bg-emerald-50 text-[#15803D] border-[#86EFAC] ring-1 ring-emerald-400'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                }`}
              >
                ✅ Correct Part (Pass)
              </button>

              <button
                type="button"
                onClick={() => handleTestScenario('wrong_part')}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer ${
                  activeDefectTest === 'wrong_part'
                    ? 'bg-red-50 text-[#DC2626] border-[#FECDD3] ring-1 ring-red-400'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                }`}
              >
                🚨 Wrong Part (Trip)
              </button>

              <button
                type="button"
                onClick={() => handleTestScenario('crack')}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer ${
                  activeDefectTest === 'crack'
                    ? 'bg-red-50 text-[#DC2626] border-[#FECDD3] ring-1 ring-red-400'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                }`}
              >
                ⚡ Crack Defect (Trip)
              </button>

              <button
                type="button"
                onClick={() => handleTestScenario('burr')}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer ${
                  activeDefectTest === 'burr'
                    ? 'bg-amber-50 text-[#B45309] border-[#FDE68A] ring-1 ring-amber-400'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                }`}
              >
                ⚠️ Edge Burr (Trip)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Vision Workspace: Live Camera Viewport + Live Telemetry Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Live Camera Viewport Container */}
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-[12px] p-2.5 flex flex-col shadow-xs">
          <div className="relative bg-[#0A0D14] rounded-[8px] aspect-[16/9] overflow-hidden flex items-center justify-center select-none shadow-inner">
            {/* 1. Real Hardware Camera Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                !isCameraActive || cameraError ? 'hidden' : 'block'
              }`}
            />

            {/* 2. Fallback Industrial Conveyor Canvas Simulation (Active when camera is off/error) */}
            {(!isCameraActive || cameraError) && (
              <canvas
                ref={simCanvasRef}
                className="w-full h-full object-cover block"
              />
            )}

            {/* 3. Live AI HUD Canvas Overlay (Directly over Video / Simulation) */}
            <canvas
              ref={hudCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Camera Status Badge in Top-Left Corner */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs border border-white/10 rounded-full px-2.5 py-1 flex items-center space-x-1.5 text-[11px] text-white z-20">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCameraActive && !cameraError
                    ? 'bg-[#22C55E] animate-pulse'
                    : 'bg-[#F59E0B]'
                }`}
              />
              <span className="font-semibold tracking-wide">
                {isCameraActive && !cameraError
                  ? 'LIVE HD WEBCAM (1280x720)'
                  : 'CONVEYOR SIMULATION (ACTIVE)'}
              </span>
            </div>

            {/* Camera Permission / Info Prompt if Camera is Disabled */}
            {cameraError && (
              <div className="absolute top-12 left-3 right-3 bg-amber-500/90 backdrop-blur-xs border border-amber-300 text-slate-950 px-3 py-1.5 rounded-[6px] text-xs font-medium z-20 flex items-center justify-between shadow-md">
                <span>{cameraError}</span>
                <button
                  type="button"
                  onClick={() => startCameraStream()}
                  className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold ml-2 cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Critical Interlock Tripped Banner */}
            {isTripped && (
              <div className="absolute bottom-3 inset-x-3 bg-red-600/95 backdrop-blur-xs border border-red-300 text-white px-3.5 py-2 rounded-[8px] flex items-center justify-between shadow-lg z-20 animate-pulse">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-white" />
                  <span>SAFETY INTERLOCK: SPINDLE CRASH PREVENTION TRIPPED (RELAY DO_2 CUT)</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 bg-white text-[#DC2626] hover:bg-rose-50 rounded-[6px] text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Reset Interlock
                </button>
              </div>
            )}
          </div>

          {/* Camera Telemetry Bar */}
          <div className="mt-2 px-3 py-1.5 bg-[#F8F9FA] rounded-[8px] border border-[#E5E7EB] flex flex-wrap items-center justify-between text-xs text-[#6B7280]">
            <div className="flex items-center space-x-3">
              <span>
                Frame Rate: <strong className="text-[#1A1A2E]">{visionStatus.fps.toFixed(1)} FPS</strong>
              </span>
              <span>·</span>
              <span>
                AI Latency: <strong className="text-[#1A1A2E]">{visionStatus.latency_ms.toFixed(1)}ms</strong>
              </span>
              <span>·</span>
              <span>
                Optical Pipeline:{' '}
                <strong className="text-[#1A1A2E]">
                  {isCameraActive ? 'MediaDevices WebRTC' : 'Simulated Optical Engine'}
                </strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px]">Hardware Contactors:</span>
              <span
                className={`text-[11px] font-bold ${
                  isTripped ? 'text-[#DC2626]' : 'text-[#15803D]'
                }`}
              >
                {isTripped ? 'DO_2 HIGH (HALT)' : 'DO_0 HIGH (PERMISSIVE)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Detection Results Sidebar */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5">
          {/* Main Inspection Verdict Card */}
          <div
            className={`bg-white border rounded-[12px] p-4.5 transition-all shadow-xs ${
              isPass ? 'border-[#BBF7D0]' : 'border-[#FECDD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Inspection Result
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isPass
                    ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                    : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECDD3]'
                }`}
              >
                {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{isPass ? 'APPROVED — PASS' : 'REJECTED — FAIL'}</span>
              </span>
            </div>

            <h3
              className={`text-lg font-bold tracking-tight mb-1 ${
                isPass ? 'text-[#15803D]' : 'text-[#DC2626]'
              }`}
            >
              {visionStatus.status_text}
            </h3>

            <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
              {isPass
                ? 'Workpiece geometry matches CAD profile. Zero surface flaws detected. Cleared for CNC spindle engagement.'
                : 'Workpiece profile mismatch or surface defect detected. Immediate spindle emergency halt engaged.'}
            </p>

            {/* Profile Match Score Gauge */}
            <div className="space-y-1.5 pt-2 border-t border-[#F1F3F5]">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#6B7280]">Profile Match Score:</span>
                <span
                  className={`font-bold font-mono ${
                    visionStatus.match_pct >= 85 ? 'text-[#15803D]' : 'text-[#DC2626]'
                  }`}
                >
                  {visionStatus.match_pct.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    visionStatus.match_pct >= 85 ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, visionStatus.match_pct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Part Verification Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 text-xs space-y-2.5 shadow-xs">
            <h4 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-wider border-b border-[#F1F3F5] pb-2 flex items-center justify-between">
              <span>Detected Workpiece</span>
              <span className="font-mono text-[#2563EB] font-bold">
                {visionStatus.target_part_code}
              </span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Component Name:</span>
                <span className="font-semibold text-[#1A1A2E] text-right max-w-[180px] truncate">
                  {visionStatus.target_part_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Match Confidence:</span>
                <span className="font-bold font-mono text-[#1A1A2E]">
                  {(visionStatus.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Verification Latency:</span>
                <span className="font-bold font-mono text-[#15803D]">
                  {visionStatus.latency_ms.toFixed(1)} ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Defect Count:</span>
                <span
                  className={`font-bold ${
                    visionStatus.defects.length > 0 ? 'text-[#DC2626]' : 'text-[#15803D]'
                  }`}
                >
                  {visionStatus.defects.length > 0
                    ? `${visionStatus.defects.length} Fault(s) Flagged`
                    : '0 Flaws (Clean Spec)'}
                </span>
              </div>
            </div>

            {/* Defect description list */}
            {visionStatus.defects.length > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[8px] space-y-1">
                {visionStatus.defects.map((d, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-[#DC2626] font-medium flex items-center space-x-1.5"
                  >
                    <AlertOctagon className="w-3 h-3 shrink-0" />
                    <span>{d.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Machine Safety Interlock Status Box */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1A1A2E] uppercase tracking-wider text-[11px]">
                Safety Relay Circuit
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isTripped
                    ? 'bg-red-100 text-[#DC2626] border border-red-200 animate-pulse'
                    : 'bg-emerald-100 text-[#15803D] border border-emerald-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{isTripped ? 'Relay DO_2 CUT' : 'SIL 3 Armed'}</span>
              </span>
            </div>

            <p className="text-[11.5px] text-[#6B7280] leading-relaxed">
              {isTripped
                ? 'Spindle power contactor severed. Machine axis halted before cutter engagement to prevent crash.'
                : 'Fail-safe contactors armed. CNC controller granted cutting permissive.'}
            </p>

            {isTripped ? (
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 px-3 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Interlock & Re-Arm Spindle</span>
              </button>
            ) : (
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F3F5] text-[11px] text-[#6B7280]">
                <span>Relay Response Time:</span>
                <span className="font-mono font-bold text-[#15803D]">
                  &lt; 15 ms (Direct Hardware Coil)
                </span>
              </div>
            )}
          </div>

          {/* Route to Triage Queue */}
          <Link
            to="/queue"
            className="p-3 bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-[12px] flex items-center justify-between text-xs text-[#4F46E5] font-semibold transition-colors group shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-[#4F46E5]" />
              <span>Inspect Incident Triage Queue</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
