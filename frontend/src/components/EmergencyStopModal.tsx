import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, X } from 'lucide-react';
import { api } from '../api/client';

interface EmergencyStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isTripped?: boolean;
}

export const EmergencyStopModal: React.FC<EmergencyStopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isTripped = false,
}) => {
  const [reason, setReason] = useState('Manual E-STOP triggered from Workstation UI');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTripStop = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.interlock.emergencyStop(reason);
      setMessage('Hardware emergency stop engaged. Safety relays opened; all motion halted.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage(`Failed to trip E-Stop: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.interlock.reset();
      setMessage('Safety circuit successfully reset. PLC permissives armed.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage(`Failed to reset: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white border border-[#E2E8F0] rounded-[12px] max-w-lg w-full p-6 relative"
        style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-[8px] hover:bg-slate-100 transition-all duration-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3.5 mb-4">
          <div className="w-11 h-11 rounded-[8px] bg-[#FFF1F2] border border-[#FECDD3] text-[#F43F5E] flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
              {isTripped ? 'Safety Interlock Circuit Tripped' : 'Manual Emergency Stop (E-STOP)'}
            </h3>
            <p className="text-xs text-slate-500">
              Siemens S7-1500F Fail-Safe Dual-Channel SIL 3 Interlock
            </p>
          </div>
        </div>

        {message && (
          <div className="p-3 mb-4 rounded-[8px] bg-slate-50 border border-slate-200 text-xs text-amber-800 font-medium">
            {message}
          </div>
        )}

        {!isTripped ? (
          <div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Activating E-STOP immediately asserts Digital Output DO_2 (STOP) and opens
              hardware safety contactors. All machining spindles, feeder axes, and transfer conveyors
              will instantly halt to prevent equipment collision or damage.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Audit Reason for Emergency Halt
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-[8px] p-2.5 text-xs text-[#0F172A] focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold border border-[#E2E8F0] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTripStop}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold tracking-wide shadow-sm focus:ring-4 focus:ring-red-200 transition-all duration-200 cursor-pointer"
              >
                {loading ? 'Sending Trip...' : 'Trip E-STOP Now'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              The safety interlock circuit is currently OPEN. Clear physical workcell obstructions, verify
              part clamps, and ensure all operators are clear of the machine envelope before performing a reset.
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold border border-[#E2E8F0] transition-all duration-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-[8px] bg-[#475569] hover:bg-[#334155] text-white text-xs font-semibold tracking-wide shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Arming Circuit...' : 'Reset Safety Circuit'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
