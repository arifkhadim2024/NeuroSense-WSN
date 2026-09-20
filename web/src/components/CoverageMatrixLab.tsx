import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, CheckCircle2, AlertTriangle, 
  Split, Grid, Box
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';

export const CoverageMatrixLab: React.FC = () => {
  const { 
    nodes, 
    activeScenario, 
    coverageMatrixResult,
    selectedNode,
    setSelectedNode,
    hoveredNode,
    setHoveredNode,
    telemetry
  } = useWSNSimulation();

  const [viewMode, setViewMode] = useState<'3d_field' | 'matrix' | 'both'>('both');
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [selectedNodeRow, setSelectedNodeRow] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;
  const Rs = activeScenario.sensingRadius || 19;

  const {
    samplePoints,
    pointCoverageCount,
    totalCoveredPoints,
    totalPoints,
    coveragePercentage,
    overlapPercentage,
    criticalNodeIds,
    redundantNodeIds
  } = coverageMatrixResult;

  // Active nodes
  const activeNodes = nodes.filter((n) => n.isAlive && n.final_state === 'ACTIVE');

  // Draw 2D Discretized Point-Grid Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / W;
    const scaleY = height / H;

    ctx.clearRect(0, 0, width, height);

    // Deep midnight canvas background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    // Grid coordinates
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

    // Draw discretized sample grid cells
    samplePoints.forEach((pt, idx) => {
      const px = pt.x * scaleX;
      const py = (H - pt.y) * scaleY;
      const count = pointCoverageCount[idx];
      const isHovered = hoveredCellIndex === idx;

      if (count === 0) {
        // Uncovered Blindspot
        ctx.fillStyle = isHovered ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(px - 4, py - 4, 8, 8);
      } else if (count === 1) {
        // Uniquely covered point (Critical)
        ctx.fillStyle = isHovered ? 'rgba(0, 229, 255, 0.9)' : 'rgba(0, 229, 255, 0.45)';
        ctx.fillRect(px - 4, py - 4, 8, 8);
      } else {
        // Redundant Multi-coverage (k >= 2)
        ctx.fillStyle = isHovered ? 'rgba(168, 85, 247, 0.9)' : 'rgba(139, 92, 246, 0.55)';
        ctx.fillRect(px - 4, py - 4, 8, 8);
      }
    });

    // If a node is selected/hovered, highlight its specific covered region
    const targetNodeId = hoveredNode?.node_id ?? selectedNode?.node_id ?? selectedNodeRow;
    if (targetNodeId !== null && targetNodeId !== undefined) {
      const targetNode = nodes.find(n => n.node_id === targetNodeId);
      if (targetNode) {
        const nx = targetNode.x * scaleX;
        const ny = (H - targetNode.y) * scaleY;
        const nRs = Rs * scaleX;

        // Animated Coverage Glow Beam
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nx, ny, nRs, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.fill();

        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw active sensor points
    activeNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      const isCritical = criticalNodeIds.includes(node.node_id);

      ctx.fillStyle = isCritical ? '#00E5FF' : '#8B5CF6';
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [samplePoints, pointCoverageCount, activeNodes, criticalNodeIds, hoveredCellIndex, hoveredNode, selectedNode, selectedNodeRow, Rs, W, H]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const realX = (px / rect.width) * W;
    const realY = H - (py / rect.height) * H;

    let closestIdx = 0;
    let minD = Infinity;

    samplePoints.forEach((pt, idx) => {
      const d = (pt.x - realX) ** 2 + (pt.y - realY) ** 2;
      if (d < minD) {
        minD = d;
        closestIdx = idx;
      }
    });

    setHoveredCellIndex(closestIdx);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              Vectorized Coverage Matrix Representation
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
              Matrix C ∈ &#123;0,1&#125;<sup>N×M</sup>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Mathematical mapping: Sensor nodes N<sub>i</sub> &rarr; Coverage Vectors <strong>V</strong><sub>i</sub> &rarr; Discretized Grid Points &rarr; Covered Territory.
          </p>
        </div>

        {/* 3 View Modes: 3D Field | Coverage Matrix | Both */}
        <div className="flex items-center bg-[#070B14] p-1 rounded-2xl border border-[#1C3150]">
          <button
            onClick={() => { soundFX.playClickSound(); setViewMode('3d_field'); }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
              viewMode === '3d_field'
                ? 'bg-cyan-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Field</span>
          </button>

          <button
            onClick={() => { soundFX.playClickSound(); setViewMode('matrix'); }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-cyan-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Matrix Table</span>
          </button>

          <button
            onClick={() => { soundFX.playClickSound(); setViewMode('both'); }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'both'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Both (Dual View)</span>
          </button>
        </div>
      </div>

      {/* Analytical KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-cyan-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Total Coverage</span>
          <span className="text-xl font-black text-cyan-400">{coveragePercentage}%</span>
          <span className="text-[10px] text-slate-400 block">{totalCoveredPoints} / {totalPoints} cells covered</span>
        </div>

        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-rose-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Uncovered Blindspots</span>
          <span className="text-xl font-black text-rose-400">{(100 - coveragePercentage).toFixed(2)}%</span>
          <span className="text-[10px] text-slate-400 block">{totalPoints - totalCoveredPoints} cells blind</span>
        </div>

        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-purple-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Overlap Redundancy</span>
          <span className="text-xl font-black text-purple-400">{overlapPercentage}%</span>
          <span className="text-[10px] text-slate-400 block">k &ge; 2 Multiplicity</span>
        </div>

        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-emerald-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Critical Nodes</span>
          <span className="text-xl font-black text-emerald-400">{criticalNodeIds.length}</span>
          <span className="text-[10px] text-slate-400 block">Unique coverage key</span>
        </div>

        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-amber-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Redundant Nodes</span>
          <span className="text-xl font-black text-amber-400">{redundantNodeIds.length}</span>
          <span className="text-[10px] text-slate-400 block">Sleep candidates</span>
        </div>

        <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-blue-500/20 shadow-md">
          <span className="text-[10px] uppercase text-slate-400 block font-bold">Active vs Sleep</span>
          <span className="text-xl font-black text-blue-400">{telemetry.activeNodes} / {telemetry.sleepingNodes}</span>
          <span className="text-[10px] text-slate-400 block">ANN Optimized</span>
        </div>
      </div>

      {/* Main Dual Showcase (Canvas Map + Matrix Table) */}
      <div className={`grid grid-cols-1 ${viewMode === 'both' ? 'lg:grid-cols-12 gap-6' : 'gap-6'}`}>
        
        {/* Left Column: Discretized Spatial Grid Canvas */}
        {(viewMode === '3d_field' || viewMode === 'both') && (
          <div className={viewMode === 'both' ? 'lg:col-span-6 space-y-3' : 'w-full space-y-3'}>
            <TiltCard3D 
              intensity={4}
              className="lab-card rounded-3xl p-4 border border-[#1C3150] bg-[#070B14] shadow-2xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
                <div className="flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs uppercase">
                    Discretized Point-Grid Map (M = 400 Cells)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Rs = {Rs}m • Field: {W}m × {H}m
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-[#1C3150]">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={380}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoveredCellIndex(null)}
                  className="w-full h-auto block cursor-pointer"
                />
              </div>

              {/* Grid Legend */}
              <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 text-center">
                <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                  Unique (k = 1)
                </div>
                <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  Overlap (k &ge; 2)
                </div>
                <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                  Blindspot (k = 0)
                </div>
              </div>
            </TiltCard3D>
          </div>
        )}

        {/* Right Column: Interactive Vectorized Matrix Table */}
        {(viewMode === 'matrix' || viewMode === 'both') && (
          <div className={viewMode === 'both' ? 'lg:col-span-6 space-y-3' : 'w-full space-y-3'}>
            <TiltCard3D 
              intensity={4}
              className="lab-card rounded-3xl p-4 border border-[#1C3150] bg-[#0D1626]/95 backdrop-blur-xl shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs uppercase">
                    Node Coverage Vectors Matrix Table
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Hover row to highlight in 3D
                </span>
              </div>

              {/* Matrix Scrollable Table Container */}
              <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-[#1C3150] bg-[#070B14]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="sticky top-0 bg-[#0B1220] border-b border-[#1C3150] text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Node ID</th>
                      <th className="p-2.5">Coords</th>
                      <th className="p-2.5">State</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Covered Cells</th>
                      <th className="p-2.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C3150]/60">
                    {nodes.slice(0, 30).map((node) => {
                      const isCritical = criticalNodeIds.includes(node.node_id);
                      const isRedundant = redundantNodeIds.includes(node.node_id);
                      const isSelected = selectedNodeRow === node.node_id || selectedNode?.node_id === node.node_id || hoveredNode?.node_id === node.node_id;

                      return (
                        <tr
                          key={node.node_id}
                          onMouseEnter={() => {
                            setSelectedNodeRow(node.node_id);
                            setHoveredNode(node);
                          }}
                          onMouseLeave={() => {
                            setSelectedNodeRow(null);
                            setHoveredNode(null);
                          }}
                          onClick={() => {
                            soundFX.playClickSound();
                            setSelectedNode(node);
                          }}
                          className={`transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-500/20 text-white' 
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 font-bold text-cyan-400">
                            N{node.node_id}
                          </td>
                          <td className="p-2.5">
                            ({node.x.toFixed(0)}, {node.y.toFixed(0)})
                          </td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              node.final_state === 'ACTIVE' 
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}>
                              {node.final_state}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {isCritical ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Critical
                              </span>
                            ) : isRedundant ? (
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Redundant
                              </span>
                            ) : (
                              <span className="text-slate-400">Standard</span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-cyan-300">
                            {node.final_state === 'ACTIVE' ? Math.floor(Math.PI * (Rs ** 2) / 25) : 0} pts
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-400 uppercase">
                            {node.node_type}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TiltCard3D>
          </div>
        )}

      </div>
    </div>
  );
};
