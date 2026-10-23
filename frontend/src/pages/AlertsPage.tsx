import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
  Clock,
  Cpu,
} from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterUnresolved, setFilterUnresolved] = useState<boolean>(true);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;
      if (filterUnresolved) params.is_resolved = false;

      const data = await api.alerts.list(params);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterUnresolved]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 8000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleMarkRead = async (id: number) => {
    await api.alerts.markRead(id);
    loadAlerts();
  };

  const handleResolve = async (id: number) => {
    await api.alerts.resolve(id);
    loadAlerts();
  };

  const handleResolveAll = async () => {
    await api.alerts.resolveAll();
    loadAlerts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Diagnostics & Safety Audit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Alerts & Safety Interlock Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit logs for emergency stops, out-of-spec dimensional breaches, and station hardware faults.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResolveAll}
            className="py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Resolve All Alarms</span>
          </button>

          <button
            onClick={loadAlerts}
            disabled={loading}
            className="py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold flex items-center space-x-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] text-xs shadow-xs">
        <div className="flex items-center space-x-1.5">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => {
            const isActive = filterSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? sev === 'CRITICAL'
                      ? 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] font-semibold'
                      : sev === 'WARNING'
                      ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-semibold'
                      : sev === 'INFO'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'bg-slate-100 text-[#0F172A] border border-slate-200 font-semibold'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev.charAt(0) + sev.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        <label className="flex items-center space-x-2 text-slate-600 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterUnresolved}
            onChange={(e) => setFilterUnresolved(e.target.checked)}
            className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <span className="text-slate-700 font-medium">Show Unresolved Only</span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-16 text-center text-slate-500 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto mb-3 border border-[#A7F3D0]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-[#0F172A]">No active alerts matching criteria</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All safety interlocks and inspection machine cells are currently operating normally.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCrit = alert.severity === 'CRITICAL';
            const isWarn = alert.severity === 'WARNING';
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  !alert.is_resolved
                    ? isCrit
                      ? 'bg-[#FFF1F2]/60 border-[#FECDD3] hover:border-rose-300'
                      : isWarn
                      ? 'bg-[#FFFBEB]/60 border-[#FDE68A] hover:border-amber-300'
                      : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                    : 'bg-white border-[#E2E8F0] text-slate-500 opacity-80'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                      isCrit
                        ? 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]'
                        : isWarn
                        ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {isCrit ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          isCrit
                            ? 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]'
                            : isWarn
                            ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="text-sm font-semibold text-[#0F172A]">{alert.title}</h4>
                      {alert.is_resolved && (
                        <span className="text-[10px] bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-medium">
                          Resolved
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2 font-mono">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </span>
                      {alert.machine_id && (
                        <span className="flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-slate-400" />
                          <span>Station Cell #{alert.machine_id}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-1.5 w-full sm:w-auto justify-end">
                  {!alert.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(alert.id)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium border border-[#E2E8F0] transition-colors"
                    >
                      Mark Read
                    </button>
                  )}

                  {!alert.is_resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolve(alert.id)}
                      className="py-1.5 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs tracking-wide shadow-2xs transition-all"
                    >
                      Acknowledge & Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
