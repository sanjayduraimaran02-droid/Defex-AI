import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Building2,
  Users,
  Layers,
  MapPin,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { FacilityZone, ManufacturingMachine } from '../../types/machineCells';
import { useToast } from '../../context/ToastContext';

interface FacilityManagerDrawerProps {
  isOpen: boolean;
  facilities: FacilityZone[];
  machines: ManufacturingMachine[];
  onClose: () => void;
  onSaveFacility: (facility: FacilityZone) => void;
  onDeleteFacility: (id: string) => void;
}

export const FacilityManagerDrawer: React.FC<FacilityManagerDrawerProps> = ({
  isOpen,
  facilities,
  machines,
  onClose,
  onSaveFacility,
  onDeleteFacility,
}) => {
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Deletion modals state
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityZone | null>(null);
  const [blockedFacility, setBlockedFacility] = useState<{
    facility: FacilityZone;
    machines: ManufacturingMachine[];
  } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(6);
  const [supervisor, setSupervisor] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setName('');
    setLocation('');
    setMaxCapacity(6);
    setSupervisor('');
    setNotes('');
    setFormError(null);
    setIsAddingNew(true);
  };

  const handleStartEdit = (fac: FacilityZone) => {
    setIsAddingNew(false);
    setEditingId(fac.id);
    setName(fac.name);
    setLocation(fac.location);
    setMaxCapacity(fac.max_capacity);
    setSupervisor(fac.supervisor);
    setNotes(fac.notes || '');
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Facility Name is required.');
      return;
    }
    if (!location.trim()) {
      setFormError('Facility Location is required.');
      return;
    }

    const facilityData: FacilityZone = {
      id: editingId || `fac-${Date.now()}`,
      name: name.trim(),
      location: location.trim(),
      max_capacity: Number(maxCapacity) || 4,
      supervisor: supervisor.trim() || 'Unassigned',
      notes: notes.trim(),
      created_at: new Date().toISOString(),
    };

    onSaveFacility(facilityData);
    setIsAddingNew(false);
    setEditingId(null);
  };

  const getMachineCountInFacility = (facId: string) => {
    return machines.filter((m) => m.facility_id === facId).length;
  };

  const handleDeleteClick = (fac: FacilityZone) => {
    const facMachines = machines.filter((m) => m.facility_id === fac.id);
    if (facMachines.length > 0) {
      setBlockedFacility({ facility: fac, machines: facMachines });
    } else {
      setFacilityToDelete(fac);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md h-full flex flex-col justify-between border-l border-[#E5E7EB] shadow-2xl animate-in slide-in-from-right duration-250 select-none"
        style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                Facility & Cell Zones
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Organize shop floor bays, cell lines, and supervisor assignments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Action button to add */}
          {!isAddingNew && !editingId && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="w-full py-2 px-3 rounded-[8px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Facility Zone</span>
            </button>
          )}

          {/* Inline Add / Edit Form */}
          {(isAddingNew || editingId) && (
            <form
              onSubmit={handleSave}
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                <span className="font-bold text-[#1A1A2E]">
                  {isAddingNew ? 'New Facility Zone' : 'Edit Facility Zone'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className="text-[#6B7280] hover:text-[#1A1A2E]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {formError && (
                <div className="p-2 rounded-[6px] bg-red-50 text-red-700 text-[11px] border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[#1A1A2E] font-semibold mb-1">
                  Facility Zone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cell A - CNC Zone"
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#1A1A2E] font-semibold mb-1">
                  Location Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Building 1 · East Gantry Bay"
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#1A1A2E] font-semibold mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A2E] font-semibold mb-1">
                    Supervisor
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1A1A2E] font-semibold mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 5-axis heavy-duty machining cell."
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] p-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] hover:bg-[#F8F9FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-colors flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Zone</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Facilities */}
          <div className="space-y-2.5">
            <span className="text-[10.5px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Configured Facilities ({facilities.length})
            </span>

            {facilities.map((fac) => {
              const machineCount = getMachineCountInFacility(fac.id);
              const isOverCapacity = machineCount > fac.max_capacity;

              return (
                <div
                  key={fac.id}
                  className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 text-xs space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#1A1A2E] text-[13px]">
                        {fac.name}
                      </h4>
                      <div className="flex items-center space-x-1 text-[11px] text-[#6B7280] mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{fac.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(fac)}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280] hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Facility"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(fac)}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F1F3F5]">
                    <div className="flex items-center space-x-1 text-[#475569]">
                      <Users className="w-3 h-3 text-[#9CA3AF]" />
                      <span className="truncate max-w-[140px] font-medium">{fac.supervisor}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full border text-[10.5px] ${
                          isOverCapacity
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-[#1A1A2E] border-[#E5E7EB]'
                        }`}
                      >
                        {machineCount} / {fac.max_capacity} Machines
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* CASE 1 — Blocked Facility Delete (Facility has machines) */}
      {blockedFacility && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-md w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                  Cannot Delete Facility
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280]">
              <strong className="text-[#1A1A2E]">"{blockedFacility.facility.name}"</strong> has {blockedFacility.machines.length} machine{blockedFacility.machines.length > 1 ? 's' : ''}:
            </p>

            <div className="bg-[#F8F9FA] rounded-[8px] p-2.5 border border-[#E5E7EB] my-3 max-h-36 overflow-y-auto space-y-1">
              {blockedFacility.machines.map((m) => (
                <div key={m.id} className="text-xs text-[#1A1A2E] flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span className="font-mono font-bold text-[#4F46E5]">{m.code}</span>
                  <span className="text-[#6B7280]">·</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>

            <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
              Please reassign or delete all machines in this facility before deleting it.
            </p>

            <div className="flex items-center justify-end space-x-2 mt-5">
              <button
                type="button"
                onClick={() => setBlockedFacility(null)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlockedFacility(null);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Manage Machines in {blockedFacility.facility.name.split('-')[0].trim()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2 — Empty Facility Delete Confirmation */}
      {facilityToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
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
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A2E]">
                  Delete Facility?
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              <strong className="text-[#1A1A2E]">"{facilityToDelete.name}"</strong> is empty. This facility will be permanently deleted.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setFacilityToDelete(null)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold hover:bg-[#F8F9FA] hover:text-[#1A1A2E] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const facName = facilityToDelete.name;
                  onDeleteFacility(facilityToDelete.id);
                  setFacilityToDelete(null);
                  toast.success(`${facName} deleted`);
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Facility</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
