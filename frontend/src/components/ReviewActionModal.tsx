import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Inspection } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

interface ReviewActionModalProps {
  inspection: Inspection | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: (updated: Inspection) => void;
}

export const ReviewActionModal: React.FC<ReviewActionModalProps> = ({
  inspection,
  isOpen,
  onClose,
  onReviewed,
}) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<'PASS' | 'FAIL'>('PASS');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !inspection) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < 5) {
      setError('Supervisor audit notes are mandatory (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.inspections.review(inspection.id, decision, notes);
      onReviewed(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white border border-[#E2E8F0] rounded-[12px] max-w-xl w-full p-6 relative"
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
          <div className="w-11 h-11 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
              Supervisor Triage Override · Inspection #{inspection.id}
            </h3>
            <p className="text-xs text-slate-500">
              {inspection.part?.code} — {inspection.part?.name} on {inspection.machine?.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-[8px] bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9F1239] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs bg-slate-50 p-3.5 rounded-[8px] border border-slate-200/80">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold tracking-wider">Initial AI Outcome</span>
            <span className="font-semibold text-[#92400E]">Uncertain (HOLD)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold tracking-wider">Model Confidence</span>
            <span className="font-semibold text-[#0F172A] font-mono">
              {(inspection.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold tracking-wider">Hardware Interlock</span>
            <span className="font-semibold text-[#92400E]">Pneumatic Clamp Locked</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold tracking-wider">Reviewing Supervisor</span>
            <span className="font-semibold text-blue-700">
              {user?.full_name || user?.username || 'Lead Inspector'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-700 mb-2 font-semibold uppercase tracking-wider">
              Select Triage Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('PASS')}
                className={`p-3 rounded-[8px] border flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer ${
                  decision === 'PASS'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span className="font-semibold text-xs">Override to PASS (Send GO)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('FAIL')}
                className={`p-3 rounded-[8px] border flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer ${
                  decision === 'FAIL'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-[#DC2626]" />
                <span className="font-semibold text-xs">Confirm FAIL (Send STOP)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Mandatory Engineering Audit Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visual scratch verified as non-structural reflection outside critical O-ring sealing groove. Clearance granted for CNC machining."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-[8px] p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all duration-200"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F8F9FA] text-[#334155] text-xs font-semibold border border-[#E2E8F0] transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2 px-4 rounded-[8px] text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center space-x-2 cursor-pointer ${
                decision === 'PASS'
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-[0_2px_4px_rgba(37,99,235,0.2)]'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C] shadow-[0_2px_4px_rgba(220,38,38,0.2)]'
              }`}
            >
              {decision === 'PASS' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Executing Interlock...'
                  : decision === 'PASS'
                  ? 'Authorize & Send GO Signal'
                  : 'Reject & Trip Divert Gate'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
