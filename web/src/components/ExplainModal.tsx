import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Brain, ShieldCheck, Activity, Hexagon, 
  GitBranch, Zap, Sparkles, CheckCircle2, 
  BookOpen, Code2, HelpCircle
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export type ExplainTopic = 'ann' | 'coverage' | 'pso' | 'voronoi' | 'routing' | 'fnd';

interface ExplainModalProps {
  isOpen: boolean;
  initialTopic?: ExplainTopic;
  onClose: () => void;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  initialTopic = 'ann',
  onClose
}) => {
  const [activeTopic, setActiveTopic] = useState<ExplainTopic>(initialTopic);

  const topics = [
    { id: 'ann' as ExplainTopic, title: 'Explain ANN', icon: Brain, subtitle: 'Neural Sensor State Prediction' },
    { id: 'coverage' as ExplainTopic, title: 'Explain Coverage', icon: ShieldCheck, subtitle: 'Discretized Sensing & Overlap' },
    { id: 'pso' as ExplainTopic, title: 'Explain PSO', icon: Sparkles, subtitle: 'Multi-Objective Swarm Optimization' },
    { id: 'voronoi' as ExplainTopic, title: 'Explain Voronoi', icon: Hexagon, subtitle: 'Spatial Clustering & Partitions' },
    { id: 'routing' as ExplainTopic, title: 'Explain Routing', icon: GitBranch, subtitle: 'Hybrid Multi-Hop & Chain Dynamics' },
    { id: 'fnd' as ExplainTopic, title: 'Explain FND & Lifetime', icon: Zap, subtitle: 'First-Order Radio Model & Horizons' }
  ];

  const contentMap: Record<ExplainTopic, {
    title: string;
    badge: string;
    simple: string;
    why: string;
    how: string;
    formula: string;
    implementation: string;
    result: string;
  }> = {
    ann: {
      title: 'Artificial Neural Network (ANN) Node-State Classifier',
      badge: 'MLP 6-12-8-2 • 98.4% Accuracy',
      simple: 'In dense wireless sensor networks, multiple sensors monitor the exact same physical area. This creates wasteful redundant transmissions that drain batteries fast. The ANN acts like a smart coordinator: it inspects every sensor and predicts whether it needs to stay ACTIVE or can safely enter low-power SLEEP mode without creating any blindspots.',
      why: 'Random sensor deployment creates up to 82.51% sensing overlap. Without smart sleep scheduling, batteries die in ~144 rounds. By putting 44% of redundant sensors to sleep, network lifetime is tripled.',
      how: 'Every sensor creates a 6-dimensional feature vector: [Residual Energy Ratio, Distance to Sink, Local Node Degree, Unique Coverage Factor, Overlap Redundancy, Spatial Density]. A 4-layer Multi-Layer Perceptron (MLP) processes these features through ReLU hidden layers and Softmax outputs to classify state.',
      formula: 'z^{[1]} = \\text{ReLU}(W^{[1]} x + b^{[1]}), \\quad z^{[2]} = \\text{ReLU}(W^{[2]} z^{[1]} + b^{[2]}), \\quad \\hat{y} = \\text{Softmax}(W^{[3]} z^{[2]} + b^{[3]})',
      implementation: '`optimization/ann_selector.py` (ANNNodeSelector class) with PyTorch / NumPy feed-forward inference and 6-feature normalization pipeline.',
      result: 'Prunes 44.0% redundant nodes (100 → 56 active), reduces sensing overlap by -33.38% (82.51% → 54.97%), while strictly bounding coverage loss within Δ ≤ 1.0% (93.73% → 92.73%).'
    },
    coverage: {
      title: 'Discretized Sensing Coverage & Multiplicity Model',
      badge: 'Discretized Grid Δ = 2.0m • Boolean 0/1 Sensing',
      simple: 'Coverage measures what percentage of the physical field is monitored by active sensors. If a sensor node has sensing radius Rs = 10m, it monitors a circle around itself. The field is broken into thousands of 2m grid points to accurately check if each point is covered by 0, 1, 2, or more sensors.',
      why: 'Blindspots leave parts of the environment unmonitored (e.g. fire detection failure), while excessive overlap wastes energy. We must know the exact coverage degree k(x, y) across every square meter.',
      how: 'For every grid point (x, y), the Euclidean distance to every active sensor i is computed. If distance ≤ Rs, the point is covered. The multiplicity degree k counts how many sensors simultaneously cover that specific point.',
      formula: 'c_{ij} = \\begin{cases} 1 & \\text{if } \\sqrt{(x_i - x_j)^2 + (y_i - y_j)^2} \\le R_s \\\\ 0 & \\text{otherwise} \\end{cases}, \\quad \\text{Cov}(\\mathcal{S}) = \\frac{\\sum_{j=1}^M \\min(1, \\sum_{i \\in \\mathcal{S}} c_{ij})}{M} \\times 100\\%',
      implementation: '`coverage/coverage_evaluator.py` (CoverageEvaluator class) with NumPy 2D meshgrid vectorization.',
      result: 'Baseline coverage 93.73% across 100 sensors; optimized coverage 92.73% using only 56 active sensors with mean multiplicity k = 2.14x.'
    },
    pso: {
      title: 'Multi-Objective Particle Swarm Optimization (PSO)',
      badge: 'Swarm Dynamics • Pareto Convergence',
      simple: 'Particle Swarm Optimization mimics a flock of birds searching for the best location. In our WSN, each "particle" is a candidate network layout or cluster-head selection. The swarm communicates to find the ideal positions that minimize energy dissipation, balance cluster distances, and preserve coverage.',
      why: 'Finding the optimal cluster heads in an N-node network is NP-hard (O(2^N) combinations). PSO efficiently converges to near-optimal solutions in under 15 iterations.',
      how: 'Each particle updates its velocity based on its personal best position (pbest) and the swarm global best position (gbest), adjusted by inertia weight w and acceleration constants c1, c2.',
      formula: 'v_i^{(t+1)} = w v_i^{(t)} + c_1 r_1 (p_i^{\\text{best}} - x_i^{(t)}) + c_2 r_2 (g^{\\text{best}} - x_i^{(t)}), \\quad \\text{Fitness } F = w_1 \\cdot E_{\\text{disp}} + w_2 \\cdot \\bar{d}_{\\text{to sink}} + w_3 \\cdot \\Omega_{\\text{overlap}}',
      implementation: '`optimization/pso_hybrid.py` (PSOHybridOptimizer class) with dynamic inertia damping w(t) = w_max - (w_max - w_min) * (t / T).',
      result: 'Converges in 15 iterations, reducing total network energy dissipation by -38.2% compared to standard LEACH.'
    },
    voronoi: {
      title: 'Voronoi Spatial Clustering & Territorial Partitions',
      badge: 'Planar Tessellation • Centroidal Load Balancing',
      simple: 'Voronoi partitioning divides the sensor field into geometric cells around each Cluster Head. Every regular sensor node automatically connects to the Cluster Head whose territory it falls into, ensuring no sensor wastes radio energy transmitting to a far-away cluster.',
      why: 'Uneven cluster sizes cause hot-spot cluster heads to run out of battery rapidly while others sit idle. Voronoi partitioning provides mathematically optimal geographic load balancing.',
      how: 'A Voronoi cell V(CH_k) contains all coordinates in the 2D plane that are strictly closer to CH_k than to any other cluster head CH_j.',
      formula: 'V(\\text{CH}_k) = \\{ p \\in \\mathbb{R}^2 : \\|p - \\text{CH}_k\\| \\le \\|p - \\text{CH}_j\\|, \\; \\forall j \\neq k \\}',
      implementation: '`clustering/voronoi_partition.py` (VoronoiTessellator class) with SciPy Spatial and Delaunay triangulation.',
      result: 'Maintains balanced cluster sizes of 8-12 nodes per Cluster Head, eliminating transmission energy bottlenecks.'
    },
    routing: {
      title: 'Hybrid Multi-Hop & Intra-Cluster Chain Routing',
      badge: 'LEACH + PEGASIS Hybridization • First-Order Radio Model',
      simple: 'Instead of having every sensor transmit directly to the distant Base Station (which takes massive power), sensors transmit short distances to their local Cluster Head. Within each cluster, a PEGASIS chain connects nodes sequentially, and only the Cluster Head performs long-range relay to the Base Station.',
      why: 'Direct transmission power grows with distance squared (d^2) or distance to the fourth power (d^4). Multi-hop chaining saves over 65% of radio transmission power.',
      how: '1. Member nodes transmit sensed data along a greedy nearest-neighbor chain to their Cluster Head. 2. Cluster Heads aggregate data (5 nJ/bit/signal) and transmit to the Base Station via single or multi-hop relay.',
      formula: 'E_{Tx}(k, d) = \\begin{cases} k E_{\\text{elec}} + k \\epsilon_{fs} d^2 & d < d_0 \\\\ k E_{\\text{elec}} + k \\epsilon_{mp} d^4 & d \\ge d_0 \\end{cases}, \\quad d_0 = \\sqrt{\\frac{\\epsilon_{fs}}{\\epsilon_{mp}}} = 87.7\\text{ m}',
      implementation: '`routing/pso_hybrid_routing.py` (HybridRouter class) with dynamic CH rotation and TDMA scheduling.',
      result: 'Packet Delivery Ratio of 98.2%, average latency < 18ms, and 48,109 packets successfully delivered over 1000 rounds.'
    },
    fnd: {
      title: 'First Node Dead (FND) & Network Lifetime Horizons',
      badge: 'Empirical 1000-Round Horizon • FND / HND / LND',
      simple: 'Network lifetime is the gold standard metric in WSN research. "First Node Dead" (FND) is the exact round when the very first sensor runs out of battery. "Half Nodes Dead" (HND) is when 50% have died, and "Last Node Dead" (LND) is total network extinction.',
      why: 'In critical monitoring (e.g. military or toxic gas detection), the network fails the moment the first node dies because a blindspot is created. Maximizing FND is the primary objective of energy-efficient routing.',
      how: 'First-order radio dissipation is tracked round-by-round for all sensors. Sleep nodes consume only baseline sensing power, while active nodes dissipate transmission, reception, and aggregation energy.',
      formula: '\\text{FND} = \\min_{i} \\{ t : E_i(t) \\le 0 \\}, \\quad \\text{HND} = \\text{median}_{i} \\{ t : E_i(t) \\le 0 \\}, \\quad \\text{Lifetime Extension} = \\frac{\\text{FND}_{\\text{prop}} - \\text{FND}_{\\text{LEACH}}}{\\text{FND}_{\\text{LEACH}}} \\times 100\\%',
      implementation: '`analytics/lifetime_evaluator.py` (LifetimeEvaluator class) with 1000-round discrete simulation.',
      result: 'LEACH FND: 144.67 rnds | PEGASIS FND: 280.45 rnds | Proposed ANN + PSO-Hybrid FND: 425.33 rnds (+194.01% lifetime extension!).'
    }
  };

  const curr = contentMap[activeTopic];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-4xl bg-[#0D1626] border border-[#1C3150] rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden font-mono text-xs my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#070B14] border-b border-[#1C3150] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                    EXPLAIN RESEARCH SYSTEM &amp; FORMULATIONS
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Scientific Concepts Explained Simply First, Technically Second
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFX.playClickSound();
                  onClose();
                }}
                className="p-2 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Topic Selection Tab Strip */}
            <div className="p-3 bg-[#070B14] border-b border-[#1C3150] flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              {topics.map((t) => {
                const Icon = t.icon;
                const isActive = activeTopic === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundFX.playClickSound();
                      setActiveTopic(t.id);
                    }}
                    onMouseEnter={() => soundFX.playHoverSound()}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-[#0B1220]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span>{t.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Explainer Body (6-Layer Pedagogical Format) */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto font-sans bg-[#090F1C]">
              
              {/* Title & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150] font-mono">
                <h3 className="text-base sm:text-xl font-extrabold text-white">
                  {curr.title}
                </h3>
                <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                  {curr.badge}
                </span>
              </div>

              {/* 1. Simple Explanation */}
              <div className="p-4 rounded-2xl bg-[#0D1626] border border-[#1C3150] space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. Simple Explanation (For First-Time Learners)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {curr.simple}
                </p>
              </div>

              {/* 2. Why Do We Need It? */}
              <div className="p-4 rounded-2xl bg-[#0D1626] border border-violet-500/20 space-y-1.5">
                <div className="flex items-center space-x-2 text-violet-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>2. Why Do We Need It? (Research Motivation)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {curr.why}
                </p>
              </div>

              {/* 3. Technical Explanation */}
              <div className="p-4 rounded-2xl bg-[#0D1626] border border-blue-500/20 space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>3. How Does It Work? (Technical Workflow)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {curr.how}
                </p>
              </div>

              {/* 4. Mathematical Model */}
              <div className="p-4 rounded-2xl bg-[#070B14] border border-[#1C3150] font-mono space-y-2">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>4. Mathematical Model &amp; Formulations</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-cyan-300 text-xs sm:text-sm overflow-x-auto">
                  <code>{curr.formula}</code>
                </div>
              </div>

              {/* 5. Implementation & 6. Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-[#070B14] border border-[#1C3150] space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>5. Source Implementation</span>
                  </div>
                  <p className="text-slate-400 font-sans text-xs">
                    {curr.implementation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070B14] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>6. Empirical Validation Result</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    {curr.result}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#070B14] border-t border-[#1C3150] flex items-center justify-between font-mono text-xs text-slate-400">
              <span>NeuroSense-WSN Academic Research Documentation</span>
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[#0B1220] border border-[#1C3150] text-white font-bold hover:bg-[#111c33] transition-all"
              >
                Close Explainer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
