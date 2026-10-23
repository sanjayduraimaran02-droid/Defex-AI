import React from 'react';
import { ShieldAlert, ShieldCheck, PauseCircle, Zap, Cpu } from 'lucide-react';
import { HardwareSignal } from '../types';

interface SignalIndicatorProps {
  signal: HardwareSignal | string;
  responseTimeMs?: number;
  relayOutputs?: {
    DO_0_GO?: boolean;
    DO_1_HOLD?: boolean;
    DO_2_STOP?: boolean;
    DO_3_DIVERT?: boolean;
    DO_4_ALARM_STROBE?: boolean;
  };
  compact?: boolean;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  signal,
  responseTimeMs = 12.4,
  relayOutputs,
  compact = false,
}) => {
  const norm = (signal || 'GO').toUpperCase();

  const isGo = norm === 'CLEAR_FOR_MACHINING' || norm === 'GO';
  const isHold = norm === 'HOLD_AND_LOCK_STATION' || norm === 'HOLD';
  const isStop = norm === 'EMERGENCY_STOP_MACHINE' || norm === 'STOP' || norm === 'EMERGENCY_STOP';

  const defaultOutputs = {
    DO_0_GO: isGo,
    DO_1_HOLD: isHold,
    DO_2_STOP: isStop,
    DO_3_DIVERT: isStop,
    DO_4_ALARM_STROBE: isStop,
  };

  const outputs = relayOutputs || defaultOutputs;

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2 text-[11px]">
        {isGo && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#15803D] border border-[#BBF7D0] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#22C55E]" />
            GO ({responseTimeMs}ms)
          </span>
        )}
        {isHold && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#B45309] border border-[#FDE68A] shadow-2xs">
            <PauseCircle className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
            HOLD ({responseTimeMs}ms)
          </span>
        )}
        {isStop && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#B91C1C] border border-[#FECACA] shadow-2xs animate-soft-pulse">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#EF4444]" />
            STOP ({responseTimeMs}ms)
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-[12px] border p-5 transition-all duration-200 bg-white ${
        isStop
          ? 'border-[#FECDD3] bg-gradient-to-b from-[#FFF1F2]/60 to-white'
          : isHold
          ? 'border-[#FDE68A] bg-gradient-to-b from-[#FFFBEB]/60 to-white'
          : 'border-[#E2E8F0]'
      }`}
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Fail-Safe Hardware Interlock</div>
            <div className="text-[11px] text-[#64748B]">Siemens SIL 3 Safety Relay Matrix</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            <Zap className="w-3 h-3 text-amber-500 mr-1" />
            {responseTimeMs} ms latch
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            OPC-UA
          </span>
        </div>
      </div>

      {/* Main Signal Banner */}
      <div
        className={`rounded-xl p-4 mb-4 border transition-all flex items-center justify-between ${
          isGo
            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
            : isHold
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            : 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isGo
                ? 'bg-emerald-100 text-[#10B981]'
                : isHold
                ? 'bg-amber-100 text-[#F59E0B]'
                : 'bg-rose-100 text-[#F43F5E] animate-soft-pulse'
            }`}
          >
            {isGo && <ShieldCheck className="w-6 h-6" />}
            {isHold && <PauseCircle className="w-6 h-6" />}
            {isStop && <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Active Hardware Command
            </div>
            <div className="text-base font-bold text-[#0F172A] mt-0.5">
              {isGo && 'CLEAR FOR MACHINING — Spindle Permitted'}
              {isHold && 'HOLD & LOCK STATION — Awaiting Triage'}
              {isStop && 'EMERGENCY STOP — Machine Feed Held'}
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isGo
                ? 'bg-emerald-100 text-[#065F46] border border-[#A7F3D0]'
                : isHold
                ? 'bg-amber-100 text-[#92400E] border border-[#FDE68A]'
                : 'bg-rose-100 text-[#9F1239] border border-[#FECDD3]'
            }`}
          >
            {isGo ? 'RELAY: GO' : isHold ? 'RELAY: HOLD' : 'RELAY: STOP'}
          </span>
        </div>
      </div>

      {/* Digital Output Pin Matrix */}
      <div>
        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
          Digital Output Relays (24V DC Opto-Isolated)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div
            className={`p-2.5 rounded-lg border text-center transition-colors ${
              outputs.DO_0_GO
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500">DO_0</div>
            <div className="text-xs font-bold mt-0.5">Spindle Perm</div>
            <div className="text-[11px] font-mono mt-1 font-semibold">
              {outputs.DO_0_GO ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center transition-colors ${
              outputs.DO_1_HOLD
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500">DO_1</div>
            <div className="text-xs font-bold mt-0.5">Part Clamp</div>
            <div className="text-[11px] font-mono mt-1 font-semibold">
              {outputs.DO_1_HOLD ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center transition-colors ${
              outputs.DO_2_STOP
                ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500">DO_2</div>
            <div className="text-xs font-bold mt-0.5">Feed Hold</div>
            <div className="text-[11px] font-mono mt-1 font-semibold">
              {outputs.DO_2_STOP ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center transition-colors ${
              outputs.DO_3_DIVERT
                ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500">DO_3</div>
            <div className="text-xs font-bold mt-0.5">Divert Gate</div>
            <div className="text-[11px] font-mono mt-1 font-semibold">
              {outputs.DO_3_DIVERT ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center transition-colors ${
              outputs.DO_4_ALARM_STROBE
                ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500">DO_4</div>
            <div className="text-xs font-bold mt-0.5">Alarm Beacon</div>
            <div className="text-[11px] font-mono mt-1 font-semibold">
              {outputs.DO_4_ALARM_STROBE ? 'HIGH (1)' : 'LOW (0)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
