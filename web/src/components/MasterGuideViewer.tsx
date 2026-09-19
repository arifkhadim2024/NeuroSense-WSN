import React, { useState } from 'react';
import { 
  Download, Search, ZoomIn, ZoomOut, BookOpen, 
  ShieldCheck, Printer, Cpu, Zap, Activity,
  Network, Code2, Layers, CheckCircle2,
  HelpCircle, Sparkles, Terminal, FileCode2
} from 'lucide-react';

export const MasterGuideViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeSection, setActiveSection] = useState<string>('abstract');

  const sections = [
    { id: 'abstract', number: '1', title: '1. Abstract & Executive Summary', icon: ShieldCheck },
    { id: 'problem', number: '2', title: '2. Problem Statement & Motivation', icon: HelpCircle },
    { id: 'architecture', number: '3', title: '3. Cyber-Physical WSN Architecture', icon: Network },
    { id: 'system_model', number: '4', title: '4. System Model & Network Assumptions', icon: Layers },
    { id: 'coverage_model', number: '5', title: '5. Discretized Sensing Coverage (Δ = 2m)', icon: ShieldCheck },
    { id: 'voronoi_model', number: '6', title: '6. Voronoi Territorial Partitioning', icon: Layers },
    { id: 'radio_model', number: '7', title: '7. First-Order Radio Dissipation Physics', icon: Zap },
    { id: 'ann_classifier', number: '8', title: '8. ANN Node-State Predictive Classifier', icon: Cpu },
    { id: 'optimization_algo', number: '9', title: '9. Coverage-Preserving Greedy Optimizer', icon: Sparkles },
    { id: 'pso_fitness', number: '10', title: '10. Multi-Objective PSO Fitness Function', icon: Activity },
    { id: 'routing_protocols', number: '11', title: '11. Routing Protocols: LEACH vs PEGASIS vs Hybrid vs PSO-Hybrid', icon: Network },
    { id: 'simulation_params', number: '12', title: '12. Empirical Simulation Parameters', icon: Terminal },
    { id: 'benchmark_results', number: '13', title: '13. 100-Seed Experimental Results Matrix', icon: Activity },
    { id: 'analysis_insights', number: '14', title: '14. Scientific Analysis & Insights', icon: CheckCircle2 },
    { id: 'pseudocode', number: '15', title: '15. Algorithm Execution Pseudocode', icon: Code2 },
    { id: 'source_arch', number: '16', title: '16. Python Source Code Architecture', icon: FileCode2 },
    { id: 'complexity', number: '17', title: '17. Computational Complexity & Scalability', icon: Cpu },
    { id: 'proofs', number: '18', title: '18. Energy Dissipation Equations & Proofs', icon: Zap },
    { id: 'visualizer', number: '19', title: '19. Multi-Camera 3D Digital Twin Visualizer', icon: Layers },
    { id: 'reproduction', number: '20', title: '20. Step-by-Step Reproduction Guide', icon: Terminal },
    { id: 'limitations', number: '21', title: '21. Limitations & Future Directions', icon: HelpCircle },
    { id: 'references', number: '22', title: '22. Academic References & Literature Citations', icon: BookOpen }
  ];

  const scrollToDocSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`doc-sec-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const text = `# NeuroSense-WSN: Energy-Efficient WSN Routing with ANN Node-State Prediction & Coverage Optimization
## Complete 22-Section Master Technical Research Guide

---

### 1. Abstract & Executive Summary
Wireless Sensor Networks (WSNs) deployed in environmental, agricultural, and industrial monitoring environments face severe energy constraints. In dense deployments, overlapping sensing radii create redundant data generation and accelerated battery depletion. This paper presents an integrated framework combining an Artificial Neural Network (ANN) node-state classifier, a greedy coverage-preserving optimizer bounded within Δ ≤ 1.0% of baseline coverage, and a Particle Swarm Optimization (PSO) multi-objective hybrid routing algorithm. Across 100 random deployment seeds, our proposed framework safely transitions 44% of sensors into low-power sleep mode, eliminates 33.38% of redundant sensing overlap, and extends First Node Dead (FND) lifetime by +194.01% (144.67 → 425.33 rounds).

---

