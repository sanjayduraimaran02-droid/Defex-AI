import React, { useState } from 'react';
import { ProfilometerResult, SensorState } from '../../types/metrology';
import { ProfilometerViewer } from './ProfilometerViewer';
import { metrologyService } from '../../services/metrologyHardware';
import { useToast } from '../../context/ToastContext';
import {
  Microscope,
  CheckCircle2,
  XCircle,
  Save,
  BarChart2,
  RotateCw,
  Layers,
  Radio,
} from 'lucide-react';

interface ProfilometerPanelProps {
  result: ProfilometerResult;
  status: SensorState;
  onStartScan: () => void;
  raLimit?: number;
  className?: string;
}

export const ProfilometerPanel: React.FC<ProfilometerPanelProps> = ({
  result,
  status,
  onStartScan,
  raLimit = 1.6,
  className = '',
}) => {
  const toast = useToast();
  const [scanMode, setScanMode] = useState<'AREA' | 'LINE' | 'MULTI_POINT'>('AREA');
  const [portName, setPortName] = useState<string>('COM-OPT4 (Confocal)');

  const isScanning = status === 'SCANNING';
  const isPassed = result.status === 'PASS';

  const handleConnectHardware = async () => {
    const res = await metrologyService.requestSerialPort('profilometer');
    if (res.success) {
      if (res.portName) setPortName(res.portName);
      toast.success(res.message);
    } else {
      toast.warning(res.message);
    }
  };

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      scanMode,
      scanAreaMm: result.scanAreaMm,
      roughness: result.roughness,
      waviness: result.waviness,
      texture: result.texture,
      surfaceScore: result.surfaceScore,
      status: result.status,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profilometer-topology-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Surface topology dataset downloaded');
  };

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Header */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Microscope className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1A1A2E] leading-tight">
              🔬 Laser Profilometer — Topology
            </h3>
            <span className="text-[10px] text-[#6B7280]">
              Confocal Micro-Roughness (Ra, Rz, Rq) & Waviness
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] px-2 py-0.5 rounded-full text-[10px] font-mono shadow-2xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isScanning
                ? 'bg-[#3B82F6] animate-pulse'
                : status === 'COMPLETE'
                ? isPassed
                  ? 'bg-[#22C55E]'
                  : 'bg-[#EF4444]'
                : 'bg-[#22C55E]'
            }`}
          />
          <span className="font-bold text-[#1A1A2E]">
            {isScanning ? 'SCANNING' : 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Mode & Port Selector */}
      <div className="px-3.5 py-1.5 bg-[#F1F3F5] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
        {/* Scan Mode Toggle */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-[#6B7280] font-medium">Mode:</span>
          {(['AREA', 'LINE', 'MULTI_POINT'] as const).map((mode) => (
            <label key={mode} className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                name="profilometerScanMode"
                checked={scanMode === mode}
                onChange={() => setScanMode(mode)}
                className="w-3 h-3 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className={`text-[10px] ${scanMode === mode ? 'font-bold text-[#1A1A2E]' : 'text-[#6B7280]'}`}>
                {mode === 'AREA' ? 'Area' : mode === 'LINE' ? 'Line' : 'Multi-Pt'}
              </span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleConnectHardware}
          className="text-[10px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
        >
          {portName}
        </button>
      </div>

      {/* Interactive Profilometer 2D / 3D Visualization */}
      <div className="p-3 bg-slate-900">
        <ProfilometerViewer
          profile2D={result.profile2D}
          topologyGrid3D={result.topologyGrid3D}
          roughness={result.roughness}
          texture={result.texture}
          raLimit={raLimit}
        />
      </div>

      {/* Surface Parameters Table */}
      <div className="p-3.5 space-y-2 flex-1 overflow-y-auto max-h-[300px] text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6B7280] pb-1 border-b border-[#F1F3F5]">
          <span>Surface Parameter</span>
          <span className="text-[10px] font-mono text-[#9CA3AF]">Value · Spec · Status</span>
        </div>

        {/* Ra */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Ra (Arithmetic Mean):</span>
          <div className="flex items-center space-x-2 font-mono">
            <span
              className={`font-bold text-[11.5px] ${
                result.roughness.Ra <= raLimit ? 'text-[#1A1A2E]' : 'text-[#EF4444]'
              }`}
            >
              {result.roughness.Ra.toFixed(2)}µm
            </span>
            <span className="text-[10px] text-[#6B7280]">≤{raLimit.toFixed(1)}µm</span>
            {result.roughness.Ra <= raLimit ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Rz */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Rz (Maximum Height):</span>
          <div className="flex items-center space-x-2 font-mono">
            <span
              className={`font-bold text-[11.5px] ${
                result.roughness.Rz <= 6.3 ? 'text-[#1A1A2E]' : 'text-[#EF4444]'
              }`}
            >
              {result.roughness.Rz.toFixed(2)}µm
            </span>
            <span className="text-[10px] text-[#6B7280]">≤6.3µm</span>
            {result.roughness.Rz <= 6.3 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            )}
          </div>
        </div>

        {/* Rq */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Rq (RMS Roughness):</span>
          <div className="flex items-center space-x-2 font-mono">
            <span className="font-bold text-[11.5px] text-[#1A1A2E]">
              {result.roughness.Rq.toFixed(2)}µm
            </span>
            <span className="text-[10px] text-[#6B7280]">≤2.0µm</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
        </div>

        {/* Rsk */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Rsk (Skewness):</span>
          <div className="flex items-center space-x-2 font-mono">
            <span className="font-bold text-[11.5px] text-[#1A1A2E]">
              {result.roughness.Rsk > 0 ? `+${result.roughness.Rsk.toFixed(2)}` : result.roughness.Rsk.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#6B7280]">±0.50</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
        </div>

        {/* Wa */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Wa (Waviness):</span>
          <div className="flex items-center space-x-2 font-mono">
            <span className="font-bold text-[11.5px] text-[#1A1A2E]">
              {result.waviness.Wa.toFixed(2)}µm
            </span>
            <span className="text-[10px] text-[#6B7280]">≤0.50µm</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
        </div>

        {/* Lay Direction */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#475569] font-medium">Lay Direction:</span>
          <div className="flex items-center space-x-2 font-mono">
            <span className="font-bold text-[11.5px] text-[#1A1A2E]">
              {result.texture.layDirection}
            </span>
            <span className="text-[10px] text-[#6B7280]">Spec Match</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
        </div>

        {/* Area metadata pill */}
        <div className="bg-[#F8F9FA] rounded-[6px] p-2 flex items-center justify-between text-[11px] text-[#6B7280] font-mono mt-2">
          <span>Scan Area: <strong>10 x 10 mm</strong></span>
          <span>Sampling: <strong>1000 x 1000</strong></span>
        </div>
      </div>

      {/* Control Buttons Footer */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStartScan}
          disabled={isScanning}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-[0_2px_4px_rgba(147,51,234,0.2)] ${
            isScanning
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
          }`}
        >
          {isScanning ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Microscope className="w-3.5 h-3.5" />
          )}
          <span>{isScanning ? 'Scanning...' : '🔬 Start Scan'}</span>
        </button>

        <button
          type="button"
          onClick={handleExportData}
          className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
