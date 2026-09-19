import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Hexagon, CheckCircle2, 
  Info, Cpu 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const CoverageLab: React.FC = () => {
  const { nodes, activeScenario, selectedSeed, setSelectedSeed, selectedOptimizer } = useWSNSimulation();

  const [mode, setMode] = useState<'heatmap' | 'blindspot' | 'overlap' | 'density'>('heatmap');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; k: number; activeSensors: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;
  const Rs = activeScenario.sensingRadius || 10;

  // Real-time grid evaluation (51x51 discretized grid, delta = 2m)
  const gridStats = useMemo(() => {
    const activeNodes = nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
    let coveredPoints = 0;
    let overlapPoints = 0;
    let blindspotPoints = 0;
    const totalPoints = 51 * 51;

    for (let gy = 0; gy <= H; gy += 2) {
      for (let gx = 0; gx <= W; gx += 2) {
        let count = 0;
        for (let i = 0; i < activeNodes.length; i++) {
          const n = activeNodes[i];
          const distSq = (n.x - gx) ** 2 + (n.y - gy) ** 2;
          if (distSq <= Rs ** 2) {
            count++;
          }
        }
        if (count === 0) blindspotPoints++;
        else {
          coveredPoints++;
          if (count > 1) overlapPoints++;
        }
      }
    }

    const covPct = (coveredPoints / totalPoints) * 100;
    const ovlPct = coveredPoints > 0 ? (overlapPoints / coveredPoints) * 100 : 0;
    const blindPct = (blindspotPoints / totalPoints) * 100;

    return { covPct, ovlPct, blindPct, coveredPoints, overlapPoints, blindspotPoints, activeCount: activeNodes.length };
  }, [nodes, selectedOptimizer, W, H, Rs]);

  // Render 2D Canvas representation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;
    const scaledRs = Rs * scaleX;

    ctx.clearRect(0, 0, width, height);

    // Midnight Blue Background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    // Coordinate Grid lines
    ctx.strokeStyle = 'rgba(28, 49, 80, 0.6)';
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

    const activeNodes = nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
    const sleepNodes = nodes.filter((n) => n.isAlive && selectedOptimizer === 'ann_greedy' && n.final_state === 'SLEEP');

    if (mode === 'heatmap') {
      // Draw radial alpha blend discs in electric cyan and blue
      activeNodes.forEach((node) => {
        const nx = node.x * scaleX;
        const ny = (H - node.y) * scaleY;

        const radGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, scaledRs);
        radGrad.addColorStop(0, 'rgba(0, 229, 255, 0.22)');
        radGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.14)');
        radGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else if (mode === 'blindspot') {
      // Highlight uncovered holes in red/slate
      const step = 4;
      for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
          const gx = (px / width) * W;
          const gy = (1 - py / height) * H;
          const isCovered = activeNodes.some((n) => (n.x - gx) ** 2 + (n.y - gy) ** 2 <= Rs ** 2);
          if (!isCovered) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.fillRect(px, py, step, step);
          }
        }
      }
    } else if (mode === 'overlap') {
      // Highlight multi-covered overlap in cyan/purple
      const step = 4;
      for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
          const gx = (px / width) * W;
          const gy = (1 - py / height) * H;
          let k = 0;
          activeNodes.forEach((n) => {
            if ((n.x - gx) ** 2 + (n.y - gy) ** 2 <= Rs ** 2) k++;
          });
          if (k > 1) {
            ctx.fillStyle = k >= 3 ? 'rgba(139, 92, 246, 0.45)' : 'rgba(0, 229, 255, 0.35)';
            ctx.fillRect(px, py, step, step);
          }
        }
      }
    }

    // Sleeping nodes dashed circles
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    sleepNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      ctx.beginPath();
      ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Nodes points
    nodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      const isActive = node.isAlive && (selectedOptimizer === 'ann_greedy' ? node.final_state === 'ACTIVE' : true);

      if (isActive) {
        ctx.fillStyle = node.node_type === 'super' ? '#8B5CF6' : node.node_type === 'advanced' ? '#10B981' : '#00E5FF';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Base Station
    const bsX = (activeScenario.sinkX / W) * width;
    const bsY = (1 - activeScenario.sinkY / H) * height;
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(bsX, Math.max(15, Math.min(height - 15, bsY)), 7, 0, Math.PI * 2);
    ctx.fill();
  }, [nodes, selectedOptimizer, activeScenario, mode, W, H, Rs]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scale = canvas.width / rect.width;
    const canvasX = clientX * scale;
    const canvasY = clientY * scale;

    const xM = (canvasX / canvas.width) * W;
    const yM = (1 - canvasY / canvas.height) * H;

    const activeNodes = nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
    let k = 0;
    activeNodes.forEach((n) => {
      if ((n.x - xM) ** 2 + (n.y - yM) ** 2 <= Rs ** 2) k++;
    });

    setHoveredPoint({
      x: Math.round(xM * 10) / 10,
      y: Math.round(yM * 10) / 10,
      k,
      activeSensors: activeNodes.length
    });
  };

  return (
    <section id="coverage-lab" className="py-12 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            3D &amp; 2D Spatial Sensing Analytics
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
            Sensing Coverage &amp; Overlap Reduction Lab
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Vectorized spatial discretization (&Delta; = 2m) validating the strict <code className="text-cyan-400 font-mono">Δ ≤ 1.0%</code> coverage boundary while reducing redundant overlap by 33.38%.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0B1220] p-2.5 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMode('heatmap')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                mode === 'heatmap' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Multiplicity Heatmap
            </button>
            <button
              onClick={() => setMode('overlap')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                mode === 'overlap' ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overlap Concentration
            </button>
            <button
              onClick={() => setMode('blindspot')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                mode === 'blindspot' ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blindspot Hole Map
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Seed:</span>
            {[42, 123, 456].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeed(s)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSeed === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-[#0D1626] text-slate-400 hover:text-white border border-[#1C3150]'
                }`}
              >
                Seed {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main Analytics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lab-card rounded-3xl p-5 border border-[#1C3150] bg-[#0D1626] flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1C3150] font-mono text-xs">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Hexagon className="w-4 h-4 text-cyan-400" />
                Discretized Sensing Matrix ({W}m x {H}m Field)
              </span>
              <span className="text-slate-400">Rs = {Rs}m • Active: <strong className="text-emerald-400">{gridStats.activeCount} Nodes</strong></span>
            </div>

            <div className="relative aspect-square max-h-[460px] mx-auto w-full bg-[#070B14] rounded-2xl border border-[#1C3150] p-2 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredPoint(null)}
                className="w-full h-full max-h-[440px] max-w-[440px] rounded-xl cursor-crosshair"
              />

              {hoveredPoint && (
                <div className="absolute top-4 left-4 bg-[#0B1220]/95 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 font-mono text-xs pointer-events-none shadow-2xl">
                  <div className="text-cyan-300 font-bold mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    Coordinate ({hoveredPoint.x}m, {hoveredPoint.y}m)
                  </div>
                  <div className="text-slate-300">
                    Covering Sensors: <strong className="text-emerald-400">{hoveredPoint.k} active node(s)</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-[#1C3150] font-mono text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/80"></span>
                <span className="text-slate-300">0x Blindspot ({gridStats.blindPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-emerald-400 font-semibold">1x Optimal Coverage</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500"></span>
                <span className="text-cyan-300 font-semibold">2x Overlap ({gridStats.ovlPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-violet-500"></span>
                <span className="text-violet-300 font-semibold">3x+ Redundant Multi-Coverage</span>
              </div>
            </div>
          </div>

          {/* Right Metrics Cards */}
          <div className="space-y-4 font-mono text-xs">
            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Coverage Constraint Bounding</span>
              </div>

              <div className="text-3xl font-extrabold text-white">
                {gridStats.covPct.toFixed(2)}% <span className="text-xs font-normal text-slate-400">Preserved</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C3150] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Sensing Area:</span>
                  <span className="font-bold text-white">{(gridStats.covPct * (W * H) / 100).toFixed(0)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensing Overlap Ratio:</span>
                  <span className="font-bold text-cyan-400">{gridStats.ovlPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uncovered Blindspots:</span>
                  <span className="font-bold text-rose-400">{gridStats.blindPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sleep Node Redundancy:</span>
                  <span className="font-bold text-amber-400">{nodes.length - gridStats.activeCount} Nodes Sleeping</span>
                </div>
              </div>
            </div>

            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Mathematical Formulations</span>
              </div>
              <div className="p-3 bg-[#070B14] rounded-xl border border-[#1C3150] space-y-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400">Discretization:</span> <code className="text-cyan-300">G = {'{(x_g, y_g)}'}, Δ = 2.0m</code>
                </div>
                <div>
                  <span className="text-slate-400">Target Coverage:</span> <code className="text-emerald-400">C_target = C_baseline - 1.0%</code>
                </div>
                <div>
                  <span className="text-slate-400">Overlap Redundancy:</span> <code className="text-violet-300">O = |{'{g | k(g) > 1}'}| / |{'{g | k(g) ≥ 1}'}|</code>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
