import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Filter,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { Inspection, Part } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SignalIndicator } from '../components/SignalIndicator';
import { ReviewActionModal } from '../components/ReviewActionModal';
import { useToast } from '../context/ToastContext';

export const ReviewQueue: React.FC = () => {
  const toast = useToast();
  const [queueItems, setQueueItems] = useState<Inspection[]>([]);
  const [historyItems, setHistoryItems] = useState<Inspection[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & selection
  const [partFilter, setPartFilter] = useState<string>('ALL');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deletion state
  const [itemToDelete, setItemToDelete] = useState<Inspection | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [queueData, allInspections, partsData] = await Promise.all([
        api.inspections.getQueue(),
        api.inspections.list({ reviewed: true, limit: 15 }),
        api.parts.list(),
      ]);
      setQueueItems(queueData);
      setHistoryItems(allInspections.filter((i) => i.override_outcome != null));
      setParts(partsData);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const handleOpenReview = (item: Inspection) => {
    setSelectedInspection(item);
    setIsModalOpen(true);
  };

  const handleReviewCompleted = (updated: Inspection) => {
    setQueueItems((prev) => prev.filter((i) => i.id !== updated.id));
    setHistoryItems((prev) => [updated, ...prev]);
    setIsModalOpen(false);
  };

  const filteredQueue = queueItems.filter((item) => {
    if (partFilter !== 'ALL' && item.part?.code !== partFilter) return false;
    return true;
  });

  // Single Item Delete Confirmation
  const handleConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    const targetId = target.id;
    const partCode = target.part?.code || `INSP-${target.id}`;

    setItemToDelete(null);
    setDeletingIds((prev) => [...prev, targetId]);

    setTimeout(async () => {
      try {
        await api.inspections.delete(targetId);
        setQueueItems((prev) => prev.filter((i) => i.id !== targetId));
        setSelectedIds((prev) => prev.filter((id) => id !== targetId));
        toast.success(`${partCode} removed from Triage Queue`);
      } catch (err) {
        console.error('Failed to remove triage item:', err);
      } finally {
        setDeletingIds((prev) => prev.filter((id) => id !== targetId));
      }
    }, 300);
  };

  // Bulk Delete Confirmation
  const handleConfirmBulkDelete = async () => {
    const toDelete = [...selectedIds];
    setIsBulkDeleteModalOpen(false);
    setDeletingIds((prev) => [...prev, ...toDelete]);

    setTimeout(async () => {
      try {
        await Promise.all(toDelete.map((id) => api.inspections.delete(id)));
        setQueueItems((prev) => prev.filter((i) => !toDelete.includes(i.id)));
        setSelectedIds([]);
        toast.success(`${toDelete.length} items removed from Triage Queue`);
      } catch (err) {
        console.error('Failed to bulk remove triage items:', err);
      } finally {
        setDeletingIds((prev) => prev.filter((id) => !toDelete.includes(id)));
      }
    }, 300);
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQueue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQueue.map((i) => i.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Human-in-the-Loop Quality Review</span>
          </div>
          <h1 className="text-[21px] font-bold tracking-tight text-[#1A1A2E]">Supervisor Triage & Review Queue</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Borderline or uncertain workpiece inspections held by hardware interlock pending manual approval.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#6B7280] mr-1.5" />
            <select
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              className="bg-transparent text-[#1A1A2E] text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Part Profiles</option>
              {parts.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadQueue}
            disabled={loading}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Active Queue Table */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 border-b border-[#F1F3F5] pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Inbox className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1A1A2E]">
                Workpieces Held on Stations ({filteredQueue.length})
              </h3>
              <p className="text-[12px] text-[#6B7280]">Pneumatic clamp locked to safeguard tooling</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            Station Locked Pending Decision
          </span>
        </div>

        {/* Bulk Action Bar (When multiple selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-[8px] p-2.5 px-3 flex items-center justify-between mb-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#B91C1C]">
              <span>{selectedIds.length} items selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#6B7280] hover:text-[#1A1A2E] px-2 py-1 rounded cursor-pointer"
              >
                Deselect
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {filteredQueue.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-[#1A1A2E]">Triage Queue is empty</p>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              All items have been cleared
            </p>
            <div className="mt-4">
              <Link
                to="/inspection/new"
                className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add to Queue</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] text-[10.5px] font-semibold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredQueue.length && filteredQueue.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Part No</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Flagged Anomaly</th>
                  <th className="py-2.5 px-3">Held Time</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-[#1A1A2E]">
                {filteredQueue.map((item) => {
                  const firstDefect = item.defect_classes?.[0];
                  const isSelected = selectedIds.includes(item.id);
                  const isDeleting = deletingIds.includes(item.id);
                  const isHighPriority = item.confidence < 0.75 || item.outcome === 'FAIL';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F8F9FA] transition-all duration-300 ${
                        isDeleting
                          ? '-translate-x-full opacity-0 pointer-events-none'
                          : 'translate-x-0 opacity-100'
                      } ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700">#{item.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1A1A2E]">{item.part?.code || 'PART-2041A'}</div>
                        <div className="text-[11px] text-[#6B7280]">{item.part?.name}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#6B7280]">{item.machine?.station || 'CNC-MILL-001'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          ON HOLD
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                            isHighPriority
                              ? 'bg-rose-50 text-[#B91C1C]'
                              : 'bg-amber-50 text-[#B45309]'
                          }`}
                        >
                          {isHighPriority ? 'HIGH' : 'MEDIUM'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {firstDefect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] capitalize">
                            {firstDefect.class} ({firstDefect.severity.toLowerCase()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                            Borderline ({((item.confidence || 0.8) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#6B7280]">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(item)}
                            className="px-2.5 py-1 rounded-[6px] bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs transition-all shadow-2xs"
                          >
                            Sign Off
                          </button>
                          <Link
                            to={`/inspection/${item.id}`}
                            className="px-2 py-1 rounded-[6px] bg-white hover:bg-[#F8F9FA] text-[#1A1A2E] border border-[#E5E7EB] text-xs font-semibold inline-flex items-center transition-colors shadow-2xs"
                            title="View Details"
                          >
                            Details
                          </Link>
                          {/* 🗑️ Row Delete Button: 32x32px, rounded-lg, #9CA3AF to #EF4444 on hover */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Remove from Triage Queue"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] bg-transparent hover:bg-[#FEE2E2] hover:text-[#EF4444] border border-transparent hover:border-[#FECDD3] transition-all duration-200 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Supervised Triage Audit Log */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
          <div>
            <span className="text-[10.5px] font-semibold text-[#6B7280] uppercase tracking-[0.05em]">Audit Trail</span>
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mt-0.5">Recent Manual Overrides & Approvals</h3>
          </div>
          <span className="text-xs text-[#6B7280]">Audited with supervisor credentials</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] text-[#6B7280] text-[10.5px] font-semibold uppercase tracking-wider border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Part Profile</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Reviewed By</th>
                <th className="py-2.5 px-3">Engineering Notes</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F5] text-[#1A1A2E]">
              {historyItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#6B7280]">#{item.id}</td>
                  <td className="py-2.5 px-3 font-mono text-[#1A1A2E] font-semibold">{item.part?.code}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.override_outcome || item.outcome} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-[#1A1A2E] font-semibold">
                    {item.reviewer?.full_name || item.reviewer?.username || 'Quality Inspector'}
                  </td>
                  <td className="py-2.5 px-3 text-[#6B7280] italic max-w-xs truncate">
                    "{item.reviewer_notes}"
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#6B7280]">
                    {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/inspection/${item.id}`}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center space-x-1"
                    >
                      <span>Report</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Action Modal */}
      <ReviewActionModal
        inspection={selectedInspection}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewed={handleReviewCompleted}
      />

      {/* Single Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-sm w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                Remove from Triage Queue?
              </h3>
            </div>

            <div className="bg-[#F8F9FA] rounded-[8px] p-3 border border-[#E5E7EB] space-y-1.5 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Part:</span>
                <span className="font-mono font-bold text-[#1A1A2E]">{itemToDelete.part?.code || 'PART-2041-A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Machine:</span>
                <span className="font-mono text-[#1A1A2E]">{itemToDelete.machine?.station || 'CNC-MILL-001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Status:</span>
                <span className="font-semibold text-amber-700">ON HOLD</span>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              This item will be permanently removed from the triage queue.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-sm w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                Delete {selectedIds.length} Selected Items?
              </h3>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Delete {selectedIds.length} selected triage items? This cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
              >
                Delete All Selected
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Review Action Modal */}
      <ReviewActionModal
        inspection={selectedInspection}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewed={handleReviewCompleted}
      />
    </div>
  );
};

export default ReviewQueue;
