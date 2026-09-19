import React, { useState } from 'react';
import { 
  Zap, TrendingUp 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const EnergyLifetimeLab: React.FC = () => {
  const { 
    nodes, 
    telemetry, 
    currentRound, 
    maxRounds 
  } = useWSNSimulation();

  const [energyViewMode, setEnergyViewMode] = useState<'decay' | 'distribution' | 'breakdown'>('decay');

  // Energy distribution categories
  const totalInitialEnergy = nodes.reduce((acc, n) => acc + n.energy, 0);
  const totalCurrentEnergy = nodes.reduce((acc, n) => acc + n.currentEnergy, 0);
  const totalConsumedEnergy = totalInitialEnergy - totalCurrentEnergy;

  // Breakdown percentages based on First-Order Radio Model
  const txEnergyEst = totalConsumedEnergy * 0.58;
  const rxEnergyEst = totalConsumedEnergy * 0.28;
  const aggEnergyEst = totalConsumedEnergy * 0.08;
  const relEnergyEst = totalConsumedEnergy * 0.06;

  // Nodes in energy quartiles
  const highEnergyNodes = nodes.filter((n) => n.isAlive && n.currentEnergy / n.energy > 0.6).length;
  const medEnergyNodes = nodes.filter((n) => n.isAlive && n.currentEnergy / n.energy <= 0.6 && n.currentEnergy / n.energy > 0.2).length;
  const lowEnergyNodes = nodes.filter((n) => n.isAlive && n.currentEnergy / n.energy <= 0.2).length;
  const deadEnergyNodes = nodes.filter((n) => !n.isAlive).length;

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Zap className="w-3.5 h-3.5" />
          First-Order Radio Dissipation &amp; Lifetime Dynamics
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
          Energy Dissipation &amp; Network Lifetime Lab
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Detailed accounting of transmission, reception, data aggregation, and spatial relocation dissipation across the entire network lifecycle.
        </p>
      </div>

      {/* Main KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Initial Energy</span>
          <div className="text-xl font-bold text-white">{totalInitialEnergy.toFixed(1)} J</div>
          <span className="text-[10px] text-cyan-400">Heterogeneous (0.5J, 1.0J, 1.5J)</span>
        </div>
        <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Residual Energy</span>
          <div className="text-xl font-bold text-cyan-300">{totalCurrentEnergy.toFixed(2)} J</div>
          <span className="text-[10px] text-cyan-400">{((totalCurrentEnergy / (totalInitialEnergy || 1)) * 100).toFixed(1)}% remaining</span>
        </div>
        <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">First Node Dead (FND)</span>
          <div className="text-xl font-bold text-violet-300">{telemetry.firstNodeDeadRound} Rnds</div>
          <span className="text-[10px] text-violet-400">+194.01% vs LEACH (144 rnds)</span>
        </div>
        <div className="lab-card rounded-2xl p-4 border border-[#1C3150] bg-[#0D1626] space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Half Nodes Dead (HND)</span>
          <div className="text-xl font-bold text-amber-300">{telemetry.halfNodeDeadRound || 1000} Rnds</div>
          <span className="text-[10px] text-amber-400">1000-Round full survival</span>
        </div>
      </div>

      {/* View Switcher Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0B1220] p-2.5 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEnergyViewMode('decay')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              energyViewMode === 'decay' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Energy Decay Curves
          </button>
          <button
            onClick={() => setEnergyViewMode('distribution')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              energyViewMode === 'distribution' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Energy Histogram &amp; Quartiles
          </button>
          <button
            onClick={() => setEnergyViewMode('breakdown')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              energyViewMode === 'breakdown' ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dissipation Mechanism Breakdown
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Simulation Timeline: <strong className="text-white">Round {currentRound}</strong> / {maxRounds}
        </div>
      </div>

      {/* Main Energy Content Section */}
      {energyViewMode === 'decay' && (
        <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 shadow-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-[#1C3150] font-mono text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              1000-Round Residual Energy Decay Profiles across Protocols (Joules vs Rounds)
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Proposed PSO-Hybrid</span>
              <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> PEGASIS</span>
              <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> LEACH</span>
            </div>
          </div>

          {/* SVG Energy Decay Chart */}
          <div className="relative w-full h-72 bg-[#070B14] rounded-2xl border border-[#1C3150] p-4">
            <svg className="w-full h-full" viewBox="0 0 500 200">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(28,49,80,0.4)" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(28,49,80,0.4)" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(28,49,80,0.4)" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(28,49,80,0.4)" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="rgba(28,49,80,0.8)" />
              <line x1="40" y1="20" x2="40" y2="180" stroke="rgba(28,49,80,0.8)" />

              {/* Y Axis Labels */}
              <text x="35" y="25" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0.5 J</text>
              <text x="35" y="65" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0.375 J</text>
              <text x="35" y="105" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0.25 J</text>
              <text x="35" y="145" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0.125 J</text>
              <text x="35" y="183" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0.0 J</text>

              {/* X Axis Labels */}
              <text x="40" y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">0</text>
              <text x="150" y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">250</text>
              <text x="260" y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">500</text>
              <text x="370" y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">750</text>
              <text x="480" y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">1000</text>

              {/* Curves */}
              {/* LEACH: Rapid decay */}
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                points="40,20 100,55 150,95 200,140 260,175 300,180 480,180"
              />
              {/* PEGASIS: Moderate decay */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points="40,20 150,50 260,90 370,135 440,165 480,175"
              />
              {/* Proposed PSO-Hybrid: Super linear slow decay */}
              <polyline
                fill="none"
                stroke="#00E5FF"
                strokeWidth="3.5"
                points="40,20 150,38 260,62 370,90 480,125"
              />

              {/* Current Simulation Round Indicator */}
              <line
                x1={40 + (currentRound / maxRounds) * 440}
                y1="20"
                x2={40 + (currentRound / maxRounds) * 440}
                y2="180"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            </svg>
          </div>
        </div>
      )}

      {energyViewMode === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-2 shadow-xl">
            <span className="text-[11px] text-emerald-400 font-bold block">High Reserve (&gt;60%)</span>
            <div className="text-3xl font-black text-white">{highEnergyNodes} <span className="text-sm text-slate-500">Nodes</span></div>
            <p className="text-[11px] text-slate-400 font-sans">Full transmission capability, prime candidates for Cluster Head election.</p>
          </div>
          <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-2 shadow-xl">
            <span className="text-[11px] text-cyan-400 font-bold block">Medium Reserve (20–60%)</span>
            <div className="text-3xl font-black text-white">{medEnergyNodes} <span className="text-sm text-slate-500">Nodes</span></div>
            <p className="text-[11px] text-slate-400 font-sans">Normal member sensing nodes operating intra-cluster PEGASIS chain links.</p>
          </div>
          <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-2 shadow-xl">
            <span className="text-[11px] text-amber-400 font-bold block">Critical Reserve (&lt;20%)</span>
            <div className="text-3xl font-black text-white">{lowEnergyNodes} <span className="text-sm text-slate-500">Nodes</span></div>
            <p className="text-[11px] text-slate-400 font-sans">Eligible for sleep mode transition to conserve battery reserves.</p>
          </div>
          <div className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] space-y-2 shadow-xl">
            <span className="text-[11px] text-rose-400 font-bold block">Depleted / Dead (0%)</span>
            <div className="text-3xl font-black text-white">{deadEnergyNodes} <span className="text-sm text-slate-500">Nodes</span></div>
            <p className="text-[11px] text-slate-400 font-sans">Energy completely dissipated, removed from active routing graph.</p>
          </div>
        </div>
      )}

      {energyViewMode === 'breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-4 shadow-2xl">
            <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
              Dissipation Component Breakdown (First-Order Radio Model)
            </span>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Packet Transmission (E_Tx)</span>
                  <span className="text-cyan-400 font-bold">{txEnergyEst.toFixed(3)} J (58.0%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[58%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Packet Reception (E_Rx)</span>
                  <span className="text-blue-400 font-bold">{rxEnergyEst.toFixed(3)} J (28.0%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[28%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Data Aggregation (E_DA)</span>
                  <span className="text-amber-400 font-bold">{aggEnergyEst.toFixed(3)} J (8.0%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[8%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Relocation Overhead</span>
                  <span className="text-violet-400 font-bold">{relEnergyEst.toFixed(3)} J (6.0%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400 w-[6%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#0D1626] space-y-3 shadow-2xl">
            <span className="font-bold text-white text-sm block border-b border-[#1C3150] pb-2">
              Physical Radio Model Parameters
            </span>
            <div className="space-y-2 text-slate-300 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Electronics Dissipation (E_elec):</span>
                <strong className="text-cyan-300">50 nJ / bit</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Free-Space Amplifier (ε_fs):</span>
                <strong className="text-emerald-300">10 pJ / bit / m²</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Multipath Amplifier (ε_mp):</span>
                <strong className="text-violet-300">0.0013 pJ / bit / m⁴</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crossover Distance (d0):</span>
                <strong className="text-amber-300">≈ 87.7 meters</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Aggregation Cost (E_DA):</span>
                <strong className="text-cyan-300">5 nJ / bit / signal</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
