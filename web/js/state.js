/**
 * Central Reactive State Store for NeuroSense-WSN v2.
 * Manages sensor nodes, active tab, scenarios, simulation history, and tool modes.
 */

export const State = {
  // Current Scenario & Network Parameters
  scenarioId: "s2",
  numNodes: 50,
  sensingRadius: 15.0,
  commRadius: 30.0,
  deploymentType: "random",
  seed: 42,
  pathLossExp: 2.0,

  // Presets
  obstaclePreset: "none",
  jammerPreset: "none",
  poiPreset: "none",
  dutyCyclePreset: "none",
  routingProto: "ann_pso_hybrid",

  // Spatial & Mathematical Telemetry
  nodes: [],
  coverage: { coverage_ratio: 0, overlap_ratio: 0, blindspot_ratio: 100, multiplicity: 0 },
  voronoiCells: [],
  obstacles: [],
  jammers: [],
  pois: [],

  // Interaction State
  activeTab: "3d-sim",
  activeTool: "inspect", // inspect, relocate, inject, delete
  selectedNodeId: null,
  isSimulationRunning: false,
  currentRound: 0,
  simulationSpeed: 50, // ms per round
  simulationHistory: null,

  // ANN Model & Benchmark Data
  annModel: null,
  ablationTable: [],
  protocolTable: [],

  // Listeners for reactive updates
  listeners: new Set(),

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  notify(event, data) {
    this.listeners.forEach((fn) => fn(event, data));
  },

  setNodes(newNodes, notify = true) {
    this.nodes = newNodes;
    if (notify) this.notify("nodes_changed", this.nodes);
  },

  setCoverage(newCoverage) {
    this.coverage = newCoverage;
    this.notify("coverage_changed", this.coverage);
  },

  setSelectedNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.notify("node_selected", nodeId);
  },

  setSimulationHistory(history) {
    this.simulationHistory = history;
    this.notify("simulation_updated", history);
  }
};
