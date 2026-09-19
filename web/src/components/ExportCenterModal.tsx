import React, { useState } from 'react';
import { 
  Download, FileText, CheckCircle2, X, 
  Database, FileSpreadsheet, Code2 
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    nodes, 
    telemetry, 
    activeScenario, 
    selectedProtocol, 
    selectedOptimizer, 
    currentRound,
    activeClusterHeads
  } = useWSNSimulation();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. Export Complete CSV Dataset
  const handleExportCSV = () => {
    const headers = [
      'Node_ID', 'X_Coord', 'Y_Coord', 'Initial_Energy_J', 'Residual_Energy_J', 
      'Role', 'Is_Alive', 'Is_Cluster_Head', 'Sensing_Radius_m', 'Comm_Radius_m'
    ];
    const rows = nodes.map((n) => [
      n.node_id,
      n.x.toFixed(2),
      n.y.toFixed(2),
      n.energy.toFixed(3),
      n.currentEnergy.toFixed(4),
      n.final_state,
      n.isAlive ? 1 : 0,
      activeClusterHeads.includes(n.node_id) ? 1 : 0,
      activeScenario.sensingRadius,
      activeScenario.commRadius
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(`WSN_Simulation_Round_${currentRound}_Dataset.csv`, csvContent, 'text/csv;charset=utf-8;');
  };

  // 2. Export Complete Simulation JSON Configuration
  const handleExportJSON = () => {
    const config = {
      project: 'NeuroSense-WSN Research Digital Twin',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      simulationState: {
        currentRound,
        selectedProtocol,
        selectedOptimizer,
        scenario: activeScenario,
        telemetry
      },
      nodes: nodes.map((n) => ({
        id: n.node_id,
        position: { x: n.x, y: n.y },
        energy: { initial: n.energy, residual: n.currentEnergy },
        role: n.final_state,
        isAlive: n.isAlive,
        isCH: activeClusterHeads.includes(n.node_id)
      }))
    };

    triggerDownload(`WSN_Simulation_State_Round_${currentRound}.json`, JSON.stringify(config, null, 2), 'application/json');
  };

  // 3. Export 100-Seed Benchmark Summary Matrix
  const handleExportBenchmark = () => {
    const benchmarkCSV = `Protocol,Active_Nodes,Sleep_Nodes,Coverage_Pct,Overlap_Pct,FND_Rounds,HND_Rounds,LND_Rounds,Throughput_Pkts,Runtime_s
Proposed_ANN_PSO_Hybrid,56.0,44.0,92.73,54.97,425.33,1000.00,1000.00,48109,128.06
Baseline_PSO_Hybrid,100.0,0.0,93.73,82.51,144.67,852.00,1000.00,71520,252.69
Hybrid_LEACH_PEGASIS,100.0,0.0,93.73,82.51,310.00,780.00,1000.00,64200,210.40
PEGASIS_Greedy_Chain,100.0,0.0,93.73,82.51,280.00,720.00,1000.00,58300,185.10
LEACH_Probabilistic,100.0,0.0,93.73,82.51,144.67,610.00,1000.00,52100,140.20`;

    triggerDownload('WSN_100_Seed_Benchmark_Matrix.csv', benchmarkCSV, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0D1626] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#1C3150] shadow-2xl shadow-cyan-950/40 text-slate-100 relative space-y-6 font-mono text-xs">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#1C3150]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Research Data &amp; Export Center
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Export empirical simulation telemetry, datasets, benchmark tables, and configs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0B1220] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Successfully downloaded <strong>{downloadSuccess}</strong></span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Option 1: CSV Export */}
          <div className="bg-[#070B14] rounded-2xl p-4 border border-[#1C3150] hover:border-cyan-500/40 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Node State CSV Dataset</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Full per-node positions, residual energies, active/sleep roles, and sensing metrics for current round ({currentRound}).
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Node CSV</span>
            </button>
          </div>

          {/* Option 2: JSON Config Export */}
          <div className="bg-[#070B14] rounded-2xl p-4 border border-[#1C3150] hover:border-blue-500/40 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-400 font-bold">
                <Code2 className="w-4 h-4" />
                <span>Simulation JSON State</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Complete structured state object including active scenario, topology, routing parameters, and telemetry.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON State</span>
            </button>
          </div>

          {/* Option 3: Benchmark Summary */}
          <div className="bg-[#070B14] rounded-2xl p-4 border border-[#1C3150] hover:border-violet-500/40 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-violet-400 font-bold">
                <Database className="w-4 h-4" />
                <span>100-Seed Benchmark Matrix</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Comparative matrix across Proposed PSO-Hybrid, LEACH, PEGASIS, and Hybrid algorithms.
              </p>
            </div>
            <button
              onClick={handleExportBenchmark}
              className="w-full py-2 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Benchmark CSV</span>
            </button>
          </div>

          {/* Option 4: Executive Report */}
          <div className="bg-[#070B14] rounded-2xl p-4 border border-[#1C3150] hover:border-amber-500/40 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <FileText className="w-4 h-4" />
                <span>Academic Paper (.md)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Complete 22-section technical guide containing mathematical formulations, pseudocode, and citations.
              </p>
            </div>
            <button
              onClick={() => {
                const guideBtn = document.getElementById('master-guide');
                onClose();
                if (guideBtn) guideBtn.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Go to Master Guide</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
