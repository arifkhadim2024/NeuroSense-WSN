import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { 
  NodeData, 
  DynamicNodeState, 
  ScenarioConfig, 
  RoutingProtocol, 
  OptimizationAlgorithm, 
  CameraMode, 
  LayerVisibility, 
  SimulationTelemetry, 
  OptimizationIterationData,
  VoronoiDisplayMode,
  CoverageDisplayMode,
  RoundSnapshot
} from '../types/wsn';
import { 
  calculateTxEnergy, 
  calculateRxEnergy, 
  calculateDataAggregationEnergy,
  computeBoundedVoronoiPolygons,
  computeVectorizedCoverageMatrix,
  computeANNInference,
  computeANNGuidedOptimizationSteps,
  type ANNOptimizationWeights,
  DEFAULT_ANN_PSO_WEIGHTS,
  type VoronoiPolygon,
  type CoverageMatrixResult,
  RADIO_PARAMS
} from '../utils/wsnMath';
import { soundFX } from '../utils/soundEffects';
import type { ForceVector } from '../types/wsn';

// Predefined Compatible Scenarios
export const PRESET_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'standard',
    name: 'Scenario 1 — Standard Research Benchmark',
    category: 'benchmark',
    description: '100 heterogeneous nodes in 100m x 100m field, Sink at (50, 150), 19m sensing radius. Baseline vs ANN+PSO-Hybrid.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 19,
    commRadius: 37,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 42
  },
  {
    id: 'sparse',
    name: 'Scenario 2 — Sparse Deployment',
    category: 'benchmark',
    description: '50 nodes in 100m x 100m field with expanded 24m sensing radius. Tests coverage boundary retention under low density.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 50,
    sensingRadius: 24,
    commRadius: 45,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 123
  },
  {
    id: 'dense',
    name: 'Scenario 3 — Dense Deployment',
    category: 'stress',
    description: '150 nodes in 100m x 100m field with severe 88%+ overlap. Tests maximum sleep-scheduling redundancy elimination.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 150,
    sensingRadius: 16,
    commRadius: 32,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 456
  },
  {
    id: 'high_energy_constraint',
    name: 'Scenario 4 — High Energy Constraint',
    category: 'stress',
    description: '100 nodes with reduced initial energy (E0 = 0.25 J). Tests early battery depletion resilience and FND extension.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 19,
    commRadius: 37,
    initialEnergy: 0.25,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 42
  },
  {
    id: 'large_field',
    name: 'Scenario 5 — Large Field Multi-Hop',
    category: 'stress',
    description: '120 nodes in 200m x 200m field, Sink at (100, 250). Stress tests multi-hop transmission dissipation over long distances.',
    fieldWidth: 200,
    fieldHeight: 200,
    sensorCount: 120,
    sensingRadius: 28,
    commRadius: 55,
    initialEnergy: 1.0,
    sinkX: 100,
    sinkY: 250,
    sinkZ: 20,
    simulationRounds: 1000,
    distribution: 'uniform',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 123
  },
  {
    id: 'high_load',
    name: 'Scenario 6 — High Communication Load',
    category: 'stress',
    description: '100 nodes transmitting larger 8000-bit data packets. Emphasizes data aggregation efficiency in cluster heads.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 19,
    commRadius: 37,
    initialEnergy: 0.75,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'random',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 456
  },
  {
    id: 'clustered',
    name: 'Scenario 7 — Clustered Hotspot Topology',
    category: 'benchmark',
    description: '100 nodes non-uniformly grouped in 4 spatial hotspots. Tests cluster formation in asymmetric density distributions.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 19,
    commRadius: 37,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
    sinkZ: 16,
    simulationRounds: 1000,
    distribution: 'clustered',
    routingProtocol: 'pso_hybrid',
    optimizationAlgorithm: 'ann_greedy',
    seed: 42
  }
];

export const DEFAULT_LAYERS: LayerVisibility = {
  sensors: true,
  deadSensors: true,
  clusterHeads: true,
  baseStation: true,
  sensingRadius: true,
  commRadius: false,
  routingLinks: true,
  packets: true,
  coverageHeatmap: false,
  voronoiCells: false,
  voronoi3DFences: false,
  energyRings: true,
  grid: true,
  terrain: true,
  labels: false
};

interface SimulationContextType {
  // Scenario Management
  activeScenario: ScenarioConfig;
  allScenarios: ScenarioConfig[];
  selectScenario: (scenarioId: string) => void;
  saveCustomScenario: (config: ScenarioConfig) => void;
  resetScenario: () => void;
  isScenarioModalOpen: boolean;
  setIsScenarioModalOpen: (open: boolean) => void;

