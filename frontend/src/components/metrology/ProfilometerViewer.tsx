import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SurfaceRoughnessParams, TextureParams } from '../../types/metrology';
import { Activity, BarChart2, Layers } from 'lucide-react';

interface ProfilometerViewerProps {
  profile2D: Array<{ x: number; y: number; mean: number; upperTol: number; lowerTol: number }>;
  topologyGrid3D: number[][];
  roughness: SurfaceRoughnessParams;
  texture: TextureParams;
  raLimit?: number;
  className?: string;
}

type TabMode = '2D_PROFILE' | '3D_SURFACE' | 'ABBOTT_CURVE';

export const ProfilometerViewer: React.FC<ProfilometerViewerProps> = ({
  profile2D,
  topologyGrid3D,
  roughness,
  texture,
  raLimit = 1.6,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('2D_PROFILE');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D rotation state for surface map
  const [rotation, setRotation] = useState({ pitch: 0.65, yaw: 0.75 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const isRaPassed = roughness.Ra <= raLimit;

  // Render active visualization onto Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (activeTab === '2D_PROFILE') {
      // 1. Draw 2D Surface Profile Trace
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      const paddingLeft = 36;
      const paddingRight = 16;
      const paddingTop = 24;
      const paddingBottom = 26;
      const graphW = width - paddingLeft - paddingRight;
      const graphH = height - paddingTop - paddingBottom;
      const midY = paddingTop + graphH / 2;

      // Grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 0.5;

      [-2.0, -1.0, 0, 1.0, 2.0].forEach((val) => {
        const y = midY - (val / 3.0) * (graphH / 2);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${val > 0 ? '+' : ''}${val.toFixed(1)}µm`, paddingLeft - 4, y + 3);
      });

      // Spec envelope band (±raLimit)
      const upperY = midY - (raLimit / 3.0) * (graphH / 2);
      const lowerY = midY - (-raLimit / 3.0) * (graphH / 2);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.fillRect(paddingLeft, upperY, graphW, lowerY - upperY);

      // Envelope dashed boundary lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, upperY);
      ctx.lineTo(width - paddingRight, upperY);
      ctx.moveTo(paddingLeft, lowerY);
      ctx.lineTo(width - paddingRight, lowerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mean line (Z = 0)
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, midY);
      ctx.lineTo(width - paddingRight, midY);
      ctx.stroke();

      // Profile trace curve
      if (profile2D.length > 1) {
        ctx.beginPath();
        profile2D.forEach((pt, idx) => {
          const x = paddingLeft + (idx / (profile2D.length - 1)) * graphW;
          const y = midY - (pt.y / 3.0) * (graphH / 2);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        // Fill under profile to mean line
        ctx.save();
        ctx.lineTo(width - paddingRight, midY);
        ctx.lineTo(paddingLeft, midY);
        ctx.closePath();
        ctx.fillStyle = isRaPassed ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
        ctx.restore();

        // Stroke line
        ctx.strokeStyle = isRaPassed ? '#22C55E' : '#EF4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mark highest peak (Rp) and deepest valley (Rv)
        let maxPeak = { x: 0, y: -999 };
        let minValley = { x: 0, y: 999 };
        profile2D.forEach((pt, idx) => {
          if (pt.y > maxPeak.y) {
            maxPeak = { x: paddingLeft + (idx / (profile2D.length - 1)) * graphW, y: pt.y };
          }
          if (pt.y < minValley.y) {
            minValley = { x: paddingLeft + (idx / (profile2D.length - 1)) * graphW, y: pt.y };
          }
        });

        const peakScreenY = midY - (maxPeak.y / 3.0) * (graphH / 2);
        const valleyScreenY = midY - (minValley.y / 3.0) * (graphH / 2);

        // Peak dot
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(maxPeak.x, peakScreenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '9px monospace';
        ctx.fillText(`Rp ${roughness.Rp.toFixed(2)}µm`, maxPeak.x + 4, peakScreenY - 4);

        // Valley dot
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(minValley.x, valleyScreenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Rv ${roughness.Rv.toFixed(2)}µm`, minValley.x + 4, valleyScreenY + 11);
      }

      // X-Axis labels (0mm to 10mm)
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText('0.0mm', paddingLeft, height - 8);
      ctx.fillText('5.0mm', paddingLeft + graphW / 2, height - 8);
      ctx.fillText('10.0mm (Trace Length)', width - paddingRight, height - 8);

    } else if (activeTab === '3D_SURFACE') {
      // 2. Draw 3D Isometric Surface Topology Map with elevation color
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 0, width, height);

      const rows = topologyGrid3D.length;
      const cols = topologyGrid3D[0]?.length || 0;
      if (rows === 0 || cols === 0) return;

      const cosYaw = Math.cos(rotation.yaw);
      const sinYaw = Math.sin(rotation.yaw);
      const cosPitch = Math.cos(rotation.pitch);
      const sinPitch = Math.sin(rotation.pitch);

      const cx = width / 2;
      const cy = height / 2 + 10;
      const scale = 3.6;

      const project3D = (x: number, y: number, z: number) => {
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = x * sinYaw + z * cosYaw;
        const y2 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch;
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          depth: z2,
        };
      };

      // Elevation false-color palette function: Blue (valleys) -> Cyan -> Green (mean) -> Yellow -> Red (peaks)
      const getColor = (elev: number) => {
        const norm = Math.max(0, Math.min(1, (elev + 2.0) / 4.0));
        if (norm < 0.25) return '#2563EB'; // Deep Blue
        if (norm < 0.5) return '#06B6D4'; // Cyan
        if (norm < 0.75) return '#22C55E'; // Green
        if (norm < 0.9) return '#EAB308'; // Yellow
        return '#EF4444'; // Red
      };

      // Draw elevation grid polygons (back to front sorting by row+col)
      const halfR = rows / 2;
      const halfC = cols / 2;
      const spacing = 2.4;

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const elev00 = topologyGrid3D[r][c];
          const elev10 = topologyGrid3D[r + 1][c];
          const elev11 = topologyGrid3D[r + 1][c + 1];
          const elev01 = topologyGrid3D[r][c + 1];

          const p00 = project3D((c - halfC) * spacing, -elev00 * 6, (r - halfR) * spacing);
          const p10 = project3D((c - halfC) * spacing, -elev10 * 6, (r + 1 - halfR) * spacing);
          const p11 = project3D((c + 1 - halfC) * spacing, -elev11 * 6, (r + 1 - halfR) * spacing);
          const p01 = project3D((c + 1 - halfC) * spacing, -elev01 * 6, (r - halfR) * spacing);

          const avgElev = (elev00 + elev10 + elev11 + elev01) / 4;
          ctx.fillStyle = getColor(avgElev);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.lineWidth = 0.5;

          ctx.beginPath();
          ctx.moveTo(p00.sx, p00.sy);
          ctx.lineTo(p10.sx, p10.sy);
          ctx.lineTo(p11.sx, p11.sy);
          ctx.lineTo(p01.sx, p01.sy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // 3D Legend Bar
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Confocal Micro-Topography Map (10mm x 10mm)', 10, 16);

    } else if (activeTab === 'ABBOTT_CURVE') {
      // 3. Draw Abbott-Firestone Bearing Area Ratio Curve
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      const paddingLeft = 36;
      const paddingRight = 20;
      const paddingTop = 24;
      const paddingBottom = 26;
      const graphW = width - paddingLeft - paddingRight;
      const graphH = height - paddingTop - paddingBottom;

      // Grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 0.5;
      [0, 25, 50, 75, 100].forEach((pct) => {
        const x = paddingLeft + (pct / 100) * graphW;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, height - paddingBottom);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pct}%`, x, height - 10);
      });

      // Draw Abbott S-Curve
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const mr = i / 100; // Material ratio 0 to 1
        // Empirical Abbott curve formula
        const depthNorm = Math.pow(mr, 0.55);
        const x = paddingLeft + mr * graphW;
        const y = paddingTop + depthNorm * graphH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Fill
      ctx.lineTo(width - paddingRight, height - paddingBottom);
      ctx.lineTo(paddingLeft, height - paddingBottom);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fill();

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Zones: Rpk (Peaks), Rk (Core), Rvk (Valleys)
      const mr1X = paddingLeft + (texture.bearingRatio.mr1 / 100) * graphW;
      const mr2X = paddingLeft + (texture.bearingRatio.mr2 / 100) * graphW;

      ctx.strokeStyle = '#EAB308';
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(mr1X, paddingTop);
      ctx.lineTo(mr1X, height - paddingBottom);
      ctx.moveTo(mr2X, paddingTop);
      ctx.lineTo(mr2X, height - paddingBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Rpk: ${texture.bearingRatio.Rpk.toFixed(2)}µm`, paddingLeft + 6, paddingTop + 14);
      ctx.fillText(`Rk:  ${texture.bearingRatio.Rk.toFixed(2)}µm`, mr1X + 6, paddingTop + 14);
      ctx.fillText(`Rvk: ${texture.bearingRatio.Rvk.toFixed(2)}µm`, mr2X + 6, paddingTop + 14);
    }
  }, [activeTab, profile2D, topologyGrid3D, roughness, texture, raLimit, isRaPassed, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Drag interaction for 3D Surface
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== '3D_SURFACE') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTab !== '3D_SURFACE') return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setRotation((prev) => ({
      pitch: Math.max(0.1, Math.min(1.4, prev.pitch + dy * 0.01)),
      yaw: prev.yaw + dx * 0.01,
    }));
  };

  return (
    <div className={`bg-[#0F172A] rounded-[10px] overflow-hidden border border-slate-800 flex flex-col ${className}`}>
      {/* Tab Switcher */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('2D_PROFILE')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === '2D_PROFILE'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>2D Trace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('3D_SURFACE')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === '3D_SURFACE'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>3D Topology</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ABBOTT_CURVE')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'ABBOTT_CURVE'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Abbott Curve</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400">
          Ra: <span className={isRaPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{roughness.Ra.toFixed(2)}µm</span> / ≤{raLimit}µm
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex-1 min-h-[220px]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`w-full h-[220px] block ${activeTab === '3D_SURFACE' ? 'cursor-grab active:cursor-grabbing' : ''}`}
        />
      </div>
    </div>
  );
};
