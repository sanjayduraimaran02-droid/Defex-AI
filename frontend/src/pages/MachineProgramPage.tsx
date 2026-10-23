import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  AlertOctagon,
  Save,
  RotateCcw,
  Zap,
  Gauge,
  Thermometer,
  Activity,
  Layers,
  Cpu,
  FileCode,
  Scan,
  ShieldCheck,
  Check,
  Upload,
  BookOpen,
  Copy,
  Trash2,
  Tag,
  Search,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ManufacturingMachine,
  MachineParametersConfig,
  ProgramValidationResult,
  ValidationIssue,
  MachineCellStatus,
  SavedMachineProgram,
} from '../types/machineCells';
import {
  getMachineCellById,
  updateMachineParameters,
  updateMachineCellStatus,
  validateMachineProgram,
  MACHINE_TYPE_METADATA,
  getFacilities,
  getSavedPrograms,
  saveProgram,
  duplicateProgram,
  deleteProgram,
} from '../api/machineCellsData';
import { MachineTypeIcon } from '../components/machineCells/MachineTypeIcon';

export const MachineProgramPage: React.FC = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();

  const [machine, setMachine] = useState<ManufacturingMachine | null>(null);
  const [params, setParams] = useState<MachineParametersConfig>({
    cycle_time_target_s: 60,
    temperature_limit_c: 70,
    pressure_limit_bar: 30,
    emergency_stop_threshold_ms: 20,
    quality_check_interval_cycles: 5,
  });

  const [validation, setValidation] = useState<ProgramValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // Run control execution simulation states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [liveSpindleRpm, setLiveSpindleRpm] = useState(0);
  const [liveTempC, setLiveTempC] = useState(24.5);
  const [interlockSignal, setInterlockSignal] = useState<'GO' | 'HOLD' | 'STOP'>('GO');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Confirmation Modals
  const [showStartConfirmModal, setShowStartConfirmModal] = useState(false);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);

  // Section D: Program Library state
  const [savedPrograms, setSavedPrograms] = useState<SavedMachineProgram[]>([]);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgNumber, setNewProgNumber] = useState('');
  const [newPartTag, setNewPartTag] = useState('');
  const [newMaterialTag, setNewMaterialTag] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [libraryFilterTag, setLibraryFilterTag] = useState('ALL');
  const [loadedToast, setLoadedToast] = useState<string | null>(null);

  // Load machine and programs
  const loadMachineData = () => {
    if (machineId) {
      const found = getMachineCellById(machineId);
      if (found) {
        setMachine(found);
        setParams({ ...found.parameters });
        setCyclesCompleted(found.cycle_count);
        setIsRunning(found.status === 'RUNNING');
        setLogMessages([
          `[${new Date().toLocaleTimeString()}] Workstation controller online: ${found.code}`,
          `[${new Date().toLocaleTimeString()}] Initialized parameters for ${found.name}`,
        ]);
        setSavedPrograms(getSavedPrograms(found.type));
      }
    }
  };

  useEffect(() => {
    loadMachineData();
  }, [machineId]);

  // Real-time validation whenever params change
  useEffect(() => {
    if (machine) {
      const result = validateMachineProgram(machine.type, params);
      setValidation(result);
    }
  }, [machine, params]);

  // Live simulation ticker when RUNNING
  useEffect(() => {
    let interval: any = null;
    if (isRunning && !isPaused && machine) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const target = params.cycle_time_target_s || 60;
          if (prev + 1 >= target) {
            setCyclesCompleted((c) => c + 1);
            setLogMessages((logs) => [
              `[${new Date().toLocaleTimeString()}] ✅ Cycle complete (${target}s). Workpiece cleared for inspection station.`,
              ...logs.slice(0, 10),
            ]);
            return 0;
          }
          return prev + 1;
        });

        // Fluctuating telemetry
        const targetRpm = params.spindle_speed_rpm || 10000;
        const noise = (Math.random() - 0.5) * 160;
        setLiveSpindleRpm(Math.round(targetRpm + noise));

        setLiveTempC((prev) => {
          const targetLimit = params.temperature_limit_c || 70;
          const baseline = targetLimit * 0.72;
          const noise = (Math.random() - 0.5) * 0.8;
          return Number(Math.max(25, Math.min(targetLimit - 5, baseline + noise)).toFixed(1));
        });
      }, 1000);
    } else {
      setLiveSpindleRpm(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, machine, params]);

  if (!machine) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-base font-bold text-[#1A1A2E]">Machine Not Found</h3>
        <p className="text-xs text-[#6B7280] mt-1">Machine identifier {machineId} does not exist.</p>
        <Link
          to="/machine-cells"
          className="mt-4 inline-flex items-center space-x-1 py-1.5 px-3 rounded-[8px] bg-[#2563EB] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Machine Cells</span>
        </Link>
      </div>
    );
  }

  const facilities = getFacilities();
  const facility = facilities.find((f) => f.id === machine.facility_id);
  const metadata = MACHINE_TYPE_METADATA[machine.type];

  const handleParamChange = (field: keyof MachineParametersConfig, value: any) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveParameters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!machine) return;
    updateMachineParameters(machine.id, params);
    setSaveSuccess(true);
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] Runtime configuration saved and latched to PLC buffer.`,
      ...logs.slice(0, 10),
    ]);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Start with confirmation modal
  const handleInitiateStart = () => {
    if (!validation.isValid) {
      alert('Cannot start machine: Please fix parameter errors before running.');
      return;
    }
    setShowStartConfirmModal(true);
  };

  const confirmStartProgram = () => {
    setShowStartConfirmModal(false);
    setIsRunning(true);
    setIsPaused(false);
    setInterlockSignal('GO');
    updateMachineCellStatus(machine.id, 'RUNNING');
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] ▶️ START CONFIRMED: Program #${params.program_number || 'P1042'} active on ${machine.code}.`,
      ...logs.slice(0, 10),
    ]);
  };

  // Pause
  const handlePauseProgram = () => {
    setIsPaused(true);
    setInterlockSignal('HOLD');
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] ⏸️ Program paused. Spindle feed held at safe z-clearance.`,
      ...logs.slice(0, 10),
    ]);
  };

  // Emergency Stop with dialog
  const handleInitiateStop = () => {
    setShowStopConfirmModal(true);
  };

  const confirmEmergencyStop = () => {
    setShowStopConfirmModal(false);
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setInterlockSignal('STOP');
    updateMachineCellStatus(machine.id, 'IDLE');
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] 🛑 EMERGENCY STOP: Axis servos de-energized. Status set to IDLE.`,
      ...logs.slice(0, 10),
    ]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setInterlockSignal('GO');
    updateMachineCellStatus(machine.id, 'IDLE');
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] Interlock cleared. Ready for new cycle.`,
      ...logs.slice(0, 10),
    ]);
  };

  // Program Library actions
  const handleOpenSaveAs = () => {
    setNewProgName(`${params.program_number || 'P1042'} - Custom Recipe`);
    setNewProgNumber(params.program_number || 'P1042');
    setNewPartTag('APG-400');
    setNewMaterialTag('4140 Alloy Steel');
    setNewProgDesc(`Configured for ${machine.name}`);
    setShowSaveAsModal(true);
  };

  const handleSaveAsProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim()) return;

    const prog: SavedMachineProgram = {
      id: `prog-${Date.now()}`,
      name: newProgName.trim(),
      program_number: newProgNumber.trim() || 'P1000',
      machine_type: machine.type,
      machine_id: machine.id,
      part_number_tag: newPartTag.trim() || 'GEN-01',
      material_tag: newMaterialTag.trim() || 'Standard Steel',
      description: newProgDesc.trim(),
      parameters: { ...params },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveProgram(prog);
    setSavedPrograms(getSavedPrograms(machine.type));
    setShowSaveAsModal(false);
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] 💾 Saved program [${prog.name}] to Library.`,
      ...logs.slice(0, 10),
    ]);
  };

  const handleLoadProgram = (prog: SavedMachineProgram) => {
    setParams({ ...prog.parameters });
    setLoadedToast(`Loaded recipe: ${prog.name}`);
    setLogMessages((logs) => [
      `[${new Date().toLocaleTimeString()}] 📥 Loaded recipe [${prog.name}] (#${prog.program_number}) into controller buffer.`,
      ...logs.slice(0, 10),
    ]);
    setTimeout(() => setLoadedToast(null), 3000);
  };

  const handleDuplicateProgram = (id: string) => {
    duplicateProgram(id);
    setSavedPrograms(getSavedPrograms(machine.type));
  };

  const handleDeleteProgram = (id: string) => {
    deleteProgram(id);
    setSavedPrograms(getSavedPrograms(machine.type));
  };

  const progressPct = Math.min(
    100,
    Math.round((elapsedSeconds / (params.cycle_time_target_s || 60)) * 100)
  );

  // Filter saved programs by tag
  const filteredPrograms = savedPrograms.filter((p) => {
    if (libraryFilterTag === 'ALL') return true;
    return (
      p.part_number_tag?.toLowerCase().includes(libraryFilterTag.toLowerCase()) ||
      p.material_tag?.toLowerCase().includes(libraryFilterTag.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
        <div className="flex items-center space-x-3">
          <Link
            to="/machine-cells"
            className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] flex items-center justify-center transition-all duration-200 shadow-2xs"
            title="Back to Machine Cells"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider mb-0.5">
              <span>{facility?.name || 'Machine Cells'}</span>
              <span>/</span>
              <span className="font-mono">{machine.code}</span>
            </div>
            <h1 className="text-[21px] font-bold tracking-tight text-[#1A1A2E] flex items-center space-x-2">
              <span>{machine.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]">
                {metadata.label}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="text-xs text-[#15803D] font-semibold flex items-center space-x-1 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-[#22C55E]" />
              <span>Recipe Saved</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenSaveAs}
            className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Save as Program</span>
          </button>

          <Link
            to={`/inspection/new?machine_id=${machine.id}`}
            className="py-1.5 px-3.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 shadow-[0_2px_4px_rgba(79,70,229,0.2)]"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Defex Inspection Station</span>
          </Link>
        </div>
      </div>

      {loadedToast && (
        <div className="p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{loadedToast}</span>
        </div>
      )}

      {/* SECTION B: PROGRAM VALIDATION BANNER */}
      <div>
        {validation.isValid ? (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[10px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#065F46]">
                  ✅ All Parameters Valid — Ready to Run
                </span>
                <p className="text-[11.5px] text-[#047857]">
                  Input parameters conform to safety limits and {metadata.label} tolerances.
                </p>
              </div>
            </div>

            {validation.warnings.length > 0 && (
              <div className="flex items-center space-x-1.5 text-xs text-[#B45309] bg-white px-2.5 py-1 rounded-[6px] border border-[#FDE68A]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{validation.warnings.length} advisory warning(s)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] p-3 shadow-2xs">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#9F1239]">
                  ❌ Fix {validation.errors.length} Error(s) Before Running Program
                </span>
                <p className="text-[11.5px] text-[#BE123C]">
                  Machine interlock prevents starting while mandatory parameter violations exist.
                </p>
              </div>
            </div>

            {/* Error Pill List */}
            <div className="flex flex-wrap gap-1.5 pl-9">
              {validation.errors.map((err, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 text-[11px] font-medium bg-white text-[#9F1239] border border-[#FECDD3] px-2 py-0.5 rounded-[6px]"
                >
                  <span className="font-semibold">{err.label}:</span>
                  <span>{err.message}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Warnings list if any */}
        {validation.warnings.length > 0 && (
          <div className="mt-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] p-2.5 text-xs text-[#92400E] flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 font-semibold shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Advisory Warnings:</span>
            </div>
            {validation.warnings.map((w, idx) => (
              <span key={idx} className="bg-white/80 px-2 py-0.5 rounded text-[11px] border border-[#FDE68A]">
                {w.message}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Parameters Form (Section A) & Run Control (Section C) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SECTION A — MACHINE PARAMETERS INPUT FORM (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="bg-white border border-[#E5E7EB] rounded-[10px] p-4"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center justify-between mb-3 border-b border-[#F1F3F5] pb-2.5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-[15px] font-bold text-[#1A1A2E]">
                  Section A: Machine Parameters Configuration
                </h3>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                Tailored for {metadata.label}
              </span>
            </div>

            {/* TYPE-SPECIFIC PARAMETER FIELDS */}
            <div className="space-y-3.5 text-xs">
              {/* CNC Parameters */}
              {(machine.type === 'CNC_MILLING' ||
                machine.type === 'CNC_LATHE' ||
                machine.type === 'EDM_MACHINE') && (
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-3 space-y-3">
                  <div className="text-[11px] font-bold text-[#1A1A2E] uppercase tracking-wider flex items-center space-x-1">
                    <Cpu className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>CNC Spindle & Tooling Controls</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Spindle Speed
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="20000"
                          value={params.spindle_speed_rpm ?? 10000}
                          onChange={(e) =>
                            handleParamChange('spindle_speed_rpm', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-11 py-1.5 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          RPM
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">Max: 20,000 RPM</span>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Feed Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          value={params.feed_rate_mm_min ?? 1500}
                          onChange={(e) =>
                            handleParamChange('feed_rate_mm_min', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-16 py-1.5 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          mm/min
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">Rec: 800 - 3,200 mm/min</span>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Cutting Depth
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="15.0"
                          value={params.cutting_depth_mm ?? 2.0}
                          onChange={(e) =>
                            handleParamChange('cutting_depth_mm', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          mm
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">Stepdown depth</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Tool Number
                      </label>
                      <select
                        value={params.tool_number || 'Tool 1 (Standard Endmill)'}
                        onChange={(e) => handleParamChange('tool_number', e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((t) => (
                          <option key={t} value={`Tool ${t}`}>
                            Tool #{t} (Magazine Slot {t})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Through-Spindle Coolant
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleParamChange('coolant_enabled', !params.coolant_enabled)
                        }
                        className={`w-full py-1.5 px-3 rounded-[8px] text-xs font-semibold border transition-all ${
                          params.coolant_enabled
                            ? 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB]'
                        }`}
                      >
                        {params.coolant_enabled ? '💧 Coolant ON' : 'Coolant OFF (Dry)'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Program # / G-Code File
                      </label>
                      <input
                        type="text"
                        value={params.program_number || 'P1042'}
                        onChange={(e) => handleParamChange('program_number', e.target.value)}
                        placeholder="e.g. P1042"
                        className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Work Offsets */}
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      G54 Work Coordinates Offset (mm)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] rounded-[6px] px-2 py-1">
                        <span className="font-bold text-[#6B7280]">X:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={params.work_offset_x ?? 0.0}
                          onChange={(e) =>
                            handleParamChange('work_offset_x', Number(e.target.value))
                          }
                          className="w-full font-mono text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-[#6B7280]">mm</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] rounded-[6px] px-2 py-1">
                        <span className="font-bold text-[#6B7280]">Y:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={params.work_offset_y ?? 0.0}
                          onChange={(e) =>
                            handleParamChange('work_offset_y', Number(e.target.value))
                          }
                          className="w-full font-mono text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-[#6B7280]">mm</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-white border border-[#E5E7EB] rounded-[6px] px-2 py-1">
                        <span className="font-bold text-[#6B7280]">Z:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={params.work_offset_z ?? 0.0}
                          onChange={(e) =>
                            handleParamChange('work_offset_z', Number(e.target.value))
                          }
                          className="w-full font-mono text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-[#6B7280]">mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Laser Cutting Parameters */}
              {machine.type === 'LASER_CUTTING' && (
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-3 space-y-3">
                  <div className="text-[11px] font-bold text-[#1A1A2E] uppercase tracking-wider flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Laser Cutting Optics & Assist Gas</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[#1A1A2E] font-semibold">Laser Power (%)</label>
                        <span className="font-mono font-bold text-[#2563EB]">
                          {params.laser_power_pct ?? 85}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={params.laser_power_pct ?? 85}
                        onChange={(e) =>
                          handleParamChange('laser_power_pct', Number(e.target.value))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Cutting Speed
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={params.cutting_speed_mm_s ?? 40}
                          onChange={(e) =>
                            handleParamChange('cutting_speed_mm_s', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-12 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          mm/s
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Focus Distance
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={params.focus_distance_mm ?? 1.2}
                          onChange={(e) =>
                            handleParamChange('focus_distance_mm', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          mm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Assist Gas Type
                      </label>
                      <select
                        value={params.gas_type || 'N2'}
                        onChange={(e) => handleParamChange('gas_type', e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 text-xs text-[#1A1A2E] font-semibold"
                      >
                        <option value="N2">Nitrogen (N2) — Burr Free</option>
                        <option value="O2">Oxygen (O2) — Heavy Plate</option>
                        <option value="Air">Shop Compressed Air</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Gas Pressure
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={params.gas_pressure_bar ?? 18}
                          onChange={(e) =>
                            handleParamChange('gas_pressure_bar', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          bar
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Pulse Frequency
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={params.pulse_frequency_hz ?? 5000}
                          onChange={(e) =>
                            handleParamChange('pulse_frequency_hz', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          Hz
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Robotic Welding Parameters */}
              {machine.type === 'ROBOTIC_WELDING' && (
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-3 space-y-3">
                  <div className="text-[11px] font-bold text-[#1A1A2E] uppercase tracking-wider flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Welding Robot Synergic Power & Trajectory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Weld Current
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={params.weld_current_a ?? 180}
                          onChange={(e) =>
                            handleParamChange('weld_current_a', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-8 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          A
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Arc Voltage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={params.weld_voltage_v ?? 24.0}
                          onChange={(e) =>
                            handleParamChange('weld_voltage_v', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-8 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          V
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Wire Feed Speed
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={params.wire_feed_speed_m_min ?? 7.5}
                          onChange={(e) =>
                            handleParamChange('wire_feed_speed_m_min', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-14 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          m/min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Travel Speed
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={params.travel_speed_mm_min ?? 420}
                          onChange={(e) =>
                            handleParamChange('travel_speed_mm_min', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-16 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          mm/min
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Shielding Gas Flow
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={params.gas_flow_l_min ?? 15.0}
                          onChange={(e) =>
                            handleParamChange('gas_flow_l_min', Number(e.target.value))
                          }
                          className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-14 py-1.5 font-mono text-xs text-[#1A1A2E]"
                        />
                        <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                          L/min
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#1A1A2E] font-semibold mb-1">
                        Weld Program Trajectory ID
                      </label>
                      <input
                        type="text"
                        value={params.weld_program_id || 'WELD_CHASSIS_01'}
                        onChange={(e) => handleParamChange('weld_program_id', e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-2.5 py-1.5 font-mono text-xs text-[#1A1A2E] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GENERAL PARAMETERS (FOR ALL MACHINES) */}
              <div className="border-t border-[#E5E7EB] pt-3">
                <span className="text-[11px] font-bold text-[#1A1A2E] uppercase tracking-wider block mb-2">
                  General Production & Safety Limits
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      Cycle Time Target
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={params.cycle_time_target_s}
                        onChange={(e) =>
                          handleParamChange('cycle_time_target_s', Number(e.target.value))
                        }
                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E] font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                        sec
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      Temperature Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="10"
                        max="300"
                        value={params.temperature_limit_c}
                        onChange={(e) =>
                          handleParamChange('temperature_limit_c', Number(e.target.value))
                        }
                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E] font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                        °C
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      Pressure Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={params.pressure_limit_bar}
                        onChange={(e) =>
                          handleParamChange('pressure_limit_bar', Number(e.target.value))
                        }
                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E] font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                        bar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      Emergency Stop Latency Threshold
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={params.emergency_stop_threshold_ms}
                        onChange={(e) =>
                          handleParamChange('emergency_stop_threshold_ms', Number(e.target.value))
                        }
                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-10 py-1.5 font-mono text-xs text-[#1A1A2E]"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                        ms
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1A2E] font-semibold mb-1">
                      Quality Check Interval (Cycles)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={params.quality_check_interval_cycles}
                        onChange={(e) =>
                          handleParamChange('quality_check_interval_cycles', Number(e.target.value))
                        }
                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-2.5 pr-16 py-1.5 font-mono text-xs text-[#1A1A2E]"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] text-[#6B7280] font-mono">
                        cycles
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C — RUN CONTROL PANEL & TELEMETRY (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex flex-col justify-between"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            {/* Header: Run Status & Defex Interlock */}
            <div className="border-b border-[#F1F3F5] pb-3 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10.5px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Section C: Execution & Hardware Interlock
                  </span>
                  <h3 className="text-base font-bold text-[#1A1A2E] mt-0.5">
                    Live Run Control Station
                  </h3>
                </div>

                {/* State Badge with animated green pulse */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isRunning && !isPaused
                      ? 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]'
                      : isPaused
                      ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                      : interlockSignal === 'STOP'
                      ? 'bg-[#FFF1F2] text-[#B91C1C] border-[#FECDD3] animate-pulse'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E5E7EB]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1.5 ${
                      isRunning && !isPaused
                        ? 'bg-[#22C55E] animate-ping'
                        : isPaused
                        ? 'bg-[#F59E0B]'
                        : interlockSignal === 'STOP'
                        ? 'bg-[#EF4444]'
                        : 'bg-[#9CA3AF]'
                    }`}
                  />
                  {isRunning && !isPaused
                    ? 'RUNNING'
                    : isPaused
                    ? 'PAUSED'
                    : interlockSignal === 'STOP'
                    ? 'TRIPPED (STOP)'
                    : 'READY / IDLE'}
                </span>
              </div>

              {/* Hardware Interlock State Tag */}
              <div className="flex items-center justify-between text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2">
                <span className="text-[#6B7280] font-medium text-[11.5px]">
                  Hardware Interlock Relay:
                </span>
                <span
                  className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${
                    interlockSignal === 'GO'
                      ? 'bg-white text-[#15803D] border-[#BBF7D0]'
                      : interlockSignal === 'HOLD'
                      ? 'bg-white text-[#B45309] border-[#FDE68A]'
                      : 'bg-white text-[#B91C1C] border-[#FECDD3]'
                  }`}
                >
                  SIGNAL_{interlockSignal}
                </span>
              </div>
            </div>

            {/* Live Progress Bar & Cycle Counter */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-[#6B7280] font-medium">Cycle Execution Progress</span>
                  <span className="font-mono font-bold text-[#1A1A2E]">
                    {elapsedSeconds}s / {params.cycle_time_target_s || 60}s ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      interlockSignal === 'STOP'
                        ? 'bg-[#EF4444]'
                        : isRunning
                        ? 'bg-[#22C55E]'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Gauge Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 text-center">
                  <div className="text-[10.5px] uppercase font-semibold text-[#6B7280]">
                    Spindle Speed
                  </div>
                  <div className="text-[18px] font-bold text-[#1A1A2E] font-mono mt-0.5">
                    {liveSpindleRpm.toLocaleString()} <span className="text-xs font-normal">RPM</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280]">
                    Target: {params.spindle_speed_rpm || 0}
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 text-center">
                  <div className="text-[10.5px] uppercase font-semibold text-[#6B7280]">
                    Spindle Thermal
                  </div>
                  <div
                    className={`text-[18px] font-bold font-mono mt-0.5 ${
                      liveTempC > (params.temperature_limit_c || 70) * 0.85
                        ? 'text-[#B91C1C]'
                        : 'text-[#15803D]'
                    }`}
                  >
                    {liveTempC}°C
                  </div>
                  <div className="text-[10px] text-[#6B7280]">
                    Max Limit: {params.temperature_limit_c || 70}°C
                  </div>
                </div>
              </div>

              {/* Total Cycles Metric */}
              <div className="flex justify-between items-center text-xs p-2.5 bg-white border border-[#E5E7EB] rounded-[8px]">
                <span className="text-[#6B7280] font-medium">Batch Cycles Produced:</span>
                <span className="font-mono font-bold text-[#1A1A2E] text-[14px]">
                  {cyclesCompleted.toLocaleString()} Parts
                </span>
              </div>
            </div>

            {/* Run Action Buttons with required Confirmation Handlers */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {!isRunning || isPaused ? (
                  <button
                    type="button"
                    onClick={handleInitiateStart}
                    disabled={!validation.isValid}
                    className={`py-2 px-3 rounded-[8px] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-200 shadow-xs cursor-pointer ${
                      validation.isValid
                        ? 'bg-[#22C55E] hover:bg-[#16A34A] shadow-[0_2px_4px_rgba(34,197,94,0.3)]'
                        : 'bg-[#9CA3AF] cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START Program</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseProgram}
                    className="py-2 px-3 rounded-[8px] bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-200 shadow-xs cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>PAUSE Cycle</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset State</span>
                </button>
              </div>

              {/* STOP Button with Emergency Halt Dialog */}
              <button
                type="button"
                onClick={handleInitiateStop}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold tracking-wide flex items-center justify-center space-x-2 transition-all duration-200 shadow-[0_2px_4px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>STOP / EMERGENCY HALT (E-STOP)</span>
              </button>
            </div>

            {/* Live Telemetry Console Log Stream */}
            <div className="bg-[#1A1A2E] text-slate-200 rounded-[8px] p-3 text-[11px] font-mono h-32 overflow-y-auto space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between">
                <span>PLC Controller Activity Log</span>
                <span className="text-emerald-400">● LIVE</span>
              </div>
              {logMessages.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D — PROGRAM LIBRARY */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-4"
        style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F1F3F5] pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">
                Section D: Program & Recipe Library
              </h3>
              <p className="text-xs text-[#6B7280]">
                Pre-configured validated parameter sets tagged by Part Number and Material grade
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tag Filter */}
            <div className="flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <select
                value={libraryFilterTag}
                onChange={(e) => setLibraryFilterTag(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1A1A2E] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Saved Programs</option>
                <option value="APG-400">Tag: APG-400</option>
                <option value="Steel">Tag: Steel</option>
                <option value="Titanium">Tag: Titanium</option>
                <option value="Aluminum">Tag: Aluminum</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenSaveAs}
              className="py-1.5 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Current as Program</span>
            </button>
          </div>
        </div>

        {/* Program Cards Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="py-8 text-center text-[#6B7280]">
            <BookOpen className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-xs font-semibold text-[#1A1A2E]">No programs found in library</p>
            <p className="text-[11.5px] text-[#6B7280] mt-0.5">
              Click &quot;Save Current as Program&quot; to save this machine&apos;s parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] p-3.5 flex flex-col justify-between hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all duration-200 text-xs"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-xs bg-white text-[#2563EB] px-1.5 py-0.2 rounded border border-blue-200">
                          #{prog.program_number}
                        </span>
                        <h4 className="font-bold text-[#1A1A2E] text-[13px] leading-tight">
                          {prog.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                        {prog.description || 'Pre-configured machine parameters'}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prog.part_number_tag && (
                      <span className="inline-flex items-center space-x-1 text-[10.5px] font-semibold bg-white text-[#1A1A2E] border border-[#E5E7EB] px-2 py-0.5 rounded-full shadow-2xs">
                        <Tag className="w-3 h-3 text-[#4F46E5]" />
                        <span>Part: {prog.part_number_tag}</span>
                      </span>
                    )}
                    {prog.material_tag && (
                      <span className="inline-flex items-center space-x-1 text-[10.5px] font-semibold bg-white text-[#475569] border border-[#E5E7EB] px-2 py-0.5 rounded-full shadow-2xs">
                        <Layers className="w-3 h-3 text-[#B45309]" />
                        <span>{prog.material_tag}</span>
                      </span>
                    )}
                  </div>

                  {/* Parameter Snapshot */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-2 text-[11px] font-mono text-[#475569] space-y-0.5 mb-3">
                    {prog.parameters.spindle_speed_rpm !== undefined && (
                      <div>Spindle: {prog.parameters.spindle_speed_rpm.toLocaleString()} RPM · Feed: {prog.parameters.feed_rate_mm_min} mm/min</div>
                    )}
                    {prog.parameters.laser_power_pct !== undefined && (
                      <div>Laser: {prog.parameters.laser_power_pct}% · Speed: {prog.parameters.cutting_speed_mm_s} mm/s</div>
                    )}
                    {prog.parameters.weld_current_a !== undefined && (
                      <div>Current: {prog.parameters.weld_current_a} A · Wire: {prog.parameters.wire_feed_speed_m_min} m/min</div>
                    )}
                    <div>Cycle Target: {prog.parameters.cycle_time_target_s}s · Limit: {prog.parameters.temperature_limit_c}°C</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateProgram(prog.id)}
                      className="p-1 rounded text-[#6B7280] hover:text-[#1A1A2E] hover:bg-slate-200 transition-colors"
                      title="Duplicate Program"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(prog.id)}
                      className="p-1 rounded text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                      title="Delete Program"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadProgram(prog)}
                    className="py-1 px-3 rounded-[6px] bg-white border border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-blue-300 text-[#2563EB] text-xs font-semibold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Load Recipe</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* START CONFIRMATION MODAL */}
      {showStartConfirmModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-md w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#15803D] flex items-center justify-center border border-emerald-100 shrink-0">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">
                  Start {machine.code} with Program #{params.program_number || 'P1042'}?
                </h3>
                <p className="text-[11.5px] text-[#6B7280]">
                  Verify all safety checks are complete.
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Confirm that the workpiece is securely mounted, pneumatic clamps are energized, machine doors are locked, and all operators are clear of the gantry envelope.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowStartConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStartProgram}
                className="px-4 py-1.5 rounded-[8px] bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✅ Confirm & Start</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOP / EMERGENCY STOP MODAL */}
      {showStopConfirmModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-md w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">
                  Emergency Stop Machine?
                </h3>
                <p className="text-[11.5px] text-[#6B7280]">
                  Halt active cycle and open safety circuit on {machine.code}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              This will assert Digital Output DO_2 (STOP), immediately stopping spindle rotation, tool feed, and axes. Machine status will transition to IDLE.
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowStopConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEmergencyStop}
                className="px-4 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>🛑 Confirm Emergency Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE AS PROGRAM MODAL */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-lg w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F3F5]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">
                    Save Parameters as Named Program
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Store into Program Library for quick loading on {machine.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="text-[#6B7280] hover:text-[#1A1A2E] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsProgram} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1A1A2E] font-semibold mb-1">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  placeholder="e.g. P1042 - Shaft Turning v2"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#1A1A2E] font-semibold mb-1">
                    Program Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newProgNumber}
                    onChange={(e) => setNewProgNumber(e.target.value)}
                    placeholder="e.g. P1042"
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2 font-mono text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A2E] font-semibold mb-1">
                    Part Number Tag
                  </label>
                  <input
                    type="text"
                    value={newPartTag}
                    onChange={(e) => setNewPartTag(e.target.value)}
                    placeholder="e.g. APG-400"
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2 font-mono text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A2E] font-semibold mb-1">
                    Material Tag
                  </label>
                  <input
                    type="text"
                    value={newMaterialTag}
                    onChange={(e) => setNewMaterialTag(e.target.value)}
                    placeholder="e.g. 4140 Steel"
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#1A1A2E] focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1A1A2E] font-semibold mb-1">
                  Description / Process Notes
                </label>
                <textarea
                  rows={2}
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  placeholder="e.g. Dual-pass turning with carbide finishing and high-pressure coolant."
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] p-2.5 text-[#1A1A2E] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#F1F3F5]">
                <button
                  type="button"
                  onClick={() => setShowSaveAsModal(false)}
                  className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] hover:bg-[#F8F9FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-xs transition-colors flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Program Library</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