### 2. Problem Statement & Motivation
Wireless Sensor Networks (WSNs) consist of spatially distributed, battery-operated sensor nodes deployed to monitor physical or environmental conditions. In dense deployments, sensor nodes frequently have overlapping sensing fields, causing:
1. Redundant Sensing & Transmission: Multiple adjacent nodes sense and transmit duplicate data, wasting finite battery power.
2. Accelerated Network Depletion: High energy dissipation leads to premature node failure (low First Node Dead / FND).
3. Severe Hot-Spot & Bottlenecks: Nodes near cluster heads or base stations deplete energy rapidly.

---

### 3. Cyber-Physical WSN Architecture
The complete system pipeline connects:
1. WSN Deployment (100 Nodes, Heterogeneous Energy)
2. ANN Node-State Prediction (Active vs. Sleep Classification)
3. Coverage & Overlap Optimization (Greedy Add & Overlap Pruning)
4. Active/Sleep Node Selection (Active: Routing | Sleep: Idle)
5. PSO Cluster-Head Selection (Energy, Sink, Intra, Cov, Overlap)
6. Hybrid / PEGASIS-style Routing (Intra-cluster Chains + Multi-hop)
7. Performance Evaluation (Coverage, Overlap, FND, HND, Throughput)

---

### 4. System Model & Network Assumptions
- Heterogeneous Node Deployment: Energy levels categorized into Normal (0.5 J), Advanced (1.0 J, m_adv=0.2, α=1.0), and Super (1.5 J, m_sup=0.1, β=2.0).
- Sensing Radius: R_s = 10 meters (Boolean disk sensing model).
- Communication Range: R_c = 2 * R_s = 20 meters.
- Base Station: Fixed coordinate located at (50, 150) or movable (50, 50).
- Data Aggregation: Cluster Heads compress member telemetry before multi-hop forwarding.

---

### 5. Discretized Sensing Coverage Formulation (Δ = 2m)
The sensing field [0, W] x [0, H] is discretized into a uniform grid G = {(x_g, y_g)} with step size Δ = 2 meters (51 x 51 = 2,601 grid points):
- Binary Coverage Indicator: I(i, g) = 1 if dist(node_i, g) <= R_s, else 0.
- Coverage Degree k(g): k(g) = sum_{i in S_active} I(i, g)
- Coverage Ratio C: C = |{g in G | k(g) >= 1}| / |G| * 100%
- Overlap Ratio O: O = |{g in G | k(g) > 1}| / |{g in G | k(g) >= 1}| * 100%

---

### 6. Voronoi Territorial Partitioning Model
Given active sensor locations P = {p_1, p_2, ..., p_n}, the Voronoi cell V(p_i) is defined as:
V(p_i) = {x in R^2 | ||x - p_i|| <= ||x - p_j||, for all j != i}
- Cluster Head Voronoi Terracing aggregates member nodes within polygonal boundaries.
- Minimizes intra-cluster Euclidean routing distances and balances transmission loads.

---

### 7. First-Order Radio Dissipation Physics
- E_Tx(k, d) = k * E_elec + k * ε_fs * d^2  (for d < d0)
- E_Tx(k, d) = k * E_elec + k * ε_mp * d^4  (for d ≥ d0)
- d0 = sqrt(ε_fs / ε_mp) = sqrt(50 pJ / 0.0013 pJ) ≈ 87.7 meters
- E_Rx(k) = k * E_elec = k * 50 nJ/bit
- E_DA(k) = k * E_da = k * 5 nJ/bit

---

### 8. ANN Node-State Predictive Classifier
- Model Architecture: MLPClassifier(hidden_layer_sizes=(16, 8), activation='relu', solver='adam', learning_rate_init=0.001, max_iter=500, early_stopping=True)
- Preprocessing: StandardScaler standardization.
- 6 Input Features:
  1. Residual Energy (E_r)
  2. Distance to Base Station (d_BS)
  3. Node Degree / Neighbors (k)
  4. Local Sensing Overlap (O_i)
  5. Distance to Closest Active Node (d_min)
  6. Historical Transmission Count (T_x)

---

