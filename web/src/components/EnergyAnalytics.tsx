import React from 'react';
import { 
  Battery, Download
} from 'lucide-react';

export const EnergyAnalytics: React.FC = () => {
  const sampledData = [
    { round: 1, leach: 0.4971, pegasis: 0.4984, hybrid: 0.4985, pso_hybrid: 0.6988 },
    { round: 50, leach: 0.3684, pegasis: 0.4379, hybrid: 0.4407, pso_hybrid: 0.6422 },
    { round: 100, leach: 0.2497, pegasis: 0.3876, hybrid: 0.3782, pso_hybrid: 0.5868 },
    { round: 150, leach: 0.1880, pegasis: 0.3256, hybrid: 0.3398, pso_hybrid: 0.5348 },
    { round: 200, leach: 0.1359, pegasis: 0.2774, hybrid: 0.3164, pso_hybrid: 0.4998 },
    { round: 300, leach: 0.0381, pegasis: 0.1692, hybrid: 0.2886, pso_hybrid: 0.4357 },
    { round: 348, leach: 0.0000, pegasis: 0.1254, hybrid: 0.2649, pso_hybrid: 0.4197 },
    { round: 400, leach: 0.0000, pegasis: 0.0894, hybrid: 0.2647, pso_hybrid: 0.3878 },
    { round: 500, leach: 0.0000, pegasis: 0.0225, hybrid: 0.2483, pso_hybrid: 0.3568 },
    { round: 537, leach: 0.0000, pegasis: 0.0000, hybrid: 0.2396, pso_hybrid: 0.3436 },
    { round: 700, leach: 0.0000, pegasis: 0.0000, hybrid: 0.1982, pso_hybrid: 0.3050 },
    { round: 850, leach: 0.0000, pegasis: 0.0000, hybrid: 0.1612, pso_hybrid: 0.2935 },
    { round: 1000, leach: 0.0000, pegasis: 0.0000, hybrid: 0.1424, pso_hybrid: 0.2624 },
  ];

  const downloadCSV = () => {
    const headers = 'Round,LEACH,PEGASIS,HYBRID,PSO_HYBRID\n';
    const csvRows = sampledData.map(d => `${d.round},${d.leach},${d.pegasis},${d.hybrid},${d.pso_hybrid}`).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wsn_1000_round_residual_energy.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(sampledData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wsn_1000_round_residual_energy.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="table" className="py-16 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <Battery className="w-3.5 h-3.5" />
            Dataset Artifacts &amp; Energy Dissipation Curves
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono">
            1000-Round Residual Energy Benchmark
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Exact 1000-round energy dissipation benchmark comparing LEACH, PEGASIS, HYBRID, and PSO_HYBRID maintained in <code className="text-cyan-400 font-mono">res-energy table.csv</code>.
          </p>
        </div>

        {/* Main Dataset Card */}
        <div className="lab-card rounded-3xl p-6 sm:p-8 border border-[#1C3150] bg-[#0D1626] shadow-2xl font-mono">
          {/* Top Actions & Export Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-[#1C3150]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Battery className="w-5 h-5 text-cyan-400" />
                Network Average Residual Energy (Joules per Active Node)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Heterogeneous Deployment: Normal (0.5J), Advanced (1.0J), Super (1.5J)
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={downloadCSV}
                className="px-3 py-1.5 bg-[#070B14] hover:bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold flex items-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={downloadJSON}
                className="px-3 py-1.5 bg-[#070B14] hover:bg-violet-500/15 text-violet-400 border border-violet-500/30 rounded-xl font-bold flex items-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Dataset Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#0B1220] text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#1C3150]">
                  <th className="py-3 px-4">Simulation Round</th>
                  <th className="py-3 px-4">LEACH (J)</th>
                  <th className="py-3 px-4">PEGASIS (J)</th>
                  <th className="py-3 px-4">HYBRID (J)</th>
                  <th className="py-3 px-4 text-cyan-400 bg-cyan-500/10">Proposed PSO-Hybrid (J)</th>
                  <th className="py-3 px-4">Preservation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C3150]">
                {sampledData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">Round {row.round}</td>
                    <td className={`py-3 px-4 ${row.leach === 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                      {row.leach.toFixed(4)}
                    </td>
                    <td className={`py-3 px-4 ${row.pegasis === 0 ? 'text-rose-500 font-bold' : 'text-slate-300'}`}>
                      {row.pegasis.toFixed(4)}
                    </td>
                    <td className={`py-3 px-4 ${row.hybrid === 0 ? 'text-rose-500 font-bold' : 'text-slate-300'}`}>
                      {row.hybrid.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-300 bg-cyan-500/10">
                      {row.pso_hybrid.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">
                      {row.pso_hybrid > 0.4 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active Optimization
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          Sustained Operation
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Protocol Depletion Milestones Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-emerald-500/15">
            <div className="bg-[#050907] p-4 rounded-xl border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">LEACH Depletion</span>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">Round 348</div>
              <p className="text-[11px] text-slate-400 mt-1">100% node death due to single-hop long distance transmissions to Sink.</p>
            </div>

            <div className="bg-[#050907] p-4 rounded-xl border border-amber-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">PEGASIS Depletion</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">Round 537</div>
              <p className="text-[11px] text-slate-400 mt-1">Chain leader bottleneck causes rapid energy exhaustion in later rounds.</p>
            </div>

            <div className="bg-[#050907] p-4 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">HYBRID at Rnd 1000</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">0.1424 J Remaining</div>
              <p className="text-[11px] text-slate-400 mt-1">Intra-cluster chaining protects nodes, but lacks swarm optimization.</p>
            </div>

            <div className="bg-[#050907] p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <span className="text-[10px] text-purple-300 uppercase tracking-wider block">PSO_HYBRID at Rnd 1000</span>
              <div className="text-lg font-bold text-purple-300 mt-0.5">0.2624 J Remaining</div>
              <p className="text-[11px] text-slate-300 mt-1">Retains <strong>84% more energy</strong> than Standard Hybrid at round 1000.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
