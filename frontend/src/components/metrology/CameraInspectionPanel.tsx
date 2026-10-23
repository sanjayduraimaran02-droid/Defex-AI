import React, { useRef, useEffect, useState } from 'react';
import { VisualInspectionResult, SensorState } from '../../types/metrology';
import { metrologyService } from '../../services/metrologyHardware';
import {
  Camera,
  Video,
  Flashlight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  Crosshair,
} from 'lucide-react';

interface CameraInspectionPanelProps {
  result: VisualInspectionResult;
  status: SensorState;
  onRetake: () => void;
  onCapture: () => void;
  className?: string;
}

export const CameraInspectionPanel: React.FC<CameraInspectionPanelProps> = ({
  result,
  status,
  onRetake,
  onCapture,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('hardware_stream');
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Draggable ROI box state (percentage values 0-100)
  const [roiBox, setRoiBox] = useState({ x: 18, y: 15, w: 64, h: 70 });
  const [isDraggingRoi, setIsDraggingRoi] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 18, origY: 15 });

  // Initialize camera devices
  useEffect(() => {
    let isMounted = true;
    const initCam = async () => {
      const devices = await metrologyService.getCameraDevices();
      if (isMounted) {
        setCameraDevices(devices);
      }
    };
    initCam();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hook stream to video element
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startFeed = async () => {
      if (selectedDeviceId === 'hardware_stream') {
        setIsLiveStream(true);
        return;
      }
      const stream = await metrologyService.startCameraStream(selectedDeviceId);
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        activeStream = stream;
        setIsLiveStream(true);
      } else {
        setIsLiveStream(false);
      }
    };
    startFeed();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedDeviceId]);

  const handleToggleTorch = async () => {
    const newState = !isTorchOn;
    const success = await metrologyService.toggleTorch(newState);
    if (success) {
      setIsTorchOn(newState);
    } else {
      setIsTorchOn(newState); // Toggle virtual state for simulated torch
    }
  };

  // ROI dragging handlers
  const handleRoiMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingRoi(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: roiBox.x,
      origY: roiBox.y,
    };
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRoi) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

    setRoiBox((prev) => ({
      ...prev,
      x: Math.max(5, Math.min(100 - prev.w - 5, dragStartRef.current.origX + dx)),
      y: Math.max(5, Math.min(100 - prev.h - 5, dragStartRef.current.origY + dy)),
    }));
  };

  const handleContainerMouseUp = () => {
    setIsDraggingRoi(false);
  };

  const isScanning = status === 'SCANNING';
  const isPassed = result.status === 'PASS';

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Panel Header */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1A1A2E] leading-tight">
              📷 Visual AI Inspection
            </h3>
            <span className="text-[10px] text-[#6B7280]">
              Shape, Surface Defects, Orientation & Material Check
            </span>
          </div>
        </div>

        {/* Live Indicator Pill */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] px-2 py-0.5 rounded-full text-[10px] font-mono shadow-2xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isScanning
                ? 'bg-[#3B82F6] animate-pulse'
                : status === 'COMPLETE'
                ? 'bg-[#22C55E]'
                : 'bg-[#22C55E] animate-ping'
            }`}
          />
          <span className="font-bold text-[#1A1A2E]">
            {isScanning ? 'SCANNING' : 'LIVE'}
          </span>
        </div>
      </div>

      {/* Camera Source Selector */}
      <div className="px-3.5 py-1.5 bg-[#F1F3F5] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-[#6B7280]">
          <Video className="w-3 h-3 text-[#4F46E5]" />
          <span className="text-[11px] font-medium">Source:</span>
        </div>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="bg-white border border-[#E5E7EB] rounded-[6px] px-2 py-0.5 text-[11px] text-[#1A1A2E] font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-[220px] truncate"
        >
          <option value="hardware_stream">Industrial Camera Stream (/api/hardware/video_feed)</option>
          {cameraDevices.length > 0 ? (
            cameraDevices.map((dev, idx) => (
              <option key={dev.deviceId || idx} value={dev.deviceId}>
                {dev.label || `Camera ${idx + 1} (Direct Video)`}
              </option>
            ))
          ) : (
            <option value="simulated">Primary Gantry Metrology Camera (Simulated)</option>
          )}
        </select>
      </div>

      {/* Live Feed Viewport Container with Overlays */}
      <div
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        className="relative bg-[#0F0F0F] aspect-[16/10] overflow-hidden select-none"
      >
        {/* Real Hardware MJPEG Stream, WebRTC Video, or Simulated Fixture Feed */}
        {selectedDeviceId === 'hardware_stream' ? (
          <img
            src="/api/hardware/video_feed"
            alt="Live Industrial Stream"
            className="w-full h-full object-cover"
            onError={(e) => {
              // If backend video feed is unreachable, gracefully show simulated fixture
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : isLiveStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-radial from-slate-900 to-black">
            {/* Simulated Industrial Part Fixture Silhouette */}
            <div className="relative w-48 h-32 border border-slate-700/60 rounded-lg flex items-center justify-center bg-slate-800/40 shadow-inner">
              {/* Stepped shaft or flange representation */}
              <div className="w-36 h-12 bg-linear-to-r from-slate-600 via-slate-400 to-slate-600 rounded-sm shadow-lg flex items-center justify-between px-3">
                <div className="w-3 h-6 bg-slate-700 rounded-xs" />
                <div className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-900" />
                <div className="w-4 h-8 bg-slate-700 rounded-xs" />
              </div>
              <span className="absolute bottom-2 text-[9px] font-mono text-slate-400 tracking-wider">
                FIXTURE JIG #A-104
              </span>
            </div>
          </div>
        )}

        {/* 1. Animated Green Scanning Laser Line */}
        {isScanning && (
          <div className="absolute inset-x-0 h-1 bg-[#22C55E] shadow-[0_0_15px_#22C55E,0_0_30px_#22C55E] z-20 animate-[bounce_2.5s_infinite]" />
        )}

        {/* 2. White Corner Bracket Guides (40px) */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-white/90 pointer-events-none" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/90 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/90 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-white/90 pointer-events-none" />

        {/* Center alignment reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Crosshair className="w-7 h-7 text-white/30" />
        </div>

        {/* 3. Draggable Yellow Dashed ROI (Region of Interest) Box */}
        <div
          onMouseDown={handleRoiMouseDown}
          style={{
            left: `${roiBox.x}%`,
            top: `${roiBox.y}%`,
            width: `${roiBox.w}%`,
            height: `${roiBox.h}%`,
          }}
          className="absolute border-2 border-dashed border-[#FBBF24] rounded cursor-move bg-amber-500/10 z-10 hover:border-amber-300 transition-colors"
        >
          <div className="absolute top-0.5 left-1 bg-amber-400 text-slate-900 text-[8px] font-mono font-bold px-1 rounded-xs">
            ROI (INSPECTION ZONE)
          </div>
        </div>

        {/* 4. Highlight Defect Red Overlay Boxes */}
        {result.defects.map((def) => (
          <div
            key={def.id}
            style={{
              left: `${def.bbox.x}%`,
              top: `${def.bbox.y}%`,
              width: `${def.bbox.width}%`,
              height: `${def.bbox.height}%`,
            }}
            className="absolute border-2 border-[#EF4444] bg-red-500/25 rounded z-20 pointer-events-none animate-pulse"
          >
            <div className="absolute -top-5 left-0 bg-[#EF4444] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
              {def.label}
            </div>
          </div>
        ))}

        {/* Torch Indicator Overlay */}
        {isTorchOn && (
          <div className="absolute top-2 left-2 z-20 flex items-center space-x-1 bg-yellow-400/90 text-slate-900 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
            <Flashlight className="w-3 h-3" />
            <span>ILLUMINATOR ACTIVE</span>
          </div>
        )}
      </div>

      {/* Visual Results Metrics Card */}
      <div className="p-3.5 space-y-2 text-xs flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
          Visual Results
        </div>

        {/* Shape Match */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] font-medium">Shape Match:</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.shapeMatchConfidence >= 85 ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                }`}
                style={{ width: `${result.shapeMatchConfidence}%` }}
              />
            </div>
            <span className="font-mono font-bold text-[#1A1A2E] text-[11.5px]">
              {result.shapeMatchConfidence.toFixed(1)}%
            </span>
            {result.shapeMatchConfidence >= 85 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Surface Defects */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] font-medium">Surface Defects:</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-semibold text-[11.5px] ${
                result.defects.length === 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'
              }`}
            >
              {result.defects.length === 0
                ? 'None detected'
                : `${result.defects.length} defect(s)`}
            </span>
            {result.defects.length === 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Orientation */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] font-medium">Orientation:</span>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-[#1A1A2E] text-[11.5px]">
              {result.orientation === 'CORRECT' ? 'Correct (0°)' : result.orientation}
            </span>
            {result.orientation === 'CORRECT' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Part Present */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] font-medium">Part Present:</span>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-[#1A1A2E] text-[11.5px]">
              {result.partPresent ? 'Yes (Seated on Jig)' : 'No Part'}
            </span>
            {result.partPresent ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Material Color */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] font-medium">Material Color:</span>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-[#1A1A2E] text-[11.5px]">
              {result.materialColorMatch ? 'Matches Specification' : 'Color Mismatch'}
            </span>
            {result.materialColorMatch ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons Footer */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCapture}
          className="flex-1 py-1.5 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-[0_2px_4px_rgba(37,99,235,0.2)] cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Capture Frame</span>
        </button>

        <button
          type="button"
          onClick={onRetake}
          className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Retake</span>
        </button>

        <button
          type="button"
          onClick={handleToggleTorch}
          className={`py-1.5 px-2.5 rounded-[8px] border text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
            isTorchOn
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FA]'
          }`}
          title="Toggle Inspection Illuminator"
        >
          <Flashlight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
