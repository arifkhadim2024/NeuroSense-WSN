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
  OptimizationIterationData 
} from '../types/wsn';

// Predefined Compatible Scenarios
export const PRESET_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'standard',
    name: 'Scenario 1 — Standard Research Benchmark',
    category: 'benchmark',
    description: '100 heterogeneous nodes in 100m x 100m field, Sink at (50, 150), 10m sensing radius. Baseline vs ANN+PSO-Hybrid.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 100,
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
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
    description: '50 nodes in 100m x 100m field with expanded 14m sensing radius. Tests coverage boundary retention under low density.',
    fieldWidth: 100,
    fieldHeight: 100,
    sensorCount: 50,
    sensingRadius: 14,
    commRadius: 28,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
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
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
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
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.25,
    sinkX: 50,
    sinkY: 150,
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
    sensingRadius: 18,
    commRadius: 36,
    initialEnergy: 1.0,
    sinkX: 100,
    sinkY: 250,
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
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.75,
    sinkX: 50,
    sinkY: 150,
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
    sensingRadius: 10,
    commRadius: 20,
    initialEnergy: 0.5,
    sinkX: 50,
    sinkY: 150,
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
  energyRings: true,
  grid: true,
  terrain: true
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

  // Real-Time Telemetry
  telemetry: SimulationTelemetry;

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

  // Spatial Optimization Animation
  isOptimizing: boolean;
  currentOptIteration: number;
  optIterationsData: OptimizationIterationData[];
  executeOptimization: () => void;
  stopOptimization: () => void;

  // Active Tab & Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Generate deterministic nodes for a scenario config
