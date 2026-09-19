import React, { useState } from 'react';
import { 
  Brain, Play, ChevronDown, ChevronUp
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { OptimizationLab } from './OptimizationLab';

export const OptimizationView: React.FC = () => {
  const { 
    isOptimizing, 
    executeOptimization, 
    currentOptIteration
  } = useWSNSimulation();

  const [showAdvancedDetails, setShowAdvancedDetails] = useState<boolean>(false);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Brain className="w-3.5 h-3.5" />
          Coverage-Preserving Spatial Optimization
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
          Sensor Position &amp; Redundancy Optimization
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Reposition sensors and transition redundant overlapping nodes into low-power sleep mode while strictly preserving baseline coverage (Δ ≤ 1.0%).
        </p>
      </div>

      {/* Before / Optimizing / After Process Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs max-w-5xl mx-auto">
        
        {/* Step 1: Initial Deployment */}
        <div className="bg-[#0D1626] rounded-2xl p-5 border border-[#1C3150] space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold">1. Initial Deployment</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B14] border border-[#1C3150] text-slate-300">BEFORE</span>
          </div>
          <div className="text-xl font-bold text-white">100 Active Nodes</div>
          <div className="text-xs text-rose-400">82.51% High Sensing Overlap</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Random deployment produces dense overlapping clusters and premature battery drain.
          </p>
        </div>

        {/* Step 2: Optimization In Progress */}
        <div className="bg-[#0D1626] rounded-2xl p-5 border border-purple-500/40 space-y-2">
          <div className="flex justify-between items-center text-purple-400">
            <span className="text-[10px] uppercase font-bold">2. Optimization</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {isOptimizing ? `ITERATION ${currentOptIteration}/15` : 'READY'}
            </span>
          </div>
          <div className="text-xl font-bold text-purple-300">15 Iterations</div>
          <div className="text-xs text-purple-400">ANN Node Selection + Greedy Relocation</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Vectorized displacement minimizes sensing redundancy within boundary constraints.
          </p>
        </div>

        {/* Step 3: Optimized Result */}
        <div className="bg-[#0D1626] rounded-2xl p-5 border border-cyan-500/40 space-y-2">
          <div className="flex justify-between items-center text-cyan-400">
            <span className="text-[10px] uppercase font-bold">3. Final Network</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AFTER</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">56 Active / 44 Sleep</div>
          <div className="text-xs text-emerald-400">-33.38% Overlap Eliminated</div>
          <p className="text-[11px] text-slate-400 font-sans">
            Strict coverage preservation (92.73% vs 93.73%) with 3x longer initial lifetime.
          </p>
        </div>

      </div>

      {/* Run Optimization Button */}
      <div className="text-center pt-2">
        <button
          onClick={executeOptimization}
          disabled={isOptimizing}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-600 to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 hover:opacity-95 transition-all inline-flex items-center gap-2 font-mono disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? `OPTIMIZING (ITERATION ${currentOptIteration}/15)...` : 'RUN OPTIMIZATION'}</span>
        </button>
      </div>

      {/* Main Visual Optimization Lab Canvas */}
      <OptimizationLab />

      {/* Advanced Details Collapsible Accordion */}
      <div className="max-w-5xl mx-auto space-y-4 font-mono text-xs">
        <div className="text-center">
          <button
            onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0D1626] border border-[#1C3150] text-slate-300 hover:text-white transition-all shadow-md"
          >
            <span>{showAdvancedDetails ? 'Hide Advanced Mathematical Formulations' : 'Advanced Details (ANN & Fitness)'}</span>
            {showAdvancedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAdvancedDetails && (
          <div className="space-y-4 animate-fadeIn">
            {/* ANN Node Intelligence Feature Vector */}
            <div className="bg-[#0D1626] rounded-3xl p-6 border border-cyan-500/20 space-y-3">
              <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
                Node Intelligence: ANN 6-Feature Classifier (MLP Architecture)
              </span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Multilayer Perceptron <code className="text-cyan-400 font-mono">MLPClassifier(16, 8)</code> evaluates spatial density, residual energy, and coverage contributions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">1. Residual Energy (Er)</div>
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">2. Sink Distance (d_BS)</div>
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">3. Node Degree / Neighbors (k)</div>
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">4. Local Overlap (Oi)</div>
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">5. Min Neighbor Distance (d_min)</div>
                <div className="p-2.5 bg-[#070B14] rounded-xl border border-[#1C3150] text-cyan-300">6. Historical Tx Count (Tx)</div>
              </div>
            </div>

            {/* PSO Multi-Objective Fitness */}
            <div className="bg-[#0D1626] rounded-3xl p-6 border border-purple-500/20 space-y-3">
              <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
                Multi-Objective Optimization Fitness Formulation
              </span>
              <div className="p-4 bg-[#070B14] rounded-2xl border border-purple-500/30 text-purple-300 font-mono text-xs">
                Fitness = 2.0 · E_CH + 100.0 / (d_sink + ε) + 50.0 / (d_intra + ε) + 100.0 · S_cov - 50.0 · S_overlap
              </div>
              <p className="text-slate-300 font-sans text-xs">
                Balances battery reserves, propagation distance to the Base Station, intra-cluster spread, and overlap reduction penalties.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
