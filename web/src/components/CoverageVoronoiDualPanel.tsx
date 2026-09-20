import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Layers, Hexagon } from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { TiltCard3D } from './TiltCard3D';
import { soundFX } from '../utils/soundEffects';
import type { VoronoiDisplayMode, CoverageDisplayMode } from '../types/wsn';

export const CoverageVoronoiDualPanel: React.FC = () => {
  const { 
    nodes, 
    activeClusterHeads, 
    activeScenario, 
    selectedOptimizer, 
    telemetry,
    voronoiPolygons,
    voronoiMode,
    setVoronoiMode,
    coverageMode,
    setCoverageMode,
    setSelectedNode
  } = useWSNSimulation();

  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const voronoiCanvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; k: number } | null>(null);
  const [selectedPolygonNodeId, setSelectedPolygonNodeId] = useState<number | null>(null);

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

    if (coverageMode !== 'off') {
      // Additive radial blend sensing discs (Electric Cyan & Violet)
      ctx.globalCompositeOperation = 'lighter';
      activeNodes.forEach((node) => {
        const nx = node.x * scaleX;
        const ny = (H - node.y) * scaleY;

        let discColorStart = 'rgba(0, 229, 255, 0.28)';
        let discColorMid = 'rgba(59, 130, 246, 0.14)';

        if (coverageMode === 'energy') {
          const eRatio = node.currentEnergy / node.energy;
          if (eRatio > 0.6) {
            discColorStart = 'rgba(16, 185, 129, 0.3)';
            discColorMid = 'rgba(16, 185, 129, 0.12)';
          } else if (eRatio > 0.25) {
            discColorStart = 'rgba(245, 158, 11, 0.3)';
            discColorMid = 'rgba(245, 158, 11, 0.12)';
          } else {
            discColorStart = 'rgba(239, 68, 68, 0.35)';
            discColorMid = 'rgba(239, 68, 68, 0.15)';
          }
        } else if (coverageMode === 'overlap') {
          discColorStart = 'rgba(168, 85, 247, 0.35)';
          discColorMid = 'rgba(139, 92, 246, 0.18)';
        }

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, scaledRs);
        grad.addColorStop(0, discColorStart);
        grad.addColorStop(0.6, discColorMid);
        grad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, scaledRs, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

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

  }, [activeNodes, activeClusterHeads, activeScenario, coverageMode, Rs, W, H]);

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

    if (voronoiMode === 'off') {
      // Simple grid when Voronoi is off
      ctx.fillStyle = '#0F172A';
      ctx.font = '12px monospace';
      ctx.fillText('Voronoi Partitions Disabled', width / 2 - 90, height / 2);
      return;
    }

    const chPoints = activeCHNodes.map((ch) => ({
      id: ch.node_id,
      x: ch.x * scaleX,
      y: (H - ch.y) * scaleY,
      energy: ch.currentEnergy,
      node: ch
    }));

    const colors = [
      'rgba(0, 229, 255, 0.18)',
      'rgba(139, 92, 246, 0.18)',
      'rgba(59, 130, 246, 0.18)',
      'rgba(245, 158, 11, 0.18)',
      'rgba(168, 85, 247, 0.18)',
      'rgba(6, 182, 212, 0.18)'
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

        const targetCH = chPoints[closestIdx];
        const isSelected = selectedPolygonNodeId !== null && targetCH?.id === selectedPolygonNodeId;

        if (isSelected) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
        } else if (voronoiMode === 'energy') {
          const eRatio = targetCH ? targetCH.energy / 0.5 : 1;
          ctx.fillStyle = eRatio > 0.6 ? 'rgba(16, 185, 129, 0.22)' : eRatio > 0.25 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(239, 68, 68, 0.25)';
        } else {
          ctx.fillStyle = colors[closestIdx % colors.length];
        }

        ctx.fillRect(px, py, step, step);
      }
    }

    // Voronoi Cell Boundaries
    voronoiPolygons.forEach((vp) => {
      if (vp.polygon.length >= 3) {
        ctx.strokeStyle = selectedPolygonNodeId === vp.nodeId ? '#00E5FF' : 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = selectedPolygonNodeId === vp.nodeId ? 2 : 1;
        ctx.beginPath();
        vp.polygon.forEach((pt, idx) => {
          const vx = pt[0] * scaleX;
          const vy = (H - pt[1]) * scaleY;
          if (idx === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        ctx.closePath();
        ctx.stroke();
      }
    });

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

  }, [activeNodes, activeCHNodes, selectedPolygonNodeId, voronoiMode, voronoiPolygons, W, H]);

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

  const handleVoronoiClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = voronoiCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const realX = (px / rect.width) * W;
    const realY = H - (py / rect.height) * H;

    let closestNode = activeNodes[0];
    let minD = Infinity;

    activeNodes.forEach((n) => {
      const d = Math.sqrt((n.x - realX) ** 2 + (n.y - realY) ** 2);
      if (d < minD) {
        minD = d;
        closestNode = n;
      }
    });

    if (closestNode) {
      soundFX.playClickSound();
      setSelectedPolygonNodeId(closestNode.node_id);
      setSelectedNode(closestNode);
    }
  };

  const inspectedPolygon = voronoiPolygons.find(vp => vp.nodeId === selectedPolygonNodeId);

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300">
      
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
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Coverage Multiplicity Heatmap
              </h3>
            </div>
            
            {/* Coverage Mode Selectors */}
            <div className="flex items-center bg-[#070B14] p-0.5 rounded-xl border border-[#1C3150]">
              {(['sensing', 'overlap', 'energy', 'off'] as CoverageDisplayMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    soundFX.playClickSound();
                    setCoverageMode(mode);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${
                    coverageMode === mode
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <Hexagon className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Bounded Voronoi Cell Partition
              </h3>
            </div>
            
            {/* Voronoi Mode Selectors */}
            <div className="flex items-center bg-[#070B14] p-0.5 rounded-xl border border-[#1C3150]">
              {(['2d', '3d', 'energy', 'off'] as VoronoiDisplayMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    soundFX.playClickSound();
                    setVoronoiMode(mode);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${
                    voronoiMode === mode
                      ? 'bg-violet-500 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#1C3150] bg-[#070B14]">
            <canvas
              ref={voronoiCanvasRef}
              width={400}
              height={300}
              onClick={handleVoronoiClick}
              className="w-full h-auto block cursor-pointer"
            />
            <div className="absolute bottom-2 right-2 bg-[#0B1220]/90 backdrop-blur-md border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              {activeCHNodes.length} Voronoi Clusters
            </div>

            {/* Clicked Polygon Info Box */}
            {inspectedPolygon && (
              <div className="absolute top-2 left-2 bg-[#0B1220]/95 backdrop-blur-md border border-violet-400/40 text-violet-200 p-2 rounded-xl text-[10px] font-mono shadow-xl space-y-0.5">
                <div className="font-bold text-cyan-300">CELL NODE #{inspectedPolygon.nodeId}</div>
                <div>Area: <strong>{inspectedPolygon.area} m²</strong></div>
                <div>Neighbors: <strong>{inspectedPolygon.neighborIds.length}</strong></div>
              </div>
            )}
          </div>
        </TiltCard3D>

      </div>

    </div>
  );
};


