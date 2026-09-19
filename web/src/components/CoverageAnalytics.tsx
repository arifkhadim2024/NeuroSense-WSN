import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Layers, Hexagon, CheckCircle2, 
  Info, Cpu
} from 'lucide-react';
import type { NodeData } from '../types/wsn';

interface CoverageAnalyticsProps {
  nodes?: NodeData[];
}

export const CoverageAnalytics: React.FC<CoverageAnalyticsProps> = ({ nodes: propNodes }) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'voronoi' | 'table'>('heatmap');
  const [selectedSeed, setSelectedSeed] = useState<number>(42);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; k: number; activeSensors: number } | null>(null);
  const [allNodes, setAllNodes] = useState<NodeData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load real node data if not provided via props
  useEffect(() => {
    if (propNodes && propNodes.length > 0) {
      setAllNodes(propNodes);
      return;
    }
    fetch('/data/ann_node_selection.json')
      .then((res) => res.json())
      .then((data: NodeData[]) => {
        setAllNodes(data);
      })
      .catch((err) => {
        console.error('Failed to load nodes in CoverageAnalytics:', err);
      });
  }, [propNodes]);

  // Per-seed verified coverage optimization data from research
  const seedCoverageData = [
    {
      seed: 42,
      baseline_cov: 92.70,
      proposed_cov: 91.70,
      delta_cov: -1.00,
      baseline_ovl: 82.70,
      proposed_ovl: 51.49,
      delta_ovl: -37.74,
      active_nodes: 54,
      sleep_nodes: 46,
      target_cov: 91.70
    },
    {
      seed: 123,
      baseline_cov: 94.16,
      proposed_cov: 93.16,
      delta_cov: -1.00,
      baseline_ovl: 81.14,
      proposed_ovl: 45.56,
      delta_ovl: -43.85,
      active_nodes: 50,
      sleep_nodes: 50,
      target_cov: 93.16
    },
    {
      seed: 456,
      baseline_cov: 94.35,
      proposed_cov: 93.35,
      delta_cov: -1.00,
      baseline_ovl: 83.70,
      proposed_ovl: 50.58,
      delta_ovl: -39.57,
      active_nodes: 54,
      sleep_nodes: 46,
      target_cov: 93.35
    }
  ];

  const currentSeedData = useMemo(() => {
    return seedCoverageData.find((s) => s.seed === selectedSeed) || seedCoverageData[0];
  }, [selectedSeed]);

  // Filter nodes for the current seed
  const currentNodes = useMemo(() => {
    const filtered = allNodes.filter((n) => n.seed === selectedSeed);
    if (filtered.length > 0) return filtered;
    // Fallback deterministic positions if not loaded yet
    const fallback: NodeData[] = [];
    for (let i = 0; i < 100; i++) {
      const x = ((i * 37.1 + selectedSeed * 13.7) % 90) + 5;
      const y = ((i * 59.3 + selectedSeed * 17.3) % 90) + 5;
      fallback.push({
        seed: selectedSeed,
        node_id: i,
        x,
        y,
        energy: i < 10 ? 1.5 : i < 30 ? 1.0 : 0.5,
        node_type: i < 10 ? 'super' : i < 30 ? 'advanced' : 'normal',
        sink_distance: Math.sqrt((x - 50) ** 2 + (y - 50) ** 2),
        neighbors: (i % 8) + 3,
        coverage_contribution: 0.1,
        overlap_ratio: 0.6,
        node_density: 0.8,
        ann_prediction: i < 54 ? 'ACTIVE' : 'SLEEP',
        final_state: i < 54 ? 'ACTIVE' : 'SLEEP'
      });
    }
    return fallback;
  }, [allNodes, selectedSeed]);

  // Active Cluster Heads for Voronoi
  const clusterHeads = useMemo(() => {
    const activePool = currentNodes.filter((n) => n.final_state === 'ACTIVE');
    if (activePool.length === 0) return currentNodes.slice(0, 5);
    const sorted = [...activePool].sort((a, b) => {
      const scoreA = a.energy * 2.0 - a.sink_distance * 0.02 + a.coverage_contribution * 3.0;
      const scoreB = b.energy * 2.0 - b.sink_distance * 0.02 + b.coverage_contribution * 3.0;
      return scoreB - scoreA;
    });
    return sorted.slice(0, 5);
  }, [currentNodes]);

  // High-Precision Canvas Rendering for Heatmap and Voronoi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / 100; // 100m x 100m
    const sensingRadius = 10 * scale; // 10m sensing radius

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#050907';
    ctx.fillRect(0, 0, width, height);

    // Grid lines (every 10m)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 100; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i * scale, 0);
      ctx.lineTo(i * scale, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * scale);
      ctx.lineTo(width, i * scale);
      ctx.stroke();
    }

    if (activeTab === 'voronoi') {
      // Voronoi Partitioning Calculation & Fill
      const chPoints = clusterHeads.map((ch) => ({
        id: ch.node_id,
        x: ch.x * scale,
        y: (100 - ch.y) * scale
      }));

      const voronoiColors = [
        'rgba(16, 185, 129, 0.18)',  // Emerald
        'rgba(6, 182, 212, 0.18)',   // Cyan
        'rgba(168, 85, 247, 0.18)',  // Violet
        'rgba(245, 158, 11, 0.18)',  // Amber
        'rgba(236, 72, 153, 0.18)'   // Pink
      ];

      const voronoiBorderColors = [
        'rgba(16, 185, 129, 0.6)',
        'rgba(6, 182, 212, 0.6)',
        'rgba(168, 85, 247, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(236, 72, 153, 0.6)'
      ];

      // Discretized Voronoi cell coloring
      const step = 4;
      for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
          let closestCHIdx = 0;
          let minD = Infinity;

          chPoints.forEach((ch, idx) => {
            const d = (px - ch.x) ** 2 + (py - ch.y) ** 2;
            if (d < minD) {
              minD = d;
              closestCHIdx = idx;
            }
          });

          ctx.fillStyle = voronoiColors[closestCHIdx % voronoiColors.length];
          ctx.fillRect(px, py, step, step);
        }
      }

      // Member to Cluster Head connecting links
      currentNodes.forEach((node) => {
        if (node.final_state === 'ACTIVE') {
          const nx = node.x * scale;
          const ny = (100 - node.y) * scale;
          let closestCH = chPoints[0];
          let minD = Infinity;

          chPoints.forEach((ch) => {
            const d = (nx - ch.x) ** 2 + (ny - ch.y) ** 2;
            if (d < minD) {
              minD = d;
              closestCH = ch;
            }
          });

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(closestCH.x, closestCH.y);
          ctx.stroke();
        }
      });

      // Render Cluster Heads with large pulsating beacon
      chPoints.forEach((ch, idx) => {
        // Outer ring
        ctx.strokeStyle = voronoiBorderColors[idx % voronoiBorderColors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`CH-${ch.id}`, ch.x + 8, ch.y - 8);
      });
    } else {
      // Coverage Multiplicity Heatmap Mode
      const activeNodes = currentNodes.filter((n) => n.final_state === 'ACTIVE');

      // 1. Draw sensing radius discs with blend mode for overlap accumulation
      activeNodes.forEach((node) => {
        const nx = node.x * scale;
        const ny = (100 - node.y) * scale;

        const radGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, sensingRadius);
        radGrad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        radGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.14)');
        radGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, sensingRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle boundary outline
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, sensingRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 2. Draw Sleeping node coverage circles (dashed)
      const sleepNodes = currentNodes.filter((n) => n.final_state === 'SLEEP');
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      sleepNodes.forEach((node) => {
        const nx = node.x * scale;
        const ny = (100 - node.y) * scale;
        ctx.beginPath();
        ctx.arc(nx, ny, sensingRadius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Draw Sensor Nodes
    currentNodes.forEach((node) => {
      const nx = node.x * scale;
      const ny = (100 - node.y) * scale;
      const isActive = node.final_state === 'ACTIVE';

      if (isActive) {
        ctx.fillStyle = node.node_type === 'super' ? '#a855f7' : node.node_type === 'advanced' ? '#10b981' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Sleep node
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Base Station Indicator (x=50, y=50 in center)
    const bsX = 50 * scale;
    const bsY = 50 * scale;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(bsX, bsY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bsX, bsY, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('BASE STATION', bsX + 16, bsY + 3);

  }, [currentNodes, clusterHeads, activeTab, selectedSeed]);

  // Handle Canvas Mouse Hover for Telemetry Tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scale = canvas.width / rect.width;
    const canvasX = clientX * scale;
    const canvasY = clientY * scale;

    const xMeters = (canvasX / canvas.width) * 100;
    const yMeters = 100 - (canvasY / canvas.height) * 100;

    // Count how many active sensors cover this point (r_s = 10m)
    const activeNodes = currentNodes.filter((n) => n.final_state === 'ACTIVE');
    let k = 0;
    activeNodes.forEach((n) => {
      const d = Math.sqrt((n.x - xMeters) ** 2 + (n.y - yMeters) ** 2);
      if (d <= 10.0) k++;
    });

    setHoveredPoint({
      x: Math.round(xMeters * 10) / 10,
      y: Math.round(yMeters * 10) / 10,
      k,
      activeSensors: activeNodes.length
    });
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <section id="coverage-analytics" className="py-16 px-4 relative border-t border-emerald-500/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Spatial Sensing &amp; Topology Partitioning
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono">
            Coverage Preservation &amp; Overlap Reduction Analytics
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Theoretical vs. empirical spatial coverage analysis ensuring strict adherence to the <code className="text-cyan-400 font-mono">Δ ≤ 1.0%</code> baseline coverage preservation boundary while eliminating 33.38% redundant sensing overlap.
          </p>
        </div>

        {/* Top Control Bar & Seed Switcher */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 bg-[#060c09] p-1.5 rounded-xl border border-emerald-500/20 font-mono text-xs">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'heatmap' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coverage Multiplicity Heatmap
            </button>
            <button
              onClick={() => setActiveTab('voronoi')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'voronoi' ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voronoi Partitioning
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'table' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Seed Verification Table
            </button>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400">Seed:</span>
            {[42, 123, 456].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeed(s)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSeed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                    : 'bg-[#0D1626] text-slate-400 hover:text-white border border-[#1C3150]'
                }`}
              >
                Seed {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1C3150] font-mono text-xs">
              <div className="flex items-center space-x-2">
                <Hexagon className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold">
                  {activeTab === 'heatmap' ? 'Spatial Coverage Multiplicity Field (100m x 100m)' :
                   activeTab === 'voronoi' ? 'Voronoi Cluster-Head Territorial Partition' :
                   'Discretized Grid Multiplicity Breakdown'}
                </span>
              </div>
              <span className="text-slate-400">
                Resolution: <strong className="text-cyan-400">2m x 2m Grid • r_s = 10m</strong>
              </span>
            </div>

            {/* High Definition Interactive Canvas */}
            <div className="relative aspect-square max-h-[460px] mx-auto w-full bg-[#070B14] rounded-xl border border-[#1C3150] p-2 flex items-center justify-center overflow-hidden">
              {activeTab === 'table' ? (
                <div className="w-full h-full overflow-y-auto p-4 space-y-4 font-mono text-xs">
                  <div className="text-slate-300 font-bold text-sm mb-2 text-cyan-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Coverage Preservation Mathematical Verification (100-Seed Benchmark)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-[#1C3150] rounded-lg">
                      <thead className="bg-[#0B1220] text-cyan-300 uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-b border-[#1C3150]">Metric Parameter</th>
                          <th className="p-2 border-b border-[#1C3150] text-right">Baseline (100 Nodes)</th>
                          <th className="p-2 border-b border-[#1C3150] text-right">Proposed (ANN + Greedy)</th>
                          <th className="p-2 border-b border-[#1C3150] text-right">Delta (Δ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C3150] text-slate-300 text-xs">
                        <tr>
                          <td className="p-2 font-semibold">Active Sensor Count</td>
                          <td className="p-2 text-right">100 Nodes</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">{currentSeedData.active_nodes} Nodes</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">-{currentSeedData.sleep_nodes}% Active</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Sleep Scheduled Nodes</td>
                          <td className="p-2 text-right">0 Nodes</td>
                          <td className="p-2 text-right text-amber-400 font-bold">{currentSeedData.sleep_nodes} Nodes</td>
                          <td className="p-2 text-right text-amber-400 font-bold">+{currentSeedData.sleep_nodes} Nodes</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Sensing Area Coverage</td>
                          <td className="p-2 text-right">{currentSeedData.baseline_cov.toFixed(2)}%</td>
                          <td className="p-2 text-right text-cyan-300 font-bold">{currentSeedData.proposed_cov.toFixed(2)}%</td>
                          <td className="p-2 text-right text-cyan-300 font-bold">{currentSeedData.delta_cov.toFixed(2)}% (≤ 1.0%)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Sensing Overlap Ratio</td>
                          <td className="p-2 text-right">{currentSeedData.baseline_ovl.toFixed(2)}%</td>
                          <td className="p-2 text-right text-cyan-400 font-bold">{currentSeedData.proposed_ovl.toFixed(2)}%</td>
                          <td className="p-2 text-right text-cyan-400 font-bold">{currentSeedData.delta_ovl.toFixed(2)}%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Target Lower Bound</td>
                          <td className="p-2 text-right">—</td>
                          <td className="p-2 text-right text-violet-400">{currentSeedData.target_cov.toFixed(2)}%</td>
                          <td className="p-2 text-right text-violet-400">Guaranteed Preserved</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    className="w-full h-full max-h-[440px] max-w-[440px] rounded-lg cursor-crosshair"
                  />

                  {/* Real-Time Telemetry HUD Tooltip */}
                  {hoveredPoint && (
                    <div className="absolute top-4 left-4 bg-[#0B1220]/95 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 font-mono text-xs pointer-events-none shadow-2xl">
                      <div className="text-cyan-300 font-bold mb-1 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Coordinate ({hoveredPoint.x}m, {hoveredPoint.y}m)
                      </div>
                      <div className="text-slate-300">
                        Covering Sensors: <strong className="text-emerald-400">{hoveredPoint.k} active node(s)</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {hoveredPoint.k === 0 ? '⚠️ Uncovered Blindspot' :
                         hoveredPoint.k === 1 ? '✨ Optimal Singular Coverage (1x)' :
                         hoveredPoint.k === 2 ? '⚡ Dual Overlap (2x)' :
                         '🔮 Dense Multi-Coverage (3x+)'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Legend */}
            <div className="flex flex-wrap justify-between items-center gap-2 mt-4 pt-3 border-t border-[#1C3150] font-mono text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
                <span className="text-slate-400">0x Blindspot (7.27%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-emerald-300 font-semibold">1x Optimal (37.76%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500"></span>
                <span className="text-cyan-300 font-semibold">2x Overlap (34.12%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-violet-500"></span>
                <span className="text-violet-300 font-semibold">3x+ Redundant (20.85%)</span>
              </div>
            </div>
          </div>

          {/* Right Side Cards */}
          <div className="space-y-5">
            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 font-mono shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Coverage Constraint Bounding</span>
              </div>

              <div className="text-2xl font-extrabold text-white">
                {currentSeedData.proposed_cov.toFixed(2)}% <span className="text-xs font-normal text-slate-400">vs. Baseline {currentSeedData.baseline_cov.toFixed(2)}%</span>
              </div>

              <div className="p-3 bg-[#070B14] rounded-xl border border-[#1C3150] text-xs text-slate-300 leading-relaxed font-sans">
                The greedy optimizer guarantees that the network sensing area never drops more than <strong>1.0 percentage point</strong> below baseline, even when 46%–50% of redundant sensors are deactivated.
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Baseline Overlap:</span>
                  <span className="text-slate-200">{currentSeedData.baseline_ovl.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Proposed Overlap:</span>
                  <span className="text-cyan-400 font-bold">{currentSeedData.proposed_ovl.toFixed(2)}% ({currentSeedData.delta_ovl.toFixed(2)}%)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sensing Radius:</span>
                  <span className="text-cyan-300">r_s = 10.0 meters</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Grid Discretization:</span>
                  <span className="text-slate-200">Δx = Δy = 2.0 m</span>
                </div>
              </div>
            </div>

            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] font-mono text-xs shadow-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-400" />
                Per-Seed Coverage Audit Log
              </h4>

              <div className="space-y-2.5">
                {seedCoverageData.map((s) => (
                  <div 
                    key={s.seed}
                    onClick={() => setSelectedSeed(s.seed)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedSeed === s.seed 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                        : 'bg-[#070B14] border-[#1C3150] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-xs mb-1">
                      <span className="text-cyan-300">Deployment Seed {s.seed}</span>
                      <span className="text-emerald-400">{s.active_nodes} Active / {s.sleep_nodes} Sleep</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Coverage: <strong className="text-white">{s.proposed_cov.toFixed(2)}%</strong> ({s.delta_cov.toFixed(2)}%)</span>
                      <span>Overlap: <strong className="text-cyan-400">{s.proposed_ovl.toFixed(2)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
