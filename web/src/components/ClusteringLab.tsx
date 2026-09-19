import React, { useState, useMemo } from 'react';
import { 
  Network, ShieldCheck, Layers
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const ClusteringLab: React.FC = () => {
  const { 
    nodes, 
    activeClusterHeads, 
    activeScenario
  } = useWSNSimulation();

  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [clusteringMethod, setClusteringMethod] = useState<'pso' | 'leach' | 'voronoi'>('pso');

  // Compute cluster memberships based on nearest active cluster head
  const clusters = useMemo(() => {
    const chNodes = nodes.filter((n) => activeClusterHeads.includes(n.node_id));
    if (chNodes.length === 0) return [];

    return chNodes.map((ch, idx) => {
      // Find all member nodes closest to this CH
      const members = nodes.filter((n) => {
        if (!n.isAlive || activeClusterHeads.includes(n.node_id)) return false;
        // Closest CH test
        let closestCH = chNodes[0];
        let minDist = Infinity;
        for (const candidate of chNodes) {
          const d = Math.hypot(n.x - candidate.x, n.y - candidate.y);
          if (d < minDist) {
            minDist = d;
            closestCH = candidate;
          }
        }
        return closestCH.node_id === ch.node_id;
      });

      const avgDistToCH = members.length > 0 
        ? members.reduce((acc, m) => acc + Math.hypot(m.x - ch.x, m.y - ch.y), 0) / members.length 
        : 0;

      const totalResidualEnergy = [ch, ...members].reduce((acc, n) => acc + n.currentEnergy, 0);

      return {
        id: idx + 1,
        chNode: ch,
        members,
        size: members.length + 1,
        avgDistance: avgDistToCH,
        distToSink: Math.hypot(ch.x - activeScenario.sinkX, ch.y - activeScenario.sinkY),
        totalEnergy: totalResidualEnergy,
        aggregationLoad: (members.length * 4000 * 5e-9) // E_da = 5 nJ/bit
      };
    });
  }, [nodes, activeClusterHeads, activeScenario.sinkX, activeScenario.sinkY]);

  const activeCluster = selectedClusterId !== null 
    ? clusters.find((c) => c.id === selectedClusterId) 
    : clusters[0];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Network className="w-3.5 h-3.5" />
          Intra-Cluster Territorial Mechanics &amp; Multi-Objective Aggregation
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
          WSN Clustering &amp; Aggregation Laboratory
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Analyze dynamic cluster-head election, Voronoi territorial membership bounds, intra-cluster PEGASIS chain formation, and data compression load balancing.
        </p>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0B1220] p-3 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setClusteringMethod('pso')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              clusteringMethod === 'pso'
                ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multi-Objective PSO Clustering
          </button>
          <button
            onClick={() => setClusteringMethod('leach')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              clusteringMethod === 'leach'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Probabilistic LEACH (P = 0.05)
          </button>
          <button
            onClick={() => setClusteringMethod('voronoi')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              clusteringMethod === 'voronoi'
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voronoi Geometric Clustering
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Active Cluster Heads: <strong className="text-amber-400">{activeClusterHeads.length}</strong> / Optimal Ratio: <strong className="text-emerald-400">5.0%</strong>
        </div>
      </div>

      {/* Main Clustering Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Left: Interactive 2D Cluster Map */}
        <div className="lg:col-span-2 lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 shadow-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-[#1C3150]">
            <span className="font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Intra-Cluster Territorial Visualization (Field: {activeScenario.fieldWidth}m × {activeScenario.fieldHeight}m)
            </span>
            <span className="text-[11px] text-cyan-400">
              Click a cluster to inspect
            </span>
          </div>

          <div className="relative w-full aspect-square max-h-[500px] mx-auto bg-[#070B14] rounded-2xl border border-[#1C3150] overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <defs>
                <pattern id="clusterGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(28, 49, 80, 0.4)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#clusterGrid)" />

              {/* Base Station Tower */}
              <circle
                cx={activeScenario.sinkX}
                cy={100 - activeScenario.sinkY}
                r={4}
                className="fill-cyan-500/20 stroke-cyan-400 stroke-[1.5] animate-pulse"
              />
              <text
                x={activeScenario.sinkX}
                y={100 - activeScenario.sinkY - 5}
                fill="#00E5FF"
                fontSize="3.5"
                textAnchor="middle"
                fontFamily="monospace"
                fontWeight="bold"
              >
                BASE STATION
              </text>

              {/* Clusters and Inter-Node Intra-Cluster Links */}
              {clusters.map((c) => {
                const isSelected = activeCluster?.id === c.id;
                const ch = c.chNode;

                return (
                  <g key={c.id}>
                    {/* Intra-Cluster Chaining Vectors */}
                    {c.members.map((m) => (
                      <line
                        key={m.node_id}
                        x1={m.x}
                        y1={100 - m.y}
                        x2={ch.x}
                        y2={100 - ch.y}
                        stroke={isSelected ? '#fbbf24' : 'rgba(0, 229, 255, 0.25)'}
                        strokeWidth={isSelected ? '0.8' : '0.4'}
                        strokeDasharray={isSelected ? '1,1' : 'none'}
                      />
                    ))}

                    {/* Cluster Head Communication Vector to Sink */}
                    <line
                      x1={ch.x}
                      y1={100 - ch.y}
                      x2={activeScenario.sinkX}
                      y2={100 - activeScenario.sinkY}
                      stroke={isSelected ? '#00E5FF' : 'rgba(0, 229, 255, 0.25)'}
                      strokeWidth={isSelected ? '1.2' : '0.6'}
                    />

                    {/* Cluster Range Aura */}
                    <circle
                      cx={ch.x}
                      cy={100 - ch.y}
                      r={15}
                      fill={isSelected ? 'rgba(251, 191, 36, 0.12)' : 'rgba(0, 229, 255, 0.05)'}
                      stroke={isSelected ? '#fbbf24' : 'rgba(0, 229, 255, 0.2)'}
                      strokeWidth="0.5"
                      onClick={() => setSelectedClusterId(c.id)}
                      className="cursor-pointer"
                    />

                    {/* Member Nodes */}
                    {c.members.map((m) => (
                      <circle
                        key={m.node_id}
                        cx={m.x}
                        cy={100 - m.y}
                        r={1.2}
                        className={isSelected ? 'fill-amber-300' : 'fill-cyan-400'}
                      />
                    ))}

                    {/* Cluster Head Node */}
                    <circle
                      cx={ch.x}
                      cy={100 - ch.y}
                      r={3}
                      fill="#fbbf24"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      className="cursor-pointer animate-pulse"
                      onClick={() => setSelectedClusterId(c.id)}
                    />
                    <text
                      x={ch.x}
                      y={100 - ch.y + 1}
                      fill="#050912"
                      fontSize="2.5"
                      textAnchor="middle"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      CH{c.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Cluster Inspector & Metrics */}
        <div className="space-y-4">
          <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Cluster #{activeCluster?.id || 1} Telemetry
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ACTIVE
              </span>
            </div>

            {activeCluster ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#050807] rounded-xl border border-emerald-500/15">
                    <span className="text-[10px] text-slate-400 block uppercase">Cluster Head</span>
                    <span className="text-white font-bold text-sm">Node #{activeCluster.chNode.node_id}</span>
                    <span className="text-[10px] text-emerald-400 block">({activeCluster.chNode.x.toFixed(1)}m, {activeCluster.chNode.y.toFixed(1)}m)</span>
                  </div>
                  <div className="p-3 bg-[#050807] rounded-xl border border-emerald-500/15">
                    <span className="text-[10px] text-slate-400 block uppercase">Cluster Size</span>
                    <span className="text-amber-400 font-bold text-sm">{activeCluster.size} Sensors</span>
                    <span className="text-[10px] text-slate-400 block">{activeCluster.members.length} member nodes</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-500/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CH Residual Energy:</span>
                    <strong className="text-emerald-400">{activeCluster.chNode.currentEnergy.toFixed(3)} J</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Cluster Energy:</span>
                    <strong className="text-white">{activeCluster.totalEnergy.toFixed(3)} J</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Member Distance:</span>
                    <strong className="text-cyan-300">{activeCluster.avgDistance.toFixed(1)} meters</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance to Base Station:</span>
                    <strong className="text-purple-300">{activeCluster.distToSink.toFixed(1)} meters</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aggregation Dissipation (E_da):</span>
                    <strong className="text-amber-400">{(activeCluster.aggregationLoad * 1e6).toFixed(2)} µJ</strong>
                  </div>
                </div>

                {/* Member Nodes List */}
                <div className="pt-3 border-t border-emerald-500/15">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">
                    Enclosed Member Sensors ({activeCluster.members.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {activeCluster.members.map((m) => (
                      <div 
                        key={m.node_id}
                        className="p-1.5 bg-[#050807] rounded-lg border border-emerald-500/10 flex justify-between items-center text-[11px]"
                      >
                        <span className="text-slate-300">Node #{m.node_id}</span>
                        <span className="text-emerald-400">{m.currentEnergy.toFixed(3)} J</span>
                        <span className="text-slate-500">{Math.hypot(m.x - activeCluster.chNode.x, m.y - activeCluster.chNode.y).toFixed(1)}m</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-slate-500 text-center py-6">
                No active clusters detected in current topology.
              </div>
            )}
          </div>

          {/* Theoretical Cluster Formulation Card */}
          <div className="lab-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 space-y-2">
            <span className="text-amber-400 font-bold text-[11px] block">
              Multi-Objective Cluster-Head Fitness Objective
            </span>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Fitness evaluates candidate heads balancing energy reserves (<code className="text-amber-300">2.0 · E_CH</code>), sink distance penalty (<code className="text-amber-300">100 / d_sink</code>), and intra-cluster dispersion (<code className="text-amber-300">50 / d_intra</code>).
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
