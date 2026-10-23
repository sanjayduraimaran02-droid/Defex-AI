import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point3D } from '../../types/metrology';
import { Rotate3d, ZoomIn, ZoomOut, Eye, Layers, Grid } from 'lucide-react';

interface PointcloudViewerProps {
  points: Point3D[];
  isScanning?: boolean;
  scanProgress?: number; // 0 to 100
  title?: string;
  className?: string;
}

type ViewMode = 'POINT_CLOUD' | 'MESH' | 'WIREFRAME';

export const PointcloudViewer: React.FC<PointcloudViewerProps> = ({
  points,
  isScanning = false,
  scanProgress = 100,
  title = '3D Laser Point Cloud',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('POINT_CLOUD');
  const [rotation, setRotation] = useState({ pitch: 0.35, yaw: 0.85 });
  const [zoom, setZoom] = useState<number>(1.85);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Mouse handlers for rotate
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setIsAutoRotate(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      pitch: Math.max(-1.4, Math.min(1.4, prev.pitch + dy * 0.008)),
      yaw: prev.yaw + dx * 0.008,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.6, Math.min(4.5, prev * factor)));
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setIsAutoRotate(false);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotation((prev) => ({
      pitch: Math.max(-1.4, Math.min(1.4, prev.pitch + dy * 0.008)),
      yaw: prev.yaw + dx * 0.008,
    }));
  };

  // Render 3D Canvas
  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Deep modern dark blueprint / metrology background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0F172A');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Coordinate grid planes in background
    ctx.save();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 0.5;
    const cx = width / 2;
    const cy = height / 2;

    // 3D Rotation trigonometry
    const cosYaw = Math.cos(rotation.yaw);
    const sinYaw = Math.sin(rotation.yaw);
    const cosPitch = Math.cos(rotation.pitch);
    const sinPitch = Math.sin(rotation.pitch);

    // Project 3D point to 2D
    const project = (x: number, y: number, z: number) => {
      // Rotate Yaw around Y
      const x1 = x * cosYaw - z * sinYaw;
      const z1 = x * sinYaw + z * cosYaw;

      // Rotate Pitch around X
      const y2 = y * cosPitch - z1 * sinPitch;
      const z2 = y * sinPitch + z1 * cosPitch;

      // Perspective projection
      const cameraDistance = 320;
      const perspective = cameraDistance / (cameraDistance + z2 * 0.8);
      const scale = zoom * perspective;

      return {
        screenX: cx + x1 * scale,
        screenY: cy + y2 * scale,
        depth: z2,
      };
    };

    // Draw reference datum floor grid
    const gridSize = 80;
    const gridStep = 20;
    const yFloor = 40;
    ctx.beginPath();
    for (let g = -gridSize; g <= gridSize; g += gridStep) {
      const p1 = project(g, yFloor, -gridSize);
      const p2 = project(g, yFloor, gridSize);
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);

      const p3 = project(-gridSize, yFloor, g);
      const p4 = project(gridSize, yFloor, g);
      ctx.moveTo(p3.screenX, p3.screenY);
      ctx.lineTo(p4.screenX, p4.screenY);
    }
    ctx.stroke();

    // Draw XYZ coordinate axes
    const origin = project(0, 0, 0);
    const axisX = project(50, 0, 0);
    const axisY = project(0, -50, 0);
    const axisZ = project(0, 0, 50);

    // X Axis (Red)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(origin.screenX, origin.screenY);
    ctx.lineTo(axisX.screenX, axisX.screenY);
    ctx.stroke();

    // Y Axis (Green)
    ctx.strokeStyle = '#22C55E';
    ctx.beginPath();
    ctx.moveTo(origin.screenX, origin.screenY);
    ctx.lineTo(axisY.screenX, axisY.screenY);
    ctx.stroke();

    // Z Axis (Blue)
    ctx.strokeStyle = '#3B82F6';
    ctx.beginPath();
    ctx.moveTo(origin.screenX, origin.screenY);
    ctx.lineTo(axisZ.screenX, axisZ.screenY);
    ctx.stroke();

    // Visible points based on scan progress
    const activeCount = Math.floor(points.length * (scanProgress / 100));
    const renderPoints = points.slice(0, activeCount);

    if (viewMode === 'POINT_CLOUD') {
      // Point Cloud rendering
      for (let i = 0; i < renderPoints.length; i += 2) {
        const pt = renderPoints[i];
        const proj = project(pt.x, pt.y, pt.z);

        // Color coding based on metrological tolerance deviation
        let color = '#22C55E'; // green: <= 0.02mm
        let radius = 1.2;

        if (pt.status === 'FAIL' || Math.abs(pt.deviation) > 0.045) {
          color = '#EF4444'; // red: out of tolerance
          radius = 2.0;
        } else if (pt.status === 'WARN' || Math.abs(pt.deviation) > 0.02) {
          color = '#EAB308'; // yellow: warning
          radius = 1.5;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (viewMode === 'WIREFRAME') {
      // Wireframe contour traces
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();

      const step = 24;
      for (let i = 0; i < renderPoints.length; i += step) {
        const pt = renderPoints[i];
        const proj = project(pt.x, pt.y, pt.z);
        if (i === 0) {
          ctx.moveTo(proj.screenX, proj.screenY);
        } else {
          ctx.lineTo(proj.screenX, proj.screenY);
        }
      }
      ctx.stroke();

      // Highlight deviation peaks
      renderPoints
        .filter((p) => p.status === 'FAIL')
        .forEach((pt) => {
          const proj = project(pt.x, pt.y, pt.z);
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(proj.screenX, proj.screenY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
    } else if (viewMode === 'MESH') {
      // Shaded Surface Mesh representation
      for (let i = 0; i < renderPoints.length - 12; i += 12) {
        const p1 = project(renderPoints[i].x, renderPoints[i].y, renderPoints[i].z);
        const p2 = project(
          renderPoints[i + 4].x,
          renderPoints[i + 4].y,
          renderPoints[i + 4].z
        );
        const p3 = project(
          renderPoints[i + 8].x,
          renderPoints[i + 8].y,
          renderPoints[i + 8].z
        );

        const dev = renderPoints[i].deviation;
        ctx.fillStyle =
          Math.abs(dev) > 0.045
            ? 'rgba(239, 68, 68, 0.45)'
            : Math.abs(dev) > 0.02
            ? 'rgba(234, 179, 8, 0.45)'
            : 'rgba(34, 197, 94, 0.4)';

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.lineTo(p3.screenX, p3.screenY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Laser scanning plane indicator during scan
    if (isScanning && scanProgress < 100) {
      const scanZ = -60 + (scanProgress / 100) * 120;
      const corner1 = project(-35, -35, scanZ);
      const corner2 = project(35, -35, scanZ);
      const corner3 = project(35, 35, scanZ);
      const corner4 = project(-35, 35, scanZ);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(corner1.screenX, corner1.screenY);
      ctx.lineTo(corner2.screenX, corner2.screenY);
      ctx.lineTo(corner3.screenX, corner3.screenY);
      ctx.lineTo(corner4.screenX, corner4.screenY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [points, scanProgress, isScanning, rotation, zoom, viewMode]);

  // Auto-rotate animation loop
  useEffect(() => {
    const loop = () => {
      if (isAutoRotate && !isDragging) {
        setRotation((prev) => ({
          ...prev,
          yaw: prev.yaw + 0.005,
        }));
      }
      renderScene();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoRotate, isDragging, renderScene]);

  return (
    <div className={`relative bg-[#0F172A] rounded-[10px] overflow-hidden border border-slate-800 ${className}`}>
      {/* Top Header Controls Overlay */}
      <div className="absolute top-2.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
            {title}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800">
            {points.length.toLocaleString()} pts
          </span>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center space-x-1 pointer-events-auto bg-slate-900/90 p-0.5 rounded-[6px] border border-slate-700">
          {(['POINT_CLOUD', 'MESH', 'WIREFRAME'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'POINT_CLOUD' ? 'Points' : mode === 'MESH' ? 'Mesh' : 'Wire'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
        className="w-full h-[260px] cursor-grab active:cursor-grabbing block"
      />

      {/* Bottom Floating Legend & Tools Overlay */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-[10px]">
        {/* Tolerance Color Bar */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700 backdrop-blur-xs">
          <span className="text-slate-400 text-[9px] uppercase font-mono">Deviation:</span>
          <div className="flex items-center space-x-1 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-emerald-300">≤0.02</span>
            <span className="w-2 h-2 rounded-full bg-[#EAB308] ml-1.5" />
            <span className="text-amber-300">≤0.04</span>
            <span className="w-2 h-2 rounded-full bg-[#EF4444] ml-1.5" />
            <span className="text-rose-300">&gt;0.04</span>
          </div>
        </div>

        {/* Interaction controls */}
        <div className="flex items-center space-x-1 pointer-events-auto bg-slate-900/80 p-1 rounded border border-slate-700 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.0, z * 1.2))}
            title="Zoom In"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, z * 0.8))}
            title="Zoom Out"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title="Toggle Auto Rotate"
            className={`p-1 rounded ${
              isAutoRotate ? 'text-blue-400 bg-blue-950/60' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRotation({ pitch: 0.35, yaw: 0.85 });
              setZoom(1.85);
            }}
            title="Reset View"
            className="px-1.5 py-0.5 text-[9px] font-mono text-slate-300 hover:bg-slate-800 rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
