import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Maximize2, X, Download, FileText, 
  CheckCircle2 
} from 'lucide-react';
import type { GraphItem, SeedRun } from '../types/wsn';
import { ReportGeneratorModal } from './ReportGeneratorModal';

const GRAPHS: GraphItem[] = [
  {
    id: 'coverage',
    title: 'WSN Sensing Coverage',
    category: 'Coverage & Overlap',
    filename: '/graphs/average_coverage_comparison.png',
    metric: 'Average Sensing Coverage',
    baseline: '93.73%',
    proposed: '92.73%',
    change: '-1.00% (Within target constraint)',
    isPositive: true,
    description: 'Sensing coverage is strictly preserved within the target boundary of <= 1.0 percentage point of baseline despite 44% of nodes being in sleep mode.'
  },
  {
    id: 'overlap',
    title: 'Sensing Overlap Reduction',
    category: 'Coverage & Overlap',
    filename: '/graphs/average_overlap_comparison.png',
    metric: 'Average Sensing Overlap',
    baseline: '82.51%',
    proposed: '54.97%',
    change: '-33.38% (Relative reduction)',
    isPositive: true,
    description: 'Substantial 33.38% relative reduction in redundant sensing overlap, eliminating duplicate sensing and transmission in dense sensor clusters.'
  },
  {
    id: 'active_nodes',
    title: 'Active vs. Sleeping Nodes',
    category: 'Topology Optimization',
    filename: '/graphs/average_active_nodes_comparison.png',
    metric: 'Active Sensor Nodes',
    baseline: '100 Nodes',
    proposed: '56 Nodes (44 Sleeping)',
    change: '-44.00% Active Nodes',
    isPositive: true,
    description: '44 out of 100 nodes are placed into sleep mode where they remain idle and retain 100% of their initial energy.'
  },
  {
    id: 'fnd',
    title: 'First Node Dead (FND) Stability',
    category: 'Network Lifespan',
    filename: '/graphs/average_fnd_comparison.png',
    metric: 'Stability Period (FND)',
    baseline: '144.67 Rounds',
    proposed: '425.33 Rounds',
    change: '+194.01% (Nearly 3x Increase)',
    isPositive: true,
    description: 'The network stability phase before any sensor node exhausts its energy is extended nearly 3-fold, maintaining full network integrity.'
  },
  {
    id: 'hnd',
    title: 'Half Nodes Dead (HND) Lifespan',
    category: 'Network Lifespan',
    filename: '/graphs/average_hnd_comparison.png',
    metric: 'Half Nodes Dead (HND)',
    baseline: '852.00 Rounds',
    proposed: '1000.00 Rounds',
    change: '+17.37% (Reached Limit)',
    isPositive: true,
    description: 'In all 3 experimental seeds, over 50% of active sensor nodes survived through the entire 1000-round simulation horizon.'
  },
  {
    id: 'throughput',
    title: 'Network Throughput Trade-off',
    category: 'System Performance',
    filename: '/graphs/average_throughput_comparison.png',
    metric: 'Total Packets Delivered',
    baseline: '71,520 Packets',
    proposed: '48,109 Packets',
    change: '-32.73% (Expected Trade-off)',
    isPositive: false,
    description: 'Throughput decreased by 32.73% as an intentional and expected trade-off because 44% sleeping nodes do not generate or route redundant data packets.'
  },
  {
    id: 'runtime',
    title: 'Simulation Execution Time',
    category: 'System Performance',
    filename: '/graphs/average_runtime_comparison.png',
    metric: 'Simulation Runtime',
    baseline: '252.69 Seconds',
    proposed: '128.06 Seconds',
    change: '-49.32% (Faster Execution)',
    isPositive: true,
    description: 'Smaller active routing topology accelerates PSO candidate search space and intra-cluster chaining, cutting execution time by nearly half.'
  }
];

const SEED_DATA: SeedRun[] = [
  {
    seed: 42,
    baseline: { active: 100, sleep: 0, cov: 92.70, ovl: 82.70, fnd: 163, hnd: 786, lnd: 1000, pkts: 69721 },
    proposed: { active: 60, sleep: 40, cov: 91.70, ovl: 64.03, fnd: 157, hnd: 1000, lnd: 1000, pkts: 48814 }
  },
  {
    seed: 123,
    baseline: { active: 100, sleep: 0, cov: 94.16, ovl: 81.14, fnd: 135, hnd: 910, lnd: 1000, pkts: 74382 },
    proposed: { active: 53, sleep: 47, cov: 93.16, ovl: 48.91, fnd: 546, hnd: 1000, lnd: 1000, pkts: 45587 }
  },
  {
    seed: 456,
    baseline: { active: 100, sleep: 0, cov: 94.35, ovl: 83.70, fnd: 136, hnd: 860, lnd: 1000, pkts: 70457 },
    proposed: { active: 55, sleep: 45, cov: 93.35, ovl: 51.98, fnd: 573, hnd: 1000, lnd: 1000, pkts: 49925 }
  }
];

