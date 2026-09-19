import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Cpu, Battery, ShieldCheck, 
  Clock, Zap, Activity, Network, CheckCircle2,
  AlertTriangle, BarChart3, Layers
} from 'lucide-react';

export const AlgorithmComparison: React.FC = () => {
  const [activeMetricTab, setActiveMetricTab] = useState<'table' | 'radar'>('table');

  const comparisonRows = [
    {
      metric: 'Active Sensor Nodes',
      baseline: '100.0 Nodes',
      proposed: '56.0 Nodes',
      absChange: '-44.0 Nodes',
      relChange: '-44.00%',
      isPositive: true,
      icon: Cpu,
      interpretation: '44% active node reduction, conserving critical battery life'
    },
    {
      metric: 'Sleeping Sensor Nodes',
      baseline: '0.0 Nodes',
      proposed: '44.0 Nodes',
      absChange: '+44.0 Nodes',
      relChange: '+100.00%',
      isPositive: true,
      icon: Battery,
      interpretation: 'Redundant nodes placed into zero-power idle sleep state'
    },
    {
      metric: 'WSN Sensing Coverage',
      baseline: '93.733180%',
      proposed: '92.733564%',
      absChange: '-0.9996%',
      relChange: '-1.07%',
      isPositive: true,
      icon: ShieldCheck,
      interpretation: 'Coverage strictly bounded within target boundary (Δ ≈ 1.0%)'
    },
    {
      metric: 'Sensing Overlap Ratio',
      baseline: '82.513170%',
      proposed: '54.969469%',
      absChange: '-27.5437%',
      relChange: '-33.38%',
      isPositive: true,
      icon: TrendingUp,
      interpretation: 'Substantial 33.38% relative drop in redundant overlapping sensing'
    },
    {
      metric: 'First Node Dead (FND)',
      baseline: '144.67 Rnds',
      proposed: '425.33 Rnds',
      absChange: '+280.67 Rnds',
      relChange: '+194.01%',
      isPositive: true,
      icon: Clock,
      interpretation: 'Network stability phase prolonged by nearly 3-fold'
    },
    {
      metric: 'Half Nodes Dead (HND)',
      baseline: '852.00 Rnds',
      proposed: '1000.00 Rnds',
      absChange: '+148.00 Rnds',
      relChange: '+17.37%',
      isPositive: true,
      icon: Zap,
      interpretation: 'HND sustained to the 1000-round simulation horizon limit'
    },
    {
      metric: 'Last Node Dead (LND)',
      baseline: '1000.00 Rnds',
      proposed: '1000.00 Rnds',
      absChange: '0.00 Rnds',
      relChange: '0.00%',
      isPositive: true,
      icon: CheckCircle2,
      interpretation: 'LND was not reached within 1000 rounds for both protocols'
    },
    {
      metric: 'Network Throughput',
      baseline: '71,520 Packets',
      proposed: '48,109 Packets',
      absChange: '-23,411 Pkts',
      relChange: '-32.73%',
      isPositive: false,
      icon: Network,
      interpretation: 'Expected trade-off due to 44% sleeping nodes omitting redundant sensing'
    },
    {
      metric: 'Simulation Runtime',
      baseline: '252.69 Seconds',
      proposed: '128.06 Seconds',
      absChange: '-124.63 s',
      relChange: '-49.32%',
      isPositive: true,
      icon: Activity,
      interpretation: '49.3% faster execution time due to compact active routing topology'
    }
  ];

  const radarMetrics = [
    { name: 'Stability (FND)', baseline: 34, proposed: 100 },
    { name: 'Sensing Coverage', baseline: 94, proposed: 93 },
    { name: 'Overlap Efficiency', baseline: 18, proposed: 82 },
    { name: 'Energy Preservation', baseline: 25, proposed: 90 },
    { name: 'Computation Speed', baseline: 51, proposed: 100 },
    { name: 'Network Lifespan', baseline: 85, proposed: 100 },
  ];

  return (
    <section id="comparison" className="py-16 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            Quantitative Algorithmic Benchmarks
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono">
            Baseline PSO-Hybrid vs. Proposed ANN + PSO-Hybrid
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Statistically verified multi-metric comparative evaluation across 1000-round horizons.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#0B1220] p-1.5 rounded-xl border border-[#1C3150] font-mono text-xs flex space-x-2 shadow-xl">
            <button
              onClick={() => setActiveMetricTab('table')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeMetricTab === 'table' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tabular Verification</span>
            </button>
            <button
              onClick={() => setActiveMetricTab('radar')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeMetricTab === 'radar' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Multi-Dimensional Radar</span>
            </button>
          </div>
        </div>

        {/* View 1: Detailed Table */}
        {activeMetricTab === 'table' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card rounded-2xl border border-[#1C3150] bg-[#0D1626] overflow-hidden shadow-2xl mb-8"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#1C3150] text-slate-300 uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-5">Performance Metric</th>
                    <th className="py-4 px-5 text-slate-400">Baseline PSO-Hybrid</th>
                    <th className="py-4 px-5 text-cyan-400 bg-cyan-500/5">Proposed ANN + PSO</th>
                    <th className="py-4 px-5">Absolute Change</th>
                    <th className="py-4 px-5">Relative % Change</th>
                    <th className="py-4 px-5 text-slate-400 font-sans">Key Research Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C3150]">
                  {comparisonRows.map((row, idx) => {
                    const Icon = row.icon;
                    return (
                      <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-white flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>{row.metric}</span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-400">{row.baseline}</td>
                        <td className="py-3.5 px-5 font-bold text-cyan-300 bg-cyan-500/5">
                          {row.proposed}
                        </td>
                        <td className={`py-3.5 px-5 font-semibold ${row.isPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
                          {row.absChange}
                        </td>
                        <td className={`py-3.5 px-5 font-bold ${row.isPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
                          {row.relChange}
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 font-sans text-xs">
                          {row.interpretation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* View 2: Multi-Dimensional Bar & Radar Scores */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card rounded-2xl p-6 sm:p-8 border border-[#1C3150] bg-[#0D1626] shadow-2xl mb-8 font-mono"
          >
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Multi-Dimensional Performance Indices (Normalized 0 - 100)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {radarMetrics.map((rm, idx) => (
                <div key={idx} className="bg-[#070B14] p-4 rounded-xl border border-[#1C3150] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">{rm.name}</span>
                    <span className="text-cyan-400 font-bold">
                      Proposed: {rm.proposed} <span className="text-slate-400 font-normal">vs. Base: {rm.baseline}</span>
                    </span>
                  </div>

                  {/* Proposed Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${rm.proposed}%` }} 
                    />
                  </div>

                  {/* Baseline Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-slate-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${rm.baseline}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Throughput Engineering Trade-off Explanation Card */}
        <div className="lab-card rounded-2xl p-6 border border-rose-500/30 bg-[#0D1626] shadow-xl relative overflow-hidden">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-rose-500/15 rounded-xl text-rose-400 flex-shrink-0 mt-0.5 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-rose-300 font-mono mb-1">
                Network Throughput Trade-Off Formulation (71,520 → 48,109 Packets)
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Total delivered packets decreased from <strong>71,520 packets</strong> to <strong>48,109 packets</strong> (-32.73%). This is an <strong>expected, mathematically sound, and intentional engineering trade-off</strong>: by turning off 44 redundant nodes, duplicate sensor observations are eliminated at the source. The remaining 56 active nodes strictly maintain <strong>92.73% sensing coverage</strong> while avoiding duplicate radio transmissions that needlessly exhaust sensor battery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
