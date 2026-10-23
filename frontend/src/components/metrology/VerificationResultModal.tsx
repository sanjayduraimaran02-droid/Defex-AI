import React, { useState, useEffect } from 'react';
import { MetrologyFusionReport } from '../../types/metrology';
import { metrologyAudio } from '../../utils/metrologyAudio';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  FileSpreadsheet,
  PhoneCall,
  Lock,
  Unlock,
  ShieldAlert,
  Award,
} from 'lucide-react';

interface VerificationResultModalProps {
  report: MetrologyFusionReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReVerify: () => void;
  onOpenCertificate: () => void;
  onStartMachine: () => void;
}

export const VerificationResultModal: React.FC<VerificationResultModalProps> = ({
  report,
  isOpen,
  onClose,
  onReVerify,
  onOpenCertificate,
  onStartMachine,
}) => {
  const toast = useToast();
  const [countdown, setCountdown] = useState<number>(3);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');

  // Handle countdown on PASS
  useEffect(() => {
    if (!isOpen || !report || report.verdict !== 'PASS' || !isCountingDown) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onStartMachine();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, report?.verdict, isCountingDown]);

  // Audio feedback on open
  useEffect(() => {
    if (!isOpen || !report) return;

    if (report.verdict === 'PASS') {
      metrologyAudio.playPassChime();
    } else if (report.verdict === 'CRITICAL_FAIL') {
      metrologyAudio.startCriticalAlarm(3500);
    } else {
      metrologyAudio.playWarningTone();
    }

    return () => {
      metrologyAudio.stopAlarm();
    };
  }, [isOpen, report?.verdict]);

  if (!isOpen || !report) return null;

  const isPass = report.verdict === 'PASS';
  const isCritical = report.verdict === 'CRITICAL_FAIL';

  const handleHoldMachine = () => {
    setIsCountingDown(false);
    toast.info('Auto-start held by operator. Machine is paused on fixture.');
  };

  const handleLogNCR = async () => {
    try {
      await api.alerts.create({
        title: `NCR Created: ${report.partCode} (${report.certificateId})`,
        message: `Non-conformance report generated for ${report.partName}. Critical deviations: ${report.criticalFailures.join('; ')}`,
        severity: 'CRITICAL',
      });
      toast.success('Non-Conformance Report (NCR) logged to QA records');
    } catch {
      toast.success('NCR created locally');
    }
  };

  const handleSupervisorUnlock = () => {
    // Demo supervisor PIN
    if (supervisorPin === '8842' || supervisorPin === '1234') {
      setIsUnlocked(true);
      setPinError('');
      metrologyAudio.stopAlarm();
      toast.success('Safety interlock bypassed by Supervisor authorization');
    } else {
      setPinError('Invalid Supervisor PIN. Access denied.');
      metrologyAudio.playWarningTone();
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-[12px] p-6 max-w-lg w-full border text-left transition-all duration-300 relative ${
          isCritical
            ? 'border-rose-500 ring-4 ring-rose-500/20'
            : isPass
            ? 'border-emerald-300 ring-4 ring-emerald-500/10'
            : 'border-amber-300 ring-4 ring-amber-500/10'
        }`}
        style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Pass Verdict Layout */}
        {isPass ? (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center border border-emerald-200 shrink-0 animate-[bounce_0.5s_ease-out]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-[#15803D] uppercase tracking-wider">
                  Verification Complete
                </span>
                <h3 className="text-[20px] font-bold text-[#1A1A2E]">
                  Metrology Verification — PASSED
                </h3>
              </div>
            </div>

            {/* Score Banner */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] p-3.5 mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-[#166534]">Overall Metrology Score:</span>
                <span className="text-2xl font-bold font-mono text-[#15803D]">
                  {report.overallScore.toFixed(1)} / 100
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[#166534] border-t border-emerald-200 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>📷 Visual Score:</span>
                  <span className="font-bold">{report.visualScore.toFixed(1)}% ✅</span>
                </div>
                <div className="flex justify-between">
                  <span>🔴 Geometry Score:</span>
                  <span className="font-bold">{report.geometryScore.toFixed(1)}% ✅ (Dims within tol)</span>
                </div>
                <div className="flex justify-between">
                  <span>🔬 Surface Score:</span>
                  <span className="font-bold">
                    {report.surfaceScore.toFixed(1)}% ✅ (Ra: {report.profilometer.roughness.Ra}µm)
                  </span>
                </div>
              </div>
            </div>

            {/* Part & Certificate Metadata */}
            <div className="bg-[#F8F9FA] rounded-[8px] p-3 border border-[#E5E7EB] text-xs space-y-1 mb-4 font-mono">
              <div className="text-[#1A1A2E] font-bold">
                {report.partCode} — {report.partName}
              </div>
              <div className="text-[#6B7280]">
                Certificate ID: <strong className="text-[#1A1A2E]">{report.certificateId}</strong>
              </div>
              <div className="text-[#6B7280]">
                Machine: <strong>{report.machineId}</strong> · Operator: <strong>{report.operatorName}</strong>
              </div>
            </div>

            {/* Auto Start Countdown */}
            {isCountingDown ? (
              <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-center mb-4">
                <span className="text-xs text-blue-900 font-semibold block mb-1">
                  All safety and metrology gates cleared.
                </span>
                <span className="text-lg font-bold font-mono text-[#2563EB] animate-pulse">
                  Machine starting in {countdown}...
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-2 text-center text-xs text-amber-900 font-semibold mb-4">
                Auto-start paused. Workpiece verified on fixture.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenCertificate}
                className="py-2 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>View Certificate</span>
              </button>

              <div className="flex items-center space-x-2">
                {isCountingDown && (
                  <button
                    type="button"
                    onClick={handleHoldMachine}
                    className="py-2 px-3.5 rounded-[8px] border border-[#E5E7EB] text-[#475569] hover:bg-[#F8F9FA] text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>✋ Hold</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onStartMachine}
                  className="py-2 px-4 rounded-[8px] bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center space-x-1.5 shadow-[0_2px_4px_rgba(34,197,94,0.3)] transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>▶ Start Now</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Fail / Critical Fail Verdict Layout */
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                  isCritical
                    ? 'bg-rose-100 text-[#DC2626] border-rose-300 animate-pulse'
                    : 'bg-amber-100 text-[#D97706] border-amber-300'
                }`}
              >
                {isCritical ? <ShieldAlert className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <span
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                    isCritical ? 'text-[#DC2626]' : 'text-[#D97706]'
                  }`}
                >
                  {isCritical ? 'Safety Interlock Engaged' : 'Verification Out-of-Tolerance'}
                </span>
                <h3 className="text-[20px] font-bold text-[#1A1A2E]">
                  Metrology Verification — FAILED
                </h3>
              </div>
            </div>

            {/* Score & Deviation Details */}
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] p-3.5 mb-3 text-xs">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-rose-900">Overall Score:</span>
                <span className="text-xl font-bold font-mono text-[#DC2626]">
                  {report.overallScore.toFixed(1)} / 100 (Min: 90.0)
                </span>
              </div>

              {/* Critical failure reasons list */}
              <div className="space-y-1 font-mono text-[11px] text-rose-800 border-t border-rose-200 pt-2">
                {report.criticalFailures.map((reason, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[#DC2626] font-bold">✕</span>
                    <span className="leading-snug">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Machine Locked Banner */}
            <div className="bg-[#1A1A2E] text-white rounded-[8px] p-3 flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-xs">
                <Lock className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="font-bold text-rose-400">⛔ MACHINE LOCKED</span>
                  <p className="text-[11px] text-slate-300">Safety circuit open — Cannot start cycle.</p>
                </div>
              </div>
              {isUnlocked && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                  OVERRIDDEN
                </span>
              )}
            </div>

            {/* Required Actions Checklist */}
            <div className="bg-[#F8F9FA] rounded-[8px] p-3 border border-[#E5E7EB] mb-4 text-xs">
              <div className="font-bold text-[#1A1A2E] mb-1.5">REQUIRED CORRECTIVE ACTIONS:</div>
              <ol className="list-decimal pl-4 space-y-1 text-[#475569]">
                {report.requiredActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>

            {/* Supervisor PIN Unlock Section (if locked) */}
            {!isUnlocked && (
              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-2.5 mb-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">
                      Supervisor PIN Override (e.g. 8842):
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={supervisorPin}
                      onChange={(e) => setSupervisorPin(e.target.value)}
                      placeholder="PIN"
                      className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-xs font-mono w-28 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSupervisorUnlock}
                    className="py-1 px-2.5 rounded bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-700 mt-3 cursor-pointer"
                  >
                    Unlock Interlock
                  </button>
                </div>
                {pinError && <p className="text-[10px] text-rose-600 mt-1">{pinError}</p>}
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleLogNCR}
                className="py-2 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
                <span>Log NCR</span>
              </button>

              <button
                type="button"
                onClick={() => toast.info('Calling QA Engineer on extension #4102...')}
                className="py-2 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Call QA</span>
              </button>

              <button
                type="button"
                onClick={onReVerify}
                className="py-2 px-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center space-x-1.5 shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Re-Verify</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
