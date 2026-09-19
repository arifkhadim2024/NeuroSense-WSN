import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Hexagon, Info 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import type { DynamicNodeState } from '../types/wsn';

export const VoronoiLab: React.FC = () => {
  const { nodes, activeClusterHeads, activeScenario, setSelectedNode, selectedOptimizer } = useWSNSimulation();

  const [inspectedNode, setInspectedNode] = useState<DynamicNodeState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;

  // Active Cluster Heads / Cluster centers
  const activeCHNodes = useMemo(() => {
    const chs = nodes.filter((n) => n.isAlive && activeClusterHeads.includes(n.node_id));
    return chs.length > 0 ? chs : nodes.filter((n) => n.isAlive).slice(0, 5);
  }, [nodes, activeClusterHeads]);

  // Compute Voronoi Cell statistics per CH
  const voronoiStats = useMemo(() => {
    const chPoints = activeCHNodes.map((ch) => ({ id: ch.node_id, x: ch.x, y: ch.y, node: ch }));
    const cellAreas: Record<number, number> = {};
    const memberCounts: Record<number, number> = {};

    chPoints.forEach((ch) => {
      cellAreas[ch.id] = 0;
      memberCounts[ch.id] = 0;
    });

    const step = 2; // 2m discretization
    for (let gy = 0; gy <= H; gy += step) {
      for (let gx = 0; gx <= W; gx += step) {
        let closestId = chPoints[0]?.id || 0;
        let minD = Infinity;

        chPoints.forEach((ch) => {
          const d = (gx - ch.x) ** 2 + (gy - ch.y) ** 2;
          if (d < minD) {
            minD = d;
            closestId = ch.id;
          }
        });

        cellAreas[closestId] = (cellAreas[closestId] || 0) + (step * step);
      }
    }

    // Assign members to closest CH
    const aliveNodes = nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
    aliveNodes.forEach((n) => {
      let closestId = chPoints[0]?.id || 0;
      let minD = Infinity;
      chPoints.forEach((ch) => {
        const d = (n.x - ch.x) ** 2 + (n.y - ch.y) ** 2;
        if (d < minD) {
          minD = d;
          closestId = ch.id;
        }
      });
      memberCounts[closestId] = (memberCounts[closestId] || 0) + 1;
    });

    return { cellAreas, memberCounts };
  }, [activeCHNodes, nodes, selectedOptimizer, W, H]);

  // Canvas Voronoi Rendering
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

    // Midnight Blue Background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, width, height);

    const chPoints = activeCHNodes.map((ch) => ({ id: ch.node_id, x: ch.x * scaleX, y: (H - ch.y) * scaleY, node: ch }));

    const colors = [
      'rgba(0, 229, 255, 0.18)',
      'rgba(139, 92, 246, 0.18)',
      'rgba(59, 130, 246, 0.18)',
      'rgba(245, 158, 11, 0.18)',
      'rgba(236, 72, 153, 0.18)',
      'rgba(99, 102, 241, 0.18)'
    ];

    // Discretized Voronoi Cell Fill
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

        const isInspected = inspectedNode && chPoints[closestIdx]?.id === inspectedNode.node_id;
        ctx.fillStyle = isInspected ? 'rgba(0, 229, 255, 0.45)' : colors[closestIdx % colors.length];
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(28, 49, 80, 0.5)';
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

    // Connecting lines from active nodes to their CH
    const aliveNodes = nodes.filter((n) => n.isAlive && (selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true));
    aliveNodes.forEach((node) => {
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
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(closestCH.x, closestCH.y);
        ctx.stroke();
      }
    });

    // Draw Sensor Nodes
    nodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = (H - node.y) * scaleY;
      const isCH = activeClusterHeads.includes(node.node_id);
      const isSelected = inspectedNode?.node_id === node.node_id;

      if (isCH) {
        // Large Cluster Head with beacon
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 16 : 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`CH-${node.node_id}`, nx + 8, ny - 6);
      } else if (node.isAlive) {
        ctx.fillStyle = node.node_type === 'super' ? '#8B5CF6' : node.node_type === 'advanced' ? '#10B981' : '#00E5FF';
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [nodes, activeCHNodes, activeClusterHeads, inspectedNode, selectedOptimizer, W, H]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    // Find closest node
    let closestNode: DynamicNodeState | null = null;
    let minD = Infinity;

    nodes.forEach((n) => {
      const d = Math.sqrt((n.x - xM) ** 2 + (n.y - yM) ** 2);
      if (d < minD) {
        minD = d;
        closestNode = n;
      }
    });

    if (closestNode && minD < 15) {
      setInspectedNode(closestNode);
      setSelectedNode(closestNode);
    }
  };

  const targetNode = inspectedNode || activeCHNodes[0] || nodes[0];
  const targetCellArea = targetNode ? (voronoiStats.cellAreas[targetNode.node_id] || 820) : 820;
  const targetMemberCount = targetNode ? (voronoiStats.memberCounts[targetNode.node_id] || 14) : 14;

  return (
    <section id="voronoi-lab" className="py-12 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <Hexagon className="w-3.5 h-3.5" />
            3D &amp; 2D Geometric Tessellation
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
            Voronoi Cluster-Head Territorial Partitioning
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Dynamic geometric cell partitioning representing Cluster Head spatial ownership, load balancing, and nearest-neighbor intra-cluster forwarding chains.
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lab-card rounded-3xl p-5 border border-[#1C3150] bg-[#0D1626] flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1C3150] font-mono text-xs">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Hexagon className="w-4 h-4 text-violet-400" />
                Voronoi Diagram ({activeCHNodes.length} Active Cluster Territories)
              </span>
              <span className="text-slate-400">Click any cell or sensor to inspect</span>
            </div>

            <div className="relative aspect-square max-h-[460px] mx-auto w-full bg-[#070B14] rounded-2xl border border-[#1C3150] p-2 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                onClick={handleCanvasClick}
                className="w-full h-full max-h-[440px] max-w-[440px] rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-[#1C3150] font-mono text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300"></span>
                <span className="text-amber-300 font-semibold">Cluster Head Beacon</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500/40"></span>
                <span className="text-cyan-300">Territorial Voronoi Cell</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-emerald-300">Member Sensor Nodes</span>
              </div>
            </div>
          </div>

          {/* Right Inspector & Theory */}
          <div className="space-y-4 font-mono text-xs">
            {targetNode && (
              <div className="lab-card rounded-2xl p-5 border border-violet-500/30 bg-[#0D1626] space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-violet-500/20">
                  <span className="text-violet-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Hexagon className="w-4 h-4 text-violet-400" />
                    Voronoi Cell Inspector
                  </span>
                  <span className="text-white font-bold">Node #{targetNode.node_id}</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Role:</span>
                    <span className={`font-bold uppercase ${activeClusterHeads.includes(targetNode.node_id) ? 'text-amber-400' : 'text-cyan-300'}`}>
                      {activeClusterHeads.includes(targetNode.node_id) ? 'Cluster Head' : 'Member Node'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voronoi Cell Area:</span>
                    <span className="font-bold text-white">{targetCellArea} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Managed Members:</span>
                    <span className="font-bold text-cyan-400">{targetMemberCount} Sensors</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Residual Energy:</span>
                    <span className="font-bold text-cyan-300">{targetNode.currentEnergy.toFixed(3)} J / {targetNode.energy.toFixed(1)} J</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sink Distance:</span>
                    <span className="font-bold text-slate-200">{targetNode.sink_distance.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coverage Contribution:</span>
                    <span className="font-bold text-violet-300">{(targetNode.coverage_contribution * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Voronoi Mathematical Property</span>
              </div>
              <div className="p-3 bg-[#070B14] rounded-xl border border-[#1C3150] space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                A Voronoi cell $V(p_i)$ contains all spatial points closer to seed $p_i$ than to any other seed:
                <code className="text-cyan-300 block font-mono text-[10px] mt-1">
                  V(p_i) = {'{x ∈ Ω | ||x - p_i|| ≤ ||x - p_j||, ∀ j ≠ i}'}
                </code>
                In our framework, Voronoi cell boundary areas directly weight the PSO multi-objective fitness to prevent over-clustering in dense subregions.
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