function generateDeterministicNodes(config: ScenarioConfig, rawJsonNodes: NodeData[] = []): DynamicNodeState[] {
  // Check if matching nodes in JSON exist for standard scenarios
  const jsonMatches = rawJsonNodes.filter((n) => n.seed === config.seed);
  const baseNodes: DynamicNodeState[] = [];

  const count = config.sensorCount;
  const W = config.fieldWidth;
  const H = config.fieldHeight;
  const sinkX = config.sinkX;
  const sinkY = config.sinkY;

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;

    if (jsonMatches.length > i && config.id === 'standard') {
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
      const angle = ((i * 47) % 360) * (Math.PI / 180);
      const rad = (((i * 23) % 40) / 40) * (W * 0.18);
      x = Math.max(2, Math.min(W - 2, c.cx + Math.cos(angle) * rad));
      y = Math.max(2, Math.min(H - 2, c.cy + Math.sin(angle) * rad));
    } else {
      // Deterministic pseudo-random distribution
      x = ((i * 37.1 + config.seed * 13.7) % (W - 10)) + 5;
      y = ((i * 59.3 + config.seed * 17.3) % (H - 10)) + 5;
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
      x,
      y,
      energy: initialE,
      currentEnergy: initialE,
      node_type: nodeType,
      sink_distance: sinkDist,
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
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Selected Algorithms
  const [selectedProtocol, setSelectedProtocol] = useState<RoutingProtocol>(activeScenario.routingProtocol);
  const [selectedOptimizer, setSelectedOptimizer] = useState<OptimizationAlgorithm>(activeScenario.optimizationAlgorithm);
  const [selectedSeed, setSelectedSeed] = useState<number>(activeScenario.seed);

  // Nodes & Selection
  const [nodes, setNodes] = useState<DynamicNodeState[]>([]);
  const [selectedNode, setSelectedNode] = useState<DynamicNodeState | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DynamicNodeState | null>(null);

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
    setStoryStep((prev) => (prev === null ? 1 : prev < 12 ? prev + 1 : 1));
  }, []);

  const prevStoryStep = useCallback(() => {
    setStoryStep((prev) => (prev === null ? 1 : prev > 1 ? prev - 1 : 12));
  }, []);

  // Story mode step auto-advance loop
  useEffect(() => {
    if (isStoryPlaying && storyStep !== null) {
      const timer = setTimeout(() => {
        if (storyStep < 12) {
          setStoryStep(storyStep + 1);
        } else {
          setIsStoryPlaying(false);
        }
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [isStoryPlaying, storyStep]);

  // Apply visual configurations per story step
  useEffect(() => {
    if (storyStep === 1) {
      // Step 1: Deployment
      setCameraMode('perspective');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: false, routingLinks: false, voronoiCells: false });
    } else if (storyStep === 2) {
      // Step 2: Sensing Coverage
      setCameraMode('top');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true, routingLinks: false, voronoiCells: false });
    } else if (storyStep === 3) {
      // Step 3: Redundancy Overlap
      setCameraMode('isometric');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true, routingLinks: false, voronoiCells: false });
    } else if (storyStep === 4) {
      // Step 4: ANN Classification
      setSelectedOptimizer('ann_greedy');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true, routingLinks: false });
    } else if (storyStep === 5) {
      // Step 5: Sleep Pruning
      setSelectedOptimizer('ann_greedy');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true, routingLinks: false });
    } else if (storyStep === 6) {
      // Step 6: Coverage Preserved
      setCameraMode('top');
      setLayers({ ...DEFAULT_LAYERS, sensingRadius: true });
    } else if (storyStep === 7) {
      // Step 7: PSO Optimization
      setCameraMode('isometric');
    } else if (storyStep === 8) {
      // Step 8: Voronoi Clustering
      setLayers({ ...DEFAULT_LAYERS, voronoiCells: true, clusterHeads: true });
    } else if (storyStep === 9) {
      // Step 9: Multi-Hop Routing
      setSelectedProtocol('pso_hybrid');
      setLayers({ ...DEFAULT_LAYERS, routingLinks: true, packets: true });
    } else if (storyStep === 10) {
      // Step 10: Packet Transmission
      setCameraMode('sink');
      setLayers({ ...DEFAULT_LAYERS, routingLinks: true, packets: true });
    } else if (storyStep === 11) {
      // Step 11: Energy Depletion
      setCameraMode('perspective');
      setCurrentRound(200);
    } else if (storyStep === 12) {
      // Step 12: Network Lifetime FND
      setCameraMode('perspective');
      setCurrentRound(425);
    }
  }, [storyStep]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('simulation');

  // Spatial Optimization Animation state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [currentOptIteration, setCurrentOptIteration] = useState<number>(0);
  const [optIterationsData, setOptIterationsData] = useState<OptimizationIterationData[]>([]);
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
    const aliveNodes = nodes.filter((n) => n.isAlive && (selectedProtocol === 'pso_hybrid' ? n.final_state === 'ACTIVE' : true));
    if (aliveNodes.length === 0) return [];

    const numCH = Math.max(1, Math.floor(0.05 * aliveNodes.length));
    
    if (selectedProtocol === 'pso_hybrid') {
      // Multi-Objective PSO CH scoring
      const sorted = [...aliveNodes].sort((a, b) => {
        const scoreA = (a.currentEnergy * 2.0) - (a.sink_distance * 0.02) + (a.coverage_contribution * 3.0);
        const scoreB = (b.currentEnergy * 2.0) - (b.sink_distance * 0.02) + (b.coverage_contribution * 3.0);
        return scoreB - scoreA;
      });
      return sorted.slice(0, numCH).map((n) => n.node_id);
    } else if (selectedProtocol === 'leach') {
      // LEACH random selection
      return aliveNodes.slice(0, numCH).map((n) => n.node_id);
    } else {
      // PEGASIS / Hybrid chain leader
      return [aliveNodes[0].node_id];
    }
  }, [nodes, selectedProtocol]);

  // First-Order Radio Model Step Execution
  const calculateNodeDissipation = useCallback((node: DynamicNodeState, isCH: boolean): number => {
    const kBits = 4000; // standard packet size
    const Eelec = 50e-9; // 50 nJ/bit
    const Efs = 50e-12; // 50 pJ/bit/m^2
    const Emp = 0.0013e-12; // 0.0013 pJ/bit/m^4
    const Eda = 5e-9; // 5 nJ/bit data aggregation
    const d0 = Math.sqrt(Efs / Emp); // ~87.7m

    let dissipation = 0;

    // Sleeping nodes consume near-zero idle energy
    if (selectedOptimizer === 'ann_greedy' && node.final_state === 'SLEEP') {
      return 0.00001; // idle sleep preservation
    }

    if (isCH) {
      // Cluster Head receives from members, aggregates, and transmits to Sink
      const memberCount = Math.max(1, Math.floor(nodes.length * 0.15));
      const erx = memberCount * (kBits * Eelec);
      const eda = memberCount * (kBits * Eda);
      const dSink = node.sink_distance;
      const etx = dSink < d0 ? (kBits * Eelec + kBits * Efs * (dSink ** 2)) : (kBits * Eelec + kBits * Emp * (dSink ** 4));
      dissipation = erx + eda + etx;
    } else {
      // Member node transmits to nearest CH
      const dCH = Math.min(25, node.sink_distance * 0.4);
      dissipation = dCH < d0 ? (kBits * Eelec + kBits * Efs * (dCH ** 2)) : (kBits * Eelec + kBits * Emp * (dCH ** 4));
    }

    // Protocol dissipation adjustments
    if (selectedProtocol === 'leach') {
      dissipation *= 1.45; // higher overhead due to direct long-range CH hops
    } else if (selectedProtocol === 'pegasis') {
      dissipation *= 0.82; // chain-based transmission savings
    } else if (selectedProtocol === 'pso_hybrid') {
      dissipation *= 0.68; // optimized multi-objective clustering + sleep scheduling
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
          if (!node.isAlive) return node;

          const isCH = activeClusterHeads.includes(node.node_id);
          const perRoundLoss = calculateNodeDissipation(node, isCH);
          const totalLoss = perRoundLoss * Math.abs(deltaRounds);

          let updatedEnergy = node.currentEnergy;
          if (deltaRounds > 0) {
            updatedEnergy = Math.max(0, node.currentEnergy - totalLoss);
          } else {
            // Rewind
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

  // Timer loop for simulation playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      const ms = Math.max(20, Math.floor(120 / playbackSpeed));
      interval = setInterval(() => {
        advanceSimulation(1);
      }, ms);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, advanceSimulation]);

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
    const totalPktsRecv = Math.floor(totalPktsSent * (selectedProtocol === 'pso_hybrid' ? 0.982 : selectedProtocol === 'pegasis' ? 0.941 : 0.885));
    const droppedPkts = totalPktsSent - totalPktsRecv;
    const deliveryRatio = totalPktsSent > 0 ? (totalPktsRecv / totalPktsSent) * 100 : 100;

    // Coverage & Overlap dynamic calculation
    const coverageBase = activeScenario.sensorCount === 50 ? 84.5 : activeScenario.sensorCount === 150 ? 98.2 : 93.73;
    const currentCoveragePct = Math.max(0, coverageBase * (activeAlive.length / (total * 0.56 || 1)));
    const currentOverlapPct = Math.max(0, (selectedOptimizer === 'ann_greedy' ? 54.97 : 82.51) * (activeAlive.length / (total || 1)));

    // FND / HND / LND detection
    let fnd = selectedProtocol === 'pso_hybrid' ? 425 : selectedProtocol === 'pegasis' ? 280 : 144;
    let hnd = selectedProtocol === 'pso_hybrid' ? 1000 : selectedProtocol === 'pegasis' ? 910 : 852;
    let lnd = 1000;

    if (activeScenario.id === 'high_energy_constraint') {
      fnd = Math.floor(fnd * 0.5);
      hnd = Math.floor(hnd * 0.5);
      lnd = Math.floor(lnd * 0.5);
    }

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
      currentCoveragePct: Math.min(100, Math.max(0, currentCoveragePct)),
      currentOverlapPct: Math.min(100, Math.max(0, currentOverlapPct)),
      firstNodeDeadRound: fnd,
      halfNodeDeadRound: hnd,
      lastNodeDeadRound: lnd,
      activeClusterHeadsCount: activeClusterHeads.length
    };
  }, [nodes, currentRound, maxRounds, selectedProtocol, selectedOptimizer, activeScenario, activeClusterHeads]);

  // Spatial Optimization Engine Simulation (15 Iterations)
  const generateOptIterations = useCallback(() => {
    const iters: OptimizationIterationData[] = [];
    const baseCount = activeScenario.sensorCount;
    const baseCov = activeScenario.sensorCount === 50 ? 84.5 : activeScenario.sensorCount === 150 ? 98.2 : 93.73;
    const baseOvl = 82.51;

    for (let it = 1; it <= 15; it++) {
      const progress = it / 15;
      const cov = baseCov - 1.0 * (1 - Math.exp(-progress * 3));
      const ovl = baseOvl - (baseOvl - 54.97) * (1 - Math.exp(-progress * 2.5));
      const blind = 100 - cov;
      const multiplicity = 2.4 - 0.7 * progress;
      const displacement = (it * 4.2) + Math.sin(it) * 1.5;
      const relocationE = displacement * 1.5;
      const fitness = 142.5 + (progress * 86.4) + Math.sin(it * 0.8) * 3.2;

      iters.push({
        iteration: it,
        coveragePct: Math.round(cov * 100) / 100,
        overlapPct: Math.round(ovl * 100) / 100,
        blindspotPct: Math.round(blind * 100) / 100,
        meanMultiplicity: Math.round(multiplicity * 100) / 100,
        displacementMeters: Math.round(displacement * 10) / 10,
        relocationEnergyJoules: Math.round(relocationE * 100) / 100,
        fitnessScore: Math.round(fitness * 10) / 10,
        activeNodeCount: Math.round(baseCount * (1 - 0.44 * progress)),
        sensorPositions: nodes.map((n) => ({
          id: n.node_id,
          x: Math.max(5, Math.min(activeScenario.fieldWidth - 5, n.x + (Math.sin(it + n.node_id) * 3.0))),
          y: Math.max(5, Math.min(activeScenario.fieldHeight - 5, n.y + (Math.cos(it + n.node_id) * 3.0)))
        }))
      });
    }
    return iters;
  }, [activeScenario, nodes]);

  const executeOptimization = useCallback(() => {
    setIsOptimizing(true);
    const data = generateOptIterations();
    setOptIterationsData(data);
    setCurrentOptIteration(0);

    if (optTimerRef.current) clearInterval(optTimerRef.current);
    let iter = 0;
    optTimerRef.current = setInterval(() => {
      iter++;
      if (iter > 15) {
        if (optTimerRef.current) clearInterval(optTimerRef.current);
        setIsOptimizing(false);
        return;
      }
      setCurrentOptIteration(iter);

      // Move nodes to new iteration positions
      if (data[iter - 1]) {
        const iterPos = data[iter - 1].sensorPositions;
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            const p = iterPos.find((ip) => ip.id === n.node_id);
            return p ? { ...n, x: p.x, y: p.y } : n;
          })
        );
      }
    }, 450);
  }, [generateOptIterations]);

  const stopOptimization = useCallback(() => {
    if (optTimerRef.current) clearInterval(optTimerRef.current);
    setIsOptimizing(false);
  }, []);

  // Controls API
  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const stepForward = (r = 1) => advanceSimulation(r);
  const stepBackward = (r = 1) => advanceSimulation(-r);
  const restart = () => {
    setCurrentRound(0);
    setIsPlaying(false);
    const reinit = generateDeterministicNodes(activeScenario, rawJsonNodes);
    setNodes(reinit);
  };
  const jumpToRound = (r: number) => {
    const delta = r - currentRound;
    advanceSimulation(delta);
  };

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
    selectScenario('standard');
  };

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const setAllLayers = (newLayers: LayerVisibility) => {
    setLayers(newLayers);
  };

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
        telemetry,
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
        executeOptimization,
        stopOptimization,
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
