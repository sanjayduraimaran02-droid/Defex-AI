import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Filter,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../api/client';
import { Inspection, DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [defects, setDefects] = useState<{ name: string; count: number }[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadReportData = useCallback(async () => {
    try {
      const [statsData, defectsData, inspData] = await Promise.all([
        api.analytics.getDashboard(),
        api.analytics.getDefects(),
        api.inspections.list({
          outcome: outcomeFilter === 'ALL' ? undefined : outcomeFilter,
          limit: 100,
        }),
      ]);
      setStats(statsData);
      setDefects(defectsData);
      setInspections(inspData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    }
  }, [outcomeFilter]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleDownloadCsv = () => {
    const url = api.analytics.getExportUrl(outcomeFilter === 'ALL' ? undefined : outcomeFilter);
    const filename = `defex-reports-${outcomeFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (!inspectionToDelete) return;
    const target = inspectionToDelete;
    const targetId = target.id;
    setIsDeleting(true);
    setDeletingId(targetId);

    // Close modal
    setInspectionToDelete(null);

    // Smooth fade-out duration before removing from list
    setTimeout(async () => {
      try {
        await api.inspections.delete(targetId);
        setInspections((prev) => prev.filter((i) => i.id !== targetId));
        setStats((prev) => {
          if (!prev) return prev;
          const outcome = target.outcome;
          return {
            ...prev,
            total_inspections: Math.max(0, prev.total_inspections - 1),
            pass_count: outcome === 'PASS' ? Math.max(0, prev.pass_count - 1) : prev.pass_count,
            fail_count: outcome === 'FAIL' ? Math.max(0, prev.fail_count - 1) : prev.fail_count,
            uncertain_count:
              outcome === 'UNCERTAIN' ? Math.max(0, prev.uncertain_count - 1) : prev.uncertain_count,
          };
        });
      } catch (err) {
        console.error('Failed to delete inspection report:', err);
      } finally {
        setDeletingId(null);
        setIsDeleting(false);
      }
    }, 300);
  };

  const DEFECT_COLORS = ['#EF4444', '#F59E0B', '#2563EB', '#EC4899', '#8B5CF6', '#22C55E'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
            <span>Auditing & Quality Analytics</span>
          </div>
          <h1 className="text-[21px] font-bold tracking-tight text-[#1A1A2E]">Inspection Reports & CSV Export</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Export comprehensive multi-modal inspection histories, Pareto flaw distributions, and supervisor audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            className="py-1.5 px-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(37,99,235,0.2)] flex items-center space-x-1.5 transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          className="bg-white border border-[#E5E7EB] p-4 rounded-[10px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Total Inspections</div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight mt-1">{stats?.total_inspections ?? '--'}</div>
          <div className="text-[12px] text-[#6B7280] mt-1">Multi-modal optical & laser</div>
        </div>
        <div
          className="bg-white border border-[#E5E7EB] p-4 rounded-[10px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Quality Pass Rate</div>
          <div className="text-[1.5rem] font-bold text-[#22C55E] leading-tight mt-1">{stats?.pass_rate_pct ?? '--'}%</div>
          <div className="text-[12px] text-[#6B7280] mt-1">{stats?.pass_count ?? 0} parts cleared</div>
        </div>
        <div
          className="bg-white border border-[#E5E7EB] p-4 rounded-[10px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Stop / Scrap Events</div>
          <div className="text-[1.5rem] font-bold text-[#EF4444] leading-tight mt-1">{stats?.fail_count ?? '--'}</div>
          <div className="text-[12px] text-[#6B7280] mt-1">Tool damage prevented</div>
        </div>
        <div
          className="bg-white border border-[#E5E7EB] p-4 rounded-[10px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Queued in Triage</div>
          <div className="text-[1.5rem] font-bold text-[#F59E0B] leading-tight mt-1">{stats?.uncertain_count ?? '--'}</div>
          <div className="text-[12px] text-[#6B7280] mt-1">Borderline measurements</div>
        </div>
      </div>

      {/* Defect Pareto Chart & Breakdown */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1A1A2E]">
                Defect Pareto Distribution (Optical Vision Flaws)
              </h3>
              <p className="text-[12px] text-[#6B7280]">Frequency of surface and structural anomalies</p>
            </div>
          </div>
          <span className="text-[12px] text-[#6B7280]">Top Root-Cause Flaws</span>
        </div>

        {defects.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-xs">No defects logged yet</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defects} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    color: '#1A1A2E',
                  }}
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                />
                <Bar dataKey="count" name="Flaw Count" radius={[4, 4, 0, 0]}>
                  {defects.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DEFECT_COLORS[index % DEFECT_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filterable Table */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-[#F1F3F5] pb-2.5">
          <div>
            <h3 className="text-[15px] font-bold text-[#1A1A2E]">
              Historical Inspection Logs ({inspections.length})
            </h3>
            <p className="text-[12px] text-[#6B7280]">Full multi-modal inspection dataset</p>
          </div>

          <div className="flex items-center space-x-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-[8px] px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-transparent text-[#1A1A2E] text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Outcomes</option>
              <option value="PASS">Pass (GO)</option>
              <option value="FAIL">Fail (STOP)</option>
              <option value="UNCERTAIN">Uncertain (HOLD)</option>
            </select>
          </div>
        </div>

        {inspections.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F1F3F5] text-[#9CA3AF] mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#1A1A2E]">No reports found.</p>
            <p className="text-xs text-[#6B7280] mt-1">Generate a new report to get started.</p>
            <div className="mt-4">
              <Link
                to="/inspection/new"
                className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-all shadow-xs"
              >
                <span>New Inspection</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] text-[10.5px] font-semibold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Part Profile</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Hardware Signal</th>
                  <th className="py-2.5 px-3">Latch Time</th>
                  <th className="py-2.5 px-3">Flaw Count</th>
                  <th className="py-2.5 px-3">Supervised Audit</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-[#1A1A2E]">
                {inspections.map((i) => (
                  <tr
                    key={i.id}
                    className={`hover:bg-[#F8F9FA] transition-all duration-300 ${
                      deletingId === i.id ? 'opacity-0 -translate-x-3 pointer-events-none' : 'opacity-100 translate-x-0'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-medium text-[#6B7280]">#{i.id}</td>
                    <td className="py-3 px-3 font-mono text-[#6B7280]">{new Date(i.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1A1A2E]">{i.part?.code}</div>
                      <div className="text-[11px] text-[#6B7280]">{i.part?.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={i.outcome} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          i.hardware_signal === 'GO'
                            ? 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]'
                            : i.hardware_signal === 'HOLD'
                            ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECDD3]'
                        }`}
                      >
                        {i.hardware_signal}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#6B7280]">{i.response_time_ms} ms</td>
                    <td className="py-3 px-3 font-mono text-[#1A1A2E] font-medium">{i.defect_classes?.length || 0}</td>
                    <td className="py-3 px-3">
                      {i.reviewed ? (
                        <span className="inline-flex items-center text-[#15803D] text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Reviewed
                        </span>
                      ) : i.outcome === 'UNCERTAIN' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          In Queue
                        </span>
                      ) : (
                        <span className="text-[#6B7280] text-xs">Auto Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          to={`/inspection/${i.id}`}
                          className="px-2 py-1 rounded-[6px] text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 font-semibold text-xs inline-flex items-center space-x-1 transition-colors"
                          title="View Detail"
                        >
                          <span>Detail</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        {/* Delete Button (32x32px, rounded-lg, #EF4444 on hover, #9CA3AF default) */}
                        <button
                          type="button"
                          onClick={() => setInspectionToDelete(i)}
                          title="Delete Report"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECDD3] transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {inspectionToDelete && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-sm w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Delete Report?</h3>
                <p className="text-[11.5px] text-[#6B7280] font-mono mt-0.5">
                  Inspection #{inspectionToDelete.id} · {inspectionToDelete.part?.code || 'Part'}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              This action cannot be undone. Are you sure you want to delete this report?
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setInspectionToDelete(null)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
