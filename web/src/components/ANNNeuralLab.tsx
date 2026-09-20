import React, { useState } from 'react';
import { 
  Brain, Play,
  Activity, Sparkles, Sliders, ArrowUpRight,
  TrendingUp, Compass, Target,
  Cpu, Eye
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';

export const ANNNeuralLab: React.FC = () => {
  const { 
    nodes, 
    executeOptimization,
    isOptimizing,
    telemetry,
    annInferenceResult,
    isANNRunning,
    runANNInference,
    beforeAfterMetrics,
    annWeights,
    setAnnWeights,
    annHeatmapMode,
    setAnnHeatmapMode,
    showANNMoveVectors,
    setShowANNMoveVectors,
    showOverlapConcentration,
    setShowOverlapConcentration,
    showBlindspotHoles,
    setShowBlindspotHoles,
    startResearchDemo,
    isResearchDemoActive
  } = useWSNSimulation();

  const [selectedFeature, setSelectedFeature] = useState<number>(0);
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const features10D = [
    {
      id: 'x_coord',
      name: 'Normalized X Position',
      symbol: 'x / W',
      weight: 'x_1',
      formula: 'x_1 = p_{i,x} / W',
      description: 'Spatial coordinate along the X-axis normalized to the 100m field boundary.'
    },
    {
      id: 'y_coord',
      name: 'Normalized Y Position',
      symbol: 'y / H',
      weight: 'x_2',
      formula: 'x_2 = p_{i,y} / H',
      description: 'Spatial coordinate along the Y-axis normalized to the 100m field boundary.'
    },
    {
      id: 'd_nearest',
      name: 'Nearest Neighbor Distance',
      symbol: 'd_{min} / 2R_s',
      weight: 'x_3',
      formula: 'x_3 = \\min_{j \\neq i} \\|p_i - p_j\\| / (2 R_s)',
      description: 'Proximity to nearest adjacent sensor node. Values < 0.5 indicate acute spatial crowding.'
    },
    {
      id: 'local_density',
      name: 'Local Node Degree / Density',
      symbol: '|N(i)| / 8',
      weight: 'x_4',
      formula: 'x_4 = |\\{j : \\|p_i - p_j\\| \\le 2 R_s\\}| / 8',
      description: 'Number of active sensor neighbors within the dual sensing perimeter (2 * Rs).'
    },
    {
      id: 'coverage_contrib',
      name: 'Unique Coverage Factor',
      symbol: 'Ψ_i (m²)',
      weight: 'x_5',
      formula: 'x_5 = \\text{Area}(D_i \\setminus \\bigcup_{j \\neq i} D_j) / (\\pi R_s^2)',
      description: 'The exclusive non-overlapping sensing area contributed solely by sensor node i.'
    },
    {
      id: 'overlap_ratio',
      name: 'Redundant Overlap Ratio',
      symbol: 'Ω_i',
      weight: 'x_6',
      formula: 'x_6 = \\text{Area}(D_i \\cap \\bigcup_{j \\neq i} D_j) / (\\pi R_s^2)',
      description: 'Fraction of sensor disk D_i concurrently monitored by neighboring nodes.'
    },
    {
      id: 'd_blindspot',
      name: 'Distance to Nearest Blindspot',
      symbol: 'd_{blind} / 2R_s',
      weight: 'x_7',
      formula: 'x_7 = \\min_{q \\in \\text{Holes}} \\|p_i - q\\| / (2 R_s)',
      description: 'Proximity to unmonitored coverage void centroid. Guides attraction vectors.'
    },
    {
      id: 'd_boundary',
      name: 'Field Boundary Clearance',
      symbol: 'd_{bound} / 0.4W',
      weight: 'x_8',
      formula: 'x_8 = \\min(x, W-x, y, H-y) / (0.4 W)',
      description: 'Distance to spatial domain perimeter to enforce virtual containment forces.'
    },
    {
      id: 'energy_ratio',
      name: 'Residual Battery Energy',
      symbol: 'E_{res} / E_0',
      weight: 'x_9',
      formula: 'x_9 = E_{i,\\text{current}} / E_0',
      description: 'Remaining battery state to prevent excessive kinetic movement of energy-critical nodes.'
    },
    {
      id: 'sink_dist',
      name: 'Distance to Base Station',
      symbol: 'd(i, sink) / D_{max}',
      weight: 'x_{10}',
      formula: 'x_{10} = \\|p_i - p_{\\text{sink}}\\| / D_{\\max}',
      description: 'Euclidean distance to the Base Station located at coordinates (50m, 150m).'
    }
  ];

  const handleRunANNInference = () => {
    soundFX.playANNScanSound();
    runANNInference();
  };

  const handleRunOptimization = () => {
    soundFX.playOptimizationSweep();
    executeOptimization();
  };

  const predictions = annInferenceResult?.predictions || [];
  const filteredPredictions = predictions.filter(p => {
    if (filterPriority === 'ALL') return true;
    return p.optimizationPriority === filterPriority;
  });

  return (
    <div className="space-y-8 font-mono text-xs animate-fadeIn">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm">
          <Brain className="w-3.5 h-3.5 animate-pulse" />
          NeuroSense-WSN • ANN-Driven Spatial &amp; Coverage Optimization
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-mono leading-tight">
          ANN Inference &amp; EA-VVF-MOPSO Swarm Optimization
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
          Deep Multi-Layer Perceptron (<strong className="text-cyan-400">MLP 10&rarr;16&rarr;12&rarr;4</strong>) evaluates 10-dimensional spatial features, predicting coverage contribution, redundant overlap risk, and blindspot migration vectors to guide Pareto PSO node repositioning.
        </p>
      </div>

      {/* Main Control & Live Metrics Strip */}
      <TiltCard3D className="lab-card rounded-3xl p-6 border border-cyan-500/30 bg-[#070E1A]/95 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/15 rounded-2xl text-cyan-400 border border-cyan-500/30 glow-cyan">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-wide flex items-center gap-2">
                <span>ARTIFICIAL NEURAL NETWORK PREDICTION ENGINE</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  MLP 10-16-12-4 &bull; LeakyReLU &bull; Sigmoid
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Real-Time Spatial Feature Ingestion &bull; Multi-Objective Fitness Evaluation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            {/* Run ANN Inference Button */}
            <button
              onClick={handleRunANNInference}
              disabled={isANNRunning || isOptimizing}
              className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              {isANNRunning ? <Sparkles className="w-4 h-4 animate-spin text-cyan-400" /> : <Brain className="w-4 h-4 text-cyan-400" />}
              <span>{isANNRunning ? 'Inferring Features...' : 'Run ANN Inference'}</span>
            </button>

            {/* Execute ANN+PSO Optimization Button */}
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing || isANNRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              {isOptimizing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isOptimizing ? 'Optimizing Topology...' : 'Execute ANN + PSO Optimization'}</span>
            </button>

            {/* Complete Research Demo Sequence */}
            <button
              onClick={() => startResearchDemo()}
              disabled={isResearchDemoActive || isOptimizing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{isResearchDemoActive ? 'Demo In Progress...' : 'Research Demo (18 Steps)'}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Outcome Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-2xl bg-[#050912] border border-cyan-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Coverage Ratio</span>
              <span className="text-cyan-400 font-bold">Actual</span>
            </div>
            <div className="text-2xl font-black text-cyan-300">{telemetry.currentCoveragePct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400">
              ANN Pred: {annInferenceResult ? `${annInferenceResult.predictedCoveragePct.toFixed(2)}%` : '94.7%'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#050912] border border-rose-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Overlap Redundancy</span>
              <span className="text-rose-400 font-bold">Actual</span>
            </div>
            <div className="text-2xl font-black text-rose-300">{telemetry.currentOverlapPct.toFixed(2)}%</div>
            <div className="text-[10px] text-slate-400">
              ANN Pred: {annInferenceResult ? `${annInferenceResult.predictedOverlapPct.toFixed(2)}%` : '21.4%'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#050912] border border-violet-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Blindspot Holes</span>
              <span className="text-violet-400 font-bold">Actual</span>
            </div>
            <div className="text-2xl font-black text-violet-300">
              {Math.max(0, 100 - telemetry.currentCoveragePct).toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400">
              ANN Pred: {annInferenceResult ? `${annInferenceResult.predictedBlindspotPct.toFixed(2)}%` : '3.2%'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#050912] border border-emerald-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Model Confidence</span>
              <span className="text-emerald-400 font-bold">&eta;</span>
            </div>
            <div className="text-2xl font-black text-emerald-300">
              {annInferenceResult ? annInferenceResult.confidence.toFixed(2) : '0.91'}
            </div>
            <div className="text-[10px] text-emerald-400">
              Evaluated: {annInferenceResult?.evaluatedNodes || nodes.length} Nodes
            </div>
          </div>
        </div>

        {/* Live Visualization Controls Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1C3150] text-[11px]">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin Visual Overlays:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. ANN Heatmap Colors */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setAnnHeatmapMode(!annHeatmapMode);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                annHeatmapMode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm'
                  : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
              }`}
            >
              ANN Node Heatmap
            </button>

            {/* 2. ANN Movement Arrows */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setShowANNMoveVectors(!showANNMoveVectors);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                showANNMoveVectors
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400 shadow-sm'
                  : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
              }`}
            >
              ANN Recommendation Arrows
            </button>

            {/* 3. Overlap Concentration */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setShowOverlapConcentration(!showOverlapConcentration);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                showOverlapConcentration
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400 shadow-sm'
                  : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
              }`}
            >
              Overlap Concentration Heatmap
            </button>

            {/* 4. Blindspot Holes */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setShowBlindspotHoles(!showBlindspotHoles);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                showBlindspotHoles
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400 shadow-sm'
                  : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
              }`}
            >
              Blindspot Hole Map
            </button>
          </div>
        </div>
      </TiltCard3D>

      {/* Before vs After Optimization Empirical Results */}
      {beforeAfterMetrics && (
        <TiltCard3D className="lab-card rounded-3xl p-6 border border-emerald-500/40 bg-[#070E1A]/95 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                ANN + PSO OPTIMIZATION RESULT &bull; EMPIRICAL BEFORE VS AFTER COMPARISON
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              CONVERGED ({beforeAfterMetrics.iterations} Iterations)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Before Box */}
            <div className="p-4 rounded-2xl bg-[#050912] border border-slate-700/60 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">INITIAL DEPLOYMENT (BEFORE)</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage:</span>
                  <span className="text-slate-200 font-bold">{beforeAfterMetrics.beforeCoverage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overlap:</span>
                  <span className="text-rose-400 font-bold">{beforeAfterMetrics.beforeOverlap.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blindspots:</span>
                  <span className="text-violet-400 font-bold">{beforeAfterMetrics.beforeBlindspots.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Energy:</span>
                  <span className="text-cyan-400 font-bold">{beforeAfterMetrics.beforeAvgEnergy.toFixed(3)} J</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Sensors:</span>
                  <span className="text-white font-bold">{beforeAfterMetrics.activeNodes} / {beforeAfterMetrics.activeNodes}</span>
                </div>
              </div>
            </div>

            {/* After Box */}
            <div className="p-4 rounded-2xl bg-[#050912] border border-cyan-500/40 space-y-2">
              <div className="text-[11px] font-bold text-cyan-300 uppercase">OPTIMIZED DEPLOYMENT (AFTER)</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage:</span>
                  <span className="text-cyan-300 font-bold">{beforeAfterMetrics.afterCoverage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overlap:</span>
                  <span className="text-emerald-400 font-bold">{beforeAfterMetrics.afterOverlap.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blindspots:</span>
                  <span className="text-emerald-400 font-bold">{beforeAfterMetrics.afterBlindspots.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Energy:</span>
                  <span className="text-cyan-400 font-bold">{beforeAfterMetrics.afterAvgEnergy.toFixed(3)} J</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Displacement:</span>
                  <span className="text-amber-300 font-bold">{beforeAfterMetrics.displacementEnergyCost.toFixed(2)} m (net)</span>
                </div>
              </div>
            </div>

            {/* Delta Box */}
            <div className="p-4 rounded-2xl bg-[#050912] border border-emerald-500/40 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase">NET DELTA IMPROVEMENT (&Delta;)</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">&Delta; Coverage:</span>
                  <span className="text-emerald-300 font-black text-sm">
                    {beforeAfterMetrics.deltaCoverage >= 0 ? '+' : ''}{beforeAfterMetrics.deltaCoverage.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">&Delta; Overlap:</span>
                  <span className="text-emerald-300 font-black text-sm">
                    {beforeAfterMetrics.deltaOverlap <= 0 ? '' : '+'}{beforeAfterMetrics.deltaOverlap.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">&Delta; Blindspots:</span>
                  <span className="text-emerald-300 font-black text-sm">
                    {beforeAfterMetrics.deltaBlindspots <= 0 ? '' : '+'}{beforeAfterMetrics.deltaBlindspots.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pareto Fitness:</span>
                  <span className="text-cyan-300 font-bold">{beforeAfterMetrics.compositeFitness.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </TiltCard3D>
      )}

      {/* 2-Column: Neural Architecture Visualizer (Left) + 10-Feature Diagnostic Explorer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (7 cols): MLP Neural Architecture Diagram */}
        <TiltCard3D className="lg:col-span-7 lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#070E1A]/95 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C3150]">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                ANN Multi-Layer Perceptron (MLP) Tensor Pipeline
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#050912] text-cyan-300 border border-[#1C3150] font-bold">
              Forward Inference: 10 &rarr; 16 &rarr; 12 &rarr; 4
            </span>
          </div>

          {/* Layer Nodes Visual Representation */}
          <div className="bg-[#050912] p-5 rounded-2xl border border-[#1C3150] space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-bold text-slate-400 border-b border-[#1C3150] pb-2">
              <span>Input (10 Spatial)</span>
              <span>Hidden 1 (16 LeakyReLU)</span>
              <span>Hidden 2 (12 LeakyReLU)</span>
              <span>Output (4 Multi-Obj)</span>
            </div>

            <div className="flex items-center justify-between py-3 px-1">
              {/* Layer 1: 10 Inputs */}
              <div className="flex flex-col space-y-1.5 items-center">
                {features10D.map((f, i) => (
                  <div
                    key={f.id}
                    className={`w-6 h-5 rounded-md flex items-center justify-center text-[9px] font-bold border transition-all cursor-pointer ${
                      selectedFeature === i
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                        : 'bg-[#0B1220] text-cyan-400 border-[#1C3150] hover:border-cyan-400'
                    }`}
                    onClick={() => {
                      soundFX.playClickSound();
                      setSelectedFeature(i);
                    }}
                    title={f.name}
                  >
                    x_{i + 1}
                  </div>
                ))}
              </div>

              {/* Arrow 1 */}
              <div className="text-slate-600 text-base">&rarr;</div>

              {/* Layer 2: 16 Hidden */}
              <div className="flex flex-col space-y-1 items-center">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center text-[8.5px] font-bold">
                    h_{i + 1}
                  </div>
                ))}
                <span className="text-[9px] text-blue-400 font-bold">&bull;&bull;&bull; (16)</span>
              </div>

              {/* Arrow 2 */}
              <div className="text-slate-600 text-base">&rarr;</div>

              {/* Layer 3: 12 Hidden */}
              <div className="flex flex-col space-y-1.5 items-center">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-md bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center text-[8.5px] font-bold">
                    z_{i + 1}
                  </div>
                ))}
                <span className="text-[9px] text-violet-400 font-bold">&bull;&bull;&bull; (12)</span>
              </div>

              {/* Arrow 3 */}
              <div className="text-slate-600 text-base">&rarr;</div>

              {/* Layer 4: 4 Outputs */}
              <div className="flex flex-col space-y-2 items-start text-[10px]">
                <div className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>y1: Coverage Contrib</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>y2: Overlap Risk</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>y3: Blindspot Risk</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>y4: Move Priority</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Objective Fitness Weights Sliders */}
          <div className="p-4 rounded-2xl bg-[#050912] border border-[#1C3150] space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#1C3150]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Objective Composite Fitness Weights</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                F = wC&middot;C - wO&middot;O - wB&middot;B - wD&middot;D + wE&middot;E + wK&middot;K
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Coverage (wC):</span>
                  <span className="text-cyan-300 font-bold">{annWeights.wC}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={annWeights.wC}
                  onChange={(e) => setAnnWeights({ ...annWeights, wC: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Overlap (wO):</span>
                  <span className="text-rose-300 font-bold">{annWeights.wO}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={annWeights.wO}
                  onChange={(e) => setAnnWeights({ ...annWeights, wO: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Blindspots (wB):</span>
                  <span className="text-purple-300 font-bold">{annWeights.wB}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={annWeights.wB}
                  onChange={(e) => setAnnWeights({ ...annWeights, wB: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Displacement (wD):</span>
                  <span className="text-amber-300 font-bold">{annWeights.wD}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={annWeights.wD}
                  onChange={(e) => setAnnWeights({ ...annWeights, wD: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Energy Pres (wE):</span>
                  <span className="text-emerald-300 font-bold">{annWeights.wE}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={annWeights.wE}
                  onChange={(e) => setAnnWeights({ ...annWeights, wE: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Connectivity (wK):</span>
                  <span className="text-blue-300 font-bold">{annWeights.wK}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={annWeights.wK}
                  onChange={(e) => setAnnWeights({ ...annWeights, wK: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>
          </div>
        </TiltCard3D>

        {/* Right (5 cols): 10-Feature Inspector */}
        <TiltCard3D className="lg:col-span-5 lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#070E1A]/95 shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm pb-2 border-b border-[#1C3150]">
            <Activity className="w-4 h-4" />
            <span>ANN 10-Dimensional Spatial Feature Vector</span>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {features10D.map((feat, idx) => (
              <div
                key={feat.id}
                onClick={() => {
                  soundFX.playClickSound();
                  setSelectedFeature(idx);
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFeature === idx
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg'
                    : 'bg-[#050912] border-[#1C3150] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{feat.weight}: {feat.name}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-[#0B1220] text-cyan-300 font-mono font-bold">
                    {feat.symbol}
                  </span>
                </div>
                {selectedFeature === idx && (
                  <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-1 animate-fadeIn">
                    <div className="text-[11px] text-cyan-300 font-mono font-bold">
                      Formula: {feat.formula}
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TiltCard3D>

      </div>

      {/* Live Per-Node ANN Prediction Diagnostic Table */}
      <TiltCard3D className="lab-card rounded-3xl p-6 border border-[#1C3150] bg-[#070E1A]/95 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C3150]">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">
              LIVE ANN NODE PREDICTION &amp; MOVEMENT RECOMMENDATIONS
            </h3>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="text-slate-400 font-bold mr-1">Filter Priority:</span>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterPriority === p
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase text-slate-400 bg-[#050912] sticky top-0 border-b border-[#1C3150]">
              <tr>
                <th className="p-2.5">Node ID</th>
                <th className="p-2.5">Coordinates</th>
                <th className="p-2.5">Coverage Contrib</th>
                <th className="p-2.5">Overlap Risk</th>
                <th className="p-2.5">Blindspot Risk</th>
                <th className="p-2.5">Rec Move Vector</th>
                <th className="p-2.5">Priority</th>
                <th className="p-2.5">ANN Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C3150]/60">
              {filteredPredictions.map((pred) => {
                const moveDist = Math.sqrt(pred.recommendedMoveX ** 2 + pred.recommendedMoveY ** 2);
                return (
                  <tr key={pred.nodeId} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="p-2.5 font-bold text-cyan-300">#{pred.nodeId}</td>
                    <td className="p-2.5 text-slate-300">({pred.features[0].toFixed(1)}, {pred.features[1].toFixed(1)})</td>
                    <td className="p-2.5">
                      <span className={`font-bold ${pred.coverageContribution >= 0.7 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {(pred.coverageContribution * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`font-bold ${pred.overlapRisk >= 0.4 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {(pred.overlapRisk * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`font-bold ${pred.blindspotRisk >= 0.3 ? 'text-purple-400' : 'text-slate-300'}`}>
                        {(pred.blindspotRisk * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5 text-cyan-300 font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{moveDist.toFixed(2)}m</span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        pred.optimizationPriority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : pred.optimizationPriority === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {pred.optimizationPriority}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">
                      {pred.overlapRisk >= 0.5 ? (
                        <span className="text-rose-400">High Overlap Redundancy</span>
                      ) : pred.blindspotRisk >= 0.4 ? (
                        <span className="text-purple-400">Hole Border Sensor</span>
                      ) : pred.coverageContribution >= 0.7 ? (
                        <span className="text-emerald-400">Optimal Contributor</span>
                      ) : (
                        <span className="text-slate-400">Moderate Contributor</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TiltCard3D>

    </div>
  );
};
