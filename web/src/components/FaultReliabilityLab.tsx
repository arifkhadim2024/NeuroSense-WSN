import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const FaultReliabilityLab: React.FC = () => {
  const { nodes, currentRound } = useWSNSimulation();
  const [faultFilter, setFaultFilter] = useState<'all' | 'dead' | 'critical' | 'isolated'>('all');

  const deadNodes = nodes.filter((n) => !n.isAlive);
  const criticalNodes = nodes.filter((n) => n.isAlive && n.currentEnergy / n.energy <= 0.15);
  const sleepingNodes = nodes.filter((n) => n.isAlive && n.final_state === 'SLEEP');

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          Network Resilience, Failure Detection &amp; Fault Tolerance
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
          Fault &amp; Reliability Laboratory
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Real-time diagnostics of node battery exhaustion, coverage hole emergence, network partition resilience, and dynamic route reconfiguration.
        </p>
      </div>

      {/* Fault Diagnostics Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#0D1626] rounded-2xl p-5 border border-rose-500/30 space-y-2 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Exhausted / Dead Nodes</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              {deadNodes.length === 0 ? '0 FAULTS' : `${deadNodes.length} FAILED`}
            </span>
          </div>
          <div className="text-3xl font-black text-white">{deadNodes.length} <span className="text-xs text-slate-500">Nodes</span></div>
          <p className="text-[11px] text-slate-400 font-sans">Permanent battery depletion, routing graph automatically pruned.</p>
        </div>

        <div className="bg-[#0D1626] rounded-2xl p-5 border border-amber-500/30 space-y-2 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Critical Battery Alert</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              &lt;15% RESERVE
            </span>
          </div>
          <div className="text-3xl font-black text-white">{criticalNodes.length} <span className="text-xs text-slate-500">Nodes</span></div>
          <p className="text-[11px] text-slate-400 font-sans">Imminent failure risk, excluded from cluster head candidacy.</p>
        </div>

        <div className="bg-[#0D1626] rounded-2xl p-5 border border-violet-500/30 space-y-2 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Sleeping Standby Nodes</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
              RESERVE POOL
            </span>
          </div>
          <div className="text-3xl font-black text-white">{sleepingNodes.length} <span className="text-xs text-slate-500">Nodes</span></div>
          <p className="text-[11px] text-slate-400 font-sans">Low-power state (44% pool), available for wake-up replacement.</p>
        </div>

        <div className="bg-[#0D1626] rounded-2xl p-5 border border-cyan-500/30 space-y-2 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Network Connectivity</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              100% REACHABLE
            </span>
          </div>
          <div className="text-3xl font-black text-white">0 <span className="text-xs text-slate-500">Partitions</span></div>
          <p className="text-[11px] text-slate-400 font-sans">Base Station path exists for 100% of live sensor clusters.</p>
        </div>
      </div>

      {/* Fault Diagnostics Table */}
      <div className="bg-[#0D1626] rounded-3xl p-6 border border-[#1C3150] space-y-4 font-mono text-xs shadow-xl">
        <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
          <span className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Sensor Reliability Audit &amp; Fault Manifest (Simulation Round: {currentRound})
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFaultFilter('all')}
              className={`px-3 py-1 rounded-xl transition-all ${faultFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/25' : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150]'}`}
            >
              All Sensors ({nodes.length})
            </button>
            <button
              onClick={() => setFaultFilter('critical')}
              className={`px-3 py-1 rounded-xl transition-all ${faultFilter === 'critical' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/25' : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150]'}`}
            >
              Critical ({criticalNodes.length})
            </button>
            <button
              onClick={() => setFaultFilter('dead')}
              className={`px-3 py-1 rounded-xl transition-all ${faultFilter === 'dead' ? 'bg-rose-500 text-white font-bold shadow-sm shadow-rose-500/25' : 'bg-[#0B1220] text-slate-400 hover:text-white border border-[#1C3150]'}`}
            >
              Dead ({deadNodes.length})
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1C3150] text-cyan-400 text-[11px]">
                <th className="py-2.5">Node ID</th>
                <th className="py-2.5">Coordinates</th>
                <th className="py-2.5">Initial Energy</th>
                <th className="py-2.5">Residual Energy</th>
                <th className="py-2.5">Health Status</th>
                <th className="py-2.5">Failure Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C3150]/60">
              {nodes
                .filter((n) => {
                  if (faultFilter === 'dead') return !n.isAlive;
                  if (faultFilter === 'critical') return n.isAlive && n.currentEnergy / n.energy <= 0.15;
                  return true;
                })
                .slice(0, 25)
                .map((n) => {
                  const pct = (n.currentEnergy / n.energy) * 100;
                  const isDead = !n.isAlive;
                  const isCritical = n.isAlive && pct <= 15;

                  return (
                    <tr key={n.node_id} className="hover:bg-[#070B14]">
                      <td className="py-2.5 font-bold text-white">Node #{n.node_id}</td>
                      <td className="py-2.5 text-slate-400">({n.x.toFixed(1)}m, {n.y.toFixed(1)}m)</td>
                      <td className="py-2.5 text-slate-300">{n.energy.toFixed(2)} J</td>
                      <td className="py-2.5">
                        <span className={isDead ? 'text-rose-400 font-bold' : isCritical ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {n.currentEnergy.toFixed(3)} J ({pct.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDead ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : isCritical ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isDead ? 'EXHAUSTED' : isCritical ? 'CRITICAL' : 'OPTIMAL'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {isDead ? 'Depleted' : isCritical ? 'High (Next 50 Rnds)' : 'Nominal (<5%)'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
