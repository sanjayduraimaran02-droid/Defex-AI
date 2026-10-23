import React, { useState } from 'react';
import { LaserScannerResult, SensorState } from '../../types/metrology';
import { PointcloudViewer } from './PointcloudViewer';
import { metrologyService } from '../../services/metrologyHardware';
import { useToast } from '../../context/ToastContext';
import {
  Scan,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Usb,
  Save,
  FileText,
  RotateCw,
} from 'lucide-react';

interface LaserScannerPanelProps {
  result: LaserScannerResult;
  status: SensorState;
  scanProgress: number;
  onStartScan: () => void;
  onOpenReport?: () => void;
  className?: string;
}

export const LaserScannerPanel: React.FC<LaserScannerPanelProps> = ({
  result,
  status,
  scanProgress,
  onStartScan,
  onOpenReport,
  className = '',
}) => {
  const toast = useToast();
  const [connectionMode, setConnectionMode] = useState<'DEMO' | 'WEB_SERIAL' | 'WEBSOCKET'>('DEMO');
  const [portLabel, setPortLabel] = useState<string>('COM-USB0 (FTDI)');

  const isScanning = status === 'SCANNING';
  const isPassed = result.status === 'PASS';

  const handleConnectHardware = async () => {
    const res = await metrologyService.requestSerialPort('laser');
    if (res.success) {
      setConnectionMode('WEB_SERIAL');
      if (res.portName) setPortLabel(res.portName);
      toast.success(res.message);
    } else {
      toast.warning(res.message);
    }
  };

  const handleSaveData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      pointCount: result.pointCount,
      dimensions: result.dimensions,
      gdt: result.gdt,
      geometryScore: result.geometryScore,
      status: result.status,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laser-scan-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('3D geometry dataset downloaded');
  };

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Header */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
            <Scan className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#1A1A2E] leading-tight">
              🔴 Laser Scanner — 3D Geometry
            </h3>
            <span className="text-[10px] text-[#6B7280]">
              Sub-micron 3D Point Cloud & GD&T Verification
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
            {isScanning ? 'SCANNING' : 'CONNECTED'}
          </span>
        </div>
      </div>

      {/* Connection Bar */}
      <div className="px-3.5 py-1.5 bg-[#F1F3F5] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Usb className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span className="text-[11px] font-mono text-[#475569]">{portLabel}</span>
        </div>
        <button
          type="button"
          onClick={handleConnectHardware}
          className="text-[10px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
        >
          {connectionMode === 'WEB_SERIAL' ? 'Re-sync Port' : 'Connect Web Serial'}
        </button>
      </div>

      {/* Interactive 3D Point Cloud View */}
      <div className="p-3 bg-slate-900">
        <PointcloudViewer
          points={result.points}
          isScanning={isScanning}
          scanProgress={scanProgress}
          title="Laser Line Triangulation"
        />
      </div>

      {/* Dimension & GD&T Results Table */}
      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
        {/* Dimensions Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <span>Dimension Results</span>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Tol (±0.05mm)</span>
          </div>
          <div className="divide-y divide-[#F1F3F5] text-xs">
            {result.dimensions.map((dim) => (
              <div key={dim.id} className="py-1.5 flex items-center justify-between">
                <span className="text-[#475569] font-medium">{dim.name}:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span
                    className={`font-bold text-[11.5px] ${
                      dim.status === 'FAIL' ? 'text-[#EF4444]' : 'text-[#1A1A2E]'
                    }`}
                  >
                    {dim.measured.toFixed(3)}
                    <span className="text-[10px] text-[#9CA3AF] ml-0.5">{dim.unit}</span>
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {dim.deviation > 0 ? `+${dim.deviation.toFixed(3)}` : dim.deviation.toFixed(3)}
                  </span>
                  {dim.status === 'PASS' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GD&T Section */}
        <div className="pt-2 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <span>GD&T Tolerancing</span>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Limit</span>
          </div>
          <div className="divide-y divide-[#F1F3F5] text-xs">
            {result.gdt.map((g) => (
              <div key={g.id} className="py-1 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[#475569]">
                  <span className="font-mono text-blue-600 font-bold">{g.symbol}</span>
                  <span>{g.name}:</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span
                    className={`font-bold text-[11px] ${
                      g.status === 'FAIL' ? 'text-[#EF4444]' : 'text-[#1A1A2E]'
                    }`}
                  >
                    {g.measured}
                    <span className="text-[9px] text-[#9CA3AF] ml-0.5">{g.unit}</span>
                  </span>
                  <span className="text-[10px] text-[#6B7280]">≤{g.specLimit}{g.unit}</span>
                  {g.status === 'PASS' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan metadata stats bar */}
        <div className="bg-[#F8F9FA] rounded-[6px] p-2 flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
          <span>Point Cloud: <strong>{result.pointCount.toLocaleString()} pts</strong></span>
          <span>Scan Time: <strong>{result.scanDurationS}s</strong></span>
        </div>
      </div>

      {/* Control Buttons Footer */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStartScan}
          disabled={isScanning}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-[0_2px_4px_rgba(239,68,68,0.2)] ${
            isScanning
              ? 'bg-rose-400 cursor-not-allowed'
              : 'bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer'
          }`}
        >
          {isScanning ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Scan className="w-3.5 h-3.5" />
          )}
          <span>{isScanning ? 'Scanning...' : '🔴 Start Scan'}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveData}
          className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Save</span>
        </button>

        {onOpenReport && (
          <button
            type="button"
            onClick={onOpenReport}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Report</span>
          </button>
        )}
      </div>
    </div>
  );
};
