import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  XCircle,
  Zap,
  ArrowRight,
  Camera,
  ShieldCheck,
  ShieldAlert,
  PauseCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api/client';
import { Part, Machine, Inspection } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SignalIndicator } from '../components/SignalIndicator';
import { InspectionStation } from '../components/InspectionStation';

export const NewInspection: React.FC = () => {
  const navigate = useNavigate();

  const [stationMode, setStationMode] = useState<'live_vision' | 'manual_batch'>('live_vision');
  const [parts, setParts] = useState<Part[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Form selections
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [selectedMachineId, setSelectedMachineId] = useState<number | ''>('');
  const [presetType, setPresetType] = useState<string>('pass');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Metrology inputs
  const [lengthInput, setLengthInput] = useState<string>('');
  const [widthInput, setWidthInput] = useState<string>('');
  const [heightInput, setHeightInput] = useState<string>('');

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const populateDefaultNominals = useCallback((part: Part) => {
    if (part.nominal_dimensions) {
      setLengthInput(String(part.nominal_dimensions.length ?? 150.0));
      setWidthInput(String(part.nominal_dimensions.width ?? 80.0));
      setHeightInput(String(part.nominal_dimensions.height ?? 45.0));
    }
  }, []);

  useEffect(() => {
    const fetchPrereqs = async () => {
      try {
        const [partsData, machinesData] = await Promise.all([
          api.parts.list(),
          api.machines.list(),
        ]);
        setParts(partsData);
        setMachines(machinesData);

        if (partsData.length > 0) {
          setSelectedPartId(partsData[0].id);
          populateDefaultNominals(partsData[0]);
        }
        if (machinesData.length > 0) {
          setSelectedMachineId(machinesData[0].id);
        }
      } catch (err) {
        console.error('Failed to load parts or machines:', err);
      }
    };
    fetchPrereqs();
  }, [populateDefaultNominals]);

  const handlePartChange = (partId: number) => {
    setSelectedPartId(partId);
    const p = parts.find((item) => item.id === partId);
    if (p) populateDefaultNominals(p);
  };

  const handlePresetSelect = (preset: string) => {
    setPresetType(preset);
    const selectedPart = parts.find((p) => p.id === Number(selectedPartId));
    if (!selectedPart) return;

    const nominalL = selectedPart.nominal_dimensions?.length ?? 150.0;
    const tolL = selectedPart.tolerances?.length ?? 0.05;

    if (preset === 'fail_tolerance') {
      setLengthInput(String((nominalL + tolL * 2.5).toFixed(3)));
    } else if (preset === 'uncertain_borderline') {
      setLengthInput(String((nominalL + tolL * 0.95).toFixed(3)));
    } else {
      setLengthInput(String(nominalL.toFixed(3)));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPresetType('custom_upload');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId || !selectedMachineId) {
      setError('Please select both a Part Profile and an Inspection Machine Station.');
      return;
    }

    setExecuting(true);
    setError(null);
    setInspectionResult(null);

    try {
      const formData = new FormData();
      formData.append('part_id', String(selectedPartId));
      formData.append('machine_id', String(selectedMachineId));
      formData.append('preset_type', presetType);

      const measurements: Record<string, number> = {};
      if (lengthInput) measurements.length = parseFloat(lengthInput);
      if (widthInput) measurements.width = parseFloat(widthInput);
      if (heightInput) measurements.height = parseFloat(heightInput);

      formData.append('measurements_json', JSON.stringify(measurements));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const result = await api.inspections.create(formData);
      setInspectionResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Inspection execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const selectedPart = parts.find((p) => p.id === Number(selectedPartId));
  const selectedMachine = machines.find((m) => m.id === Number(selectedMachineId));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>Automated Damage Prevention</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Workpiece Inspection Station</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Ingest multi-modal optical vision frames and laser metrology streams to trigger real-time interlock signals.
        </p>
      </div>

      {/* Station Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] pb-2">
        <button
          type="button"
          onClick={() => setStationMode('live_vision')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
            stationMode === 'live_vision'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] border border-[#E5E7EB]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Real-Time Camera Vision (Live HUD & Interlock)</span>
        </button>

        <button
          type="button"
          onClick={() => setStationMode('manual_batch')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
            stationMode === 'manual_batch'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] border border-[#E5E7EB]'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Manual CAD & Metrology Form</span>
        </button>
      </div>

      {stationMode === 'live_vision' ? (
        <InspectionStation />
      ) : (
        <>
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2.5 shadow-sm">
              <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

      {/* Real-Time Result Banner if Generated */}
      {inspectionResult && (
        <div
          className={`rounded-[12px] border p-6 transition-all duration-300 shadow-sm ${
            inspectionResult.outcome === 'PASS'
              ? 'bg-[#ECFDF5] border-[#A7F3D0]'
              : inspectionResult.outcome === 'FAIL'
              ? 'bg-[#FFF1F2] border-[#FECDD3]'
              : 'bg-[#FFFBEB] border-[#FDE68A]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  inspectionResult.outcome === 'PASS'
                    ? 'bg-emerald-100 text-[#10B981]'
                    : inspectionResult.outcome === 'FAIL'
                    ? 'bg-rose-100 text-[#F43F5E]'
                    : 'bg-amber-100 text-[#F59E0B]'
                }`}
              >
                {inspectionResult.outcome === 'PASS' && <ShieldCheck className="w-7 h-7" />}
                {inspectionResult.outcome === 'FAIL' && <ShieldAlert className="w-7 h-7" />}
                {inspectionResult.outcome === 'UNCERTAIN' && <PauseCircle className="w-7 h-7" />}
              </div>

              <div>
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Damage Prevention Interlock Fired
                </div>
                <div className="text-xl font-bold text-[#0F172A] flex items-center space-x-3 mt-0.5">
                  <span>Decision:</span>
                  <StatusBadge status={inspectionResult.outcome} size="lg" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setInspectionResult(null)}
                className="py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold border border-[#E2E8F0] transition-colors shadow-2xs"
              >
                Inspect Next Workpiece
              </button>
              <button
                type="button"
                onClick={() => navigate(`/inspection/${inspectionResult.id}`)}
                className="py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide flex items-center space-x-1.5 transition-all shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
              >
                <span>View Full Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hardware Signal Card */}
          <SignalIndicator
            signal={inspectionResult.hardware_signal}
            responseTimeMs={inspectionResult.response_time_ms}
          />
        </div>
      )}

      {/* Main Inspection Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Part & Machine Configuration */}
        <div
          className="bg-white border border-[#E2E8F0] rounded-[12px] p-6"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="flex items-center space-x-2.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-5 border-b border-[#E2E8F0] pb-3">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
              1
            </span>
            <span>Target Component & Inspection Station</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workpiece Part Profile
              </label>
              <select
                value={selectedPartId}
                onChange={(e) => handlePartChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition-colors"
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name} ({p.material})
                  </option>
                ))}
              </select>
              {selectedPart && (
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  Tolerance: L ±{selectedPart.tolerances?.length}mm · W ±
                  {selectedPart.tolerances?.width}mm · H ±{selectedPart.tolerances?.height}mm
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inspection Machine Cell
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition-colors"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name} [{m.status}]
                  </option>
                ))}
              </select>
              {selectedMachine && (
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  Station: {selectedMachine.station} · Protocol: {selectedMachine.protocol}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Multi-Modal Inspection Input */}
        <div
          className="bg-white border border-[#E2E8F0] rounded-[12px] p-6"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="flex items-center space-x-2.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-5 border-b border-[#E2E8F0] pb-3">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
              2
            </span>
            <span>Multi-Modal Optical Vision & Laser Metrology Streams</span>
          </div>

          {/* Preset Buttons for Instant Simulation */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
              Rapid Workpiece Scenario Simulation:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => handlePresetSelect('pass')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'pass'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#065F46]">Pass</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Nominal Part</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('fail_crack')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'fail_crack'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#9F1239]">Fail</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Surface Crack</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('fail_burr')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'fail_burr'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#9F1239]">Fail</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Machining Burr</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('fail_porosity')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'fail_porosity'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#9F1239]">Fail</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Casting Void</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('fail_tolerance')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'fail_tolerance'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#9F1239]">Fail</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Out-of-Tol +0.12mm</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('uncertain_borderline')}
                className={`p-2.5 rounded-lg border text-center transition-all duration-150 text-xs ${
                  presetType === 'uncertain_borderline'
                    ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[#92400E]">Uncertain</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Borderline Metrology</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Optical Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Telecentric Camera Optical Stream
              </label>
              <div className="border border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center bg-slate-50 transition-colors relative min-h-[190px] flex flex-col justify-center items-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Workpiece Preview"
                      className="max-h-36 mx-auto rounded-lg border border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 rounded-full text-white text-xs shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 mx-auto mb-2.5 shadow-2xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 mb-1">
                      Live Telecentric Optical Feed Ready
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 max-w-xs">
                      Synthetic workpiece vision stream active, or upload an image file.
                    </p>
                    <label className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-600 text-xs font-semibold cursor-pointer border border-slate-300 inline-flex items-center space-x-1.5 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Sample Workpiece</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Laser Metrology Dimensional Inputs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Laser Metrology Readings (mm)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPart) populateDefaultNominals(selectedPart);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Nominals</span>
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Length (X-Axis):</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Nominal: {selectedPart?.nominal_dimensions?.length ?? 150} ±
                      {selectedPart?.tolerances?.length ?? 0.05} mm
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Width (Y-Axis):</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Nominal: {selectedPart?.nominal_dimensions?.width ?? 80} ±
                      {selectedPart?.tolerances?.width ?? 0.05} mm
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Height (Z-Axis Profilometer):</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Nominal: {selectedPart?.nominal_dimensions?.height ?? 45} ±
                      {selectedPart?.tolerances?.height ?? 0.08} mm
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Trigger Execution Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={executing}
            className="w-full sm:w-auto py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>
              {executing
                ? 'Processing Optical CV & Arming Interlock...'
                : 'Execute Multi-Modal AI Inspection'}
            </span>
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
};
