import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Sliders,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  FileText,
  BarChart2,
} from 'lucide-react';
import {
  ManufacturingMachine,
  MachineCellStatus,
  FacilityZone,
} from '../../types/machineCells';
import { MACHINE_TYPE_METADATA } from '../../api/machineCellsData';
import { MachineTypeIcon } from './MachineTypeIcon';

interface MachineCellCardProps {
  machine: ManufacturingMachine;
  facility?: FacilityZone;
  onStatusChange: (id: string, newStatus: MachineCellStatus) => void;
  onDelete?: (id: string) => void;
  onDeleteRequest?: (machine: ManufacturingMachine) => void;
  onEdit?: (machine: ManufacturingMachine) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  isDeleting?: boolean;
}

export const MachineCellCard: React.FC<MachineCellCardProps> = ({
  machine,
  facility,
  onStatusChange,
  onDelete,
  onDeleteRequest,
  onEdit,
  isSelected,
  onToggleSelect,
  isDeleting,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const metadata = MACHINE_TYPE_METADATA[machine.type] || {
    label: machine.type,
    category: 'Industrial Machinery',
  };

  const getStatusBadge = (status: MachineCellStatus) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#15803D] border border-[#BBF7D0] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5 animate-pulse" />
            RUNNING
          </span>
        );
      case 'IDLE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#B45309] border border-[#FDE68A] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5" />
            IDLE
          </span>
        );
      case 'FAULT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#B91C1C] border border-[#FECDD3] shadow-2xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1.5" />
            FAULT / ERROR
          </span>
        );
      case 'SETUP_MODE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#1D4ED8] border border-[#BFDBFE] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mr-1.5" />
            SETUP MODE
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#4B5563] border border-[#E5E7EB] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] mr-1.5" />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white border rounded-[10px] p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative group ${
        isDeleting ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
      } ${isSelected ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-[#E5E7EB]'}`}
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Checkbox (top-left, visible on hover or when selected) */}
      <div
        className={`absolute top-3 left-3 z-20 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={() => onToggleSelect?.(machine.id)}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer shadow-xs bg-white"
        />
      </div>

      {/* Header: Type Icon, Titles, Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-3 pl-5 sm:pl-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
              <MachineTypeIcon type={machine.type} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-[14.5px] font-bold text-[#1A1A2E] leading-snug tracking-tight">
                  {machine.name}
                </h4>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[11px] font-mono font-semibold text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.2 rounded">
                  {machine.code}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  {metadata.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {getStatusBadge(machine.status)}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-[6px] hover:bg-[#F8F9FA] text-[#6B7280] flex items-center justify-center transition-colors cursor-pointer"
                title="Machine quick actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-8 z-30 w-48 bg-white border border-[#E5E7EB] rounded-[8px] py-1 shadow-lg text-xs animate-in fade-in duration-150"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {/* Action items requested in 3A */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit?.(machine);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#1A1A2E] font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>✏️ Edit Machine</span>
                  </button>

                  <Link
                    to={`/machine-cells/${machine.id}/program`}
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#1A1A2E] font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>📋 View Details</span>
                  </Link>

                  <Link
                    to={`/machine-cells/${machine.id}/program`}
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#1A1A2E] font-medium"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>📊 View Programs</span>
                  </Link>

                  <div className="my-1 border-t border-[#F1F3F5]" />

                  <div className="px-3 py-1 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    Set State
                  </div>
                  <button
                    onClick={() => {
                      onStatusChange(machine.id, 'RUNNING');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#15803D]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span>RUNNING</span>
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(machine.id, 'IDLE');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#B45309]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    <span>IDLE</span>
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(machine.id, 'FAULT');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-[#F8F9FA] flex items-center space-x-2 text-[#B91C1C]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    <span>FAULT</span>
                  </button>

                  <div className="my-1 border-t border-[#F1F3F5]" />

                  {/* 🗑️ Delete Machine (red text) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      if (onDeleteRequest) {
                        onDeleteRequest(machine);
                      } else if (onDelete) {
                        onDelete(machine.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#FEF2F2] flex items-center space-x-2 text-[#EF4444] font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Delete Machine</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & Facility */}
        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-[8px] p-2.5 mb-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] font-medium text-[11px]">Facility Zone:</span>
            <span className="font-semibold text-[#1A1A2E] truncate max-w-[170px]">
              {facility?.name || 'Unassigned Bay'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[#6B7280] font-medium text-[11px]">Model:</span>
            <span className="font-mono text-[#475569] text-[11.5px] truncate max-w-[170px]">
              {machine.manufacturer} · {machine.model}
            </span>
          </div>
        </div>

        {/* Real-time Telemetry Stats: Uptime % and Cycle Count */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-2 text-center shadow-2xs">
            <div className="text-[10px] uppercase font-semibold text-[#6B7280] tracking-wider">
              Uptime
            </div>
            <div className="text-[15px] font-bold text-[#15803D] mt-0.5">
              {machine.uptime_pct.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-2 text-center shadow-2xs">
            <div className="text-[10px] uppercase font-semibold text-[#6B7280] tracking-wider">
              Cycle Count
            </div>
            <div className="text-[15px] font-bold text-[#1A1A2E] mt-0.5 font-mono">
              {machine.cycle_count.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Operator & Maintenance Info */}
        <div className="space-y-1.5 text-xs text-[#6B7280] border-t border-[#F1F3F5] pt-2.5 mb-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="text-[11.5px]">Operator:</span>
            </div>
            <span className="font-semibold text-[#1A1A2E] text-[11.5px]">
              {machine.operator || 'Unassigned'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="text-[11.5px]">Last Maintenance:</span>
            </div>
            <span className="font-mono text-[11.5px] text-[#475569]">
              {machine.last_maintenance_date || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer: Link to Program Configuration & Run Control */}
      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
        <Link
          to={`/machine-cells/${machine.id}/program`}
          className="flex-1 py-1.5 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-200 shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configure Program</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default MachineCellCard;
