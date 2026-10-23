import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Boxes,
  Ruler,
} from 'lucide-react';
import { api } from '../api/client';
import { Part } from '../types';

export const PartsCatalog: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [defectClassesStr, setDefectClassesStr] = useState('crack, porosity, scratch, dent, burr');
  const [cadRef, setCadRef] = useState('');

  // Nominals & Tolerances
  const [nominalLength, setNominalLength] = useState('150.0');
  const [nominalWidth, setNominalWidth] = useState('80.0');
  const [nominalHeight, setNominalHeight] = useState('45.0');
  const [tolLength, setTolLength] = useState('0.05');
  const [tolWidth, setTolWidth] = useState('0.05');
  const [tolHeight, setTolHeight] = useState('0.08');

  const [error, setError] = useState<string | null>(null);

  const loadParts = useCallback(async () => {
    try {
      const data = await api.parts.list();
      setParts(data);
    } catch (err) {
      console.error('Failed to load parts:', err);
    }
  }, []);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const openAddModal = () => {
    setEditingPart(null);
    setCode('PRT-VAL-99');
    setName('Precision Pressure Relief Valve');
    setDescription('Forged steel high-pressure safety relief valve core.');
    setMaterial('Stainless Steel 316L');
    setDefectClassesStr('crack, porosity, scratch, burr');
    setCadRef('CAD-VAL-316L-REV2');
    setNominalLength('120.0');
    setNominalWidth('60.0');
    setNominalHeight('40.0');
    setTolLength('0.04');
    setTolWidth('0.04');
    setTolHeight('0.05');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setCode(part.code);
    setName(part.name);
    setDescription(part.description || '');
    setMaterial(part.material || '');
    setDefectClassesStr(part.defect_classes?.join(', ') || '');
    setCadRef(part.cad_reference || '');
    setNominalLength(String(part.nominal_dimensions?.length ?? 100));
    setNominalWidth(String(part.nominal_dimensions?.width ?? 50));
    setNominalHeight(String(part.nominal_dimensions?.height ?? 30));
    setTolLength(String(part.tolerances?.length ?? 0.05));
    setTolWidth(String(part.tolerances?.width ?? 0.05));
    setTolHeight(String(part.tolerances?.height ?? 0.05));
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const defect_classes = defectClassesStr
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      code,
      name,
      description,
      material,
      defect_classes,
      cad_reference: cadRef,
      nominal_dimensions: {
        length: parseFloat(nominalLength) || 100.0,
        width: parseFloat(nominalWidth) || 50.0,
        height: parseFloat(nominalHeight) || 30.0,
        unit: 'mm',
      },
      tolerances: {
        length: parseFloat(tolLength) || 0.05,
        width: parseFloat(tolWidth) || 0.05,
        height: parseFloat(tolHeight) || 0.05,
      },
    };

    try {
      if (editingPart) {
        await api.parts.update(editingPart.id, payload);
      } else {
        await api.parts.create(payload);
      }
      setIsModalOpen(false);
      loadParts();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deactivate this part profile from active production stations?')) {
      await api.parts.delete(id);
      loadParts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Specifications Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Parts & Tolerances Catalog</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Configure nominal dimensional baselines, allowable metrology tolerances, and AI defect classes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(37,99,235,0.2)] flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Part Profile</span>
        </button>
      </div>

      {/* Part Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parts.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mt-0.5">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-blue-600 uppercase">
                      {p.code}
                    </span>
                    <h3 className="text-base font-bold text-[#0F172A] leading-tight mt-0.5">{p.name}</h3>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-2xs"
                    title="Edit Part"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors shadow-2xs"
                    title="Delete Part"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                {p.description || 'Precision industrial component for automated CNC machining and assembly lines.'}
              </p>

              {/* Material & CAD Ref */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase text-[#64748B] block font-semibold">Material</span>
                  <span className="text-slate-800 font-medium">{p.material || 'Alloy'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase text-[#64748B] block font-semibold">CAD Spec</span>
                  <span className="text-slate-800 font-mono text-[11px] font-medium truncate block">{p.cad_reference || 'REV-STD'}</span>
                </div>
              </div>

              {/* Nominal Dimensions & Tolerances */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4">
                <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Ruler className="w-3 h-3 text-blue-600" />
                    <span>Nominal Dimensions & ± Allowable Tolerances</span>
                  </span>
                  <span className="text-slate-500">Unit: mm</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-[#64748B] font-medium">Length</div>
                    <div className="font-bold text-[#0F172A] mt-0.5">{p.nominal_dimensions?.length ?? '--'} mm</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">±{p.tolerances?.length ?? '0.05'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-[#64748B] font-medium">Width</div>
                    <div className="font-bold text-[#0F172A] mt-0.5">{p.nominal_dimensions?.width ?? '--'} mm</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">±{p.tolerances?.width ?? '0.05'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-[#64748B] font-medium">Height</div>
                    <div className="font-bold text-[#0F172A] mt-0.5">{p.nominal_dimensions?.height ?? '--'} mm</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">±{p.tolerances?.height ?? '0.08'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Defect Classes Tag Cloud */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                Target Defect Classes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {p.defect_classes?.map((d) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-[#E2E8F0] rounded-[12px] w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-800 p-1 rounded-[8px] hover:bg-slate-100 transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#0F172A] mb-4">
              {editingPart ? `Edit Part: ${editingPart.code}` : 'Add New Part Profile'}
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Part Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-slate-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Part Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-800 block mb-2 text-xs">
                  Nominal Dimensions & ± Tolerances (mm)
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] text-slate-600 font-semibold block">Length (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nominalLength}
                      onChange={(e) => setNominalLength(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                    <label className="text-[10px] text-emerald-700 mt-2 block font-semibold">± Tolerance</label>
                    <input
                      type="number"
                      step="0.001"
                      value={tolLength}
                      onChange={(e) => setTolLength(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] text-slate-600 font-semibold block">Width (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nominalWidth}
                      onChange={(e) => setNominalWidth(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                    <label className="text-[10px] text-emerald-700 mt-2 block font-semibold">± Tolerance</label>
                    <input
                      type="number"
                      step="0.001"
                      value={tolWidth}
                      onChange={(e) => setTolWidth(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] text-slate-600 font-semibold block">Height (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nominalHeight}
                      onChange={(e) => setNominalHeight(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                    <label className="text-[10px] text-emerald-700 mt-2 block font-semibold">± Tolerance</label>
                    <input
                      type="number"
                      step="0.001"
                      value={tolHeight}
                      onChange={(e) => setTolHeight(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Defect Classes (comma-separated)
                </label>
                <input
                  type="text"
                  value={defectClassesStr}
                  onChange={(e) => setDefectClassesStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] font-semibold text-xs border border-[#E2E8F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all"
                >
                  Save Part Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
