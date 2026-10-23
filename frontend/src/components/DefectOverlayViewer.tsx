import React, { useState } from 'react';
import { Eye, Layers, ZoomIn, Crosshair, CheckCircle2 } from 'lucide-react';
import { DefectItem } from '../types';

interface DefectOverlayViewerProps {
  rawImageUrl?: string | null;
  annotatedImageUrl?: string | null;
  defects: DefectItem[];
  partCode?: string;
}

export const DefectOverlayViewer: React.FC<DefectOverlayViewerProps> = ({
  rawImageUrl,
  annotatedImageUrl,
  defects = [],
  partCode = 'PART',
}) => {
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [selectedDefectIdx, setSelectedDefectIdx] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Active image source with relative path support for static hosting
  const rawSrc = showAnnotated && annotatedImageUrl ? annotatedImageUrl : rawImageUrl || annotatedImageUrl;
  const currentImage = rawSrc && rawSrc.startsWith('/uploads/') ? '.' + rawSrc : rawSrc;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      {/* Control Toolbar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">
            Optical Feed <span className="text-slate-400">·</span> <span className="font-mono text-blue-600 font-bold">{partCode}</span> <span className="text-slate-400">·</span> Telecentric 50mm
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAnnotated(!showAnnotated)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1.5 ${
              showAnnotated
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAnnotated ? 'HUD Overlay: On' : 'Raw Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-100 flex items-center space-x-1 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{isZoomed ? 'Reset Scale' : '1.5x Zoom'}</span>
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative bg-[#0F172A] flex items-center justify-center p-3 min-h-[380px] overflow-hidden">
        {currentImage ? (
          <div
            className={`relative transition-transform duration-200 ${
              isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={currentImage}
              alt="Industrial Workpiece Inspection"
              className="max-h-[460px] w-auto object-contain rounded-lg border border-slate-700 shadow-md"
            />

            {/* Corner Alignment Crosshairs */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/80 backdrop-blur-xs">
              CAM_1: 4096×3072 @ 60FPS
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/80 backdrop-blur-xs">
              Grid: 10.00 mm
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Eye className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-xs text-slate-400">No inspection frame loaded</p>
          </div>
        )}
      </div>

      {/* Defect Bounding Box Coordinate Cards */}
      <div className="p-4 bg-white border-t border-[#E2E8F0]">
        <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Detected Visual Defects ({defects.length})
          </span>
          <span className="text-[11px] text-slate-400">Select anomaly to highlight coordinates</span>
        </div>

        {defects.length === 0 ? (
          <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs flex items-center font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] mr-2 flex-shrink-0" />
            Zero surface flaws or structural fractures identified. Workpiece conforms to specification.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {defects.map((d, idx) => {
              const isSelected = selectedDefectIdx === idx;
              const isCrit = d.severity === 'CRITICAL';
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDefectIdx(isSelected ? null : idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-xs'
                      : isCrit
                      ? 'bg-[#FFF1F2] border-[#FECDD3] hover:border-rose-400'
                      : 'bg-[#FFFBEB] border-[#FDE68A] hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCrit ? 'bg-[#F43F5E]' : 'bg-[#F59E0B]'
                        }`}
                      />
                      <span className="font-semibold text-[#0F172A] capitalize">{d.class}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isCrit
                            ? 'bg-[#FFE4E6] text-[#9F1239]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {d.severity.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px]">{(d.confidence * 100).toFixed(0)}% Conf</span>
                  </div>

                  {d.description && (
                    <div className="text-[11px] text-slate-600 mt-1.5 line-clamp-1">{d.description}</div>
                  )}

                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-[#E2E8F0] pt-1.5">
                    <span>
                      BBox: [{d.bbox ? d.bbox.join(', ') : 'N/A'}]
                    </span>
                    <span>{d.area_px ? `${d.area_px} px²` : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