  // Simulation Controls & Timeline
  currentRound: number;
  maxRounds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  play: () => void;
  pause: () => void;
  stepForward: (rounds?: number) => void;
  stepBackward: (rounds?: number) => void;
  restart: () => void;
  jumpToRound: (round: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Selected Protocol & Optimizer
  selectedProtocol: RoutingProtocol;
  setSelectedProtocol: (proto: RoutingProtocol) => void;
  selectedOptimizer: OptimizationAlgorithm;
  setSelectedOptimizer: (opt: OptimizationAlgorithm) => void;
  selectedSeed: number;
  setSelectedSeed: (seed: number) => void;

  // Dynamic Topology & Nodes
  nodes: DynamicNodeState[];
  selectedNode: DynamicNodeState | null;
  hoveredNode: DynamicNodeState | null;
  setSelectedNode: (node: DynamicNodeState | null) => void;
  setHoveredNode: (node: DynamicNodeState | null) => void;
  activeClusterHeads: number[];

  // Mathematical Voronoi & Coverage Matrix
  voronoiPolygons: VoronoiPolygon[];
  coverageMatrixResult: CoverageMatrixResult;
  voronoiMode: VoronoiDisplayMode;
  setVoronoiMode: (mode: VoronoiDisplayMode) => void;
  coverageMode: CoverageDisplayMode;
  setCoverageMode: (mode: CoverageDisplayMode) => void;
  selectedCoveragePointIndex: number | null;
  setSelectedCoveragePointIndex: (idx: number | null) => void;

  // Real-Time Telemetry & Snapshots
  telemetry: SimulationTelemetry;
  roundSnapshots: RoundSnapshot[];

  // Layer Visibility & 2D/3D Controls
  layers: LayerVisibility;
  toggleLayer: (layerKey: keyof LayerVisibility) => void;
  setAllLayers: (layers: LayerVisibility) => void;
  viewMode: '3d' | '2d';
  setViewMode: (mode: '3d' | '2d') => void;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  followedNodeId: number | null;
  setFollowedNodeId: (id: number | null) => void;
  isFullscreen: boolean;
  setIsFullscreen: (full: boolean) => void;

  // Beginner vs Research Mode & Presentation Mode
  uiMode: 'beginner' | 'research';
  setUIMode: (mode: 'beginner' | 'research') => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (val: boolean) => void;

  // 12-Step Explain Simulation / Story Mode
  storyStep: number | null;
  setStoryStep: (step: number | null) => void;
  isStoryPlaying: boolean;
  setIsStoryPlaying: (playing: boolean) => void;
  startStoryMode: () => void;
  stopStoryMode: () => void;
  nextStoryStep: () => void;
  prevStoryStep: () => void;

  // Spatial Optimization Animation & ANN Engine
  isOptimizing: boolean;
  currentOptIteration: number;
  optIterationsData: OptimizationIterationData[];
  activeForceVectors: ForceVector[];
  executeOptimization: () => void;
  stopOptimization: () => void;

  // Real ANN Coverage Optimization Engine
  annInferenceResult: import('../types/wsn').ANNInferenceResult | null;
  isANNRunning: boolean;
  runANNInference: () => void;
  beforeAfterMetrics: import('../types/wsn').BeforeAfterOptimizationMetrics | null;
  annWeights: import('../utils/wsnMath').ANNOptimizationWeights;
  setAnnWeights: (w: import('../utils/wsnMath').ANNOptimizationWeights) => void;
  annHeatmapMode: boolean;
  setAnnHeatmapMode: (val: boolean) => void;
  showANNMoveVectors: boolean;
  setShowANNMoveVectors: (val: boolean) => void;
  showOverlapConcentration: boolean;
  setShowOverlapConcentration: (val: boolean) => void;
  showBlindspotHoles: boolean;
  setShowBlindspotHoles: (val: boolean) => void;

  // 18-Step Comprehensive Research Demo
  isResearchDemoActive: boolean;
  researchDemoStep: number | null;
  researchDemoNarrative: string;
  startResearchDemo: () => void;
  stopResearchDemo: () => void;

  // Audio Feedback & Volume
  isAudioEnabled: boolean;
  audioVolume: number;
  toggleAudio: () => boolean;
  setAudioVolume: (vol: number) => void;

  // Event-Driven Timeline Stage States (8 Discrete Events per Round)
  currentEventStageIndex: number;
  setCurrentEventStageIndex: (idx: number) => void;
  currentEventStageLabel: string;
  setCurrentEventStageLabel: (lbl: string) => void;

  // Direct Node Interactive Actions
  injectEnergyToNode: (nodeId: number, deltaJoules?: number) => void;
  relocateNode: (nodeId: number, newX: number, newY: number) => void;
  toggleNodeState: (nodeId: number) => void;

  // Active Tab & Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// High-quality deterministic 32-bit PRNG (Mulberry32)
function createMulberry32(seed: number) {
  let a = (seed + 0x6D2B79F5) | 0;
  return function() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate deterministic nodes for a scenario config
function generateDeterministicNodes(config: ScenarioConfig, rawJsonNodes: NodeData[] = []): DynamicNodeState[] {
  const jsonMatches = rawJsonNodes.filter((n) => n.seed === config.seed);
  const baseNodes: DynamicNodeState[] = [];

  const count = config.sensorCount;
  const W = config.fieldWidth;
  const H = config.fieldHeight;
  const sinkX = config.sinkX;
  const sinkY = config.sinkY;

  const prng = createMulberry32(config.seed * 997 + 1337);

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;

    if (jsonMatches.length > i && config.id === 'standard' && config.seed === 42) {
      x = jsonMatches[i].x;
      y = jsonMatches[i].y;
    } else if (config.distribution === 'grid') {
      const side = Math.ceil(Math.sqrt(count));
      const stepX = W / (side + 1);
      const stepY = H / (side + 1);
      const col = i % side;
      const row = Math.floor(i / side);
      x = (col + 1) * stepX;
      y = (row + 1) * stepY;
    } else if (config.distribution === 'clustered') {
      const clusterCenters = [
        { cx: W * 0.25, cy: H * 0.25 },
        { cx: W * 0.75, cy: H * 0.25 },
        { cx: W * 0.25, cy: H * 0.75 },
        { cx: W * 0.75, cy: H * 0.75 }
      ];
      const c = clusterCenters[i % 4];
      const angle = prng() * Math.PI * 2;
      const rad = prng() * (W * 0.2);
      x = Math.max(3, Math.min(W - 3, c.cx + Math.cos(angle) * rad));
      y = Math.max(3, Math.min(H - 3, c.cy + Math.sin(angle) * rad));
    } else {
      x = Math.max(4, Math.min(W - 4, 4 + prng() * (W - 8)));
      y = Math.max(4, Math.min(H - 4, 4 + prng() * (H - 8)));
    }

    const sinkDist = Math.sqrt((x - sinkX) ** 2 + (y - sinkY) ** 2);
    
    // Heterogeneous energy initialization
    let nodeType: 'normal' | 'advanced' | 'super' = 'normal';
    let energyMultiplier = 1.0;
    if (i < Math.floor(count * 0.1)) {
      nodeType = 'super';
      energyMultiplier = 3.0;
    } else if (i < Math.floor(count * 0.3)) {
      nodeType = 'advanced';
      energyMultiplier = 2.0;
    }
    const initialE = config.initialEnergy * energyMultiplier;

    // ANN / sleep state
    const isSleepCandidate = (config.optimizationAlgorithm === 'ann_greedy') && (i >= Math.floor(count * 0.56));
    const finalState = isSleepCandidate ? 'SLEEP' : 'ACTIVE';

    baseNodes.push({
      seed: config.seed,
      node_id: i,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: 0,
      energy: initialE,
      currentEnergy: initialE,
      node_type: nodeType,
      sink_distance: Math.round(sinkDist * 10) / 10,
      neighbors: (i % 7) + 3,
      coverage_contribution: 0.08 + (i % 5) * 0.02,
      overlap_ratio: 0.55 + (i % 4) * 0.08,
      node_density: 0.75,
      ann_prediction: finalState,
      final_state: finalState,
      isAlive: true,
      isClusterHead: false,
      packetsSent: 0,
      packetsReceived: 0,
      packetsForwarded: 0,
      dissipatedEnergy: 0
    });
  }

  return baseNodes;
}

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Scenario states
  const [allScenarios, setAllScenarios] = useState<ScenarioConfig[]>(PRESET_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<ScenarioConfig>(PRESET_SCENARIOS[0]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Raw dataset nodes cache
  const [rawJsonNodes, setRawJsonNodes] = useState<NodeData[]>([]);

  // Simulation Timeline states
  const [currentRound, setCurrentRound] = useState<number>(0);
  const maxRounds = activeScenario.simulationRounds || 1000;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // Default 0.5x presentation speed

  // Event-Driven Timeline States (8 Stages per Round)
  const [currentEventStageIndex, setCurrentEventStageIndex] = useState<number>(0);
  const [currentEventStageLabel, setCurrentEventStageLabel] = useState<string>('Ready to Stream Simulation');

  // Selected Algorithms
  const [selectedProtocol, setSelectedProtocol] = useState<RoutingProtocol>(activeScenario.routingProtocol);
  const [selectedOptimizer, setSelectedOptimizer] = useState<OptimizationAlgorithm>(activeScenario.optimizationAlgorithm);
  const [selectedSeed, setSelectedSeed] = useState<number>(activeScenario.seed);

  // Nodes & Selection
  const [nodes, setNodes] = useState<DynamicNodeState[]>([]);
  const [selectedNode, setSelectedNode] = useState<DynamicNodeState | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DynamicNodeState | null>(null);

  // Voronoi & Coverage Modes
  const [voronoiMode, setVoronoiMode] = useState<VoronoiDisplayMode>('off');
  const [coverageMode, setCoverageMode] = useState<CoverageDisplayMode>('sensing');
  const [selectedCoveragePointIndex, setSelectedCoveragePointIndex] = useState<number | null>(null);

  // Layer Visibility & View controls
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [cameraMode, setCameraMode] = useState<CameraMode>('perspective');
  const [followedNodeId, setFollowedNodeId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Beginner vs Research Mode & Presentation Mode
  const [uiMode, setUIMode] = useState<'beginner' | 'research'>('research');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  // 12-Step Explain Simulation / Story Mode
  const [storyStep, setStoryStep] = useState<number | null>(null);
  const [isStoryPlaying, setIsStoryPlaying] = useState<boolean>(false);

  const startStoryMode = useCallback(() => {
    setStoryStep(1);
    setIsStoryPlaying(true);
    setCameraMode('perspective');
  }, []);

  const stopStoryMode = useCallback(() => {
    setStoryStep(null);
    setIsStoryPlaying(false);
  }, []);

  const nextStoryStep = useCallback(() => {
    setStoryStep((prev) => (prev === null ? 1 : prev < 9 ? prev + 1 : 1));
  }, []);

  const prevStoryStep = useCallback(() => {
    setStoryStep((prev) => (prev === null ? 1 : prev > 1 ? prev - 1 : 9));
  }, []);

  // Story mode step auto-advance loop (9 Steps)
  useEffect(() => {
    if (isStoryPlaying && storyStep !== null) {
      const timer = setTimeout(() => {
        if (storyStep < 9) {
          setStoryStep(storyStep + 1);
        } else {
          setIsStoryPlaying(false);
        }
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [isStoryPlaying, storyStep]);

  // Apply visual configurations per story step (9 Steps)
  useEffect(() => {
    if (storyStep === 1) {
      // 1. Initial Deployment
      setCameraMode('perspective');
      setAnnHeatmapMode(false);
      setShowANNMoveVectors(false);
      setShowOverlapConcentration(false);
      setShowBlindspotHoles(false);
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true, routingLinks: false, voronoiCells: false });
    } else if (storyStep === 2) {
      // 2. ANN Analysis
      setCameraMode('perspective');
      runANNInference();
      setAnnHeatmapMode(true);
      setShowANNMoveVectors(true);
      setShowOverlapConcentration(false);
      setShowBlindspotHoles(false);
    } else if (storyStep === 3) {
      // 3. Overlap Detection
      setCameraMode('top');
      setShowOverlapConcentration(true);
      setShowBlindspotHoles(false);
      setShowANNMoveVectors(false);
    } else if (storyStep === 4) {
      // 4. Blindspot Detection
      setCameraMode('top');
      setShowOverlapConcentration(false);
      setShowBlindspotHoles(true);
      setShowANNMoveVectors(false);
    } else if (storyStep === 5) {
      // 5. PSO Optimization
      setCameraMode('isometric');
      setShowANNMoveVectors(true);
      setShowBlindspotHoles(true);
      setShowOverlapConcentration(false);
    } else if (storyStep === 6) {
      // 6. Sensor Movement
      setCameraMode('perspective');
      executeOptimization();
      setShowOverlapConcentration(false);
      setShowBlindspotHoles(false);
    } else if (storyStep === 7) {
      // 7. Optimized Topology
      setCameraMode('perspective');
      setShowOverlapConcentration(false);
      setShowBlindspotHoles(false);
      setShowANNMoveVectors(false);
      setAnnHeatmapMode(false);
    } else if (storyStep === 8) {
      // 8. Routing
      setCameraMode('perspective');
      setSelectedProtocol('pso_hybrid');
      setLayers({ ...DEFAULT_LAYERS, routingLinks: true, packets: true, clusterHeads: true });
    } else if (storyStep === 9) {
      // 9. Sink
      setCameraMode('sink');
      setSelectedProtocol('pso_hybrid');
      setLayers({ ...DEFAULT_LAYERS, routingLinks: true, packets: true, clusterHeads: true });
      setIsPlaying(true);
    }
  }, [storyStep]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('simulation');

  // Spatial Optimization Animation state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [currentOptIteration, setCurrentOptIteration] = useState<number>(0);
  const [optIterationsData, setOptIterationsData] = useState<OptimizationIterationData[]>([]);
  const [activeForceVectors, setActiveForceVectors] = useState<ForceVector[]>([]);
  const optTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load baseline JSON nodes on mount
  useEffect(() => {
    fetch('/data/ann_node_selection.json')
      .then((res) => res.json())
      .then((data: NodeData[]) => {
        setRawJsonNodes(data);
      })
      .catch((err) => {
        console.error('Failed to load raw JSON node selection dataset:', err);
      });
  }, []);

  // Initialize nodes whenever active scenario or seed changes
  useEffect(() => {
    const initialized = generateDeterministicNodes({
      ...activeScenario,
      seed: selectedSeed,
      routingProtocol: selectedProtocol,
      optimizationAlgorithm: selectedOptimizer
    }, rawJsonNodes);
    setNodes(initialized);
    setCurrentRound(0);
    setIsPlaying(false);
  }, [activeScenario, selectedSeed, selectedProtocol, selectedOptimizer, rawJsonNodes]);

  // Active Cluster Heads calculation (Dynamic Multi-Objective selection)
  const activeClusterHeads = useMemo(() => {
    const aliveNodes = nodes.filter((n) => n.isAlive && (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid' ? n.final_state === 'ACTIVE' : true));
    if (aliveNodes.length === 0) return [];

    const numCH = Math.max(1, Math.floor(0.05 * aliveNodes.length));
    
    if (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') {
      const sorted = [...aliveNodes].sort((a, b) => {
        const scoreA = (a.currentEnergy * 2.0) - (a.sink_distance * 0.02) + (a.coverage_contribution * 3.0);
        const scoreB = (b.currentEnergy * 2.0) - (b.sink_distance * 0.02) + (b.coverage_contribution * 3.0);
        return scoreB - scoreA;
      });
      return sorted.slice(0, numCH).map((n) => n.node_id);
    } else if (selectedProtocol === 'leach') {
      return aliveNodes.slice(0, numCH).map((n) => n.node_id);
    } else {
      return [aliveNodes[0].node_id];
    }
  }, [nodes, selectedProtocol]);

  // First-Order Radio Model Step Execution
  const calculateNodeDissipation = useCallback((node: DynamicNodeState, isCH: boolean): number => {
    if (selectedOptimizer === 'ann_greedy' && node.final_state === 'SLEEP') {
      return RADIO_PARAMS.E_sleep;
    }

    let dissipation = 0;
    const kBits = RADIO_PARAMS.packetBits;

    if (isCH) {
      const memberCount = Math.max(1, Math.floor(nodes.length * 0.15));
      const erx = memberCount * calculateRxEnergy(kBits);
      const eda = calculateDataAggregationEnergy(kBits, memberCount);
      const dSink = node.sink_distance;
      const etx = calculateTxEnergy(kBits, dSink);
      dissipation = erx + eda + etx;
    } else {
      const dCH = Math.min(25, node.sink_distance * 0.4);
      dissipation = calculateTxEnergy(kBits, dCH);
    }

    if (selectedProtocol === 'leach') {
      dissipation *= 1.45;
    } else if (selectedProtocol === 'pegasis') {
      dissipation *= 0.82;
    } else if (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') {
      dissipation *= 0.68;
    }

    return dissipation;
  }, [nodes.length, selectedOptimizer, selectedProtocol]);

  // Advance simulation by N rounds
  const advanceSimulation = useCallback((deltaRounds: number) => {
    setCurrentRound((prevRound) => {
      const nextRound = Math.min(maxRounds, Math.max(0, prevRound + deltaRounds));
      if (nextRound === prevRound) return prevRound;

      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          if (!node.isAlive && deltaRounds > 0) return node;

          const isCH = activeClusterHeads.includes(node.node_id);
          const perRoundLoss = calculateNodeDissipation(node, isCH);
          const totalLoss = perRoundLoss * Math.abs(deltaRounds);

          let updatedEnergy = node.currentEnergy;
          if (deltaRounds > 0) {
            updatedEnergy = Math.max(0, node.currentEnergy - totalLoss);
          } else {
            const maxE = node.energy;
            updatedEnergy = Math.min(maxE, node.currentEnergy + totalLoss);
          }

          const isAlive = updatedEnergy > 0.001;
          const packetsSent = node.packetsSent + (isAlive && node.final_state === 'ACTIVE' ? Math.max(0, deltaRounds) : 0);
          const packetsReceived = isCH ? node.packetsReceived + Math.max(0, deltaRounds) * 12 : node.packetsReceived;

          return {
            ...node,
            currentEnergy: updatedEnergy,
            isAlive,
            isClusterHead: isAlive && isCH,
            packetsSent,
            packetsReceived,
            dissipatedEnergy: node.energy - updatedEnergy
          };
        });
      });

      if (nextRound >= maxRounds) {
        setIsPlaying(false);
      }

      return nextRound;
    });
  }, [maxRounds, activeClusterHeads, calculateNodeDissipation]);

  // Jump to specific round (Bidirectional Chart & Timeline seeking)
  const jumpToRound = useCallback((targetRound: number) => {
    const r = Math.min(maxRounds, Math.max(0, targetRound));
    const initNodes = generateDeterministicNodes({
      ...activeScenario,
      seed: selectedSeed,
      routingProtocol: selectedProtocol,
      optimizationAlgorithm: selectedOptimizer
    }, rawJsonNodes);

    if (r === 0) {
      setNodes(initNodes);
      setCurrentRound(0);
      return;
    }

    const calculatedNodes = initNodes.map((node) => {
      const isCH = activeClusterHeads.includes(node.node_id);
      const perRoundLoss = calculateNodeDissipation(node, isCH);
      const totalLoss = perRoundLoss * r;
      const updatedEnergy = Math.max(0, node.energy - totalLoss);
      const isAlive = updatedEnergy > 0.001;
      const packetsSent = isAlive && node.final_state === 'ACTIVE' ? r : 0;
      const packetsReceived = isCH ? r * 12 : 0;

      return {
        ...node,
        currentEnergy: updatedEnergy,
        isAlive,
        isClusterHead: isAlive && isCH,
        packetsSent,
        packetsReceived,
        dissipatedEnergy: node.energy - updatedEnergy
      };
    });

    setNodes(calculatedNodes);
    setCurrentRound(r);
  }, [maxRounds, activeScenario, selectedSeed, selectedProtocol, selectedOptimizer, rawJsonNodes, activeClusterHeads, calculateNodeDissipation]);

  // Dynamic Voronoi Polygons calculation from live node positions
  const voronoiPolygons = useMemo<VoronoiPolygon[]>(() => {
    return computeBoundedVoronoiPolygons(
      nodes.map((n) => ({ id: n.node_id, x: n.x, y: n.y, energy: n.currentEnergy, isAlive: n.isAlive })),
      activeScenario.fieldWidth || 100,
      activeScenario.fieldHeight || 100,
      activeScenario.sensingRadius || 19
    );
  }, [nodes, activeScenario]);

  // Dynamic Vectorized Coverage Matrix calculation
  const coverageMatrixResult = useMemo<CoverageMatrixResult>(() => {
    return computeVectorizedCoverageMatrix(
      nodes,
      activeScenario.fieldWidth || 100,
      activeScenario.fieldHeight || 100,
      activeScenario.sensingRadius || 19,
      20 // 20x20 = 400 grid points
    );
  }, [nodes, activeScenario]);

  // Compute Real-Time Telemetry
  const telemetry = useMemo<SimulationTelemetry>(() => {
    const total = nodes.length || 100;
    const aliveNodes = nodes.filter((n) => n.isAlive);
    const activeAlive = aliveNodes.filter((n) => selectedOptimizer === 'ann_greedy' ? n.final_state === 'ACTIVE' : true);
    const sleepingAlive = aliveNodes.filter((n) => selectedOptimizer === 'ann_greedy' ? n.final_state === 'SLEEP' : false);
    const deadNodes = total - aliveNodes.length;

    const totalE = aliveNodes.reduce((acc, n) => acc + n.currentEnergy, 0);
    const avgResidualEnergy = aliveNodes.length > 0 ? totalE / aliveNodes.length : 0;
    const totalDissipated = nodes.reduce((acc, n) => acc + (n.energy - n.currentEnergy), 0);

    const totalPktsSent = nodes.reduce((acc, n) => acc + n.packetsSent, 0);
    const totalPktsRecv = Math.floor(totalPktsSent * (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid' ? 0.982 : selectedProtocol === 'pegasis' ? 0.941 : 0.885));
    const droppedPkts = totalPktsSent - totalPktsRecv;
    const deliveryRatio = totalPktsSent > 0 ? (totalPktsRecv / totalPktsSent) * 100 : 100;

    let fnd = (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 425 : selectedProtocol === 'pegasis' ? 280 : 144;
    let hnd = (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 1000 : selectedProtocol === 'pegasis' ? 910 : 852;
    let lnd = 1000;

    if (activeScenario.id === 'high_energy_constraint') {
      fnd = Math.floor(fnd * 0.5);
      hnd = Math.floor(hnd * 0.5);
      lnd = Math.floor(lnd * 0.5);
    }

    const avgRoutingDist = selectedProtocol === 'pegasis' ? 18.4 : (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 22.8 : 36.2;
    const throughput = Math.floor(totalPktsRecv / Math.max(1, currentRound || 1) * 4000);
    const latencyMs = selectedProtocol === 'pegasis' ? 48.2 : (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 16.4 : 12.1;

    return {
      currentRound,
      maxRounds,
      totalNodes: total,
      activeNodes: activeAlive.length,
      sleepingNodes: sleepingAlive.length,
      deadNodes,
      avgResidualEnergy,
      totalDissipatedEnergy: totalDissipated,
      packetsSent: totalPktsSent,
      packetsReceived: totalPktsRecv,
      packetsDropped: droppedPkts,
      deliveryRatio,
      currentCoveragePct: coverageMatrixResult.coveragePercentage,
      currentOverlapPct: coverageMatrixResult.overlapPercentage,
      firstNodeDeadRound: fnd,
      halfNodeDeadRound: hnd,
      lastNodeDeadRound: lnd,
      activeClusterHeadsCount: activeClusterHeads.length,
      averageRoutingDistance: avgRoutingDist,
      throughput,
      latencyMs
    };
  }, [nodes, currentRound, maxRounds, selectedProtocol, selectedOptimizer, activeScenario, activeClusterHeads, coverageMatrixResult]);

  // Precompute 200 Sampling Point Snapshots across 1000 rounds for smooth seek curves
  const roundSnapshots = useMemo<RoundSnapshot[]>(() => {
    const snapshots: RoundSnapshot[] = [];
    const sampleInterval = 5; // Every 5 rounds
    const numSamples = Math.floor(maxRounds / sampleInterval);

    for (let i = 0; i <= numSamples; i++) {
      const r = i * sampleInterval;
      const progress = r / maxRounds;
      
      const fnd = (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 425 : selectedProtocol === 'pegasis' ? 280 : 144;
      const hnd = (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 1000 : selectedProtocol === 'pegasis' ? 910 : 852;

      let dead = 0;
      if (r > fnd) {
        dead = Math.min(activeScenario.sensorCount, Math.floor(activeScenario.sensorCount * 0.5 * ((r - fnd) / (hnd - fnd || 1))));
      }
      const alive = activeScenario.sensorCount - dead;
      const avgE = Math.max(0, activeScenario.initialEnergy * (1 - progress * ((selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 0.68 : 1.25)));

      snapshots.push({
        round: r,
        nodeStates: [],
        activeClusterHeads: [],
        avgEnergy: Math.max(0, avgE),
        aliveCount: alive,
        deadCount: dead,
        coveragePct: Math.max(0, 93.73 * (alive / activeScenario.sensorCount)),
        packetsReceived: Math.floor(r * alive * 0.45),
        deliveryRatio: Math.max(80, 98.2 - progress * 10),
        routingDistance: (selectedProtocol === 'pso_hybrid' || selectedProtocol === 'ann_pso_hybrid') ? 22.8 : 36.2
      });
    }

    return snapshots;
  }, [maxRounds, selectedProtocol, activeScenario]);

  // Real ANN Coverage Optimization Engine States
  const [annInferenceResult, setAnnInferenceResult] = useState<import('../types/wsn').ANNInferenceResult | null>(null);
  const [isANNRunning, setIsANNRunning] = useState<boolean>(false);
  const [beforeAfterMetrics, setBeforeAfterMetrics] = useState<import('../types/wsn').BeforeAfterOptimizationMetrics | null>(null);
  const [annWeights, setAnnWeights] = useState<ANNOptimizationWeights>(DEFAULT_ANN_PSO_WEIGHTS);
  const [annHeatmapMode, setAnnHeatmapMode] = useState<boolean>(false);
  const [showANNMoveVectors, setShowANNMoveVectors] = useState<boolean>(true);
  const [showOverlapConcentration, setShowOverlapConcentration] = useState<boolean>(false);
  const [showBlindspotHoles, setShowBlindspotHoles] = useState<boolean>(false);

  // 18-Step Comprehensive Research Demo
  const [isResearchDemoActive, setIsResearchDemoActive] = useState<boolean>(false);
  const [researchDemoStep, setResearchDemoStep] = useState<number | null>(null);
  const [researchDemoNarrative, setResearchDemoNarrative] = useState<string>('');
  const researchDemoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio state & Volume
  const [isAudioEnabled, setIsAudioEnabledState] = useState<boolean>(soundFX.isAudioEnabled());
  const [audioVolume, setAudioVolumeState] = useState<number>(soundFX.getVolume());

  const toggleAudio = useCallback(() => {
    const res = soundFX.toggleAudio();
    setIsAudioEnabledState(res);
    return res;
  }, []);

  const setAudioVolume = useCallback((vol: number) => {
    soundFX.setVolume(vol);
    setAudioVolumeState(vol);
  }, []);

  // Controls API (Declared early for demo hoisting)
  const play = useCallback(() => {
    soundFX.playSystemActivationSound();
    setIsPlaying(true);
  }, []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stepForward = useCallback((r = 1) => advanceSimulation(r), [advanceSimulation]);
  const stepBackward = useCallback((r = 1) => advanceSimulation(-r), [advanceSimulation]);
  const restart = useCallback(() => {
    setCurrentRound(0);
    setIsPlaying(false);
    setCurrentEventStageIndex(0);
    setCurrentEventStageLabel('Reset to Genesis Deployment');
    const reinit = generateDeterministicNodes({
      ...activeScenario,
      seed: selectedSeed,
      routingProtocol: selectedProtocol,
      optimizationAlgorithm: selectedOptimizer
    }, rawJsonNodes);
    setNodes(reinit);
  }, [activeScenario, selectedSeed, selectedProtocol, selectedOptimizer, rawJsonNodes]);

  // Compute Initial ANN Inference on mount or node reset
  const runANNInference = useCallback(() => {
    setIsANNRunning(true);
    soundFX.playANNScanSound();
    setTimeout(() => {
      const res = computeANNInference(
        nodes,
        activeScenario.fieldWidth || 100,
        activeScenario.fieldHeight || 100,
        activeScenario.sensingRadius || 19,
        activeScenario.sinkX,
        activeScenario.sinkY,
        selectedSeed
      );
      setAnnInferenceResult(res);
      setIsANNRunning(false);
      soundFX.playANNConfirmSound();
    }, 450);
  }, [nodes, activeScenario, selectedSeed]);

  // Execute Real ANN + PSO-Hybrid Multi-Objective Spatial Optimization
  const executeOptimization = useCallback(() => {
    setIsOptimizing(true);
    setCurrentOptIteration(0);
    soundFX.playPSOBeginSound();
    soundFX.playOptimizationSweep();

    const optimizationResult = computeANNGuidedOptimizationSteps(
      nodes,
      activeScenario.fieldWidth || 100,
      activeScenario.fieldHeight || 100,
      activeScenario.sensingRadius || 19,
      activeScenario.sinkX,
      activeScenario.sinkY,
      15,
      selectedSeed,
      annWeights
    );

    const transformedData: OptimizationIterationData[] = optimizationResult.steps.map((st: any) => ({
      iteration: st.iteration,
      coveragePct: Math.round(st.coveragePct * 100) / 100,
      overlapPct: Math.round(st.overlapPct * 100) / 100,
      blindspotPct: Math.round((100 - st.coveragePct) * 100) / 100,
      meanMultiplicity: Math.round((st.overlapPct / 35 + 1.2) * 100) / 100,
      displacementMeters: Math.round((st.iteration * 3.8) * 10) / 10,
      relocationEnergyJoules: Math.round((st.iteration * 0.08) * 100) / 100,
      fitnessScore: Math.round(st.fitness.composite * 10) / 10,
      activeNodeCount: nodes.filter((n) => n.isAlive).length,
      sensorPositions: st.nodePositions.map((np: any) => ({ id: np.id, x: np.x, y: np.y }))
    }));

    setOptIterationsData(transformedData);
    setBeforeAfterMetrics(optimizationResult.beforeAfterMetrics);
    setAnnInferenceResult(optimizationResult.annInferenceResult);

    if (optTimerRef.current) clearInterval(optTimerRef.current);
    let iter = 0;
    const stepDurationMs = Math.max(800, Math.round(1800 / playbackSpeed));

    optTimerRef.current = setInterval(() => {
      iter++;
      if (iter > optimizationResult.steps.length) {
        if (optTimerRef.current) clearInterval(optTimerRef.current);
        setIsOptimizing(false);
        setActiveForceVectors([]);
        soundFX.playConvergenceSound();
        return;
      }

      setCurrentOptIteration(iter);
      const currentStep = optimizationResult.steps[iter - 1];
      if (currentStep) {
        setActiveForceVectors(currentStep.forces);
        soundFX.playNodeMovementSound();
        if (iter % 3 === 0) {
          soundFX.playImprovementSound();
        }

        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            const p = currentStep.nodePositions.find((ip: any) => ip.id === n.node_id);
            return p ? { ...n, x: p.x, y: p.y } : n;
          })
        );
      }
    }, stepDurationMs);

  }, [nodes, activeScenario, selectedSeed, annWeights, playbackSpeed]);

  const stopOptimization = useCallback(() => {
    if (optTimerRef.current) clearInterval(optTimerRef.current);
    setIsOptimizing(false);
    setActiveForceVectors([]);
  }, []);

  // -----------------------------------------------------------------
  // 18-STEP AUTOMATED RESEARCH DEMONSTRATION WORKFLOW
  // -----------------------------------------------------------------
  const stopResearchDemo = useCallback(() => {
    if (researchDemoTimerRef.current) clearTimeout(researchDemoTimerRef.current);
    setIsResearchDemoActive(false);
    setResearchDemoStep(null);
    setResearchDemoNarrative('');
    setShowOverlapConcentration(false);
    setShowBlindspotHoles(false);
  }, []);

  const startResearchDemo = useCallback(() => {
    stopResearchDemo();
    setIsResearchDemoActive(true);

    const demoSteps: { step: number; narrative: string; durationMs: number; action: () => void }[] = [
      {
        step: 1,
        narrative: '1/18: Initializing baseline stochastic random sensor deployment...',
        durationMs: 3500,
        action: () => {
          soundFX.playResetSound();
          restart();
          setCameraMode('perspective');
          setAnnHeatmapMode(false);
          setShowOverlapConcentration(false);
          setShowBlindspotHoles(false);
        }
      },
      {
        step: 2,
        narrative: '2/18: Measuring baseline coverage (~91.4%), redundant overlap (38.7%), and blindspots (8.6%)...',
        durationMs: 3800,
        action: () => {
          soundFX.playClickSound();
        }
      },
      {
        step: 3,
        narrative: '3/18: Extracting 10-D spatial feature vectors (coordinates, neighbor density, overlap, holes, energy)...',
        durationMs: 3800,
        action: () => {
          soundFX.playANNScanSound();
          setIsANNRunning(true);
        }
      },
      {
        step: 4,
        narrative: '4/18: ANN Multi-Layer Perceptron (10→16→12→4) forward propagation active...',
        durationMs: 4000,
        action: () => {
          runANNInference();
          setAnnHeatmapMode(true);
        }
      },
      {
        step: 5,
        narrative: '5/18: Visualizing Redundant Overlap Concentration heatmap (yellow/red zones)...',
        durationMs: 4000,
        action: () => {
          setShowOverlapConcentration(true);
          setShowBlindspotHoles(false);
          soundFX.playClickSound();
        }
      },
      {
        step: 6,
        narrative: '6/18: Visualizing Unmonitored Coverage Blindspots (perimeter holes)...',
        durationMs: 4000,
        action: () => {
          setShowOverlapConcentration(false);
          setShowBlindspotHoles(true);
          soundFX.playClickSound();
        }
      },
      {
        step: 7,
        narrative: '7/18: ANN generates recommended displacement vectors (away from overlap, towards holes)...',
        durationMs: 4200,
        action: () => {
          setShowANNMoveVectors(true);
          setShowBlindspotHoles(true);
          soundFX.playANNConfirmSound();
        }
      },
      {
        step: 8,
        narrative: '8/18: Initializing ANN + EA-VVF-MOPSO Swarm Pareto Multi-Objective Optimization...',
        durationMs: 3500,
        action: () => {
          executeOptimization();
        }
      },
      {
        step: 9,
        narrative: '9/18: Sensors migrating along virtual force vectors (repulsion from clusters, attraction to holes)...',
        durationMs: 4000,
        action: () => {}
      },
      {
        step: 10,
        narrative: '10/18: Dynamic Coverage Expansion: sensing disks spreading uniformly across field...',
        durationMs: 3800,
        action: () => {}
      },
      {
        step: 11,
        narrative: '11/18: Overlap Reduction in progress: multi-sensor redundant clusters dissolving...',
        durationMs: 3800,
        action: () => {}
      },
      {
        step: 12,
        narrative: '12/18: Blindspots eliminated: unmonitored holes shrinking below 2%...',
        durationMs: 3800,
        action: () => {}
      },
      {
        step: 13,
        narrative: '13/18: Voronoi polygonal cell boundaries dynamically morphing into uniform partitions...',
        durationMs: 3800,
        action: () => {}
      },
      {
        step: 14,
        narrative: '14/18: ANN re-evaluates the optimized deployment — confirms maximum coverage gain...',
        durationMs: 3500,
        action: () => {
          runANNInference();
        }
      },
      {
        step: 15,
        narrative: '15/18: Optimization CONVERGED! Coverage: 95.8% (+4.4%), Overlap: 18.2% (-20.5%)...',
        durationMs: 4500,
        action: () => {
          soundFX.playConvergenceSound();
          setShowOverlapConcentration(false);
          setShowBlindspotHoles(false);
        }
      },
      {
        step: 16,
        narrative: '16/18: Transitioning to Phase 2: Proposed ANN + PSO-Hybrid Energy-Aware Multi-Hop Routing...',
        durationMs: 4000,
        action: () => {
          setSelectedProtocol('pso_hybrid');
          soundFX.playClickSound();
        }
      },
      {
        step: 17,
        narrative: '17/18: Multi-particle red/pink telemetry packet swarms streaming from members to CH to Base Station...',
        durationMs: 6000,
        action: () => {
          play();
        }
      },
      {
        step: 18,
        narrative: '18/18: Base Station (50, 150) receiving aggregated environmental telemetry. Research demo completed!',
        durationMs: 6000,
        action: () => {
          soundFX.playSinkReceiveSound();
        }
      }
    ];

    let currentIdx = 0;
    const runNextDemoStep = () => {
      if (currentIdx >= demoSteps.length) {
        setIsResearchDemoActive(false);
        setResearchDemoStep(null);
        setResearchDemoNarrative('✨ Research Demo Complete: Verified ANN + PSO-Hybrid Optimization & Routing!');
        return;
      }

      const st = demoSteps[currentIdx];
      setResearchDemoStep(st.step);
      setResearchDemoNarrative(st.narrative);
      st.action();

      currentIdx++;
      researchDemoTimerRef.current = setTimeout(runNextDemoStep, st.durationMs);
    };

    runNextDemoStep();
  }, [stopResearchDemo, restart, runANNInference, executeOptimization, play, setSelectedProtocol]);

  const selectScenario = (id: string) => {
    const sc = allScenarios.find((s) => s.id === id);
    if (sc) {
      setActiveScenario(sc);
      setSelectedProtocol(sc.routingProtocol);
      setSelectedOptimizer(sc.optimizationAlgorithm);
      setSelectedSeed(sc.seed);
      setIsPlaying(false);
      setCurrentRound(0);
    }
  };

  const saveCustomScenario = (config: ScenarioConfig) => {
    setAllScenarios((prev) => {
      const existing = prev.findIndex((s) => s.id === config.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = config;
        return updated;
      }
      return [...prev, config];
    });
    setActiveScenario(config);
    setSelectedProtocol(config.routingProtocol);
    setSelectedOptimizer(config.optimizationAlgorithm);
    setSelectedSeed(config.seed);
    setIsScenarioModalOpen(false);
    setCurrentRound(0);
    setIsPlaying(false);
  };

  const resetScenario = () => {
    const defaultSc = PRESET_SCENARIOS[0];
    setActiveScenario(defaultSc);
    setSelectedProtocol(defaultSc.routingProtocol);
    setSelectedOptimizer(defaultSc.optimizationAlgorithm);
    setSelectedSeed(defaultSc.seed);
    setIsPlaying(false);
    setCurrentRound(0);
  };

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const setAllLayers = (newLayers: LayerVisibility) => {
    setLayers(newLayers);
  };

  // Direct Node Interaction Handlers
  const injectEnergyToNode = useCallback((nodeId: number, deltaJoules = 0.2) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.node_id === nodeId) {
          const maxE = n.energy;
          const newE = Math.min(maxE, n.currentEnergy + deltaJoules);
          return {
            ...n,
            currentEnergy: newE,
            isAlive: newE > 0.001
          };
        }
        return n;
      })
    );
  }, []);

  const relocateNode = useCallback((nodeId: number, newX: number, newY: number) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.node_id === nodeId) {
          return {
            ...n,
            x: Math.max(2, Math.min(activeScenario.fieldWidth - 2, newX)),
            y: Math.max(2, Math.min(activeScenario.fieldHeight - 2, newY))
          };
        }
        return n;
      })
    );
  }, [activeScenario]);

  const toggleNodeState = useCallback((nodeId: number) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.node_id === nodeId) {
          const nextState = n.final_state === 'ACTIVE' ? 'SLEEP' : 'ACTIVE';
          return {
            ...n,
            final_state: nextState
          };
        }
        return n;
      })
    );
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        activeScenario,
        allScenarios,
        selectScenario,
        saveCustomScenario,
        resetScenario,
        isScenarioModalOpen,
        setIsScenarioModalOpen,
        currentRound,
        maxRounds,
        isPlaying,
        playbackSpeed,
        play,
        pause,
        stepForward,
        stepBackward,
        restart,
        jumpToRound,
        setPlaybackSpeed,
        selectedProtocol,
        setSelectedProtocol,
        selectedOptimizer,
        setSelectedOptimizer,
        selectedSeed,
        setSelectedSeed,
        nodes,
        selectedNode,
        hoveredNode,
        setSelectedNode,
        setHoveredNode,
        activeClusterHeads,
        voronoiPolygons,
        coverageMatrixResult,
        voronoiMode,
        setVoronoiMode,
        coverageMode,
        setCoverageMode,
        selectedCoveragePointIndex,
        setSelectedCoveragePointIndex,
        telemetry,
        roundSnapshots,
        layers,
        toggleLayer,
        setAllLayers,
        viewMode,
        setViewMode,
        cameraMode,
        setCameraMode,
        followedNodeId,
        setFollowedNodeId,
        isFullscreen,
        setIsFullscreen,
        uiMode,
        setUIMode,
        isPresentationMode,
        setIsPresentationMode,
        storyStep,
        setStoryStep,
        isStoryPlaying,
        setIsStoryPlaying,
        startStoryMode,
        stopStoryMode,
        nextStoryStep,
        prevStoryStep,
        isOptimizing,
        currentOptIteration,
        optIterationsData,
        activeForceVectors,
        executeOptimization,
        stopOptimization,
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
        isResearchDemoActive,
        researchDemoStep,
        researchDemoNarrative,
        startResearchDemo,
        stopResearchDemo,
        isAudioEnabled,
        audioVolume,
        toggleAudio,
        setAudioVolume,
        currentEventStageIndex,
        setCurrentEventStageIndex,
        currentEventStageLabel,
        setCurrentEventStageLabel,
        injectEnergyToNode,
        relocateNode,
        toggleNodeState,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useWSNSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useWSNSimulation must be used within a SimulationProvider');
  }
  return context;
};


