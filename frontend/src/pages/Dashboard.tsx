import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Scan,
  Inbox,
  Cpu,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  Camera,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import { DashboardStats, TrendDataPoint, Inspection, Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SignalIndicator } from '../components/SignalIndicator';
import { getMachineCells, getFacilities } from '../api/machineCellsData';
import { ManufacturingMachine, FacilityZone } from '../types/machineCells';
import { MachineTypeIcon } from '../components/machineCells/MachineTypeIcon';
import { useToast } from '../context/ToastContext';
import { TotalInspectionsModal } from '../components/dashboardModals/TotalInspectionsModal';
import { QualityPassRateModal } from '../components/dashboardModals/QualityPassRateModal';
import { BlockedDefectsModal } from '../components/dashboardModals/BlockedDefectsModal';
import { InspectionStation } from '../components/InspectionStation';
import { useHardwareTelemetry } from '../hooks/useHardwareTelemetry';

const STORAGE_PINNED_MACHINES = 'defex_dashboard_pinned_machines';

export const Dashboard: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [mfgMachines, setMfgMachines] = useState<ManufacturingMachine[]>([]);
  const [facilities, setFacilities] = useState<FacilityZone[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [machineToRemove, setMachineToRemove] = useState<ManufacturingMachine | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isManagePinnedOpen, setIsManagePinnedOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drill-down Modal State for Top KPI Cards
  const [activeModal, setActiveModal] = useState<'total' | 'pass_rate' | 'defects' | null>(null);
  const [isLiveFeedModalOpen, setIsLiveFeedModalOpen] = useState(false);

  // Live Hardware Telemetry WebSocket Stream
  const {
    isConnected: isWsConnected,
    isLiveHardware,
    demoMode,
    plcProtocol,
    plcLatencyMs,
    interlockState: wsInterlockState,
    machineTelemetries,
    lastEvent,
  } = useHardwareTelemetry();

  // Dynamic live increments from WebSocket events
  const [liveInspectionsCount, setLiveInspectionsCount] = useState<number>(0);
  const [livePassedCount, setLivePassedCount] = useState<number>(0);
  const [liveDefectsBlockedCount, setLiveDefectsBlockedCount] = useState<number>(0);

  // Handle incoming live hardware push events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'inspection_completed') {
      setLiveInspectionsCount((prev) => prev + 1);
      if (lastEvent.outcome === 'PASS') {
        setLivePassedCount((prev) => prev + 1);
        toast.success(`Part ${lastEvent.part_code || ''} PASSED quality verification`);
      } else if (lastEvent.outcome === 'FAIL') {
        setLiveDefectsBlockedCount((prev) => prev + 1);
        toast.error(`Part ${lastEvent.part_code || ''} FAILED — Safety Interlock Actuated!`);
      }
    } else if (lastEvent.type === 'interlock_tripped') {
      setLiveDefectsBlockedCount((prev) => prev + 1);
      toast.error(`Hardware Interlock Tripped: ${lastEvent.reason || 'Emergency Stop'}`);
    }
  }, [lastEvent]);

  // Derived real-time KPI totals
  const liveTotalInspections = (stats?.total_inspections ?? 20) + liveInspectionsCount;
  const livePassed = (stats?.pass_count ?? 20) + livePassedCount;
  const liveDefectsBlocked = (stats?.defects_caught ?? 8) + liveDefectsBlockedCount;
  const livePassRate =
    liveTotalInspections > 0
      ? Number(((livePassed / liveTotalInspections) * 100).toFixed(1))
      : 100;

  // Close modals on Esc key and lock body scroll when active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setMachineToRemove(null);
        setIsManagePinnedOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeModal || isManagePinnedOpen || machineToRemove) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeModal, isManagePinnedOpen, machineToRemove]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, trendData, inspData, machData] = await Promise.all([
        api.analytics.getDashboard(),
        api.analytics.getTrend(7),
        api.inspections.list({ limit: 8 }),
        api.machines.list(),
      ]);
      setStats(statsData);
      setTrend(trendData);
      setRecentInspections(inspData);
      setMachines(machData);
      const allMfg = getMachineCells();
      setMfgMachines(allMfg);
      setFacilities(getFacilities());

      const savedPinned = localStorage.getItem(STORAGE_PINNED_MACHINES);
      if (savedPinned) {
        try {
          setPinnedIds(JSON.parse(savedPinned));
        } catch {
          setPinnedIds(allMfg.map((m) => m.id));
        }
      } else {
        const allIds = allMfg.map((m) => m.id);
        setPinnedIds(allIds);
        localStorage.setItem(STORAGE_PINNED_MACHINES, JSON.stringify(allIds));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const facilityMap = useMemo(() => {
    return facilities.reduce<Record<string, FacilityZone>>((acc, f) => {
      acc[f.id] = f;
      return acc;
    }, {});
  }, [facilities]);

  const visibleMfgMachines = useMemo(() => {
    return mfgMachines.filter((m) => pinnedIds.includes(m.id));
  }, [mfgMachines, pinnedIds]);

  const runningCount = useMemo(
    () => visibleMfgMachines.filter((m) => m.status === 'RUNNING').length,
    [visibleMfgMachines]
  );
  const idleCount = useMemo(
    () => visibleMfgMachines.filter((m) => m.status === 'IDLE').length,
    [visibleMfgMachines]
  );
  const faultCount = useMemo(
    () => visibleMfgMachines.filter((m) => m.status === 'FAULT').length,
    [visibleMfgMachines]
  );

  const handleConfirmRemove = () => {
    if (!machineToRemove) return;
    const target = machineToRemove;
    setRemovingId(target.id);
    setMachineToRemove(null);

    setTimeout(() => {
      setPinnedIds((prev) => {
        const updated = prev.filter((id) => id !== target.id);
        localStorage.setItem(STORAGE_PINNED_MACHINES, JSON.stringify(updated));
        return updated;
      });
      setRemovingId(null);
      toast.success(`"${target.code}" removed from dashboard`);
    }, 300);
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(STORAGE_PINNED_MACHINES, JSON.stringify(next));
      return next;
    });
  };

  const handlePinAll = () => {
    const allIds = mfgMachines.map((m) => m.id);
    setPinnedIds(allIds);
    localStorage.setItem(STORAGE_PINNED_MACHINES, JSON.stringify(allIds));
    toast.success('All machines pinned to dashboard');
  };

  const handleUnpinAll = () => {
    setPinnedIds([]);
    localStorage.setItem(STORAGE_PINNED_MACHINES, JSON.stringify([]));
    toast.info('All machines removed from dashboard');
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
            <span>Operational Quality Telemetry</span>
          </div>
          <h1 className="text-[21px] font-bold tracking-tight text-[#1A1A2E]">Quality Inspection Operations Dashboard</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Real-time metrology verification and automated damage prevention interlock telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Hardware Connection Status Indicator */}
          <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-full text-xs shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected
                  ? isLiveHardware
                    ? 'bg-[#22C55E] animate-pulse'
                    : 'bg-[#3B82F6] animate-pulse'
                  : 'bg-[#EF4444]'
              }`}
            />
            <span className="text-[#6B7280] font-medium text-[11px]">Hardware:</span>
            <span
              className={`font-mono font-bold text-[11px] ${
                isWsConnected
                  ? isLiveHardware
                    ? 'text-[#15803D]'
                    : 'text-[#2563EB]'
                  : 'text-[#B91C1C]'
              }`}
            >
              {isWsConnected
                ? isLiveHardware
                  ? `CONNECTED (Live Hardware · ${plcLatencyMs}ms)`
                  : `CONNECTED (Simulated · ${plcLatencyMs}ms)`
                : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveFeedModalOpen(true)}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 shadow-2xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Feed</span>
          </button>

          <Link
            to="/inspection/new"
            className="py-1.5 px-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide flex items-center space-x-1.5 transition-all duration-200 shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>New Inspection</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Inspections (Clickable Drill-down) */}
        <div
          onClick={() => setActiveModal('total')}
          className="bg-white border border-[#E5E7EB] hover:border-blue-500 rounded-[10px] p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group select-none relative"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          title="Click to view Total Inspections Log"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveModal('total');
            }
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em] group-hover:text-blue-600 transition-colors">
              Total Inspections
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight">
            {liveTotalInspections}
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1 flex items-center justify-between">
            <span>Multi-modal optical & laser</span>
            <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              Drill-down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Pass Rate (Clickable Drill-down) */}
        <div
          onClick={() => setActiveModal('pass_rate')}
          className="bg-white border border-[#E5E7EB] hover:border-emerald-500 rounded-[10px] p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group select-none relative"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          title="Click to view Quality Pass Rate Analytics"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveModal('pass_rate');
            }
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em] group-hover:text-emerald-600 transition-colors">
              Quality Pass Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#22C55E] flex items-center justify-center border border-emerald-100 group-hover:bg-[#22C55E] group-hover:text-white transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight">
            {livePassRate}%
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1 flex items-center justify-between">
            <span>{livePassed} parts cleared for CNC</span>
            <span className="text-[11px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              Analytics <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Defects Caught (Clickable Drill-down) */}
        <div
          onClick={() => setActiveModal('defects')}
          className="bg-white border border-[#E5E7EB] hover:border-rose-500 rounded-[10px] p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group select-none relative"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          title="Click to view Blocked Defects & Damage Prevention"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveModal('defects');
            }
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em] group-hover:text-rose-600 transition-colors">
              Defects Blocked
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100 group-hover:bg-[#EF4444] group-hover:text-white transition-colors">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight">
            {liveDefectsBlocked}
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1 flex items-center justify-between">
            <span>Spindle crash prevention</span>
            <span className="text-[11px] font-semibold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              Interlocks <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Triage Queue */}
        <Link
          to="/queue"
          className="bg-white border border-[#E5E7EB] hover:border-amber-400 rounded-[10px] p-4 transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em] group-hover:text-amber-700 transition-colors">
              Triage Queue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-100">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight">
            {stats?.queue_count ?? '--'}
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1 flex items-center group-hover:text-amber-700 transition-colors">
            <span>Borderline items on HOLD</span>
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        {/* Card 5: Open Alerts */}
        <Link
          to="/alerts"
          className="bg-white border border-[#E5E7EB] hover:border-rose-400 rounded-[10px] p-4 transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em] group-hover:text-rose-700 transition-colors">
              Active Alerts
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight">
            {stats?.open_alerts ?? '--'}
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1">
            {stats?.critical_alerts ?? 0} critical safety trips
          </div>
        </Link>
      </div>

      {/* Module 3: Machine Status Overview */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#F1F3F5] gap-2.5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
                Shop Floor Telemetry
              </span>
            </div>
            <h2 className="text-[15.5px] font-bold text-[#1A1A2E] flex items-center space-x-2">
              <span>Machine Status Overview</span>
              <span className="text-xs font-normal text-[#6B7280]">
                ({visibleMfgMachines.length} of {mfgMachines.length} pinned)
              </span>
            </h2>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Count summary: X Running | X Idle | X Fault */}
            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#15803D] border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5 animate-pulse" />
                {runningCount} Running
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5" />
                {idleCount} Idle
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECDD3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1.5 animate-pulse" />
                {faultCount} Fault
              </span>
            </div>

            {/* Manage Machines Button */}
            <button
              type="button"
              onClick={() => setIsManagePinnedOpen(true)}
              className="py-1 px-2.5 rounded-[6px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-[11.5px] font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Pin or unpin machines to dashboard"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Manage Machines</span>
            </button>

            <Link
              to="/machine-cells"
              className="py-1 px-2.5 rounded-[6px] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-[11.5px] font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View All Cells</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mini status grid of all machines color-coded by status (green/amber/red/gray) */}
        {visibleMfgMachines.length === 0 ? (
          <div className="py-12 text-center text-[#6B7280]">
            <div className="w-10 h-10 rounded-full bg-[#F1F3F5] text-[#9CA3AF] flex items-center justify-center mx-auto mb-2">
              <Cpu className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#1A1A2E]">
              No machines pinned. Go to Machine Cells to add.
            </p>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={handlePinAll}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Reset All Machines</span>
              </button>
              <Link
                to="/machine-cells"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Machine</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {visibleMfgMachines.map((m) => {
              const fac = facilityMap[m.facility_id];
              const liveTele = machineTelemetries[m.code];
              const effectiveStatus = liveTele?.status || m.status;
              const isRunning = effectiveStatus === 'RUNNING';
              const isIdle = effectiveStatus === 'IDLE';
              const isFault = effectiveStatus === 'FAULT';
              const isSetup = effectiveStatus === 'SETUP_MODE';
              const isBeingRemoved = removingId === m.id;

              return (
                <Link
                  key={m.id}
                  to={`/machine-cells/${m.id}/program`}
                  title={`Configure ${m.name} (${m.code})`}
                  className={`group relative bg-white border rounded-[8px] p-2.5 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    isBeingRemoved ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
                  } ${
                    isRunning
                      ? 'border-[#BBF7D0] hover:border-[#22C55E]'
                      : isFault
                      ? 'border-[#FECDD3] hover:border-[#EF4444]'
                      : isIdle
                      ? 'border-[#FDE68A] hover:border-[#F59E0B]'
                      : isSetup
                      ? 'border-[#BFDBFE] hover:border-[#3B82F6]'
                      : 'border-[#E5E7EB] hover:border-[#94A3B8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0 border ${
                            isRunning
                              ? 'bg-[#ECFDF5] border-[#BBF7D0] text-[#15803D]'
                              : isFault
                              ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#B91C1C]'
                              : isIdle
                              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                              : isSetup
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          <MachineTypeIcon type={m.type} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-[#1A1A2E] truncate">
                          {m.code}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shrink-0 border ${
                            isRunning
                              ? 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]'
                              : isFault
                              ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECDD3]'
                              : isIdle
                              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                              : isSetup
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              isRunning
                                ? 'bg-[#22C55E] animate-pulse'
                                : isFault
                                ? 'bg-[#EF4444] animate-pulse'
                                : isIdle
                                ? 'bg-[#F59E0B]'
                                : isSetup
                                ? 'bg-[#3B82F6]'
                                : 'bg-[#9CA3AF]'
                            }`}
                          />
                          {effectiveStatus === 'SETUP_MODE' ? 'SETUP' : effectiveStatus}
                        </span>

                        {/* 🗑️ Delete button: 24x24px, rounded-full, transparent to #FEE2E2 / #EF4444 on hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMachineToRemove(m);
                          }}
                          title="Remove from dashboard"
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-transparent text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[12px] font-semibold text-[#1A1A2E] truncate group-hover:text-[#2563EB] transition-colors">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-[#6B7280] truncate mt-0.5">
                      {fac?.name || 'Main Bay'}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-[#F1F3F5] flex items-center justify-between text-[10px]">
                    <span className="font-mono text-[#475569] bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                      {liveTele?.spindle_rpm && liveTele.spindle_rpm > 0
                        ? `${liveTele.spindle_rpm.toLocaleString()} RPM`
                        : m.parameters.program_number
                        ? `#${m.parameters.program_number}`
                        : 'No Prog'}
                    </span>
                    <div className="flex items-center text-[#6B7280] font-medium group-hover:text-[#2563EB] transition-colors">
                      <span>{liveTele?.uptime_pct ?? m.uptime_pct}% up</span>
                      <ArrowUpRight className="w-2.5 h-2.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Charts & Machine Cells Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* 7-Day Trend Chart (Recharts) */}
        <div
          className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
            <div>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] block">
                Quality Assurance Velocity
              </span>
              <h3 className="text-[15px] font-bold text-[#1A1A2E] mt-0.5 tracking-tight">
                7-Day Inspection & Triage Trend
              </h3>
            </div>
            <div className="text-[12px] text-[#6B7280]">Pass vs Fail vs Uncertain</div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }} barGap={4} barCategoryGap="28%">
                {/* Very light grid lines */}
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
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
                <Legend
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                />
                {/* Clean Bar Colors & Modern Rounded Tops */}
                <Bar dataKey="pass" name="PASS (GO)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uncertain" name="UNCERTAIN (HOLD)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fail" name="FAIL (STOP)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vision & Optical Stations */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex flex-col transition-all duration-200"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
            <div>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Station Hardware</span>
              <h3 className="text-[15px] font-bold text-[#1A1A2E] mt-0.5">Vision & Optical Sensors ({machines.length})</h3>
            </div>
            <Link to="/inspection-station" className="text-[12px] text-[#4F46E5] hover:text-[#4338CA] font-semibold">
              Live Station
            </Link>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {machines.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-[#E5E7EB] rounded-[8px] p-2.5 flex items-center justify-between text-xs hover:border-[#CBD5E1] hover:bg-[#F8F9FA] transition-all duration-200 shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#1A1A2E]">{m.name}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono">
                      {m.code} · {m.station}
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-white shadow-2xs ${
                      m.status === 'CONNECTED'
                        ? 'text-[#15803D] border-[#BBF7D0]'
                        : m.status === 'FAULT'
                        ? 'text-[#B91C1C] border-[#FECDD3] animate-pulse'
                        : 'text-[#6B7280] border-[#E5E7EB]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        m.status === 'CONNECTED'
                          ? 'bg-[#22C55E]'
                          : m.status === 'FAULT'
                          ? 'bg-[#EF4444]'
                          : 'bg-[#9CA3AF]'
                      }`}
                    />
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">Live Stream</span>
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mt-0.5">Recent Workpiece Inspections</h3>
          </div>
          <Link to="/reports" className="text-[12px] text-[#4F46E5] hover:text-[#4338CA] font-semibold flex items-center space-x-1">
            <span>View All & Export</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] text-[#6B7280] text-[10.5px] font-semibold uppercase tracking-wider border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Part Profile</th>
                <th className="py-2 px-3">Station</th>
                <th className="py-2 px-3">Outcome</th>
                <th className="py-2 px-3">Confidence</th>
                <th className="py-2 px-3">Hardware Signal</th>
                <th className="py-2 px-3">Latch Time</th>
                <th className="py-2 px-3">Triage</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F5] text-[#1A1A2E]">
              {recentInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-[#F8F9FA] transition-colors duration-150">
                  <td className="py-2 px-3 font-mono font-semibold text-[#6B7280]">#{insp.id}</td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-[#1A1A2E] text-[12.5px]">{insp.part?.name || 'Unknown Part'}</div>
                    <div className="text-[10.5px] text-[#6B7280] font-mono">{insp.part?.code}</div>
                  </td>
                  <td className="py-2 px-3 text-[#6B7280] text-[12.5px]">{insp.machine?.station || 'Station 1'}</td>
                  <td className="py-2 px-3">
                    <StatusBadge status={insp.outcome} size="sm" />
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-[#1A1A2E] text-[12.5px]">
                    {(insp.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3">
                    <SignalIndicator signal={insp.hardware_signal} compact={true} />
                  </td>
                  <td className="py-2 px-3 font-mono text-[#6B7280] text-[12px]">{insp.response_time_ms} ms</td>
                  <td className="py-2 px-3">
                    {insp.reviewed ? (
                      <span className="inline-flex items-center text-[#15803D] text-[11px] font-medium bg-white px-2 py-0.5 rounded-full border border-[#BBF7D0] shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-[#22C55E]" />
                        Reviewed
                      </span>
                    ) : insp.outcome === 'UNCERTAIN' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-[#B45309] border border-[#FDE68A] shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-[#F59E0B]" />
                        In Queue
                      </span>
                    ) : (
                      <span className="text-[#6B7280] text-[11px]">Auto Cleared</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Link
                      to={`/inspection/${insp.id}`}
                      className="px-2 py-1 rounded-[6px] bg-white hover:bg-[#F8F9FA] text-[#1A1A2E] hover:text-[#4F46E5] border border-[#E5E7EB] text-[11.5px] font-medium inline-flex items-center space-x-1 transition-colors shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Remove Machine from Dashboard Modal */}
      {machineToRemove && (
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
              <h3 className="text-base font-bold text-[#1A1A2E]">
                Remove Machine from Dashboard?
              </h3>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              <strong className="text-[#1A1A2E] font-semibold">"{machineToRemove.code}"</strong> will be removed from the dashboard overview widget. The machine will <strong className="text-[#1A1A2E]">NOT</strong> be deleted from the system.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setMachineToRemove(null)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manage Pinned Machines Slide-Over Panel */}
      {isManagePinnedOpen && (
        <div className="fixed inset-0 z-[1050] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md h-full flex flex-col justify-between border-l border-[#E5E7EB] shadow-2xl animate-in slide-in-from-right duration-250 select-none"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A2E]">
                    Manage Pinned Machines
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Select which machines appear on the main dashboard widget ({pinnedIds.length} pinned)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManagePinnedOpen(false)}
                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F3F5]">
                <span className="font-semibold text-[#6B7280] text-[11px] uppercase tracking-wider">
                  Available Machines ({mfgMachines.length})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePinAll}
                    className="text-[11px] font-semibold text-[#4F46E5] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[#CBD5E1]">·</span>
                  <button
                    type="button"
                    onClick={handleUnpinAll}
                    className="text-[11px] font-semibold text-[#6B7280] hover:text-[#EF4444] cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {mfgMachines.map((m) => {
                  const isPinned = pinnedIds.includes(m.id);
                  const fac = facilityMap[m.facility_id];

                  return (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-2.5 rounded-[8px] border transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-[#EEF2FF]/40 border-[#C7D2FE]'
                          : 'bg-white border-[#E5E7EB] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={() => handleTogglePin(m.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                        />
                        <div className="w-7 h-7 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] shrink-0">
                          <MachineTypeIcon type={m.type} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-[#1A1A2E] text-[12px] truncate">
                              {m.name}
                            </span>
                            <span className="font-mono text-[10.5px] text-[#4F46E5] bg-[#EEF2FF] px-1 py-0.2 rounded font-semibold">
                              {m.code}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-[#6B7280] truncate">
                            {fac?.name || 'Main Bay'} · {m.status}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                          isPinned
                            ? 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]'
                            : 'bg-[#F8F9FA] text-[#6B7280] border-[#E5E7EB]'
                        }`}
                      >
                        {isPinned ? 'Pinned' : 'Hidden'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-between items-center">
              <span className="text-xs text-[#6B7280]">
                {pinnedIds.length} of {mfgMachines.length} displayed
              </span>
              <button
                type="button"
                onClick={() => setIsManagePinnedOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Modal 1: Total Inspections Log */}
      <TotalInspectionsModal
        isOpen={activeModal === 'total'}
        onClose={() => setActiveModal(null)}
        inspections={recentInspections}
        mfgMachines={mfgMachines}
      />

      {/* Drill-down Modal 2: Quality Pass Rate Analytics */}
      <QualityPassRateModal
        isOpen={activeModal === 'pass_rate'}
        onClose={() => setActiveModal(null)}
        stats={stats}
        trend={trend}
        mfgMachines={mfgMachines}
        inspections={recentInspections}
      />

      {/* Drill-down Modal 3: Blocked Defects & Damage Prevention */}
      <BlockedDefectsModal
        isOpen={activeModal === 'defects'}
        onClose={() => setActiveModal(null)}
        inspections={recentInspections}
        stats={stats}
      />

      {/* Floating Live Camera Vision HUD Modal */}
      {isLiveFeedModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[14px] max-w-6xl w-full max-h-[92vh] overflow-y-auto border border-[#E5E7EB] shadow-2xl relative p-4 sm:p-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A2E]">
                    Live Camera Vision Inspection Station
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Real-time video HUD with part profile verification & spindle crash protection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveFeedModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#F8F9FA] text-[#6B7280] hover:text-[#1A1A2E] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <InspectionStation />
          </div>
        </div>
      )}
    </div>
  );
};
