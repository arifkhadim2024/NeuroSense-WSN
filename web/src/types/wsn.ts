export interface NodeData {
  seed: number;
  node_id: number;
  x: number;
  y: number;
  z?: number;
  energy: number;
  node_type: 'normal' | 'advanced' | 'super';
  sink_distance: number;
  neighbors: number;
  coverage_contribution: number;
  overlap_ratio: number;
  node_density: number;
  ann_prediction: 'ACTIVE' | 'SLEEP';
  final_state: 'ACTIVE' | 'SLEEP';
}

export interface DynamicNodeState extends NodeData {
  currentEnergy: number;
  isAlive: boolean;
  isClusterHead: boolean;
  isRelay?: boolean;
  clusterId?: number;
  nextHopId?: number;
  packetsSent: number;
  packetsReceived: number;
  packetsForwarded: number;
  dissipatedEnergy: number;
  voronoiArea?: number;
  voronoiVertices?: [number, number][];
  isCriticalCoverage?: boolean;
  isRedundant?: boolean;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  category: 'benchmark' | 'stress' | 'custom';
  description: string;
  fieldWidth: number;
  fieldHeight: number;
  sensorCount: number;
  sensingRadius: number;
  commRadius: number;
  initialEnergy: number; // in Joules
  sinkX: number;
  sinkY: number;
  sinkZ?: number;
  simulationRounds: number;
  distribution: 'random' | 'uniform' | 'clustered' | 'grid';
  routingProtocol: RoutingProtocol;
  optimizationAlgorithm: OptimizationAlgorithm;
  seed: number;
}

export type RoutingProtocol = 'leach' | 'pegasis' | 'hybrid' | 'pso_hybrid' | 'ann_pso_hybrid';
export type OptimizationAlgorithm = 'ea_vvf_mopso' | 'ann_greedy' | 'pso' | 'mopso' | 'vfa' | 'ga' | 'none';
export type CameraMode = 'perspective' | 'top' | 'isometric' | 'sink' | 'orbit' | 'follow_packet' | 'follow_node' | 'reset';
export type UIMode = 'beginner' | 'research';
export type VoronoiDisplayMode = 'off' | '2d' | '3d' | 'coverage' | 'energy';
export type CoverageDisplayMode = 'off' | 'sensing' | 'comm' | 'energy' | 'overlap' | 'heatmap';

export interface ForceVector {
  nodeId: number;
  origin: [number, number];
  fx: number;
  fy: number;
  magnitude: number;
  type: 'repulsion' | 'attraction' | 'boundary' | 'combined';
}

export interface OptimizationStepData {
  iteration: number;
  nodePositions: { id: number; x: number; y: number; energy: number; isAlive: boolean }[];
  forces: ForceVector[];
  coveragePct: number;
  overlapPct: number;
  fitness: {
    coverage: number;
    overlap: number;
    energyCost: number;
    uniformity: number;
    composite: number;
  };
}

export interface StoryStepInfo {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  explanation: string;
  cameraMode: CameraMode;
  targetProtocol?: RoutingProtocol;
  targetOptimizer?: OptimizationAlgorithm;
  isSleepingActive?: boolean;
}

export interface LayerVisibility {
  sensors: boolean;
  deadSensors: boolean;
  clusterHeads: boolean;
  baseStation: boolean;
  sensingRadius: boolean;
  commRadius: boolean;
  routingLinks: boolean;
  packets: boolean;
  coverageHeatmap: boolean;
  voronoiCells: boolean;
  voronoi3DFences: boolean;
  energyRings: boolean;
  grid: boolean;
  terrain: boolean;
  labels: boolean;
}

export interface SimulationTelemetry {
  currentRound: number;
  maxRounds: number;
  totalNodes: number;
  activeNodes: number;
  sleepingNodes: number;
  deadNodes: number;
  avgResidualEnergy: number;
  totalDissipatedEnergy: number;
  packetsSent: number;
  packetsReceived: number;
  packetsDropped: number;
  deliveryRatio: number;
  currentCoveragePct: number;
  currentOverlapPct: number;
  firstNodeDeadRound: number | null;
  halfNodeDeadRound: number | null;
  lastNodeDeadRound: number | null;
  activeClusterHeadsCount: number;
  averageRoutingDistance: number;
  throughput: number;
  latencyMs: number;
}

export interface RoundSnapshot {
  round: number;
  nodeStates: {
    id: number;
    currentEnergy: number;
    isAlive: boolean;
    isCH: boolean;
    state: 'ACTIVE' | 'SLEEP';
    packetsSent: number;
    packetsReceived: number;
  }[];
  activeClusterHeads: number[];
  avgEnergy: number;
  aliveCount: number;
  deadCount: number;
  coveragePct: number;
  packetsReceived: number;
  deliveryRatio: number;
  routingDistance: number;
}

