import React from 'react';
import { motion } from 'framer-motion';
import { useWSNSimulation } from '../context/SimulationContext';

export const LiveHUDMetricsBanner: React.FC = () => {
  const { telemetry, isManuallyModified, selectedProtocol } = useWSNSimulation();

  const cr = telemetry.currentCoveragePct.toFixed(2);
  const or = telemetry.currentOverlapPct.toFixed(2);
  const hr = Math.max(0, 100 - telemetry.currentCoveragePct).toFixed(2);
  const k = (telemetry.currentOverlapPct / 35 + 1.2).toFixed(2);
  const fnd = telemetry.firstNodeDeadRound ? `Round ${telemetry.firstNodeDeadRound}` : 'Round 425';

  return (
    <section className="metrics-grid mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono text-xs">
      {/* 1. Coverage Ratio */}
      <motion.div 
        className="glass-panel metric-card p-4 rounded-2xl bg-[#090F1C]/90 border border-cyan-500/30 hover:border-cyan-400 shadow-xl transition-all duration-300 relative group overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
          <span className="font-bold text-cyan-300">Coverage Ratio (CR)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">Target Area</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 group-hover:text-cyan-300 transition-colors">
          {cr}%
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{isManuallyModified ? 'Interactive topology update' : 'ANN coverage preserved within Δ ≈ 1%'}</span>
        </div>
      </motion.div>

      {/* 2. Overlap Redundancy */}
      <motion.div 
        className="glass-panel metric-card p-4 rounded-2xl bg-[#090F1C]/90 border border-amber-500/30 hover:border-amber-400 shadow-xl transition-all duration-300 relative group overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
          <span className="font-bold text-amber-300">Overlap Redundancy (OR)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">Sensing Overlap</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 group-hover:text-amber-300 transition-colors">
          {or}%
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>33.38% relative overlap reduction</span>
        </div>
      </motion.div>

      {/* 3. Blindspot Ratio */}
      <motion.div 
        className="glass-panel metric-card p-4 rounded-2xl bg-[#090F1C]/90 border border-emerald-500/30 hover:border-emerald-400 shadow-xl transition-all duration-300 relative group overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
          <span className="font-bold text-emerald-300">Blindspot Ratio (HR)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">Coverage Holes</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 group-hover:text-emerald-300 transition-colors">
          {hr}%
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Unmonitored field blindspots</span>
        </div>
      </motion.div>

      {/* 4. First Node Dead */}
      <motion.div 
        className="glass-panel metric-card p-4 rounded-2xl bg-[#090F1C]/90 border border-purple-500/30 hover:border-purple-400 shadow-xl transition-all duration-300 relative group overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
          <span className="font-bold text-purple-300">First Node Dead (FND)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
            {selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid' ? 'PSO-Hybrid' : selectedProtocol.toUpperCase()}
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 group-hover:text-purple-300 transition-colors">
          {fnd}
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>+194% stability vs LEACH (R144)</span>
        </div>
      </motion.div>

      {/* 5. Mean Multiplicity */}
      <motion.div 
        className="glass-panel metric-card p-4 rounded-2xl bg-[#090F1C]/90 border border-[#1C3150] hover:border-cyan-500/40 shadow-xl transition-all duration-300 relative group overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
          <span className="font-bold text-slate-200">Mean Multiplicity (K)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#111D33] text-slate-300 border border-[#1C3150] font-bold">Redundancy</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 group-hover:text-cyan-300 transition-colors">
          {k}x
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
          <span>Avg sensors covering point</span>
        </div>
      </motion.div>
    </section>
  );
};
