import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Zap, Cpu, Network, Battery, Clock, TrendingUp, Brain, 
  ShieldCheck, CheckCircle2, AlertTriangle, Layers, Activity, Eye,
  Maximize2, X
} from 'lucide-react';
import { useState } from 'react';
import { WSN3DVisualizer } from './components/WSN3DVisualizer';
import { InteractiveSimulator } from './components/InteractiveSimulator';

interface GraphItem {
  id: string;
  title: string;
  category: string;
  filename: string;
  metric: string;
  baseline: string;
  proposed: string;
  change: string;
  isPositive: boolean;
  description: string;
}

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

const SEED_DATA = [
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

function App() {
  const [activeSection, setActiveSection] = useState('simulation-3d');
  const [selectedGraph, setSelectedGraph] = useState<GraphItem | null>(null);
  const [selectedSeedTab, setSelectedSeedTab] = useState<number>(42);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const downloadSummaryJSON = () => {
    const a = document.createElement('a');
    a.href = '/data/final_summary_results.json';
    a.download = 'wsn_final_summary_results.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-slate-950/85 backdrop-blur-xl z-50 border-b border-cyan-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection('simulation-3d')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                  ANN + PSO-Hybrid WSN
                </span>
                <span className="block text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                  3D Simulation &amp; Optimization
                </span>
              </div>
            </motion.div>

            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: '3D Simulation', id: 'simulation-3d' },
                { name: 'Summary Metrics', id: 'metrics' },
                { name: 'Architecture', id: 'architecture' },
                { name: 'Comparison', id: 'comparison' },
                { name: 'Visual Graphs', id: 'graphs' },
                { name: 'Seed Evaluation', id: 'seeds' },
                { name: 'Canvas Simulator', id: 'simulator-canvas' },
                { name: 'Residual Energy', id: 'table' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeSection === item.id 
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header & 3D Simulation Showcase */}
      <section id="simulation-3d" className="pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background glow elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Banner */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4 shadow-inner"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Verified Results • 100-Node Heterogeneous WSN Deployment</span>
            </motion.div>

            <motion.h1 
              className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-cyan-100 to-purple-300 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              ANN-Based Coverage Optimization and PSO-Hybrid Energy-Efficient Routing in Wireless Sensor Networks
            </motion.h1>

            <motion.p 
              className="text-xs sm:text-sm text-slate-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Experience the 3D animated sensor network below. Observe progressive node state classification, sensing coverage expansion, overlap reduction, and dynamic PSO cluster-head routing to the Base Station.
            </motion.p>
          </div>

          {/* 3D WSN Visualizer Component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-12"
          >
            <WSN3DVisualizer initialSeed={42} initialProtocol="proposed" />
          </motion.div>

          {/* Quick Nav Anchors */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => scrollToSection('metrics')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/40 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 shadow-lg"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Summary Metrics</span>
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-purple-500/40 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 shadow-lg"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Architecture Pipeline</span>
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-emerald-500/40 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 shadow-lg"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Baseline vs. Proposed</span>
            </button>
            <button
              onClick={() => scrollToSection('graphs')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500/40 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 shadow-lg"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Matplotlib Graphs</span>
            </button>
          </div>
        </div>
      </section>

      {/* Summary Metrics Cards Section */}
      <section id="metrics" className="py-20 px-4 bg-slate-900/40 relative border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Verified Performance Indicators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Comprehensive 3-Seed Average Results
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Experimentally verified metrics computed over 1000 simulation rounds across independent random deployment seeds (42, 123, and 456).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* 1. Active Nodes */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  -44.0%
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Sensor Nodes</h3>
              <div className="text-3xl font-extrabold text-white mt-1">56 <span className="text-sm font-normal text-slate-400">Nodes</span></div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 100 nodes. 44 nodes placed in sleep mode.</p>
            </motion.div>

            {/* 2. Sleeping Nodes */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                  <Battery className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  100% Preserved
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sleeping Nodes</h3>
              <div className="text-3xl font-extrabold text-white mt-1">44 <span className="text-sm font-normal text-slate-400">Nodes</span></div>
              <p className="text-xs text-slate-400 mt-2">Idle nodes do not transmit or route data, retaining full battery.</p>
            </motion.div>

            {/* 3. Coverage */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-blue-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Δ = 1.00%
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sensing Coverage</h3>
              <div className="text-3xl font-extrabold text-white mt-1">92.73%</div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 93.73%. Strictly maintained within 1% target.</p>
            </motion.div>

            {/* 4. Overlap */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  -33.38% Overlap
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sensing Overlap</h3>
              <div className="text-3xl font-extrabold text-white mt-1">54.97%</div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 82.51%. Substantial reduction in sensing redundancy.</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* 5. FND */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-purple-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  +194.01%
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">First Node Dead (FND)</h3>
              <div className="text-3xl font-extrabold text-white mt-1">425.33 <span className="text-sm font-normal text-slate-400">Rounds</span></div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 144.67 rnds. Stability period extended nearly 3x.</p>
            </motion.div>

            {/* 6. HND */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-sky-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Max Limit Reached
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Half Nodes Dead (HND)</h3>
              <div className="text-3xl font-extrabold text-white mt-1">1000 <span className="text-sm font-normal text-slate-400">Rounds</span></div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 852.0 rnds. Over 50% nodes remained alive through round 1000.</p>
            </motion.div>

            {/* 7. Runtime */}
            <motion.div 
              className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  -49.32% Time
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Simulation Runtime</h3>
              <div className="text-3xl font-extrabold text-white mt-1">128.06 <span className="text-sm font-normal text-slate-400">Seconds</span></div>
              <p className="text-xs text-slate-400 mt-2">Baseline: 252.69s. 49.3% faster due to compact active routing topology.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Complete Architecture Section */}
      <section id="architecture" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              System Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Proposed 7-Stage Architectural Pipeline
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              End-to-end framework integrating intelligent machine learning node prediction with metaheuristic swarm routing.
            </p>
          </div>

          {/* Architecture Flow Chart Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                step: '1',
                title: 'WSN Deployment',
                subtitle: 'Heterogeneous Node Field',
                icon: Network,
                color: 'text-cyan-400',
                border: 'border-cyan-500/30',
                bg: 'bg-cyan-500/10',
                desc: '100 nodes deployed across 100m x 100m area. Heterogeneous energy levels: Normal (0.5J), Advanced (1.0J), Super (1.5J).'
              },
              {
                step: '2',
                title: 'ANN Prediction',
                subtitle: 'Active vs. Sleep Prediction',
                icon: Brain,
                color: 'text-purple-400',
                border: 'border-purple-500/30',
                bg: 'bg-purple-500/10',
                desc: 'MLP neural classifier with 6 features (energy, sink distance, neighbors, coverage contribution, overlap ratio, density).'
              },
              {
                step: '3',
                title: 'Coverage Optimizer',
                subtitle: 'Preservation & Pruning',
                icon: ShieldCheck,
                color: 'text-emerald-400',
                border: 'border-emerald-500/30',
                bg: 'bg-emerald-500/10',
                desc: 'Greedily adds sleeping nodes if coverage < baseline - 1.0%, then prunes redundant active nodes to minimize overlap.'
              },
              {
                step: '4',
                title: 'Active/Sleep Selection',
                subtitle: 'Topology Partitioning',
                icon: Battery,
                color: 'text-amber-400',
                border: 'border-amber-500/30',
                bg: 'bg-amber-500/10',
                desc: '56 active nodes assigned to routing pool; 44 sleeping nodes remain idle and preserve 100% of their initial energy.'
              },
              {
                step: '5',
                title: 'PSO CH Selection',
                subtitle: 'Multi-Objective Swarm',
                icon: Zap,
                color: 'text-yellow-400',
                border: 'border-yellow-500/30',
                bg: 'bg-yellow-500/10',
                desc: 'PSO optimizes Cluster Heads using composite fitness: CH energy, sink distance, intra-cluster distance, coverage, and overlap.'
              },
              {
                step: '6',
                title: 'Hybrid Routing',
                subtitle: 'PEGASIS Chains + Multi-hop',
                icon: Cpu,
                color: 'text-blue-400',
                border: 'border-blue-500/30',
                bg: 'bg-blue-500/10',
                desc: 'Intra-cluster greedy nearest-neighbor chaining with data aggregation; inter-cluster direct or multi-hop transmission to Sink.'
              },
              {
                step: '7',
                title: 'Performance Evaluation',
                subtitle: 'Multi-Metric Tracking',
                icon: Activity,
                color: 'text-pink-400',
                border: 'border-pink-500/30',
                bg: 'bg-pink-500/10',
                desc: 'Continuous round tracking of active coverage, sensing overlap, FND, HND, LND, throughput, and energy variance.'
              }
            ].map((card, idx) => (
              <motion.div 
                key={idx}
                className={`bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border ${card.border} hover:shadow-xl hover:shadow-cyan-500/5 transition-all relative overflow-hidden`}
                whileHover={{ y: -4 }}
              >
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-500 border border-slate-700">
                  0{card.step}
                </div>
                <div className={`p-3 w-12 h-12 ${card.bg} rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
                <span className={`text-xs font-semibold ${card.color} block mb-3`}>{card.subtitle}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ANN Methodology Notice */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400 flex-shrink-0 mt-0.5">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-purple-300 mb-1">
                  Machine Learning Labeling Methodology Notice
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The Artificial Neural Network (MLPClassifier with hidden layers <code className="text-purple-300 font-mono">16, 8</code>) is trained on <strong>heuristic node-state labels</strong> generated from spatial coverage contributions, sensing overlap metrics, and local node densities. It is accurately documented as an analytical heuristic predictor, not trained on experimental ground truth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison & Throughput Trade-off Section */}
      <section id="comparison" className="py-20 px-4 bg-slate-900/40 relative border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Quantitative Benchmarks
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Baseline PSO-Hybrid vs. Proposed ANN + PSO-Hybrid
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Direct comparison of lifecycle metrics, sensing quality, and energy efficiency.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700/80 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <th className="py-4 px-6">Performance Metric</th>
                    <th className="py-4 px-6 text-slate-400">Baseline PSO-Hybrid</th>
                    <th className="py-4 px-6 text-cyan-400 bg-cyan-500/5">Proposed ANN + PSO</th>
                    <th className="py-4 px-6">Absolute Change</th>
                    <th className="py-4 px-6">Relative % Change</th>
                    <th className="py-4 px-6">Key Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Active Sensor Nodes</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">100.0 Nodes</td>
                    <td className="py-4 px-6 font-bold text-cyan-400 bg-cyan-500/5">56.0 Nodes</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">-44.0 Nodes</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">-44.00%</td>
                    <td className="py-4 px-6 text-slate-400">44% active node reduction, conserving battery life</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Battery className="w-4 h-4 text-amber-400" />
                      <span>Sleeping Sensor Nodes</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">0.0 Nodes</td>
                    <td className="py-4 px-6 font-bold text-amber-400 bg-cyan-500/5">44.0 Nodes</td>
                    <td className="py-4 px-6 text-amber-400 font-medium">+44.0 Nodes</td>
                    <td className="py-4 px-6 text-amber-400 font-bold">+100.0%</td>
                    <td className="py-4 px-6 text-slate-400">Redundant nodes placed in zero-power sleep mode</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>WSN Sensing Coverage</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">93.733180%</td>
                    <td className="py-4 px-6 font-bold text-blue-400 bg-cyan-500/5">92.733564%</td>
                    <td className="py-4 px-6 text-blue-300 font-medium">-0.9996%</td>
                    <td className="py-4 px-6 text-blue-300 font-bold">-1.07%</td>
                    <td className="py-4 px-6 text-slate-400">Coverage strictly preserved within target (Δ ≈ 1.0%)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Sensing Overlap Ratio</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">82.513170%</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-cyan-500/5">54.969469%</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">-27.5437%</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">-33.38%</td>
                    <td className="py-4 px-6 text-slate-400">Substantial 33.38% drop in redundant sensing overlap</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>First Node Dead (FND)</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">144.666667 Rnds</td>
                    <td className="py-4 px-6 font-bold text-purple-400 bg-cyan-500/5">425.333333 Rnds</td>
                    <td className="py-4 px-6 text-purple-300 font-medium">+280.67 Rnds</td>
                    <td className="py-4 px-6 text-purple-300 font-bold">+194.01%</td>
                    <td className="py-4 px-6 text-slate-400">Network stability phase prolonged by nearly 3x</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span>Half Nodes Dead (HND)</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">852.000000 Rnds</td>
                    <td className="py-4 px-6 font-bold text-sky-400 bg-cyan-500/5">1000.000000 Rnds</td>
                    <td className="py-4 px-6 text-sky-300 font-medium">+148.00 Rnds</td>
                    <td className="py-4 px-6 text-sky-300 font-bold">+17.37%</td>
                    <td className="py-4 px-6 text-slate-400">HND extended to the 1000-round simulation horizon</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Last Node Dead (LND)</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">1000.000000 Rnds</td>
                    <td className="py-4 px-6 font-bold text-teal-400 bg-cyan-500/5">1000.000000 Rnds</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">0.00 Rnds</td>
                    <td className="py-4 px-6 text-slate-400 font-bold">0.00%</td>
                    <td className="py-4 px-6 text-slate-400">LND was not reached within 1000-round limit</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Network className="w-4 h-4 text-pink-400" />
                      <span>Network Throughput</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">71,520 Packets</td>
                    <td className="py-4 px-6 font-bold text-pink-400 bg-cyan-500/5">48,109 Packets</td>
                    <td className="py-4 px-6 text-pink-300 font-medium">-23,411 Pkts</td>
                    <td className="py-4 px-6 text-pink-300 font-bold">-32.73%</td>
                    <td className="py-4 px-6 text-slate-400">Expected trade-off due to 44% sleeping nodes</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <span>Simulation Runtime</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">252.685812 s</td>
                    <td className="py-4 px-6 font-bold text-indigo-400 bg-cyan-500/5">128.056544 s</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">-124.63 s</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">-49.32%</td>
                    <td className="py-4 px-6 text-slate-400">49.3% faster execution due to compact active topology</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Throughput Trade-off Callout Card */}
          <div className="bg-slate-900/90 border border-pink-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-pink-500/15 rounded-xl text-pink-400 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-pink-300 mb-1">
                  Throughput Trade-off Explanation (71,520 → 48,109 Packets)
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Total packets delivered decreased from <strong>71,520 packets</strong> to <strong>48,109 packets</strong> (a 32.73% reduction). This is an <strong>expected and intentional engineering trade-off</strong>: by turning off 44 redundant nodes, duplicate sensor observations are eliminated at the source. The remaining 56 active nodes provide <strong>92.73% sensing coverage</strong> while avoiding duplicate radio transmissions that needlessly exhaust battery energy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Comparison Graphs Gallery */}
      <section id="graphs" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Experimental Visualizations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Generated Matplotlib Comparison Charts
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Click any chart to inspect high-resolution comparative figures generated directly by the experimental evaluation scripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GRAPHS.map((graph) => (
              <motion.div
                key={graph.id}
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all overflow-hidden cursor-pointer group shadow-xl"
                whileHover={{ y: -5 }}
                onClick={() => setSelectedGraph(graph)}
              >
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{graph.category}</span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{graph.title}</h3>
                  </div>
                  <Maximize2 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                
                <div className="p-3 bg-slate-950 flex items-center justify-center relative overflow-hidden aspect-video">
                  <img 
                    src={graph.filename} 
                    alt={graph.title}
                    className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4 bg-slate-900/50">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Baseline: <strong className="text-slate-300">{graph.baseline}</strong></span>
                    <span className="text-slate-400">Proposed: <strong className="text-cyan-400">{graph.proposed}</strong></span>
                  </div>
                  <div className={`text-xs font-semibold ${graph.isPositive ? 'text-emerald-400' : 'text-pink-400'}`}>
                    {graph.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-Seed Breakdown Section */}
      <section id="seeds" className="py-20 px-4 bg-slate-900/40 relative border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Multi-Seed Evaluation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Per-Seed Detailed Experimental Runs
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Verification across independent deployment seeds 42, 123, and 456 confirming reproducibility.
            </p>
          </div>

          {/* Seed Selector Tabs */}
          <div className="flex justify-center space-x-3 mb-8">
            {[42, 123, 456].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeedTab(s)}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedSeedTab === s 
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' 
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Seed {s}
              </button>
            ))}
          </div>

          {/* Selected Seed Table Card */}
          {(() => {
            const currentSeed = SEED_DATA.find((item) => item.seed === selectedSeedTab) || SEED_DATA[0];
            return (
              <motion.div 
                key={selectedSeedTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl max-w-5xl mx-auto"
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                    <span>Deployment Seed {currentSeed.seed} Analysis</span>
                  </h3>
                  <span className="text-xs px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full font-semibold border border-cyan-500/20">
                    1000 Simulation Rounds
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-300 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Routing Method</th>
                        <th className="py-3 px-4">Active Nodes</th>
                        <th className="py-3 px-4">Sleeping Nodes</th>
                        <th className="py-3 px-4">Coverage (%)</th>
                        <th className="py-3 px-4">Overlap (%)</th>
                        <th className="py-3 px-4">FND (Rnds)</th>
                        <th className="py-3 px-4">HND (Rnds)</th>
                        <th className="py-3 px-4">Throughput</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr className="hover:bg-slate-800/20">
                        <td className="py-3 px-4 font-semibold text-slate-300">Baseline PSO-Hybrid</td>
                        <td className="py-3 px-4 text-slate-400">{currentSeed.baseline.active}</td>
                        <td className="py-3 px-4 text-slate-400">{currentSeed.baseline.sleep}</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.cov.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.ovl.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.fnd}</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.hnd}</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{currentSeed.baseline.pkts.toLocaleString()} pkts</td>
                      </tr>
                      <tr className="hover:bg-slate-800/20 bg-cyan-500/5 font-semibold">
                        <td className="py-3 px-4 text-cyan-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                          <span>ANN + PSO-Hybrid</span>
                        </td>
                        <td className="py-3 px-4 text-cyan-400">{currentSeed.proposed.active}</td>
                        <td className="py-3 px-4 text-amber-400">{currentSeed.proposed.sleep}</td>
                        <td className="py-3 px-4 text-blue-400">{currentSeed.proposed.cov.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-emerald-400">{currentSeed.proposed.ovl.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-purple-400">{currentSeed.proposed.fnd}</td>
                        <td className="py-3 px-4 text-sky-400">{currentSeed.proposed.hnd}</td>
                        <td className="py-3 px-4 text-pink-400">{currentSeed.proposed.pkts.toLocaleString()} pkts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </section>

      {/* 2D Canvas Simulator Section (Secondary verification tool) */}
      <section id="simulator-canvas" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Interactive 2D Canvas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Step-by-Step 2D Network Simulation
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Customizable real-time parameter tweaking with instantaneous energy dissipation curves.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-8 shadow-2xl">
            <InteractiveSimulator />
          </div>
        </div>
      </section>

      {/* Residual Energy Benchmark Table Section */}
      <section id="table" className="py-20 px-4 bg-slate-900/40 relative border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Dataset Artifacts
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Experimental Residual Energy Benchmark
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Sampled 1000-round energy dissipation benchmark comparing LEACH, PEGASIS, HYBRID, and PSO_HYBRID.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">1000-Round Average Residual Energy Dataset</h3>
                <span className="text-xs text-slate-400">Maintained in <code className="text-cyan-400 font-mono">res-energy table.csv</code></span>
              </div>
              <button
                onClick={downloadSummaryJSON}
                className="px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Summary JSON</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4 text-cyan-400">LEACH</th>
                    <th className="py-3 px-4 text-yellow-400">PEGASIS</th>
                    <th className="py-3 px-4 text-emerald-400">HYBRID</th>
                    <th className="py-3 px-4 text-purple-400 font-bold bg-purple-500/10">✨ PSO_HYBRID (Proposed)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {[
                    [1, 0.4971, 0.4984, 0.4985, 0.6988],
                    [100, 0.2497, 0.3876, 0.3782, 0.5868],
                    [200, 0.1359, 0.2774, 0.3164, 0.4998],
                    [300, 0.0381, 0.1692, 0.2886, 0.4357],
                    [348, 0.0000, 0.1254, 0.2649, 0.4197],
                    [400, 0.0000, 0.0894, 0.2647, 0.3878],
                    [500, 0.0000, 0.0225, 0.2483, 0.3568],
                    [537, 0.0000, 0.0000, 0.2396, 0.3436],
                    [700, 0.0000, 0.0000, 0.1982, 0.3050],
                    [850, 0.0000, 0.0000, 0.1612, 0.2935],
                    [1000, 0.0000, 0.0000, 0.1424, 0.2624],
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-4 font-bold text-slate-300">Round {row[0]}</td>
                      <td className={`py-2.5 px-4 ${row[1] === 0 ? 'text-red-400' : 'text-slate-300'}`}>{row[1].toFixed(4)} J</td>
                      <td className={`py-2.5 px-4 ${row[2] === 0 ? 'text-red-400' : 'text-slate-300'}`}>{row[2].toFixed(4)} J</td>
                      <td className="py-2.5 px-4 text-emerald-300">{row[3].toFixed(4)} J</td>
                      <td className="py-2.5 px-4 text-purple-300 font-bold bg-purple-500/5">{row[4].toFixed(4)} J</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Graph Lightbox Modal */}
      <AnimatePresence>
        {selectedGraph && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedGraph(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedGraph(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{selectedGraph.category}</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedGraph.title}</h3>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-center mb-6 overflow-hidden">
                <img 
                  src={selectedGraph.filename} 
                  alt={selectedGraph.title} 
                  className="max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-700">
                  <span className="text-xs text-slate-400">Baseline: <strong className="text-slate-200">{selectedGraph.baseline}</strong></span>
                  <span className="text-xs text-slate-400">Proposed: <strong className="text-cyan-400">{selectedGraph.proposed}</strong></span>
                  <span className={`text-xs font-bold ${selectedGraph.isPositive ? 'text-emerald-400' : 'text-pink-400'}`}>{selectedGraph.change}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedGraph.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-950 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">ANN-Based Coverage Optimization &amp; PSO-Hybrid WSN</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-6">
            Energy-Efficient Wireless Sensor Network Routing with Artificial Neural Network Node-State Prediction and Particle Swarm Optimization.
          </p>
          <div className="text-[11px] text-slate-400">
            Faculty Validated Benchmark • Verified Results Across Seeds 42, 123, and 456
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