export interface CoverageGridCell {
  x: number;
  y: number;
  coveredBy: number[];
  isCovered: boolean;
}

export interface OptimizationIterationData {
  iteration: number;
  coveragePct: number;
  overlapPct: number;
  blindspotPct: number;
  meanMultiplicity: number;
  displacementMeters: number;
  relocationEnergyJoules: number;
  fitnessScore: number;
  activeNodeCount: number;
  sensorPositions: { id: number; x: number; y: number }[];
}

export interface GraphItem {
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

export interface SeedMetricData {
  active: number;
  sleep: number;
  cov: number;
  ovl: number;
  fnd: number | string;
  hnd: number | string;
  lnd: number | string;
  pkts: number;
}

export interface SeedRun {
  seed: number;
  baseline: SeedMetricData;
  proposed: SeedMetricData;
}

export interface ResidualEnergySample {
  Round: number;
  LEACH: number;
  PEGASIS: number;
  HYBRID: number;
  PSO_HYBRID: number;
  ANN_PSO_HYBRID?: number;
}

export interface BenchmarkSummaryItem {
  Metric: string;
  Baseline_PSO_Hybrid: number;
  ANN_PSO_Hybrid: number;
  Unit: string;
  Absolute_Change: number;
  Percent_Change: number;
  Interpretation: string;
}

export interface CoverageOptimizationResult {
  seed: number;
  baseline_nodes: number;
  baseline_coverage_pct: number;
  baseline_overlap_pct: number;
  target_coverage_pct: number;
  ann_active_nodes: number;
  ann_coverage_pct: number;
  ann_overlap_pct: number;
  final_active_nodes: number;
  final_sleeping_nodes: number;
  final_coverage_pct: number;
  final_overlap_pct: number;
}

export interface ANNNodePrediction {
  nodeId: number;
  coverageContribution: number; // 0..1 (Predicted unique coverage utility)
  overlapRisk: number;          // 0..1 (Predicted redundant overlap risk)
  blindspotRisk: number;        // 0..1 (Predicted proximity to unmonitored blindspots)
  optimizationPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedMoveVector: [number, number]; // [dx, dy] suggested direction & magnitude
  recommendedMoveAngleDeg: number;
  recommendedMoveDistanceM: number;
  recommendedMoveX: number;
  recommendedMoveY: number;
  featureVector: number[];      // 10-dimensional normalized input vector
  features: number[];
  classification: 'ACTIVE' | 'RELOCATE' | 'SLEEP';
  confidence: number;
}

export interface ANNInferenceResult {
  nodePredictions: Record<number, ANNNodePrediction>;
  predictions: ANNNodePrediction[];
  networkCoveragePrediction: number;
  predictedCoveragePct: number;
  networkOverlapPrediction: number;
  predictedOverlapPct: number;
  networkBlindspotRisk: number;
  predictedBlindspotPct: number;
  overallConfidence: number;
  confidence: number;
  evaluatedNodeCount: number;
  evaluatedNodes: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  timestamp: number;
}

export interface BeforeAfterOptimizationMetrics {
  initialCoveragePct: number;
  finalCoveragePct: number;
  coverageImprovementPct: number;
  initialOverlapPct: number;
  finalOverlapPct: number;
  overlapReductionPct: number;
  initialBlindspotPct: number;
  finalBlindspotPct: number;
  blindspotReductionPct: number;
  totalDisplacementMeters: number;
  averageDisplacementMeters: number;
  energyPreservationPct: number;
  convergenceIteration: number;
  totalIterations: number;
  iterations: number;
  fitnessHistory: { iteration: number; fitness: number; coverage: number; overlap: number; blindspot: number }[];
  beforeCoverage: number;
  afterCoverage: number;
  deltaCoverage: number;
  beforeOverlap: number;
  afterOverlap: number;
  deltaOverlap: number;
  beforeBlindspots: number;
  afterBlindspots: number;
  deltaBlindspots: number;
  beforeAvgEnergy: number;
  afterAvgEnergy: number;
  displacementEnergyCost: number;
  activeNodes: number;
  compositeFitness: number;
}

export type ObstaclePreset = 'none' | 'central-lake' | 'dual-walls' | 'corner-zones' | 'central_lake' | 'dual_walls' | 'perimeter_basins';
export type POIPreset = 'none' | 'high-value-assets' | 'perimeter-patrol' | 'dynamic-convoy' | 'quad_hotspots' | 'perimeter_sentinel' | 'center_target';
export type DutyCyclePreset = 'none' | 'adaptive-redundancy' | 'harvesting-duty-cycle' | 'adaptive' | 'sleep_44' | 'all_active' | 'aggressive_save';
export type JammerPreset = 'none' | 'central-jammer' | 'dual-jammers' | 'single_broadband' | 'dual_spot';
