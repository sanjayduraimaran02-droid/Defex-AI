import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Sliders,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, role, switchRole } = useAuth();

  // Settings form state
  const [visionSensitivity, setVisionSensitivity] = useState<number>(85);
  const [metrologyToleranceFactor, setMetrologyToleranceFactor] = useState<number>(1.0);
  const [maxLatencyMs, setMaxLatencyMs] = useState<number>(35);
  const [safetyFailSafeMode, setSafetyFailSafeMode] = useState<string>('EMERGENCY_STOP_MACHINE');
  const [autoDivertDefects, setAutoDivertDefects] = useState<boolean>(true);
  const [heartbeatWatchdog, setHeartbeatWatchdog] = useState<boolean>(true);
  const [stationCode, setStationCode] = useState<string>('CELL-01-A');
  const [stationName, setStationName] = useState<string>('Station 1 - High-Speed Gantry');
  const [audibleAlarm, setAudibleAlarm] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setVisionSensitivity(85);
    setMetrologyToleranceFactor(1.0);
    setMaxLatencyMs(35);
    setSafetyFailSafeMode('EMERGENCY_STOP_MACHINE');
    setAutoDivertDefects(true);
    setHeartbeatWatchdog(true);
    setStationCode('CELL-01-A');
    setStationName('Station 1 - High-Speed Gantry');
    setAudibleAlarm(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Station Parameters & Security</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Settings & System Configuration</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage industrial vision heuristics, hardware interlock thresholds, and workstation node configurations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="py-[9px] px-3.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-[9px] px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(37,99,235,0.2)] flex items-center space-x-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration successfully applied to workstation controller and hardware relays.</span>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Vision & Metrology Heuristics */}
          <div
            className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center space-x-2.5 mb-4 border-b border-[#F1F3F5] pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Inspection & Metrology Heuristics</h3>
                <p className="text-xs text-[#6B7280]">AI flaw classification confidence and dimensional tolerance bounds</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#1A1A2E]">
                    Minimum Vision Defect Confidence Floor: <span className="text-blue-600">{visionSensitivity}%</span>
                  </label>
                  <span className="text-[11px] text-[#6B7280]">Sub-threshold flaws routed to Triage</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={visionSensitivity}
                  onChange={(e) => setVisionSensitivity(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B7280] font-mono mt-0.5">
                  <span>50% (Permissive)</span>
                  <span>75% (Balanced)</span>
                  <span>98% (Ultra Strict)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                    Metrology Tolerance Multiplier
                  </label>
                  <select
                    value={metrologyToleranceFactor}
                    onChange={(e) => setMetrologyToleranceFactor(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value={0.8}>0.8x (Tighter Aerospace Band)</option>
                    <option value={1.0}>1.0x (Standard Engineering ± Spec)</option>
                    <option value={1.2}>1.2x (Relaxed Non-Critical Band)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                    Max Allowed Latch Latency
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={maxLatencyMs}
                      onChange={(e) => setMaxLatencyMs(Number(e.target.value))}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-[#6B7280]">ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Hardware Interlock & Safety Protocols */}
          <div
            className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center space-x-2.5 mb-4 border-b border-[#F1F3F5] pb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Hardware Interlock & Safety Circuit</h3>
                <p className="text-xs text-[#6B7280]">Fail-safe relay signals before workpiece machining commences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                  Default Hardware Action on Critical Anomaly
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  <div
                    onClick={() => setSafetyFailSafeMode('EMERGENCY_STOP_MACHINE')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      safetyFailSafeMode === 'EMERGENCY_STOP_MACHINE'
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-[#E5E7EB] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#1A1A2E]">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span>EMERGENCY_STOP_MACHINE</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      Instantly trips SIL 3 hardware circuit breaker to protect machine spindle.
                    </p>
                  </div>

                  <div
                    onClick={() => setSafetyFailSafeMode('HOLD_AND_LOCK_STATION')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      safetyFailSafeMode === 'HOLD_AND_LOCK_STATION'
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-[#E5E7EB] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#1A1A2E]">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span>HOLD_AND_LOCK_STATION</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      Halts gantry conveyor without breaking master relay circuit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F1F3F5] space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#1A1A2E]">Auto-Divert Defective Workpieces</div>
                    <div className="text-[11px] text-[#6B7280]">Energize pneumatic gate DO_3_DIVERT on FAIL outcome</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDivertDefects}
                    onChange={(e) => setAutoDivertDefects(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#1A1A2E]">Periodic PLC Heartbeat Watchdog</div>
                    <div className="text-[11px] text-[#6B7280]">Ping optical sensor head every 250ms with 3-miss trip safety</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={heartbeatWatchdog}
                    onChange={(e) => setHeartbeatWatchdog(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Workstation & User Profile */}
        <div className="space-y-6">
          {/* Card 3: Workstation Node Profile */}
          <div
            className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center space-x-2.5 mb-4 border-b border-[#F1F3F5] pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#15803D] flex items-center justify-center border border-emerald-100">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Workstation Profile</h3>
                <p className="text-xs text-[#6B7280]">Physical cell binding and telemetry identifier</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">Cell Code Identifier</label>
                <input
                  type="text"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">Station Line Name</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-2 border-t border-[#F1F3F5]">
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-[#6B7280]">Firmware Target</span>
                  <span className="font-mono font-semibold text-[#1A1A2E]">v2.4.12-RT</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-[#6B7280]">Safety Classification</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                    IEC 61508 (SIL 3)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Active Operator Credentials */}
          <div
            className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center space-x-2.5 mb-4 border-b border-[#F1F3F5] pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center border border-indigo-100">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Active Session</h3>
                <p className="text-xs text-[#6B7280]">Current operator role and permissions</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
                <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Signed In As</div>
                <div className="text-sm font-bold text-[#1A1A2E] mt-0.5">{user?.full_name || 'System Operator'}</div>
                <div className="text-[11px] font-mono text-[#6B7280]">{user?.email || 'operator@defex.ai'}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">Switch Active Role</label>
                <select
                  value={role}
                  onChange={(e) => switchRole(e.target.value as UserRole)}
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="administrator">Administrator (Full Access)</option>
                  <option value="quality_inspector">Quality Inspector (Triage Sign-off)</option>
                  <option value="operator">Station Operator (Inspection Only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
