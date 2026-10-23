import React, { useState, useEffect } from 'react';
import { X, Cpu, Plus, Sparkles } from 'lucide-react';
import {
  ManufacturingMachine,
  ManufacturingMachineType,
  FacilityZone,
  MachineCellStatus,
} from '../../types/machineCells';
import { MACHINE_TYPE_METADATA } from '../../api/machineCellsData';

interface AddMachineModalProps {
  isOpen: boolean;
  facilities: FacilityZone[];
  machineToEdit?: ManufacturingMachine | null;
  onClose: () => void;
  onSave: (machine: ManufacturingMachine) => void;
  onOpenFacilityManager: () => void;
}

export const AddMachineModal: React.FC<AddMachineModalProps> = ({
  isOpen,
  facilities,
  machineToEdit,
  onClose,
  onSave,
  onOpenFacilityManager,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<ManufacturingMachineType>('CNC_MILLING');
  const [facilityId, setFacilityId] = useState<string>(facilities[0]?.id || '');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().slice(0, 10));
  const [maintenanceIntervalDays, setMaintenanceIntervalDays] = useState(60);
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MachineCellStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);

  // Auto-generate code when type changes
  const handleAutoGenerateId = (selectedType: ManufacturingMachineType) => {
    const prefix = MACHINE_TYPE_METADATA[selectedType]?.prefix || 'MACH';
    const randNum = Math.floor(100 + Math.random() * 900);
    setCode(`${prefix}-${randNum}`);
  };

  useEffect(() => {
    if (isOpen) {
      if (machineToEdit) {
        setName(machineToEdit.name);
        setCode(machineToEdit.code);
        setType(machineToEdit.type);
        setFacilityId(machineToEdit.facility_id);
        setManufacturer(machineToEdit.manufacturer);
        setModel(machineToEdit.model);
        setSerialNumber(machineToEdit.serial_number);
        setInstallDate(machineToEdit.install_date);
        setMaintenanceIntervalDays(machineToEdit.maintenance_interval_days);
        setOperator(machineToEdit.operator);
        setNotes(machineToEdit.notes);
        setStatus(machineToEdit.status);
      } else {
        setName('');
        handleAutoGenerateId(type);
        if (facilities.length > 0 && !facilityId) {
          setFacilityId(facilities[0].id);
        }
        setManufacturer('');
        setModel('');
        setSerialNumber('');
        setInstallDate(new Date().toISOString().slice(0, 10));
        setMaintenanceIntervalDays(60);
        setOperator('');
        setNotes('');
        setStatus('IDLE');
      }
      setError(null);
    }
  }, [isOpen, machineToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Machine Name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Machine ID / Code is required.');
      return;
    }

    const machineData: ManufacturingMachine = {
      id: machineToEdit?.id || `mach-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      facility_id: facilityId || (facilities[0]?.id ?? 'fac-cell-a'),
      manufacturer: manufacturer.trim() || 'Generic Industrial',
      model: model.trim() || 'Standard Edition',
      serial_number: serialNumber.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      install_date: installDate,
      maintenance_interval_days: Number(maintenanceIntervalDays) || 60,
      last_maintenance_date: machineToEdit?.last_maintenance_date || new Date().toISOString().slice(0, 10),
      operator: operator.trim() || 'Unassigned',
      notes: notes.trim(),
      status,
      uptime_pct: machineToEdit?.uptime_pct ?? 99.0,
      cycle_count: machineToEdit?.cycle_count ?? 0,
      parameters: machineToEdit?.parameters || {
        cycle_time_target_s: 60,
        temperature_limit_c: 75,
        pressure_limit_bar: 30,
        emergency_stop_threshold_ms: 20,
        quality_check_interval_cycles: 5,
        // CNC defaults
        spindle_speed_rpm: 8000,
        feed_rate_mm_min: 1500,
        cutting_depth_mm: 2.0,
        coolant_enabled: true,
        // Laser defaults
        laser_power_pct: 75,
        cutting_speed_mm_s: 30,
        gas_type: 'N2',
        gas_pressure_bar: 15,
        // Welding defaults
        weld_current_a: 160,
        weld_voltage_v: 22,
        weld_program_id: 'WELD_STD_01',
      },
      created_at: machineToEdit?.created_at || new Date().toISOString(),
    };

    onSave(machineData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[12px] p-6 max-w-2xl w-full border border-[#E5E7EB] text-left max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F1F3F5]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">
                {machineToEdit ? 'Edit Manufacturing Machine Cell' : 'Register New Manufacturing Machine Cell'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {machineToEdit ? `Updating parameters for ${machineToEdit.code}` : 'Configure physical cell hardware, assigned bay, and telemetry bindings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-[8px] bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Machine Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5-Axis Precision Gantry Mill #3"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#1A1A2E] font-semibold">
                  Machine ID / Code <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoGenerateId(type)}
                  className="text-[11px] text-[#4F46E5] hover:underline flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Gen</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CNC-MILL-003"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs font-mono font-semibold focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Row 2: Machine Type & Facility Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Machine Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as ManufacturingMachineType;
                  setType(newType);
                  handleAutoGenerateId(newType);
                }}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200 cursor-pointer font-medium"
              >
                {Object.entries(MACHINE_TYPE_METADATA).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#1A1A2E] font-semibold">
                  Facility Zone / Cell Location <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenFacilityManager}
                  className="text-[11px] text-[#4F46E5] hover:underline"
                >
                  + Add Facility
                </button>
              </div>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200 cursor-pointer font-medium"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Manufacturer, Model & Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Haas, DMG Mori, Trumpf"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Model Number
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. VF-2SS Super-Speed"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-889124-RT"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-2 text-[#1A1A2E] text-xs font-mono focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Row 4: Install Date, Maintenance Interval, Operator, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Installation Date
              </label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-1.5 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Maint. Interval (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={maintenanceIntervalDays}
                onChange={(e) => setMaintenanceIntervalDays(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-1.5 text-[#1A1A2E] text-xs font-mono focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Assigned Operator
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-1.5 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[#1A1A2E] font-semibold mb-1">
                Initial State
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MachineCellStatus)}
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] px-3 py-1.5 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200 cursor-pointer font-medium"
              >
                <option value="RUNNING">RUNNING</option>
                <option value="IDLE">IDLE</option>
                <option value="SETUP_MODE">SETUP MODE</option>
                <option value="FAULT">FAULT</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          </div>

          {/* Row 5: Notes & Description */}
          <div>
            <label className="block text-[#1A1A2E] font-semibold mb-1">
              Notes & Technical Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. High-speed spindle equipped with Renishaw wireless touch probe and optical sensor head."
              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] focus:border-blue-500 focus:bg-white rounded-[8px] p-2.5 text-[#1A1A2E] text-xs focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#F1F3F5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Register Machine</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
