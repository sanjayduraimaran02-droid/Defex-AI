import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { api } from '../api/client';
import { Inspection } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SignalIndicator } from '../components/SignalIndicator';
import { DefectOverlayViewer } from '../components/DefectOverlayViewer';
import { LaserProfilometer } from '../components/LaserProfilometer';
import { ReviewActionModal } from '../components/ReviewActionModal';

export const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchInspection = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.inspections.get(Number(id));
      setInspection(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Inspection not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Loading Telemetry & Optical Buffer...</span>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        {error || 'Inspection record unavailable'}
      </div>
    );
  }

  const measurements = inspection.measurements || {};
  const defects = inspection.defect_classes || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center space-x-3.5">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold text-[#0F172A] tracking-tight">
                Inspection #{inspection.id}
              </span>
              <StatusBadge status={inspection.outcome} size="md" />
              {inspection.override_outcome && (
                <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  Supervisor Override: {inspection.override_outcome}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Part: <span className="text-slate-800 font-semibold">{inspection.part?.code} — {inspection.part?.name}</span> · Cell: <span className="text-slate-800 font-semibold">{inspection.machine?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {(!inspection.reviewed || inspection.outcome === 'UNCERTAIN') && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="py-[10px] px-[18px] rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(217,119,6,0.2)] flex items-center space-x-1.5 transition-all"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Supervisor Triage Override</span>
            </button>
          )}

          <Link
            to="/inspection/new"
            className="py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold border border-[#E2E8F0] transition-colors shadow-2xs"
          >
            New Inspection
          </Link>
        </div>
      </div>

      {/* Hardware Interlock Banner */}
      <SignalIndicator
        signal={inspection.hardware_signal}
        responseTimeMs={inspection.response_time_ms}
      />

      {/* Main Multi-Modal Grid: Visual Camera on Left, Laser Profilometer & Metrology Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Visual Defect Viewer */}
        <div className="space-y-4">
          <DefectOverlayViewer
            rawImageUrl={inspection.image_url}
            annotatedImageUrl={inspection.annotated_image_url}
            defects={defects}
            partCode={inspection.part?.code}
          />
        </div>

        {/* Right Column: Laser Metrology Table & Laser Profilometer Chart */}
        <div className="space-y-6">
          {/* Dimension Validation Breakdown Table */}
          <div
            className="bg-white border border-[#E2E8F0] rounded-[12px] p-5"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[0.75rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">Metrology Verification</span>
                <h3 className="text-sm font-bold text-[#0F172A] mt-0.5">Dimensional Tolerance Breakdown</h3>
              </div>
              <div className="text-xs text-[#64748B]">Allowable ± Tolerance Band</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#64748B] text-[10px] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-2">Dimension</th>
                    <th className="py-2.5 px-2">Nominal</th>
                    <th className="py-2.5 px-2">Measured</th>
                    <th className="py-2.5 px-2">Deviation</th>
                    <th className="py-2.5 px-2">Tolerance</th>
                    <th className="py-2.5 px-2">Band %</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {Object.entries(measurements).map(([key, item]) => {
                    const isFail = item.status === 'FAIL';
                    const isBorderline = item.status === 'BORDERLINE';
                    return (
                      <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-2 font-semibold capitalize text-slate-900">{key}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-600">{item.nominal} mm</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-blue-700">{item.measured} mm</td>
                        <td className="py-2.5 px-2 font-mono">
                          <span
                            className={
                              isFail ? 'text-rose-700 font-bold' : isBorderline ? 'text-amber-700 font-semibold' : 'text-slate-600'
                            }
                          >
                            {item.deviation > 0 ? `+${item.deviation}` : item.deviation} mm
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-500">±{item.tolerance} mm</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-mono font-semibold">{item.ratio_pct}%</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  isFail
                                    ? 'bg-[#F43F5E]'
                                    : isBorderline
                                    ? 'bg-[#F59E0B]'
                                    : 'bg-[#10B981]'
                                }`}
                                style={{ width: `${Math.min(100, item.ratio_pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <StatusBadge status={item.status} size="sm" showIcon={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2D Laser Profilometer Cross Section */}
          <LaserProfilometer measurements={measurements} partName={inspection.part?.name} />
        </div>
      </div>

      {/* Supervisor Review & Audit Log Section */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[12px] p-5"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
      >
        <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-[#0F172A]">
              Supervisor Audit Trail & Engineering Notes
            </h3>
          </div>
          <span className="text-xs text-[#64748B]">
            {inspection.reviewed ? 'Review Completed' : 'Pending Quality Sign-off'}
          </span>
        </div>

        {inspection.reviewed ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 text-slate-600">
              <div>
                <span className="text-slate-500 font-medium">Supervisor Sign-Off:</span>
                <span className="ml-2 font-bold text-slate-900">
                  {inspection.reviewer?.full_name || inspection.reviewer?.username || 'Lead Inspector'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Final Decision:</span>
                <StatusBadge status={inspection.override_outcome || inspection.outcome} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="ml-2 text-slate-700 font-mono">
                  {inspection.reviewed_at ? new Date(inspection.reviewed_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-slate-700 leading-relaxed">
              <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                Engineering Notes
              </span>
              <p className="italic text-slate-800">
                "{inspection.reviewer_notes || 'Automatic inspection resolution without manual flags.'}"
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#92400E] mb-1 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span>Station Clamped on HOLD (Awaiting Triage Sign-off)</span>
              </div>
              <p className="text-slate-700">
                This workpiece is safely held at the metrology station to prevent spindle tool damage until manually reviewed.
              </p>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="py-[10px] px-[18px] rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs tracking-wide transition-all shadow-[0_2px_4px_rgba(217,119,6,0.2)]"
            >
              Sign Off Now
            </button>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      <ReviewActionModal
        inspection={inspection}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewed={(updated) => {
          setInspection(updated);
          setIsReviewModalOpen(false);
        }}
      />
    </div>
  );
};
