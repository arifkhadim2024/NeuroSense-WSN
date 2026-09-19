import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Layers, Hexagon } from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { TiltCard3D } from './TiltCard3D';

export const CoverageVoronoiDualPanel: React.FC = () => {
  const { nodes, activeClusterHeads, activeScenario, selectedOptimizer, telemetry } = useWSNSimulation();

  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const voronoiCanvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; k: number } | null>(null);
  const [selectedCH] = useState<number | null>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;
  const Rs = activeScenario.sensingRadius || 19;

  const activeNodes = useMemo(() => {
    return nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
  }, [nodes, selectedOptimizer]);

  const activeCHNodes = useMemo(() => {
    const chs = nodes.filter((n) => n.isAlive && activeClusterHeads.includes(n.node_id));
    return chs.length > 0 ? chs : nodes.filter((n) => n.isAlive).slice(0, 5);
  }, [nodes, activeClusterHeads]);

  // -----------------------------------------------------------------
  // 1. RENDER COVERAGE MULTIPLICITY HEATMAP CANVAS
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;
    const scaledRs = Rs * scaleX;

    ctx.clearRect(0, 0, width, height);

    // Deep midnight field background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    // Fine grid
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, height);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(width, y * scaleY);
      ctx.stroke();
    }

    // Additive radial blend sensing discs (Electric Cyan & Violet)
    ctx.globalCompositeOperation = 'lighter';
    activeNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;

      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, scaledRs);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.28)');
      grad.addColorStop(0.6, 'rgba(59, 130, 246, 0.14)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    // Draw sensor nodes
    activeNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      const isCH = activeClusterHeads.includes(node.node_id);

      ctx.fillStyle = isCH ? '#F59E0B' : '#00E5FF';
      ctx.beginPath();
      ctx.arc(nx, ny, isCH ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (isCH) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Base Station Sink
    const sx = activeScenario.sinkX * scaleX;
    const sy = (H - activeScenario.sinkY) * scaleY;
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(sx, Math.max(10, sy), 5, 0, Math.PI * 2);
    ctx.fill();

  }, [activeNodes, activeClusterHeads, activeScenario, Rs, W, H]);

  // -----------------------------------------------------------------
  // 2. RENDER BOUNDED VORONOI CELL PARTITION CANVAS
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = voronoiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;

    ctx.clearRect(0, 0, width, height);

    // Deep midnight background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    const chPoints = activeCHNodes.map((ch) => ({
      id: ch.node_id,
      x: ch.x * scaleX,
      y: (H - ch.y) * scaleY,
      node: ch
    }));

    const colors = [
      'rgba(0, 229, 255, 0.16)',
      'rgba(139, 92, 246, 0.16)',
      'rgba(59, 130, 246, 0.16)',
      'rgba(245, 158, 11, 0.16)',
      'rgba(168, 85, 247, 0.16)',
      'rgba(6, 182, 212, 0.16)'
    ];

    // Discretized polygonal fill
    const step = 4;
    for (let px = 0; px < width; px += step) {
      for (let py = 0; py < height; py += step) {
        let closestIdx = 0;
        let minD = Infinity;

        chPoints.forEach((ch, idx) => {
          const d = (px - ch.x) ** 2 + (py - ch.y) ** 2;
          if (d < minD) {
            minD = d;
            closestIdx = idx;
          }
        });

        const isSelected = selectedCH !== null && chPoints[closestIdx]?.id === selectedCH;
        ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.35)' : colors[closestIdx % colors.length];
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, height);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(width, y * scaleY);
      ctx.stroke();
    }

    // Connect members to closest CH
    activeNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      let closestCH = chPoints[0];
      let minD = Infinity;

      chPoints.forEach((ch) => {
        const d = (nx - ch.x) ** 2 + (ny - ch.y) ** 2;
        if (d < minD) {
          minD = d;
          closestCH = ch;
        }
      });

      if (closestCH) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(closestCH.x, closestCH.y);
        ctx.stroke();
      }

      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Cluster Head Markers
    chPoints.forEach((ch) => {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    });

  }, [activeNodes, activeCHNodes, selectedCH, W, H]);

  // Heatmap Pointer Hover Calculation
  const handleHeatmapMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const realX = (px / rect.width) * W;
    const realY = H - (py / rect.height) * H;

    let k = 0;
    activeNodes.forEach((n) => {
      const d = Math.sqrt((n.x - realX) ** 2 + (n.y - realY) ** 2);
      if (d <= Rs) k++;
    });

    setHoveredPoint({ x: Math.round(realX * 10) / 10, y: Math.round(realY * 10) / 10, k });
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <span>Vectorized Coverage Matrix &amp; Voronoi Partitions</span>
        </h2>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Real-time analytical evaluation of sensing multiplicity matrices and planar polygonal Voronoi tessellations.
        </p>
      </div>

      {/* Side-by-Side Dual Panels with 3D Tilt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Coverage Multiplicity Heatmap */}
        <TiltCard3D 
          intensity={5}
          playAudioOnHover={true}
          className="lab-card rounded-3xl p-4 sm:p-5 border border-[#1C3150] bg-[#0D1626]/90 shadow-2xl space-y-3 relative group"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Coverage Multiplicity Heatmap
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#070B14] text-cyan-300 font-bold border border-[#1C3150]">
              Grid Resolution: 1.0m
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#1C3150] bg-[#070B14]">
            <canvas
              ref={heatmapCanvasRef}
              width={400}
              height={300}
              onMouseMove={handleHeatmapMove}
              onMouseLeave={() => setHoveredPoint(null)}
              className="w-full h-auto block cursor-crosshair"
            />
            {hoveredPoint && (
              <div className="absolute top-2 left-2 bg-[#0B1220]/90 backdrop-blur-md border border-cyan-400/40 text-cyan-300 px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
                ({hoveredPoint.x}m, {hoveredPoint.y}m) • Degree k = {hoveredPoint.k}
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-[#0B1220]/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              Coverage: {telemetry.currentCoveragePct.toFixed(1)}%
            </div>
          </div>
        </TiltCard3D>

        {/* Right: Bounded Voronoi Cell Partition */}
        <TiltCard3D 
          intensity={5}
          playAudioOnHover={true}
          className="lab-card rounded-3xl p-4 sm:p-5 border border-[#1C3150] bg-[#0D1626]/90 shadow-2xl space-y-3 relative group"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <Hexagon className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Bounded Voronoi Cell Partition
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#070B14] text-violet-300 font-bold border border-[#1C3150]">
              Planar Tessellation
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#1C3150] bg-[#070B14]">
            <canvas
              ref={voronoiCanvasRef}
              width={400}
              height={300}
              className="w-full h-auto block cursor-pointer"
            />
            <div className="absolute bottom-2 right-2 bg-[#0B1220]/90 backdrop-blur-md border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              {activeCHNodes.length} Voronoi Clusters
            </div>
          </div>
        </TiltCard3D>

      </div>

    </div>
  );
};