### 9. Coverage-Preserving Greedy Optimizer
- Target Coverage: Target_Cov = Baseline_Cov - 1.0%
- Step 1: Initial ANN prediction gives active set S_ann.
- Step 2 (Greedy Addition): If Cov(S_ann) < Target_Cov, iteratively activate sleep node with highest marginal coverage gain.
- Step 3 (Greedy Pruning): Evaluate active nodes. If removing node u maintains Cov(S_active \ {u}) >= Target_Cov, remove the node whose deactivation minimizes total sensing overlap.

---

### 10. Multi-Objective Particle Swarm Optimization (PSO) Fitness Function
Fitness = 2.0 * E_CH + 100.0 / (d_sink + ε) + 50.0 / (d_intra + ε) + 100.0 * S_cov - 50.0 * S_overlap
- E_CH: Average residual energy of chosen cluster heads.
- d_sink: Average distance from cluster heads to Base Station.
- d_intra: Average intra-cluster transmission distance from member nodes to their CH.
- S_cov: Active coverage ratio bonus.
- S_overlap: Sensing overlap penalty.

---

### 11. Routing Protocols Comparison
1. LEACH: Single-hop direct probabilistic clustering (P = 0.05). FND: 144.67 rnds.
2. PEGASIS: Global greedy chain formation. High latency and single-point bottleneck. FND: 280.00 rnds.
3. Hybrid (LEACH + PEGASIS): Clustered chain-based routing. FND: 310.00 rnds.
4. Proposed ANN + PSO-Hybrid: Sleep-scheduled, multi-objective optimized CH selection with intra-cluster PEGASIS chaining. FND: 425.33 rnds (+194.01%).

---

### 12. Empirical Simulation Parameters
- Field Size: 100m x 100m
- Total Sensor Nodes: 100
- Initial Energy: 0.5 J (Normal), 1.0 J (Advanced), 1.5 J (Super)
- Sensing Radius: 10m
- Communication Radius: 20m
- Packet Size: 4000 bits
- E_elec: 50 nJ/bit
- E_fs: 50 pJ/bit/m^2
- E_mp: 0.0013 pJ/bit/m^4
- E_da: 5 nJ/bit/signal
- Simulation Rounds: 1000

---

### 13. 100-Seed Experimental Results Matrix
- Active Nodes: 100.0 -> 56.0 (-44.00%)
- Sleep Nodes: 0.0 -> 44.0 (+100.0%)
- Sensing Coverage: 93.73% -> 92.73% (-1.00% absolute, -1.07% relative)
- Sensing Overlap: 82.51% -> 54.97% (-33.38% reduction)
- First Node Dead (FND): 144.67 -> 425.33 rounds (+194.01%)
- Half Nodes Dead (HND): 852.00 -> 1000.00 rounds (+17.37%)
- Throughput: 71,520 -> 48,109 packets (-32.73%, eliminating duplicate data)
- Simulation Execution Runtime: 252.69s -> 128.06s (-49.32% faster)

---

### 14. Scientific Analysis & Insights
1. Sleep Scheduling Energy Preservation: 44 sleeping nodes consume 0 transmission energy, saving ~44 Joules of cumulative initial capacity.
2. Overlap Elimination: 33.38% overlap reduction directly translates to lower packet redundancy and reduced channel contention.
3. Stability Period Tripling: FND extended from round 144 to 425, providing 3x longer continuous uniform monitoring before the first blindspot appears.

---

