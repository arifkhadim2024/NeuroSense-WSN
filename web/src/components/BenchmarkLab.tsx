import React, { useState } from 'react';
import { 
  BarChart3, ArrowUpDown, Search, Sparkles 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

export const BenchmarkLab: React.FC = () => {
  const { allScenarios, selectScenario } = useWSNSimulation();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'algorithms' | 'scenarios'>('algorithms');
  const [sortField, setSortField] = useState<string>('fnd');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const algorithmData = [
    {
      id: 'ann_pso_hybrid',
      name: 'Proposed ANN + PSO-Hybrid',
      category: 'Proposed Framework',
      activeNodes: 56,
      sleepNodes: 44,
      coverage: 92.73,
      overlap: 54.97,
      fnd: 425.33,
      hnd: 1000.0,
      lnd: 1000.0,
      packets: 48109,
      energyPerRnd: 0.00142,
      runtime: 128.06,
      assessment: 'Superior energy preservation & network stability (+194% FND gain) within Δ ≤ 1.0% coverage constraint.',
      isProposed: true
    },
    {
      id: 'baseline_pso_hybrid',
      name: 'Baseline PSO-Hybrid',
      category: 'Evolutionary Benchmark',
      activeNodes: 100,
      sleepNodes: 0,
      coverage: 93.73,
      overlap: 82.51,
      fnd: 144.67,
      hnd: 852.0,
      lnd: 1000.0,
      packets: 71520,
      energyPerRnd: 0.00285,
      runtime: 252.69,
      assessment: 'Full active deployment with severe 82.5% overlap causing premature node death at round 144.',
      isProposed: false
    },
    {
      id: 'pegasis',
      name: 'Classical PEGASIS',
      category: 'Chain Routing',
      activeNodes: 100,
      sleepNodes: 0,
      coverage: 93.73,
      overlap: 82.51,
      fnd: 280.0,
      hnd: 910.0,
      lnd: 1000.0,
      packets: 55300,
      energyPerRnd: 0.00198,
      runtime: 210.45,
      assessment: 'Chain topology reduces direct sink hops but suffers from token-passing propagation latency.',
      isProposed: false
    },
    {
      id: 'hybrid',
      name: 'Standard Hybrid LEACH-PEGASIS',
      category: 'Cluster-Chain Hybrid',
      activeNodes: 100,
      sleepNodes: 0,
      coverage: 93.73,
      overlap: 82.51,
      fnd: 180.0,
      hnd: 720.0,
      lnd: 1000.0,
      packets: 62400,
      energyPerRnd: 0.00215,
      runtime: 185.30,
      assessment: 'Static clusters with intra-cluster chains; lacks adaptive energy & coverage optimization.',
      isProposed: false
    },
    {
      id: 'leach',
      name: 'Classical LEACH',
      category: 'Hierarchical Baseline',
      activeNodes: 100,
      sleepNodes: 0,
      coverage: 93.73,
      overlap: 82.51,
      fnd: 144.0,
      hnd: 852.0,
      lnd: 1000.0,
      packets: 71520,
      energyPerRnd: 0.00340,
      runtime: 142.10,
      assessment: 'Probabilistic CH selection causes rapid energy depletion from single-hop long-range sink links.',
      isProposed: false
    }
  ];

  // Sorting logic
  const sortedAlgorithms = [...algorithmData].sort((a, b) => {
    let valA = (a as any)[sortField];
    let valB = (b as any)[sortField];
    if (typeof valA === 'string') return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortAsc ? valA - valB : valB - valA;
  });

  const filteredAlgorithms = sortedAlgorithms.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section id="benchmark-lab" className="py-12 px-4 relative border-t border-[#1C3150]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Empirical Benchmark Suite
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono">
            Research Verification &amp; Protocol Benchmark Matrix
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Multi-metric empirical evaluation across 100-seed simulations confirming quantitative lifetime, coverage boundary, and overlap reduction gains.
          </p>
        </div>

        {/* Tab & Search Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0B1220] p-3 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('algorithms')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'algorithms' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Algorithm Performance Matrix
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'scenarios' ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scenario Benchmark Profiles ({allScenarios.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search benchmark metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl pl-9 pr-3 py-1.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Main Table Content */}
        {activeTab === 'algorithms' ? (
          <div className="lab-card rounded-3xl border border-[#1C3150] bg-[#0D1626] overflow-hidden shadow-2xl font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0B1220] text-cyan-300 uppercase text-[10px] border-b border-[#1C3150]">
                  <tr>
                    <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                      Algorithm &amp; Framework <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('activeNodes')}>
                      Active / Sleep <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('coverage')}>
                      Coverage (%) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('overlap')}>
                      Overlap (%) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('fnd')}>
                      FND (Rnds) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('hnd')}>
                      HND (Rnds) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('packets')}>
                      Throughput <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('runtime')}>
                      Runtime (s) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C3150] text-slate-300">
                  {filteredAlgorithms.map((algo) => {
                    const isExpanded = expandedRow === algo.id;
                    return (
                      <React.Fragment key={algo.id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : algo.id)}
                          className={`cursor-pointer transition-all hover:bg-cyan-500/5 ${
                            algo.isProposed ? 'bg-cyan-500/10 font-semibold' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              {algo.isProposed && (
                                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                              )}
                              <div>
                                <div className={algo.isProposed ? 'text-cyan-300 font-bold' : 'text-white'}>
                                  {algo.name}
                                </div>
                                <div className="text-[10px] text-slate-400">{algo.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="text-white">{algo.activeNodes}</span> /{' '}
                            <span className="text-amber-400">{algo.sleepNodes}</span>
                          </td>
                          <td className="p-3.5 text-right text-cyan-300 font-bold">{algo.coverage.toFixed(2)}%</td>
                          <td className="p-3.5 text-right text-cyan-400 font-bold">{algo.overlap.toFixed(2)}%</td>
                          <td className="p-3.5 text-right text-violet-300 font-bold">{algo.fnd.toFixed(0)}</td>
                          <td className="p-3.5 text-right text-amber-300 font-bold">{algo.hnd.toFixed(0)}</td>
                          <td className="p-3.5 text-right text-slate-200">{algo.packets.toLocaleString()}</td>
                          <td className="p-3.5 text-right text-slate-400">{algo.runtime.toFixed(1)} s</td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#070B14] text-[11px] text-slate-400">
                            <td colSpan={8} className="p-4 space-y-2 border-l-2 border-cyan-500">
                              <div className="text-slate-300 leading-relaxed font-sans">
                                <strong>Assessment:</strong> {algo.assessment}
                              </div>
                              <div className="flex gap-6 text-[10px] text-slate-400 font-mono">
                                <span>Energy Dissipation: <strong className="text-cyan-400">{algo.energyPerRnd} J/round</strong></span>
                                <span>LND Boundary: <strong className="text-white">{algo.lnd} Rounds</strong></span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Scenarios View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => selectScenario(sc.id)}
                className="lab-card rounded-2xl p-5 border border-[#1C3150] bg-[#0D1626] cursor-pointer hover:border-cyan-500/40 transition-all font-mono text-xs space-y-3 shadow-xl"
              >
                <div className="flex justify-between items-center pb-2 border-b border-[#1C3150]">
                  <span className="text-white font-bold">{sc.name}</span>
                  <span className="text-cyan-400 text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {sc.fieldWidth}m × {sc.fieldHeight}m
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nodes:</span>
                    <strong className="text-white">{sc.sensorCount} Sensors</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensing Radius (Rs):</span>
                    <strong className="text-cyan-300">{sc.sensingRadius} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Station (Sink):</span>
                    <strong className="text-slate-200">({sc.sinkX}, {sc.sinkY})</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
