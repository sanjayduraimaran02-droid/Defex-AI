import React from 'react';
import {
  MetrologyFusionReport,
  SensorState,
} from '../../types/metrology';
import {
  Layers,
  Camera,
  Scan,
  Microscope,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface FusionVerificationEngineProps {
  report: MetrologyFusionReport;
  cameraStatus: SensorState;
  laserStatus: SensorState;
  profiloStatus: SensorState;
  cameraProgress: number;
  laserProgress: number;
  profiloProgress: number;
  estimatedTimeRemaining: number;
  isPipelineRunning: boolean;
  className?: string;
}

export const FusionVerificationEngine: React.FC<FusionVerificationEngineProps> = ({
  report,
  cameraStatus,
  laserStatus,
  profiloStatus,
  cameraProgress,
  laserProgress,
  profiloProgress,
  estimatedTimeRemaining,
  isPipelineRunning,
  className = '',
}) => {
  const isAllComplete =
    cameraStatus === 'COMPLETE' &&
    laserStatus === 'COMPLETE' &&
    profiloStatus === 'COMPLETE';

  const isPassed = report.verdict === 'PASS';

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Banner Header */}
      <div className="bg-[#1A1A2E] text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-bold tracking-tight">
                🔬 Metrology Fusion Engine — Real-Time Verification
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Multi-Sensor Triage
              </span>
            </div>
            <div className="text-[11.5px] text-slate-400 mt-0.5 font-mono flex items-center space-x-2">
              <span>Part: <strong className="text-white">{report.partCode}</strong></span>
              <span>·</span>
              <span>Machine: <strong className="text-white">{report.machineId}</strong></span>
              <span>·</span>
              <span>Operator: <strong className="text-white">{report.operatorName}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Pipeline Run indicator */}
        <div className="flex items-center space-x-2">
          {isPipelineRunning && (
            <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-mono bg-blue-950/70 border border-blue-800/80 px-2.5 py-1 rounded-full">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Est: {estimatedTimeRemaining.toFixed(1)}s</span>
            </div>
          )}
          <div className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {report.certificateId}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Sensor Status Progress Rows */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Sensor Pipeline Status (Weights: Visual 25% · Geometry 50% · Surface 25%)
          </div>

          {/* 1. Camera Visual */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 w-44 shrink-0">
              <Camera className="w-4 h-4 text-[#2563EB]" />
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">📷 Camera Visual</div>
                <div className="text-[10px] text-[#6B7280]">Weight: 25%</div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                <span className="text-[#6B7280]">
                  {cameraStatus === 'SCANNING' ? 'SCANNING FRAME...' : cameraStatus}
                </span>
                <span className="font-bold text-[#1A1A2E]">{cameraProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cameraStatus === 'COMPLETE'
                      ? report.camera.status === 'PASS'
                        ? 'bg-[#22C55E]'
                        : 'bg-[#EF4444]'
                      : 'bg-[#2563EB] animate-pulse'
                  }`}
                  style={{ width: `${cameraProgress}%` }}
                />
              </div>
            </div>

            <div className="w-24 text-right">
              {cameraStatus === 'COMPLETE' ? (
                <div className="flex items-center justify-end space-x-1 font-mono text-xs font-bold">
                  <span className={report.camera.status === 'PASS' ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                    {report.camera.visualScore.toFixed(1)}%
                  </span>
                  {report.camera.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#EF4444]" />
                  )}
                </div>
              ) : (
                <span className="text-[11px] font-mono text-[#6B7280]">In Progress...</span>
              )}
            </div>
          </div>

          {/* 2. Laser Scanner */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 w-44 shrink-0">
              <Scan className="w-4 h-4 text-[#DC2626]" />
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">🔴 Laser Scanner</div>
                <div className="text-[10px] text-[#6B7280]">Weight: 50%</div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                <span className="text-[#6B7280]">
                  {laserStatus === 'SCANNING' ? '3D POINT CLOUD CAPTURE...' : laserStatus}
                </span>
                <span className="font-bold text-[#1A1A2E]">{laserProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    laserStatus === 'COMPLETE'
                      ? report.laserScanner.status === 'PASS'
                        ? 'bg-[#22C55E]'
                        : 'bg-[#EF4444]'
                      : 'bg-[#DC2626] animate-pulse'
                  }`}
                  style={{ width: `${laserProgress}%` }}
                />
              </div>
            </div>

            <div className="w-24 text-right">
              {laserStatus === 'COMPLETE' ? (
                <div className="flex items-center justify-end space-x-1 font-mono text-xs font-bold">
                  <span className={report.laserScanner.status === 'PASS' ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                    {report.laserScanner.geometryScore.toFixed(1)}%
                  </span>
                  {report.laserScanner.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#EF4444]" />
                  )}
                </div>
              ) : (
                <span className="text-[11px] font-mono text-[#6B7280]">
                  {laserStatus === 'SCANNING' ? 'Triangulating' : 'Waiting...'}
                </span>
              )}
            </div>
          </div>

          {/* 3. Laser Profilometer */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 w-44 shrink-0">
              <Microscope className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">🔬 Laser Profilometer</div>
                <div className="text-[10px] text-[#6B7280]">Weight: 25%</div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                <span className="text-[#6B7280]">
                  {profiloStatus === 'SCANNING' ? 'CONFOCAL SURFACE SAMPLING...' : profiloStatus}
                </span>
                <span className="font-bold text-[#1A1A2E]">{profiloProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    profiloStatus === 'COMPLETE'
                      ? report.profilometer.status === 'PASS'
                        ? 'bg-[#22C55E]'
                        : 'bg-[#EF4444]'
                      : 'bg-purple-600 animate-pulse'
                  }`}
                  style={{ width: `${profiloProgress}%` }}
                />
              </div>
            </div>

            <div className="w-24 text-right">
              {profiloStatus === 'COMPLETE' ? (
                <div className="flex items-center justify-end space-x-1 font-mono text-xs font-bold">
                  <span className={report.profilometer.status === 'PASS' ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                    {report.profilometer.surfaceScore.toFixed(1)}%
                  </span>
                  {report.profilometer.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#EF4444]" />
                  )}
                </div>
              ) : (
                <span className="text-[11px] font-mono text-[#6B7280]">
                  {profiloStatus === 'SCANNING' ? 'Sampling' : 'Waiting...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Aggregated Results Summary Card */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-3 text-xs">
          <div className="font-bold text-[#1A1A2E] mb-2 flex items-center justify-between">
            <span>LIVE AGGREGATED METRICS:</span>
            <span className="text-[10px] font-mono text-[#6B7280]">Threshold: ≥90.0% Overall Score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
            {/* Visual breakdown */}
            <div className="p-2 bg-white rounded border border-[#E5E7EB]">
              <span className="text-[#6B7280] block mb-1 font-sans text-[10px] uppercase font-bold">
                📷 Visual:
              </span>
              <div>
                Shape: {report.camera.shapeMatchConfidence >= 85 ? '✅' : '❌'}{' '}
                Surface: {report.camera.defects.length === 0 ? '✅' : '❌'}{' '}
                Orient: {report.camera.orientation === 'CORRECT' ? '✅' : '❌'}
              </div>
            </div>

            {/* Geometry breakdown */}
            <div className="p-2 bg-white rounded border border-[#E5E7EB]">
              <span className="text-[#6B7280] block mb-1 font-sans text-[10px] uppercase font-bold">
                🔴 Geometry:
              </span>
              <div>
                {report.laserScanner.dimensions.map((d) => (
                  <span key={d.id} className="mr-1.5">
                    {d.axis || d.name.slice(0, 3)}: {d.status === 'PASS' ? '✅' : '❌'}
                  </span>
                ))}
              </div>
            </div>

            {/* Surface breakdown */}
            <div className="p-2 bg-white rounded border border-[#E5E7EB]">
              <span className="text-[#6B7280] block mb-1 font-sans text-[10px] uppercase font-bold">
                🔬 Surface:
              </span>
              <div>
                Ra ({report.profilometer.roughness.Ra}µm): {report.profilometer.roughness.Ra <= 1.6 ? '✅' : '❌'}{' '}
                Rz: {report.profilometer.roughness.Rz <= 6.3 ? '✅' : '❌'}{' '}
                Lay: ✅
              </div>
            </div>
          </div>
        </div>

        {/* Overall Weighted Score Gauge */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-[#1A1A2E]">OVERALL FUSION SCORE:</span>
            <span className="font-mono font-bold text-sm">
              {isAllComplete ? (
                <span className={isPassed ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                  {report.overallScore.toFixed(1)} / 100 ({report.verdict})
                </span>
              ) : (
                <span className="text-[#2563EB]">Calculating stream...</span>
              )}
            </span>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-[#E5E7EB]">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                isAllComplete
                  ? isPassed
                    ? 'bg-[#22C55E]'
                    : 'bg-[#EF4444]'
                  : 'bg-linear-to-r from-blue-500 to-indigo-600 animate-pulse'
              }`}
              style={{
                width: isAllComplete
                  ? `${report.overallScore}%`
                  : `${Math.round((cameraProgress + laserProgress + profiloProgress) / 3)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
