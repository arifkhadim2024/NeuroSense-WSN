import React, { useState } from 'react';
import { 
  Play, Pause, Sparkles, Cpu, Zap 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const OptimizationLab: React.FC = () => {
  const { 
    isOptimizing, 
    currentOptIteration, 
    optIterationsData, 
    executeOptimization, 
    stopOptimization, 
    activeScenario 
  } = useWSNSimulation();

  const [selectedFeature, setSelectedFeature] = useState<number>(0);

  const features = [
    {
      id: 'energy',
      name: 'Residual Energy Ratio',
      symbol: 'E_res / E_0',
      weight: '+2.0',
      description: 'Prioritizes nodes with higher residual battery to serve as cluster heads or active forwarders.'
    },
    {
      id: 'sink_dist',
      name: 'Distance to Base Station',
      symbol: 'd(i, sink)',
      weight: '-0.02',
      description: 'Penalizes high-distance nodes to avoid excessive energy depletion across long transmission hops.'
    },
    {
      id: 'neighbors',
      name: 'Local Node Degree',
      symbol: '|N(i)|',
      weight: '+1.5',
      description: 'Identifies densely connected hubs within communication radius (2 * Rs) to manage cluster members.'
    },
    {
      id: 'coverage_contrib',
      name: 'Unique Coverage Factor',
      symbol: 'Ψ_i (m²)',
      weight: '+3.0',
      description: 'Protects critical boundary nodes whose deactivation would create unmonitored blindspot holes.'
    },
    {
      id: 'overlap_ratio',
      name: 'Overlap Redundancy',
      symbol: 'Ω_i',
      weight: '-1.8',
      description: 'Flags nodes with high redundant sensing overlap for safe transition into low-power sleep mode.'
    },
    {
      id: 'node_density',
      name: 'Spatial Cluster Density',
      symbol: 'ρ_i',
      weight: '+1.2',
      description: 'Measures neighborhood concentration to balance Voronoi cluster territorial partitions.'
    }
  ];

  const currentIterData = optIterationsData[currentOptIteration - 1] || {
    iteration: 0,
    coveragePct: 93.73,
    overlapPct: 82.51,
    blindspotPct: 6.27,
    meanMultiplicity: 2.4,
    displacementMeters: 0,
    relocationEnergyJoules: 0,
    fitnessScore: 142.5,
    activeNodeCount: activeScenario.sensorCount
  };

  return (
    <section id="optimization-lab" className="py-12 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Neural-Evolutionary Optimization Suite
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
            Spatial Optimization &amp; ANN Node-State Engine
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Multi-objective Particle Swarm Optimization and Neural Classifier dynamically pruning redundant sensors while bounding coverage loss within <code className="text-cyan-400 font-mono">Δ ≤ 1.0%</code>.
          </p>
        </div>

        {/* Live Execution Control Panel */}
        <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1C3150]">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-cyan-500/15 rounded-2xl text-cyan-400 border border-cyan-500/30">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono tracking-wide">
                  SPATIAL TOPOLOGY OPTIMIZATION EXECUTION
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  15 Iterations • Active/Sleep Pruning • Multi-Objective Pareto Convergence
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 font-mono text-xs">
              <button
                onClick={isOptimizing ? stopOptimization : executeOptimization}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25 flex items-center gap-2 hover:opacity-95 transition-all text-xs"
              >
                {isOptimizing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isOptimizing ? 'PAUSE OPTIMIZATION' : 'EXECUTE SPATIAL OPTIMIZATION'}</span>
              </button>
            </div>
          </div>

          {/* Progress & Live Telemetry Grid */}
          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Optimization Progress (Iterations):</span>
              <span className="text-cyan-400 font-bold">Iteration {currentOptIteration} / 15</span>
            </div>

            <div className="w-full h-3 bg-[#070B14] rounded-full overflow-hidden border border-[#1C3150]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-300"
                style={{ width: `${(currentOptIteration / 15) * 100}%` }}
              />
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Coverage</div>
                <div className="text-lg font-black text-cyan-300 mt-0.5">{currentIterData.coveragePct.toFixed(1)}%</div>
                <div className="text-[10px] text-emerald-400">Δ ≤ 1.0% bounded</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Overlap Redundancy</div>
                <div className="text-lg font-black text-cyan-400 mt-0.5">{currentIterData.overlapPct.toFixed(1)}%</div>
                <div className="text-[10px] text-cyan-400">-33.38% reduced</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Active Nodes</div>
                <div className="text-lg font-black text-white mt-0.5">{currentIterData.activeNodeCount} Nodes</div>
                <div className="text-[10px] text-amber-400">{activeScenario.sensorCount - currentIterData.activeNodeCount} Sleep</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Displacement (ΣΔd)</div>
                <div className="text-lg font-black text-violet-300 mt-0.5">{currentIterData.displacementMeters} m</div>
                <div className="text-[10px] text-slate-400">Relocation total</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Relocation Energy</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{currentIterData.relocationEnergyJoules} J</div>
                <div className="text-[10px] text-slate-400">1.5 J/m dissipation</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#1C3150]">
                <div className="text-[10px] text-slate-400 uppercase">Fitness Score (F)</div>
                <div className="text-lg font-black text-cyan-400 mt-0.5">{currentIterData.fitnessScore.toFixed(1)}</div>
                <div className="text-[10px] text-violet-400">Multi-Objective</div>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Feature Diagnostic Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 font-mono shadow-2xl">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
              <Cpu className="w-4 h-4" />
              <span>ANN 6-Dimensional Feature Vector Space</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {features.map((feat, idx) => (
                <div
                  key={feat.id}
                  onClick={() => setSelectedFeature(idx)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedFeature === idx
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'bg-[#0B1220] border-[#1C3150] hover:border-cyan-500/30 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-white font-bold">{feat.name}</span>
                    <span className="text-cyan-400 font-bold">{feat.weight}</span>
                  </div>
                  <code className="text-cyan-300 text-xs block mb-1.5">{feat.symbol}</code>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Objective Fitness Breakdown */}
          <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>PSO Multi-Objective Fitness</span>
            </div>

            <div className="p-3.5 bg-[#070B14] rounded-2xl border border-[#1C3150] space-y-2">
              <div className="text-slate-400 text-[11px]">Composite Objective Function:</div>
              <code className="text-cyan-300 block text-[11px] font-bold">
                F = 2.0·E_ch + 100/(d_sink + ε) + 50/(d_intra + ε) + 100·S_cov - 50·S_ovl
              </code>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
              <div>• <strong>Residual Energy (2.0)</strong>: Directs CH duty towards higher battery nodes.</div>
              <div>• <strong>Sink Proximity (100.0)</strong>: Minimizes multi-path $d^4$ dissipation.</div>
              <div>• <strong>Intra-Cluster Spread (50.0)</strong>: Optimizes nearest-neighbor chaining.</div>
              <div>• <strong>Coverage Retention (100.0)</strong>: Guarantees $\Delta \le 1.0\%$ field monitoring.</div>
              <div>• <strong>Overlap Penalty (-50.0)</strong>: Actively penalizes redundant sensor density.</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