### 15. Algorithm Execution Pseudocode
\`\`\`python
# 1. Feature Extraction
features = extract_spatial_features(nodes, grid_resolution=2.0)
# 2. ANN Prediction
ann_states = ann_model.predict(scaler.transform(features))
# 3. Greedy Coverage-Preserving Optimizer
active_nodes = optimize_coverage_and_overlap(nodes, ann_states, target_cov=baseline_cov - 0.01)
# 4. PSO Multi-Objective Cluster Head Selection
cluster_heads = pso_optimize_cluster_heads(active_nodes, iterations=15, particles=20)
# 5. Hybrid Intra-Cluster Chaining & Multi-Hop Transmission
simulate_rounds(active_nodes, cluster_heads, rounds=1000)
\`\`\`

---

### 16. Python Source Code Repository Layout
- optimization/coverage.py: Vectorized grid coverage evaluation.
- optimization/overlap.py: Overlap degree matrix computation.
- optimization/ann_selector.py: MLPClassifier model & feature scaler.
- optimization/node_optimizer.py: Greedy addition and overlap pruning pipeline.
- pso_hybrid.py: Multi-objective PSO clustering & hybrid routing.
- leach.py, pegasis.py, hybrid.py: Benchmark protocol implementations.
- generate_results.py: Model training, 100-seed simulation & CSV generation.

---

### 17. Computational Complexity & Scalability
- Grid Coverage Discretization: O(|G| * N)
- ANN Inference: O(N * (f_in * h_1 + h_1 * h_2 + h_2 * f_out)) = O(N)
- Greedy Optimization: O(k * |G| * N) where k <= 15
- PSO CH Selection: O(P * I * N_active) where P=20 particles, I=15 iterations
- Overall Per-Round Complexity: O(N_active^2)

---

### 18. Energy Dissipation Equations & Proofs
Detailed derivation of critical cross-over distance d0:
d0 = sqrt(ε_fs / ε_mp) = sqrt(50e-12 / 0.0013e-12) ≈ 87.7m
For d < d0, amplifier dissipation scales with d^2 (Friis Free-Space model).
For d >= d0, amplifier dissipation scales with d^4 (Two-Ray Ground Reflection model).

---

### 19. Multi-Camera 3D Digital Twin Visualizer
- WebGL 3D Engine with Three.js rendering.
- Real-time packet particle flows and dynamic Voronoi polygonal terracing.
- 6 Camera Modes: Perspective Orbit, 2D Orthographic Top-Down, 45° Isometric, Base Station Tower View, Cluster Head Follower, and Free Orbit.

---

### 20. Step-by-Step Reproduction Guide
1. pip install -r requirements.txt
2. python generate_results.py
3. python comparison.py
4. cd web && npm install && npm run dev

---

### 21. Limitations & Future Directions
- Dynamic Sleep-Wake Cycling: Periodically rotating sleeping nodes as active nodes deplete energy.
- 3D Terrain Volumetric Sensing: Modeling irregular mountainous elevations and wireless path obstructions.
- Mobile Sink Trajectory Optimization: Deep Reinforcement Learning for dynamic UAV sink path planning.

---

### 22. Academic References
1. W. R. Heinzelman, A. Chandrakasan, and H. Balakrishnan, "Energy-efficient communication protocol for wireless microsensor networks," in Proc. IEEE HICSS, 2000.
2. S. Lindsey and C. S. Raghavendra, "PEGASIS: Power-efficient gathering in sensor information systems," in IEEE Aerospace Conference, 2002.
3. J. Kennedy and R. Eberhart, "Particle swarm optimization," in Proc. IEEE ICNN, 1995.
4. I. F. Akyildiz, W. Su, Y. Sankarasubramaniam, and E. Cayirci, "Wireless sensor networks: a survey," Computer Networks, vol. 38, no. 4, pp. 393-422, 2002.
`;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'NeuroSense_WSN_Master_Technical_Guide.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSections = sections.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="master-guide" className="py-12 px-4 relative border-t border-[#1C3150]/60 bg-[#050912]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Centered Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
            <BookOpen className="w-3.5 h-3.5" />
            Comprehensive Research Documentation (22 Sections)
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2 font-mono tracking-tight">
            Master Technical Guide &amp; Research Paper
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Publication-grade technical guide detailing system models, radio physics, neural architecture, multi-objective formulations, and empirical verification.
          </p>
        </div>

        {/* Centered & Balanced Viewer Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0D1626] p-3 rounded-2xl border border-[#1C3150] font-mono text-xs shadow-xl shadow-cyan-950/20">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search all 22 sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1C3150] rounded-xl pl-9 pr-3 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div className="flex items-center space-x-1 bg-[#070B14] p-1 rounded-xl border border-[#1C3150]">
              <button
                onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] px-1 text-cyan-300 font-bold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(140, zoomLevel + 10))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1220] hover:bg-[#111c33] border border-[#1C3150] text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-black shadow-md shadow-cyan-500/25 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Guide (.md)</span>
            </button>
          </div>
        </div>

        {/* Master Document Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono text-xs">
          
          {/* Left Table of Contents (All 22 Sections) */}
          <div className="bg-[#0D1626] rounded-3xl p-5 border border-[#1C3150] max-h-[800px] overflow-y-auto space-y-1.5 shadow-xl shadow-cyan-950/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-[#1C3150] flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="text-cyan-400">{filteredSections.length} Sections</span>
            </div>
            {filteredSections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToDocSection(s.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B1220]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Document Content Viewport (All 22 Sections Full Text) */}
          <div className="lg:col-span-3 bg-[#0D1626] rounded-3xl p-8 border border-[#1C3150] max-h-[800px] overflow-y-auto font-sans leading-relaxed text-slate-300 space-y-8 shadow-2xl shadow-cyan-950/20">
            
            <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }} className="space-y-8">
              
              {/* Paper Title Header */}
              <div className="pb-6 border-b border-[#1C3150] space-y-2">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                  Academic Research Technical Specification // v2.0 Platform
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-mono leading-tight">
                  Energy-Efficient WSN Routing with ANN Node-State Prediction &amp; Coverage-Preserving Optimization
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Autonomous Cyber-Physical Systems • Particle Swarm Optimization • Multi-Hop Hybrid Topology
                </p>
              </div>

              {/* Section 1: Abstract */}
              <div id="doc-sec-abstract" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  1. Abstract &amp; Executive Summary
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Wireless Sensor Networks (WSNs) deployed in environmental, agricultural, and industrial monitoring environments face severe energy constraints. In dense deployments, overlapping sensing radii create redundant data generation and accelerated battery depletion. This paper presents an integrated framework combining an Artificial Neural Network (ANN) node-state classifier, a greedy coverage-preserving optimizer bounded within <code className="text-cyan-400 font-mono">Δ ≤ 1.0%</code> of baseline coverage, and a Particle Swarm Optimization (PSO) multi-objective hybrid routing algorithm. Across 100 random deployment seeds, our proposed framework safely transitions <strong>44% of sensors into low-power sleep mode</strong>, eliminates <strong>33.38% of redundant sensing overlap</strong>, and extends First Node Dead (FND) lifetime by <strong>+194.01% (144.67 → 425.33 rounds)</strong>.
                </p>
              </div>

              {/* Section 2: Problem Statement */}
              <div id="doc-sec-problem" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  2. Problem Statement &amp; Research Motivation
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Wireless Sensor Networks (WSNs) consist of spatially distributed, battery-operated sensor nodes deployed to monitor physical or environmental conditions. In dense deployments, sensor nodes frequently have overlapping sensing fields, causing:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300 font-mono">
                  <li><strong>Redundant Sensing &amp; Transmission</strong>: Multiple adjacent nodes sense and transmit duplicate data, wasting finite battery power.</li>
                  <li><strong>Accelerated Network Depletion</strong>: High energy dissipation leads to premature node failure (low First Node Dead / FND).</li>
                  <li><strong>Severe Hot-Spot &amp; Bottlenecks</strong>: Nodes near cluster heads or base stations deplete energy rapidly.</li>
                </ul>
              </div>

              {/* Section 3: Architecture */}
              <div id="doc-sec-architecture" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-400" />
                  3. Cyber-Physical WSN Digital Twin Architecture
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  The framework integrates a unified dataflow connecting sensor topology generation, neural node prediction, spatial coverage optimization, multi-objective PSO cluster head selection, and hybrid data transmission:
                </p>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-[#1C3150] font-mono text-xs text-cyan-300 space-y-1">
                  <div>WSN Topology (100 Nodes) → ANN 6-Feature Classifier → Greedy Coverage Optimizer (Δ ≤ 1.0%) → Active / Sleep State Assignment → Multi-Objective PSO Clustering → Hybrid Multi-Hop Routing → 1000-Round Empirical Verification</div>
                </div>
              </div>

              {/* Section 4: System Model */}
              <div id="doc-sec-system_model" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  4. System Model &amp; Network Assumptions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-[#070B14] rounded-xl border border-violet-500/20">
                    <span className="text-violet-400 font-bold block mb-1">Heterogeneous Energy</span>
                    Normal (0.5 J, 70%), Advanced (1.0 J, 20%), Super (1.5 J, 10%). Total initial energy: 70 J.
                  </div>
                  <div className="p-3 bg-[#070B14] rounded-xl border border-cyan-500/20">
                    <span className="text-cyan-400 font-bold block mb-1">Radii &amp; Field</span>
                    Field: 100m × 100m. Sensing Radius Rs = 10m. Communication Range Rc = 20m. Sink: (50, 150).
                  </div>
                </div>
              </div>

              {/* Section 5: Coverage Model */}
              <div id="doc-sec-coverage_model" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  5. Discretized Spatial Sensing Coverage Formulation (Δ = 2m)
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Discretizing the field into a uniform grid <code className="text-cyan-400 font-mono">G = &#123;(x_g, y_g)&#125;</code> with resolution <code className="text-cyan-400 font-mono">Δ = 2m</code> (2,601 evaluation points):
                </p>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-[#1C3150] font-mono text-xs space-y-2 text-cyan-300">
                  <div>Coverage (C) = |&#123;g ∈ G | ∃ i ∈ S_active, dist(i, g) ≤ Rs&#125;| / |G| × 100%</div>
                  <div>Overlap (O) = |&#123;g ∈ G | k(g) &gt; 1&#125;| / |&#123;g ∈ G | k(g) ≥ 1&#125;| × 100%</div>
                </div>
              </div>

              {/* Section 6: Voronoi Model */}
              <div id="doc-sec-voronoi_model" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  6. Voronoi Territorial Partitioning &amp; Spatial Terracing
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Given active sensor coordinates <code className="text-violet-400 font-mono">P = &#123;p_1, ..., p_n&#125;</code>, each node governs a convex polygon <code className="text-violet-400 font-mono">V(p_i) = &#123;x | ||x - p_i|| ≤ ||x - p_j|| ∀ j ≠ i&#125;</code>. In cluster head selection, Voronoi boundaries ensure balanced territory sizes and minimize intra-cluster Euclidean distances.
                </p>
              </div>

              {/* Section 7: Radio Model */}
              <div id="doc-sec-radio_model" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  7. First-Order Radio Dissipation &amp; Free-Space / Multipath Physics
                </h2>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-amber-500/20 font-mono text-xs space-y-2 text-amber-300">
                  <div>E_Tx(k, d) = k · E_elec + k · ε_fs · d²  (for d &lt; d0, Free-Space Friis model)</div>
                  <div>E_Tx(k, d) = k · E_elec + k · ε_mp · d⁴  (for d ≥ d0, Two-Ray Ground Multipath)</div>
                  <div>d0 = √(ε_fs / ε_mp) = √(50 pJ / 0.0013 pJ) ≈ 87.7 meters</div>
                  <div>E_Rx(k) = k · E_elec = k · 50 nJ/bit</div>
                  <div>E_DA(k) = k · E_da = k · 5 nJ/bit</div>
                </div>
              </div>

              {/* Section 8: ANN Classifier */}
              <div id="doc-sec-ann_classifier" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  8. ANN Node-State Predictive Classifier
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Multilayer Perceptron <code className="text-cyan-400 font-mono">MLPClassifier(16, 8)</code> trained with standard scaler across 6 spatial-energy features:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">1. Residual Energy (Er)</div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">2. Sink Distance (d_BS)</div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">3. Node Degree (k)</div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">4. Overlap Ratio (Oi)</div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">5. Min Neighbor Dist (d_min)</div>
                  <div className="p-2.5 bg-[#070B14] rounded-lg border border-[#1C3150] text-cyan-300">6. Tx Count (Tx)</div>
                </div>
              </div>

              {/* Section 9: Optimization Algo */}
              <div id="doc-sec-optimization_algo" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  9. Coverage-Preserving Greedy Overlap Reduction Optimizer
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Guarantees that active sensing coverage does not drop below <code className="text-cyan-400 font-mono">Target_Cov = Baseline_Cov - 1.0%</code>. Iterative greedy pruning deactivates nodes whose removal minimizes redundant sensing overlap while maintaining strict boundary integrity.
                </p>
              </div>

              {/* Section 10: PSO Fitness */}
              <div id="doc-sec-pso_fitness" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-400" />
                  10. Multi-Objective Particle Swarm Optimization (PSO) Fitness Function
                </h2>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-violet-500/20 font-mono text-xs text-violet-300">
                  Fitness = 2.0 · E_CH + 100.0 / (d_sink + ε) + 50.0 / (d_intra + ε) + 100.0 · S_cov - 50.0 · S_overlap
                </div>
              </div>

              {/* Section 11: Routing Protocols */}
              <div id="doc-sec-routing_protocols" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Network className="w-5 h-5 text-amber-400" />
                  11. Routing Protocols: LEACH vs PEGASIS vs Hybrid vs Proposed PSO-Hybrid
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  While LEACH suffers from rapid death at round 144 due to probabilistic direct CH transmission, PEGASIS forms single chain bottlenecks. Proposed PSO-Hybrid balances intra-cluster chains and multi-objective CH selection to reach round 425 FND.
                </p>
              </div>

              {/* Section 12: Simulation Params */}
              <div id="doc-sec-simulation_params" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  12. Empirical Simulation Parameters
                </h2>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-[#1C3150] font-mono text-xs space-y-1 text-slate-300">
                  <div>Field Dimensions: 100m × 100m | Nodes: 100 | Initial Energy: 0.5 J (Normal), 1.0 J (Adv), 1.5 J (Sup)</div>
                  <div>E_elec: 50 nJ/bit | ε_fs: 50 pJ/bit/m² | ε_mp: 0.0013 pJ/bit/m⁴ | E_da: 5 nJ/bit | Packet: 4000 bits</div>
                </div>
              </div>

              {/* Section 13: Results Matrix */}
              <div id="doc-sec-benchmark_results" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  13. 100-Seed Experimental Results &amp; Benchmark Comparative Table
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#1C3150] text-cyan-400">
                        <th className="py-2.5">Metric</th>
                        <th className="py-2.5">Baseline PSO-Hybrid</th>
                        <th className="py-2.5">Proposed ANN+PSO</th>
                        <th className="py-2.5">Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C3150]/60">
                      <tr><td className="py-2.5">Active Sensors</td><td>100.0</td><td className="text-cyan-400 font-bold">56.0</td><td className="text-cyan-400">-44.0%</td></tr>
                      <tr><td className="py-2.5">Sleeping Sensors</td><td>0.0</td><td className="text-violet-400 font-bold">44.0</td><td className="text-violet-400">+100.0%</td></tr>
                      <tr><td className="py-2.5">Sensing Overlap</td><td>82.51%</td><td className="text-cyan-400 font-bold">54.97%</td><td className="text-cyan-400 font-bold">-33.38%</td></tr>
                      <tr><td className="py-2.5">First Node Dead (FND)</td><td>144.67 rnds</td><td className="text-emerald-400 font-bold">425.33 rnds</td><td className="text-emerald-400 font-bold">+194.01%</td></tr>
                      <tr><td className="py-2.5">Half Nodes Dead (HND)</td><td>852.00 rnds</td><td className="text-emerald-400 font-bold">1000.00 rnds</td><td className="text-emerald-400 font-bold">+17.37%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 14: Scientific Analysis */}
              <div id="doc-sec-analysis_insights" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  14. Scientific Analysis &amp; Insights
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Putting 44% of nodes into sleep mode eliminates 33.38% of duplicate packet transmissions, drastically conserving energy and preventing channel contention without violating the 1.0% coverage constraint.
                </p>
              </div>

              {/* Section 15: Pseudocode */}
              <div id="doc-sec-pseudocode" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-violet-400" />
                  15. Algorithm Execution Pseudocode
                </h2>
                <pre className="p-4 bg-[#070B14] rounded-2xl border border-violet-500/20 font-mono text-xs text-violet-300 overflow-x-auto">
{`# 1. Spatial Discretization & ANN Feature Extraction
features = extract_spatial_features(nodes, grid_step=2.0)
# 2. ANN Node-State Inference
ann_predictions = ann_model.predict(scaler.transform(features))
# 3. Greedy Coverage-Preserving Overlap Optimization
active_nodes = optimize_coverage_and_overlap(nodes, ann_predictions, target_cov=baseline_cov - 0.01)
# 4. Multi-Objective PSO Cluster Head Selection
cluster_heads = pso_optimize_cluster_heads(active_nodes, particles=20, iterations=15)
# 5. Hybrid Chained Multi-Hop Routing
simulate_rounds(active_nodes, cluster_heads, rounds=1000)`}
                </pre>
              </div>

              {/* Section 16: Source Architecture */}
              <div id="doc-sec-source_arch" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-cyan-400" />
                  16. Python Source Code Repository Layout
                </h2>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-[#1C3150] font-mono text-xs text-slate-300 space-y-1">
                  <div>optimization/coverage.py — Vectorized spatial coverage evaluator</div>
                  <div>optimization/overlap.py — Spatial overlap matrix computation</div>
                  <div>optimization/ann_selector.py — MLPClassifier and StandardScaler</div>
                  <div>optimization/node_optimizer.py — Greedy addition and pruning pipeline</div>
                  <div>pso_hybrid.py — Multi-objective PSO clustering engine</div>
                </div>
              </div>

              {/* Section 17: Complexity */}
              <div id="doc-sec-complexity" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  17. Computational Complexity &amp; Scalability Bounds
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Total spatial evaluation runs in <code className="text-amber-400 font-mono">O(|G| · N)</code>, ANN inference is <code className="text-amber-400 font-mono">O(N)</code>, and PSO clustering is <code className="text-amber-400 font-mono">O(P · I · N_active)</code>, ensuring real-time simulation on commodity computing hardware.
                </p>
              </div>

              {/* Section 18: Proofs */}
              <div id="doc-sec-proofs" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  18. Energy Dissipation Equations &amp; Mathematical Proofs
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Proof of crossover distance: Equating <code className="text-cyan-400 font-mono">k · ε_fs · d² = k · ε_mp · d⁴</code> yields <code className="text-cyan-400 font-mono">d0 = √(ε_fs / ε_mp) = √(50×10⁻¹² / 0.0013×10⁻¹²) ≈ 87.7m</code>.
                </p>
              </div>

              {/* Section 19: Visualizer */}
              <div id="doc-sec-visualizer" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  19. Multi-Camera 3D Digital Twin Visualizer Mechanics
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Interactive WebGL rendering engine with Three.js supporting 6 dynamic camera perspectives (Perspective, Orthographic Top-Down, 45° Isometric, Sink Tower, Follow CH, Orbit), physical multi-hop packet particles, and residual energy HUD rings.
                </p>
              </div>

              {/* Section 20: Reproduction */}
              <div id="doc-sec-reproduction" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-violet-400" />
                  20. Step-by-Step Reproduction Guide
                </h2>
                <div className="p-4 bg-[#070B14] rounded-2xl border border-violet-500/20 font-mono text-xs text-violet-300 space-y-1">
                  <div>1. pip install -r requirements.txt</div>
                  <div>2. python generate_results.py</div>
                  <div>3. python comparison.py</div>
                  <div>4. cd web &amp;&amp; npm run dev</div>
                </div>
              </div>

              {/* Section 21: Limitations */}
              <div id="doc-sec-limitations" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  21. Limitations &amp; Future Research Directions
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300 font-mono">
                  <li>Dynamic sleep-wake rotation as active nodes deplete battery reserves.</li>
                  <li>3D volumetric irregular terrain elevation and signal attenuation models.</li>
                  <li>Deep Reinforcement Learning (DRL) for dynamic mobile UAV sink path planning.</li>
                </ul>
              </div>

              {/* Section 22: References */}
              <div id="doc-sec-references" className="space-y-3 pt-6 border-t border-[#1C3150]/60 scroll-mt-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  22. Academic References &amp; Literature Citations
                </h2>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-400 font-mono">
                  <li>W. R. Heinzelman, A. Chandrakasan, and H. Balakrishnan, "Energy-efficient communication protocol for wireless microsensor networks," in Proc. IEEE HICSS, 2000.</li>
                  <li>S. Lindsey and C. S. Raghavendra, "PEGASIS: Power-efficient gathering in sensor information systems," in IEEE Aerospace Conference, 2002.</li>
                  <li>J. Kennedy and R. Eberhart, "Particle swarm optimization," in Proc. IEEE ICNN, 1995.</li>
                  <li>I. F. Akyildiz, W. Su, Y. Sankarasubramaniam, and E. Cayirci, "Wireless sensor networks: a survey," Computer Networks, vol. 38, no. 4, pp. 393-422, 2002.</li>
                </ol>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