export const ResearchResults: React.FC = () => {
  const [selectedGraph, setSelectedGraph] = useState<GraphItem | null>(null);
  const [selectedSeedTab, setSelectedSeedTab] = useState<number>(42);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const downloadSummaryJSON = () => {
    const a = document.createElement('a');
    a.href = '/data/final_summary_results.json';
    a.download = 'wsn_final_summary_results.json';
    a.click();
  };

  return (
    <section id="graphs" className="py-16 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            Empirical Visual Evidence
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono">
            Generated Matplotlib Research Charts &amp; Per-Seed Runs
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            High-resolution comparative figures generated directly by Python evaluation scripts across 1000-round horizons.
          </p>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400">Seed Filter:</span>
            {[42, 123, 456].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeedTab(s)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedSeedTab === s 
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25' 
                    : 'bg-[#0D1626] text-slate-400 hover:text-white border border-[#1C3150]'
                }`}
              >
                Seed {s}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 hover:brightness-110 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Research Report</span>
            </button>
            <button
              onClick={downloadSummaryJSON}
              className="px-3.5 py-2 bg-[#0D1626] hover:bg-cyan-500/15 text-cyan-400 border border-[#1C3150] rounded-xl font-bold flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Summary JSON</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {GRAPHS.map((graph) => (
            <motion.div
              key={graph.id}
              className="lab-card rounded-2xl border border-[#1C3150] bg-[#0D1626] overflow-hidden cursor-pointer group shadow-xl hover:-translate-y-1 transition-all duration-300 font-mono"
              onClick={() => setSelectedGraph(graph)}
            >
              <div className="p-4 border-b border-[#1C3150] flex justify-between items-center bg-[#0B1220]">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    {graph.category}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {graph.title}
                  </h3>
                </div>
                <Maximize2 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              
              <div className="p-3 bg-[#070B14] flex items-center justify-center relative overflow-hidden aspect-video">
                <img 
                  src={graph.filename} 
                  alt={graph.title}
                  className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-4 bg-[#0B1220]">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400">Baseline: <strong className="text-slate-200">{graph.baseline}</strong></span>
                  <span className="text-slate-400">Proposed: <strong className="text-cyan-400">{graph.proposed}</strong></span>
                </div>
                <div className={`text-xs font-bold ${graph.isPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {graph.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {(() => {
          const currentSeed = SEED_DATA.find((item) => item.seed === selectedSeedTab) || SEED_DATA[0];
          return (
            <div className="lab-card rounded-2xl border border-[#1C3150] bg-[#0D1626] p-6 shadow-2xl font-mono">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1C3150]">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span>Per-Seed Empirical Audit • Deployment Seed #{currentSeed.seed}</span>
                </h3>
                <span className="text-xs px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full font-bold border border-cyan-500/20">
                  1000 Simulation Rounds
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#0B1220] text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#1C3150]">
                      <th className="py-3 px-4">Routing Configuration</th>
                      <th className="py-3 px-4">Active</th>
                      <th className="py-3 px-4">Sleep</th>
                      <th className="py-3 px-4">Coverage</th>
                      <th className="py-3 px-4">Overlap</th>
                      <th className="py-3 px-4">FND</th>
                      <th className="py-3 px-4">HND</th>
                      <th className="py-3 px-4">Throughput</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C3150]">
                    <tr className="hover:bg-cyan-500/5">
                      <td className="py-3 px-4 font-semibold text-slate-300">Baseline PSO-Hybrid</td>
                      <td className="py-3 px-4 text-slate-400">{currentSeed.baseline.active}</td>
                      <td className="py-3 px-4 text-slate-400">{currentSeed.baseline.sleep}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.cov.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.ovl.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.fnd}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.hnd}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.pkts.toLocaleString()} pkts</td>
                    </tr>
                    <tr className="hover:bg-emerald-500/5 bg-emerald-500/5 font-bold">
                      <td className="py-3 px-4 text-emerald-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Proposed ANN + PSO-Hybrid</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400">{currentSeed.proposed.active}</td>
                      <td className="py-3 px-4 text-amber-400">{currentSeed.proposed.sleep}</td>
                      <td className="py-3 px-4 text-cyan-300">{currentSeed.proposed.cov.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400">{currentSeed.proposed.ovl.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-purple-400">{currentSeed.proposed.fnd}</td>
                      <td className="py-3 px-4 text-sky-400">{currentSeed.proposed.hnd}</td>
                      <td className="py-3 px-4 text-slate-200">{currentSeed.proposed.pkts.toLocaleString()} pkts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        <AnimatePresence>
          {selectedGraph && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
              onClick={() => setSelectedGraph(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#070e0b] border border-emerald-500/30 rounded-3xl max-w-4xl w-full p-6 relative shadow-2xl font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedGraph(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{selectedGraph.category}</span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">{selectedGraph.title}</h3>
                </div>

                <div className="bg-[#030605] rounded-2xl p-4 flex items-center justify-center mb-6 overflow-hidden border border-emerald-500/15">
                  <img 
                    src={selectedGraph.filename} 
                    alt={selectedGraph.title} 
                    className="max-h-[60vh] object-contain rounded-lg"
                  />
                </div>

                <div className="bg-[#050907] rounded-xl p-4 border border-emerald-500/15 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2 pb-2 border-b border-emerald-500/10">
                    <span className="text-slate-400">Baseline: <strong className="text-slate-200">{selectedGraph.baseline}</strong></span>
                    <span className="text-slate-400">Proposed: <strong className="text-emerald-400">{selectedGraph.proposed}</strong></span>
                    <span className={`font-bold ${selectedGraph.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedGraph.change}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                    {selectedGraph.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ReportGeneratorModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </div>
    </section>
  );
};
