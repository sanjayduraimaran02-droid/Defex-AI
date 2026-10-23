import React, { useState, useEffect } from 'react';
import {
  Plus,
  Building2,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Trash2,
  Package,
  AlertOctagon,
} from 'lucide-react';
import {
  ManufacturingMachine,
  FacilityZone,
  MachineCellStatus,
} from '../types/machineCells';
import {
  getFacilities,
  saveFacility,
  deleteFacility,
  getMachineCells,
  saveMachineCell,
  updateMachineCellStatus,
  deleteMachineCell,
  MACHINE_TYPE_METADATA,
  getSavedPrograms,
} from '../api/machineCellsData';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { MachineCellCard } from '../components/machineCells/MachineCellCard';
import { AddMachineModal } from '../components/machineCells/AddMachineModal';
import { FacilityManagerDrawer } from '../components/machineCells/FacilityManagerDrawer';

export const MachineCellsPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<FacilityZone[]>([]);
  const [machines, setMachines] = useState<ManufacturingMachine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});

  // Modals & Drawers
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState<ManufacturingMachine | null>(null);
  const [isFacilityManagerOpen, setIsFacilityManagerOpen] = useState(false);

  // Deletion states
  const [machineToDelete, setMachineToDelete] = useState<ManufacturingMachine | null>(null);
  const [typedMachineCode, setTypedMachineCode] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string[]>([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [typedBulkDeleteConfirm, setTypedBulkDeleteConfirm] = useState('');

  // Bulk move state
  const [isMoveFacilityModalOpen, setIsMoveFacilityModalOpen] = useState(false);
  const [targetMoveFacilityId, setTargetMoveFacilityId] = useState('');

  // Load data
  const loadData = () => {
    setFacilities(getFacilities());
    setMachines(getMachineCells());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (id: string, newStatus: MachineCellStatus) => {
    updateMachineCellStatus(id, newStatus);
    setMachines(getMachineCells());
  };

  const handleSaveMachine = (newMachine: ManufacturingMachine) => {
    saveMachineCell(newMachine);
    setMachines(getMachineCells());
    setMachineToEdit(null);
    toast.success(`${newMachine.code} saved successfully`);
  };

  const handleSaveFacility = (facility: FacilityZone) => {
    saveFacility(facility);
    setFacilities(getFacilities());
  };

  const handleDeleteFacility = (id: string) => {
    deleteFacility(id);
    setFacilities(getFacilities());
  };

  const toggleCollapse = (facId: string) => {
    setCollapsedFacilities((prev) => ({
      ...prev,
      [facId]: !prev[facId],
    }));
  };

  const handleToggleSelectMachine = (id: string) => {
    setSelectedMachineIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Section 3A: Confirm Single Machine Delete
  const handleConfirmSingleDelete = () => {
    if (!machineToDelete) return;
    const target = machineToDelete;
    setMachineToDelete(null);
    setTypedMachineCode('');
    setIsDeletingId((prev) => [...prev, target.id]);

    setTimeout(async () => {
      deleteMachineCell(target.id);
      setMachines(getMachineCells());
      setIsDeletingId((prev) => prev.filter((id) => id !== target.id));
      setSelectedMachineIds((prev) => prev.filter((id) => id !== target.id));
      toast.success(`${target.code} has been deleted`);

      // Log delete action to Alerts & Events section
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const operatorName = user?.full_name || user?.username || 'J.Kumar';
      await api.alerts.create({
        title: `Machine Deletion Event: ${target.code}`,
        message: `Machine ${target.code} deleted by Operator: ${operatorName} at ${timeStr} on ${dateStr}`,
        severity: 'WARNING',
      });
    }, 300);
  };

  // Section 3C: Confirm Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = [...selectedMachineIds];
    setIsBulkDeleteOpen(false);
    setTypedBulkDeleteConfirm('');
    setIsDeletingId((prev) => [...prev, ...ids]);

    setTimeout(async () => {
      ids.forEach((id) => deleteMachineCell(id));
      setMachines(getMachineCells());
      setSelectedMachineIds([]);
      setIsDeletingId((prev) => prev.filter((id) => !ids.includes(id)));
      toast.success(`${ids.length} machines have been deleted`);

      // Log bulk delete action to Alerts & Events section
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const operatorName = user?.full_name || user?.username || 'J.Kumar';
      await api.alerts.create({
        title: `Bulk Machine Deletion (${ids.length} Units)`,
        message: `${ids.length} machines deleted by Operator: ${operatorName} at ${timeStr} on ${dateStr}`,
        severity: 'CRITICAL',
      });
    }, 300);
  };

  const handleConfirmMoveFacility = () => {
    if (!targetMoveFacilityId) return;
    const current = getMachineCells();
    current.forEach((m) => {
      if (selectedMachineIds.includes(m.id)) {
        m.facility_id = targetMoveFacilityId;
        saveMachineCell(m);
      }
    });
    setMachines(getMachineCells());
    setIsMoveFacilityModalOpen(false);
    const targetFac = facilities.find((f) => f.id === targetMoveFacilityId);
    toast.success(`${selectedMachineIds.length} machines moved to ${targetFac?.name || 'facility'}`);
    setSelectedMachineIds([]);
  };

  // Filtered machines
  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || m.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Calculations
  const totalCount = machines.length;
  const runningCount = machines.filter((m) => m.status === 'RUNNING').length;
  const idleCount = machines.filter((m) => m.status === 'IDLE' || m.status === 'SETUP_MODE').length;
  const faultCount = machines.filter((m) => m.status === 'FAULT').length;
  const offlineCount = machines.filter((m) => m.status === 'OFFLINE').length;
  const avgUptime =
    totalCount > 0
      ? (machines.reduce((acc, m) => acc + m.uptime_pct, 0) / totalCount).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
            <span>Smart Factory Machine Management</span>
          </div>
          <h1 className="text-[21px] font-bold tracking-tight text-[#1A1A2E]">
            Machine Cells & Facilities Management
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Real-time status, program configurations, and facility bay capacity across 10 industrial machine types.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsFacilityManagerOpen(true)}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 shadow-2xs cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Manage Facilities</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMachineOpen(true)}
            className="py-1.5 px-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide flex items-center space-x-1.5 transition-all duration-200 shadow-[0_2px_4px_rgba(37,99,235,0.2)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Machine</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Card 1: Total */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200 hover:shadow-md"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em]">
            Total Machines
          </div>
          <div className="text-[1.5rem] font-bold text-[#1A1A2E] leading-tight mt-1">
            {totalCount}
          </div>
          <div className="text-[11.5px] text-[#6B7280] mt-0.5">Across {facilities.length} Facility Zones</div>
        </div>

        {/* Card 2: Running */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200 hover:shadow-md"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-[#15803D] uppercase tracking-[0.05em]">
              Running
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          </div>
          <div className="text-[1.5rem] font-bold text-[#15803D] leading-tight mt-1">
            {runningCount}
          </div>
          <div className="text-[11.5px] text-[#6B7280] mt-0.5">
            {totalCount > 0 ? ((runningCount / totalCount) * 100).toFixed(0) : 0}% Active Production
          </div>
        </div>

        {/* Card 3: Idle / Setup */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200 hover:shadow-md"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold text-[#B45309] uppercase tracking-[0.05em]">
            Idle & Setup
          </div>
          <div className="text-[1.5rem] font-bold text-[#B45309] leading-tight mt-1">
            {idleCount}
          </div>
          <div className="text-[11.5px] text-[#6B7280] mt-0.5">Ready for Job Loading</div>
        </div>

        {/* Card 4: Fault / Offline */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200 hover:shadow-md"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold text-[#B91C1C] uppercase tracking-[0.05em]">
            Fault & Offline
          </div>
          <div className="text-[1.5rem] font-bold text-[#B91C1C] leading-tight mt-1">
            {faultCount + offlineCount}
          </div>
          <div className="text-[11.5px] text-[#6B7280] mt-0.5">
            {faultCount} Fault · {offlineCount} Standby
          </div>
        </div>

        {/* Card 5: Fleet Uptime */}
        <div
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 transition-all duration-200 hover:shadow-md"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.05em]">
            Fleet Overall OEE
          </div>
          <div className="text-[1.5rem] font-bold text-[#4F46E5] leading-tight mt-1">
            {avgUptime}%
          </div>
          <div className="text-[11.5px] text-[#6B7280] mt-0.5">Target &gt;98.0% Availability</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by machine name, code, operator, or brand..."
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Machine Type Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-semibold text-[#6B7280] shrink-0">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Machine Types ({machines.length})</option>
            {Object.entries(MACHINE_TYPE_METADATA).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'RUNNING', 'IDLE', 'SETUP_MODE', 'FAULT', 'OFFLINE'] as const).map(
            (st) => {
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {st === 'SETUP_MODE' ? 'SETUP' : st}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Facilities Grouped Collapsible Section View */}
      <div className="space-y-4">
        {facilities.map((facility) => {
          const facilityMachines = filteredMachines.filter(
            (m) => m.facility_id === facility.id
          );
          const totalInFac = machines.filter((m) => m.facility_id === facility.id).length;
          const isCollapsed = !!collapsedFacilities[facility.id];

          return (
            <div
              key={facility.id}
              className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden transition-all duration-200"
              style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
            >
              {/* Facility Header Banner */}
              <div
                onClick={() => toggleCollapse(facility.id)}
                className="bg-[#F8FAFC] hover:bg-[#F1F3F5] px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] text-[#4F46E5] flex items-center justify-center shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-[14.5px] font-bold text-[#1A1A2E]">
                        {facility.name}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#1A1A2E] border border-[#E5E7EB] shadow-2xs">
                        {totalInFac} / {facility.max_capacity} Machines
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[#6B7280] mt-0.5">
                      {facility.location} · Supervisor: <span className="font-semibold text-[#1A1A2E]">{facility.supervisor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#6B7280]">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280]">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Machines Grid */}
              {!isCollapsed && (
                <div className="p-4">
                  {facilityMachines.length === 0 ? (
                    <div className="py-8 text-center text-[#6B7280]">
                      <Cpu className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
                      <p className="text-xs font-semibold text-[#1A1A2E]">
                        No machines currently matching filter in {facility.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddMachineOpen(true)}
                        className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        + Add a machine to this facility
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {facilityMachines.map((mach) => (
                        <MachineCellCard
                          key={mach.id}
                          machine={mach}
                          facility={facility}
                          isSelected={selectedMachineIds.includes(mach.id)}
                          onToggleSelect={handleToggleSelectMachine}
                          isDeleting={isDeletingId.includes(mach.id)}
                          onStatusChange={handleStatusChange}
                          onEdit={(m) => {
                            setMachineToEdit(m);
                            setIsAddMachineOpen(true);
                          }}
                          onDeleteRequest={(m) => {
                            setMachineToDelete(m);
                            setTypedMachineCode('');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3C. Floating Bulk Action Bar */}
      {selectedMachineIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1A1A2E] text-white px-5 py-3 rounded-[12px] shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="text-xs font-semibold flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>{selectedMachineIds.length} machines selected</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedMachineIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
            >
              Deselect
            </button>
            <button
              type="button"
              onClick={() => {
                if (facilities.length > 0) {
                  setTargetMoveFacilityId(facilities[0].id);
                }
                setIsMoveFacilityModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-[8px] bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Move to Facility</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedBulkDeleteConfirm('');
                setIsBulkDeleteOpen(true);
              }}
              className="px-3 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 3A. Delete Machine Confirmation Modal */}
      {machineToDelete && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-md w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                  Delete Machine?
                </h3>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-[8px] p-3 border border-[#E5E7EB] space-y-1.5 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Machine:</span>
                <span className="font-mono font-bold text-[#1A1A2E]">{machineToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Type:</span>
                <span className="font-semibold text-[#1A1A2E]">
                  {MACHINE_TYPE_METADATA[machineToDelete.type]?.label || machineToDelete.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Facility:</span>
                <span className="text-[#1A1A2E]">
                  {facilities.find((f) => f.id === machineToDelete.facility_id)?.name || 'Cell Zone'}
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-[8px] p-3 text-xs text-rose-900 mb-4">
              <div className="font-bold flex items-center space-x-1.5 text-[#B91C1C] mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>WARNING: This will permanently delete:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-rose-800">
                <li>Machine configuration</li>
                <li>All saved programs ({getSavedPrograms(machineToDelete.type).length} programs)</li>
                <li>All scan/verification history</li>
                <li>All run logs</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                Type machine ID to confirm: <span className="font-mono text-[#EF4444] font-bold">{machineToDelete.code}</span>
              </label>
              <input
                type="text"
                value={typedMachineCode}
                onChange={(e) => setTypedMachineCode(e.target.value)}
                placeholder={machineToDelete.code}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#E5E7EB] focus:border-red-500 rounded-[8px] px-3 py-2 text-xs font-mono font-semibold text-[#1A1A2E] focus:outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMachineToDelete(null);
                  setTypedMachineCode('');
                }}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={typedMachineCode.trim() !== machineToDelete.code}
                onClick={handleConfirmSingleDelete}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                  typedMachineCode.trim() === machineToDelete.code
                    ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Delete Machine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3C. Bulk Delete Warning Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-md w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                  Bulk Delete {selectedMachineIds.length} Machines?
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-3">
              Are you sure you want to delete these <strong className="text-[#1A1A2E]">{selectedMachineIds.length} machines</strong>? This will permanently delete configurations, programs, and verification run logs.
            </p>

            <div className="bg-[#F8F9FA] rounded-[8px] p-2.5 border border-[#E5E7EB] my-3 max-h-36 overflow-y-auto space-y-1">
              {machines
                .filter((m) => selectedMachineIds.includes(m.id))
                .map((m) => (
                  <div key={m.id} className="text-xs text-[#1A1A2E] flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    <span className="font-mono font-bold text-[#1A1A2E]">{m.code}</span>
                    <span className="text-[#6B7280]">·</span>
                    <span className="truncate">{m.name}</span>
                  </div>
                ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                Type <span className="font-mono font-bold text-[#EF4444]">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={typedBulkDeleteConfirm}
                onChange={(e) => setTypedBulkDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#E5E7EB] focus:border-red-500 rounded-[8px] px-3 py-2 text-xs font-mono font-bold text-[#1A1A2E] focus:outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsBulkDeleteOpen(false);
                  setTypedBulkDeleteConfirm('');
                }}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={typedBulkDeleteConfirm.trim() !== 'DELETE'}
                onClick={handleConfirmBulkDelete}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                  typedBulkDeleteConfirm.trim() === 'DELETE'
                    ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move To Facility Modal */}
      {isMoveFacilityModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-sm w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                  Move {selectedMachineIds.length} Machines
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] mb-3">
              Select destination facility zone for the {selectedMachineIds.length} selected machines:
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                Target Facility
              </label>
              <select
                value={targetMoveFacilityId}
                onChange={(e) => setTargetMoveFacilityId(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-xs text-[#1A1A2E] font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsMoveFacilityModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveFacility}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      <AddMachineModal
        isOpen={isAddMachineOpen}
        facilities={facilities}
        machineToEdit={machineToEdit}
        onClose={() => {
          setIsAddMachineOpen(false);
          setMachineToEdit(null);
        }}
        onSave={handleSaveMachine}
        onOpenFacilityManager={() => {
          setIsAddMachineOpen(false);
          setIsFacilityManagerOpen(true);
        }}
      />

      {/* Facility Manager Drawer */}
      <FacilityManagerDrawer
        isOpen={isFacilityManagerOpen}
        facilities={facilities}
        machines={machines}
        onClose={() => setIsFacilityManagerOpen(false)}
        onSaveFacility={handleSaveFacility}
        onDeleteFacility={handleDeleteFacility}
      />
    </div>
  );
};
