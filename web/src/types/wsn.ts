export interface NodeData {
  seed: number;
  node_id: number;
  x: number;
  y: number;
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
  clusterId?: number;
  nextHopId?: number;
  packetsSent: number;
  packetsReceived: number;
  packetsForwarded: number;
  dissipatedEnergy: number;
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
  simulationRounds: number;
  distribution: 'random' | 'uniform' | 'clustered' | 'grid';
  routingProtocol: RoutingProtocol;
  optimizationAlgorithm: OptimizationAlgorithm;
  seed: number;
}

export type RoutingProtocol = 'leach' | 'pegasis' | 'hybrid' | 'pso_hybrid';
export type OptimizationAlgorithm = 'ann_greedy' | 'pso' | 'mopso' | 'none';
export type CameraMode = 'perspective' | 'top' | 'isometric' | 'sink' | 'orbit' | 'follow_packet' | 'follow_node' | 'reset';
export type UIMode = 'beginner' | 'research';

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
  energyRings: boolean;
  grid: boolean;
  terrain: boolean;
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
