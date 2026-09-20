import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Maximize2, Minimize2,
  Sliders,
  ChevronRight, ChevronLeft,
  Crosshair, Move, PlusCircle, Trash2,
  Volume2, VolumeX, Brain, Sparkles,
  Compass, TrendingUp
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { soundFX } from '../utils/soundEffects';
import type { DynamicNodeState, RoutingProtocol, CameraMode } from '../types/wsn';

// 6 Dedicated Visualization Modes
type VisMode = 'full' | 'network' | 'coverage' | 'routing' | 'energy' | 'voronoi';
type ToolMode = 'inspect' | 'relocate' | 'inject' | 'remove';

interface Node3DHandle {
  id: number;
  group: THREE.Group;
  casingMesh: THREE.Mesh;
  ledMesh: THREE.Mesh;
  mastMesh: THREE.Mesh;
  beaconMesh: THREE.Mesh;
  chCrownMesh: THREE.Mesh;
  diskMesh: THREE.Mesh;
  diskRingMesh: THREE.Mesh;
  sprite: THREE.Sprite;
  baseY: number;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  node: DynamicNodeState;
  isCH: boolean;
  txFlashTimer: number;
  rxFlashTimer: number;
}

interface DynamicLaserBeam {
  coreLine: THREE.Line;
  haloLine: THREE.Line;
  points: THREE.Vector3[];
  sourceId: number;
  targetId: number | 'sink';
  isUplink: boolean;
  activePhase: [number, number]; // [startPhase, endPhase] within round cycle
  label: string;
}

interface PacketParticleItem {
  mesh: THREE.Mesh;
  offsetT: number;
  lateralX: number;
  lateralY: number;
  lateralZ: number;
  baseScale: number;
}

interface DynamicPacketStream {
  group: THREE.Group;
  particles: PacketParticleItem[];
  path: THREE.Vector3[];
  color: number;
  sourceId: number;
  targetId: number | 'sink';
  targetPos: THREE.Vector3;
  isUplink: boolean;
  activePhase: [number, number];
  label: string;
}

interface GroundRipple {
  mesh: THREE.Mesh;
  scale: number;
  opacity: number;
  maxScale: number;
  speed: number;
}

interface AggregationPulse {
  mesh: THREE.Mesh;
  scale: number;
  opacity: number;
  maxScale: number;
  speed: number;
}

interface EMPShockwave {
  mesh: THREE.Mesh;
  currentRadius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

// 8 Discrete Event Stages per Round Cycle
interface EventStageInfo {
  stageNumber: number;
  name: string;
  shortDesc: string;
  longDesc: string;
  startP: number;
  endP: number;
}

const EVENT_STAGES: EventStageInfo[] = [
  {
    stageNumber: 1,
    name: 'Cluster Head Election',
    shortDesc: 'Swarm / Multi-objective CH Selection',
    longDesc: 'Multi-objective evaluation of residual battery energy, sink distance, and spatial coverage contribution to elect optimal Cluster Heads.',
    startP: 0.00,
    endP: 0.10
  },
  {
    stageNumber: 2,
    name: 'Cluster Formation',
    shortDesc: 'Active Link Topology Setup',
    longDesc: 'Sensor nodes compute communication distances and configure routing links to nearest Cluster Head or chain neighbor.',
    startP: 0.10,
    endP: 0.22
  },
  {
    stageNumber: 3,
    name: 'Member Data Transmission',
    shortDesc: 'Node → Cluster Head Laser Flow',
    longDesc: 'Active member sensors fire directional laser communication beams and transmit monitored environmental telemetry packets to their Cluster Head.',
    startP: 0.22,
    endP: 0.45
  },
  {
    stageNumber: 4,
    name: 'Packet Receipt & Buffer',
    shortDesc: 'Cluster Head Ingestion',
    longDesc: 'Cluster Heads receive member telemetry packets with a status flash and register payload data into local memory buffer.',
    startP: 0.45,
    endP: 0.55
  },
  {
    stageNumber: 5,
    name: 'Data Fusion & Aggregation',
    shortDesc: 'Payload Compression & Fusion',
    longDesc: 'Cluster Head fuses multiple sensor data streams, reducing packet overhead and compressing telemetry into an aggregated super-packet.',
    startP: 0.55,
    endP: 0.67
  },
  {
    stageNumber: 6,
    name: 'Base Station Uplink',
    shortDesc: 'CH → Sink Long-Range Laser',
    longDesc: 'Cluster Head fires a high-power directional laser beam to transmit the aggregated super-packet to the Base Station.',
    startP: 0.67,
    endP: 0.88
  },
  {
    stageNumber: 7,
    name: 'Sink Ingestion & Reception',
    shortDesc: 'Base Station Packet Absorption',
    longDesc: 'Base Station validates telemetry reception at sink coordinates. Central core pulses and network throughput counters increment.',
    startP: 0.88,
    endP: 0.95
  },
  {
    stageNumber: 8,
    name: 'Energy Settlement',
    shortDesc: 'First-Order Radio Dissipation',
    longDesc: 'Residual battery dissipation settled across all transmitting and receiving nodes based on the first-order radio energy model.',
    startP: 0.95,
    endP: 1.00
  }
];

export const WSN3DVisualizer: React.FC = () => {
  const {
    activeScenario,
    nodes,
    selectedNode,
    hoveredNode,
    setSelectedNode,
    setHoveredNode,
    activeClusterHeads,
    currentRound,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    play,
    pause,
    restart,
    stepForward,
    stepBackward,
    selectedProtocol,
    setSelectedProtocol,
    selectedOptimizer,
    selectedSeed,
    setSelectedSeed,
    executeOptimization,
    isOptimizing,
    currentOptIteration,
    activeForceVectors,
    telemetry,
    saveCustomScenario,
    voronoiMode,
    voronoiPolygons,
    injectEnergyToNode,
    injectNewNode,
    removeNode,
    relocateNode,
    toggleNodeState,
    obstaclePreset,
    poiPreset,
    jammerPreset,
    isManuallyModified,
    annInferenceResult,
    isANNRunning,
    runANNInference,
    beforeAfterMetrics,
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
    toggleAudio,
    isPresentationMode,
    setIsPresentationMode,
    setCurrentEventStageIndex,
    setCurrentEventStageLabel
  } = useWSNSimulation();

  // 3D Canvas & Camera State
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number>(0);

  // Left Tool Dock: Inspect, Relocate, Inject, Remove
  const [toolMode, setToolMode] = useState<ToolMode>('inspect');

  // Drag & Drop State
  const isDraggingRef = useRef<boolean>(false);
  const draggedNodeIdRef = useRef<number | null>(null);
  const [dragBadge, setDragBadge] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);

  // Layer Group Refs for Obstacles, POIs, and Jammers
  const obstaclesLayerGroupRef = useRef<THREE.Group | null>(null);
  const poiLayerGroupRef = useRef<THREE.Group | null>(null);
  const jammerLayerGroupRef = useRef<THREE.Group | null>(null);

  // Visualization Mode Selector: FULL, NETWORK, COVERAGE, ROUTING, ENERGY, VORONOI
  const [visMode, setVisMode] = useState<VisMode>('full');

  // Camera & Interaction States
  const [activeCamPreset, setActiveCamPreset] = useState<CameraMode>('perspective');
  const [is360Rotating, setIs360Rotating] = useState<boolean>(false);
  const [showDiskBubbles, setShowDiskBubbles] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // HUD Popover Explanation States
  const [hoveredHudCard, setHoveredHudCard] = useState<'phase1' | 'phase2' | null>(null);
  const [empBannerText, setEmpBannerText] = useState<string | null>(null);
  const empBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronized Event-Based Animation Timeline State
  const roundPhaseTimerRef = useRef<number>(0);
  const lastPlayedStageIdxRef = useRef<number>(-1);

  // Live state refs for non-restarting 60 FPS animation loop
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const simSpeedRef = useRef<number>(playbackSpeed);
  simSpeedRef.current = playbackSpeed;
  const visModeRef = useRef<VisMode>(visMode);
  visModeRef.current = visMode;
  const showDiskBubblesRef = useRef<boolean>(showDiskBubbles);
  showDiskBubblesRef.current = showDiskBubbles;
  const activeCamPresetRef = useRef<CameraMode>(activeCamPreset);
  activeCamPresetRef.current = activeCamPreset;
  const is360RotatingRef = useRef<boolean>(is360Rotating);
  is360RotatingRef.current = is360Rotating;
  const selectedNodeRef = useRef<DynamicNodeState | null>(selectedNode);
  selectedNodeRef.current = selectedNode;
  const hoveredNodeRef = useRef<DynamicNodeState | null>(hoveredNode);
  hoveredNodeRef.current = hoveredNode;
  const stepForwardRef = useRef(stepForward);
  stepForwardRef.current = stepForward;

  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [eventProgressPct, setEventProgressPct] = useState<number>(0);

  // Mouse Parallax & 3D Hover State
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);
  const mouseNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-46, 68, 96));

  // Live Slider local states
  const [nodeCount, setNodeCount] = useState<number>(activeScenario.sensorCount || 70);
  const [sensingRad, setSensingRad] = useState<number>(activeScenario.sensingRadius || 19);
  const [commRad, setCommRad] = useState<number>(activeScenario.commRadius || 37);
  const [initialEnergy, setInitialEnergy] = useState<number>(activeScenario.initialEnergy || 0.5);
  const [maxRounds, setMaxRounds] = useState<number>(activeScenario.simulationRounds || 1000);

  // Sync sliders when scenario changes
  useEffect(() => {
    setNodeCount(activeScenario.sensorCount || 70);
    setSensingRad(activeScenario.sensingRadius || 19);
    setCommRad(activeScenario.commRadius || 37);
    setInitialEnergy(activeScenario.initialEnergy || 0.5);
    setMaxRounds(activeScenario.simulationRounds || 1000);
  }, [activeScenario]);

  // Mesh & Object References for Dynamic Live Network Simulation
  const nodeHandlesRef = useRef<Map<number, Node3DHandle>>(new Map());
  const laserBeamsRef = useRef<DynamicLaserBeam[]>([]);
  const packetStreamsRef = useRef<DynamicPacketStream[]>([]);
  const groundRipplesRef = useRef<GroundRipple[]>([]);
  const aggregationPulsesRef = useRef<AggregationPulse[]>([]);
  const empShockwavesRef = useRef<EMPShockwave[]>([]);

  // Permanent Top-Level Layer Groups
  const nodesLayerGroupRef = useRef<THREE.Group | null>(null);
  const coverageLayerGroupRef = useRef<THREE.Group | null>(null);
  const voronoiLayerGroupRef = useRef<THREE.Group | null>(null);
  const routingLayerGroupRef = useRef<THREE.Group | null>(null);
  const packetsLayerGroupRef = useRef<THREE.Group | null>(null);
  const effectsLayerGroupRef = useRef<THREE.Group | null>(null);
  const labelsLayerGroupRef = useRef<THREE.Group | null>(null);
  const forcesLayerGroupRef = useRef<THREE.Group | null>(null);
  const annVectorsLayerGroupRef = useRef<THREE.Group | null>(null);
  const overlapConcentrationLayerGroupRef = useRef<THREE.Group | null>(null);
  const blindspotHolesLayerGroupRef = useRef<THREE.Group | null>(null);
  const uiLayerGroupRef = useRef<THREE.Group | null>(null);

  const selectionBeaconRef = useRef<THREE.Group | null>(null);
  const hoverHighlightMeshRef = useRef<THREE.Group | null>(null);
  const radarDishRef = useRef<THREE.Mesh | null>(null);
  const sinkCoreRef = useRef<THREE.Mesh | null>(null);
  const skyBeamRef = useRef<THREE.Mesh | null>(null);
  const sinkImpactRingRef = useRef<THREE.Mesh | null>(null);

  // Coordinate mapper from scenario space (0..W, 0..H) to 3D scene (-50..50)
  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;

  const to3DPos = useCallback((x: number, y: number, heightOffset = 0): THREE.Vector3 => {
    const sceneX = ((x / W) - 0.5) * 100;
    const sceneZ = -(((y / H) - 0.5) * 100);
    return new THREE.Vector3(sceneX, heightOffset, sceneZ);
  }, [W, H]);

  const sink3DPos = useMemo(() => {
    const sx = ((activeScenario.sinkX / W) - 0.5) * 100;
    const sz = -(((activeScenario.sinkY / H) - 0.5) * 100);
    return new THREE.Vector3(sx, 16, sz);
  }, [activeScenario, W, H]);

  // Helper: Create 3D text sprite for Node ID [N17]
  const createTextSprite = useCallback((text: string, color: string = '#00E5FF'): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(5, 10, 22, 0.88)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(8, 8, 112, 48, 12);
      } else {
        ctx.rect(8, 8, 112, 48);
      }
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      depthWrite: false, 
      depthTest: false 
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.8, 1.9, 1);
    return sprite;
  }, []);

  // Helper: Create Corner Coordinate Sprites
  const createCornerSprite = useCallback((text: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(7, 14, 26, 0.75)';
      ctx.fillRect(0, 0, 128, 48);
      ctx.strokeStyle = '#1C3150';
      ctx.strokeRect(0, 0, 128, 48);
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 24);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(7.5, 2.8, 1);
    return sprite;
  }, []);

  // Visual Effects Emitters
  const triggerArrivalRipple = useCallback((pos: THREE.Vector3, color = 0x00E5FF) => {
    if (!effectsLayerGroupRef.current) return;
    const geo = new THREE.RingGeometry(0.5, 1.2, 24);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.15, pos.z);
    effectsLayerGroupRef.current.add(mesh);

    groundRipplesRef.current.push({
      mesh,
      scale: 1,
      opacity: 0.95,
      maxScale: 6.5,
      speed: 0.12
    });
  }, []);

  const triggerAggregationPulse = useCallback((pos: THREE.Vector3) => {
    if (!effectsLayerGroupRef.current) return;
    const geo = new THREE.SphereGeometry(1.2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0.85,
      wireframe: true,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    effectsLayerGroupRef.current.add(mesh);

    aggregationPulsesRef.current.push({
      mesh,
      scale: 1,
      opacity: 0.85,
      maxScale: 4.8,
      speed: 0.15
    });
  }, []);

  // -------------------------------------------------------------
  // 1. INITIALIZE THREE.JS SCENE ONCE ON MOUNT
  // -------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    scene.fog = new THREE.FogExp2(0x050811, 0.0035);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 1000);
    camera.position.copy(targetCameraPosRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 260;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1E293B, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00E5FF, 1.6);
    dirLight.position.set(60, 100, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const sinkPointLight = new THREE.PointLight(0xF59E0B, 2.8, 140);
    sinkPointLight.position.copy(sink3DPos);
    scene.add(sinkPointLight);

    // Ground Plane & Grid
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070E1A,
      roughness: 0.85,
      metalness: 0.2
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    groundMesh.position.y = 0;
    scene.add(groundMesh);

    const gridHelper = new THREE.GridHelper(100, 20, 0x1C3150, 0x0F1B2E);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Boundary Frame
    const frameGeo = new THREE.BoxGeometry(100.8, 0.4, 100.8);
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.45 });
    const frameLines = new THREE.LineSegments(frameEdges, frameLineMat);
    frameLines.position.y = 0.2;
    scene.add(frameLines);

    // Corner Sprites
    const c1 = createCornerSprite('(0, 0)');
    c1.position.set(-50, 1.2, 50);
    scene.add(c1);

    const c2 = createCornerSprite('(100, 0)');
    c2.position.set(50, 1.2, 50);
    scene.add(c2);

    const c3 = createCornerSprite('(0, 100)');
    c3.position.set(-50, 1.2, -50);
    scene.add(c3);

    const c4 = createCornerSprite('(100, 100)');
    c4.position.set(50, 1.2, -50);
    scene.add(c4);

    // Base Station (Sink) Tower Geometry
    const bsGroup = new THREE.Group();
    bsGroup.position.set(sink3DPos.x, 0, sink3DPos.z);

    const bsBaseGeo = new THREE.CylinderGeometry(3.5, 4.5, 2.5, 24);
    const bsBaseMat = new THREE.MeshStandardMaterial({ color: 0x1C2B40, metalness: 0.9, roughness: 0.2 });
    const bsBase = new THREE.Mesh(bsBaseGeo, bsBaseMat);
    bsBase.position.y = 1.25;
    bsGroup.add(bsBase);

    const dishGeo = new THREE.CylinderGeometry(3.2, 0.6, 1.2, 24, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
    const radarDish = new THREE.Mesh(dishGeo, dishMat);
    radarDish.position.y = 9.5;
    radarDish.rotation.x = Math.PI / 4;
    bsGroup.add(radarDish);
    radarDishRef.current = radarDish;

    const coreGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 2.2 });
    const sinkCore = new THREE.Mesh(coreGeo, coreMat);
    sinkCore.position.y = 5.5;
    bsGroup.add(sinkCore);
    sinkCoreRef.current = sinkCore;

    const mastGeo = new THREE.CylinderGeometry(0.2, 0.4, 12, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 7.0;
    bsGroup.add(mast);

    const beaconTipGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const beaconTipMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
    const beaconTip = new THREE.Mesh(beaconTipGeo, beaconTipMat);
    beaconTip.position.y = 13.5;
    bsGroup.add(beaconTip);

    // Sky Beam Rising into Atmosphere
    const skyBeamGeo = new THREE.CylinderGeometry(0.35, 0.85, sink3DPos.y + 50, 16);
    const skyBeamMat = new THREE.MeshBasicMaterial({
      color: 0xFF2B6D,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const skyBeam = new THREE.Mesh(skyBeamGeo, skyBeamMat);
    skyBeam.position.set(0, -(sink3DPos.y + 50) / 2 + 13.5, 0);
    bsGroup.add(skyBeam);
    skyBeamRef.current = skyBeam;

    // Ground Impact Ring
    const impactRingGeo = new THREE.RingGeometry(2.2, 3.8, 32);
    const impactRingMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const impactRing = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(0, 0.1, 0);
    bsGroup.add(impactRing);
    sinkImpactRingRef.current = impactRing;

    // Base Station Label
    const bsSprite = createTextSprite('BASE STATION', '#F59E0B');
    bsSprite.position.set(0, 16.5, 0);
    bsSprite.scale.set(7.5, 3.75, 1);
    bsGroup.add(bsSprite);

    scene.add(bsGroup);

    // -------------------------------------------------------------
    // PERMANENT SCENE HIERARCHY GROUPS
    // -------------------------------------------------------------
    const overlapGroup = new THREE.Group();
    overlapGroup.renderOrder = 1;
    scene.add(overlapGroup);
    overlapConcentrationLayerGroupRef.current = overlapGroup;

    const blindspotGroup = new THREE.Group();
    blindspotGroup.renderOrder = 2;
    scene.add(blindspotGroup);
    blindspotHolesLayerGroupRef.current = blindspotGroup;

    const voronoiLayerGroup = new THREE.Group();
    voronoiLayerGroup.renderOrder = 3;
    scene.add(voronoiLayerGroup);
    voronoiLayerGroupRef.current = voronoiLayerGroup;

    const coverageLayerGroup = new THREE.Group();
    coverageLayerGroup.renderOrder = 4;
    scene.add(coverageLayerGroup);
    coverageLayerGroupRef.current = coverageLayerGroup;

    const routingLayerGroup = new THREE.Group();
    routingLayerGroup.renderOrder = 5;
    scene.add(routingLayerGroup);
    routingLayerGroupRef.current = routingLayerGroup;

    const nodesLayerGroup = new THREE.Group();
    nodesLayerGroup.renderOrder = 6;
    scene.add(nodesLayerGroup);
    nodesLayerGroupRef.current = nodesLayerGroup;

    const annVectorsGroup = new THREE.Group();
    annVectorsGroup.renderOrder = 7;
    scene.add(annVectorsGroup);
    annVectorsLayerGroupRef.current = annVectorsGroup;

    const packetsLayerGroup = new THREE.Group();
    packetsLayerGroup.renderOrder = 8;
    scene.add(packetsLayerGroup);
    packetsLayerGroupRef.current = packetsLayerGroup;

    const effectsLayerGroup = new THREE.Group();
    effectsLayerGroup.renderOrder = 9;
    scene.add(effectsLayerGroup);
    effectsLayerGroupRef.current = effectsLayerGroup;

    const forcesLayerGroup = new THREE.Group();
    forcesLayerGroup.renderOrder = 10;
    scene.add(forcesLayerGroup);
    forcesLayerGroupRef.current = forcesLayerGroup;

    const uiLayerGroup = new THREE.Group();
    uiLayerGroup.renderOrder = 11;
    scene.add(uiLayerGroup);
    uiLayerGroupRef.current = uiLayerGroup;

    const labelsLayerGroup = new THREE.Group();
    labelsLayerGroup.renderOrder = 12;
    scene.add(labelsLayerGroup);
    labelsLayerGroupRef.current = labelsLayerGroup;

    const obstaclesGroup = new THREE.Group();
    obstaclesGroup.renderOrder = 13;
    scene.add(obstaclesGroup);
    obstaclesLayerGroupRef.current = obstaclesGroup;

    const poiGroup = new THREE.Group();
    poiGroup.renderOrder = 14;
    scene.add(poiGroup);
    poiLayerGroupRef.current = poiGroup;

    const jammerGroup = new THREE.Group();
    jammerGroup.renderOrder = 15;
    scene.add(jammerGroup);
    jammerLayerGroupRef.current = jammerGroup;

    // Selection Beacon Group
    const selectionGroup = new THREE.Group();
    const selRingGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const selRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const selRing = new THREE.Mesh(selRingGeo, selRingMat);
    selRing.rotation.x = -Math.PI / 2;
    selRing.position.y = 0.12;
    selectionGroup.add(selRing);
    selectionGroup.visible = false;
    scene.add(selectionGroup);
    selectionBeaconRef.current = selectionGroup;

    // Hover Highlight Group
    const hoverGroup = new THREE.Group();
    const hRingGeo = new THREE.RingGeometry(2.0, 2.5, 32);
    const hRingMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const hRing = new THREE.Mesh(hRingGeo, hRingMat);
    hRing.rotation.x = -Math.PI / 2;
    hRing.position.y = 0.14;
    hoverGroup.add(hRing);
    hoverGroup.visible = false;
    scene.add(hoverGroup);
    hoverHighlightMeshRef.current = hoverGroup;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // CONTINUOUS 60 FPS ANIMATION LOOP (ZERO FLICKER)
    // -------------------------------------------------------------
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentSpeed = simSpeedRef.current;
      const currentIsPlaying = isPlayingRef.current;
      const currentVisMode = visModeRef.current;
      const currentShowDisks = showDiskBubblesRef.current;

      // 1. Synchronized Timeline Progression
      const roundDurationSeconds = 10.0 / Math.max(0.05, currentSpeed);

      if (currentIsPlaying) {
        const deltaPhase = dt / roundDurationSeconds;
        roundPhaseTimerRef.current += deltaPhase;

        if (roundPhaseTimerRef.current >= 1.0) {
          roundPhaseTimerRef.current = 0.0;
          stepForwardRef.current(1);
        }
      }

      const phase = roundPhaseTimerRef.current;
      const currentStageIdx = EVENT_STAGES.findIndex(s => phase >= s.startP && phase < s.endP);
      const safeStageIdx = currentStageIdx >= 0 ? currentStageIdx : 0;
      setActiveEventIndex(safeStageIdx);

      const stg = EVENT_STAGES[safeStageIdx];
      const stageProgress = Math.min(100, Math.max(0, Math.round(((phase - stg.startP) / (stg.endP - stg.startP)) * 100)));
      setEventProgressPct(stageProgress);

      // Sound trigger on discrete stage entry & context sync
      if (lastPlayedStageIdxRef.current !== safeStageIdx) {
        lastPlayedStageIdxRef.current = safeStageIdx;
        setCurrentEventStageIndex(safeStageIdx);
        setCurrentEventStageLabel(stg.name);

        if (currentIsPlaying) {
          if (safeStageIdx === 0) soundFX.playPSOBeginSound();
          else if (safeStageIdx === 1) soundFX.playClickSound();
          else if (safeStageIdx === 2) soundFX.playPacketSound();
          else if (safeStageIdx === 3) {
            soundFX.playPacketArrivalSound();
            activeClusterHeads.forEach(cid => {
              const chH = nodeHandlesRef.current.get(cid);
              if (chH) triggerArrivalRipple(chH.currentPos, 0x00E5FF);
            });
          }
          else if (safeStageIdx === 4) soundFX.playImprovementSound();
          else if (safeStageIdx === 5) soundFX.playPacketSound();
          else if (safeStageIdx === 6) {
            soundFX.playSinkReceiveSound();
            triggerArrivalRipple(sink3DPos, 0xF59E0B);
          }
          else if (safeStageIdx === 7) soundFX.playEnergyUpdateSound();
        }
      }

      // 2. Camera Controls & Parallax
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Parallax slight tilt
      if (cameraRef.current && activeCamPresetRef.current === 'perspective' && !is360RotatingRef.current) {
        const targetX = targetCameraPosRef.current.x + mouseNormRef.current.x * 3.5;
        const targetY = targetCameraPosRef.current.y - mouseNormRef.current.y * 2.5;
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
      }

      // 3. Base Station Radar & Pulse Animations
      if (radarDishRef.current) {
        radarDishRef.current.rotation.y += 0.02 * currentSpeed;
      }
      if (sinkCoreRef.current) {
        const pScale = 1.0 + Math.sin(now * 0.005) * 0.12;
        sinkCoreRef.current.scale.set(pScale, pScale, pScale);
      }
      if (sinkImpactRingRef.current) {
        const rScale = 1.0 + Math.sin(now * 0.004) * 0.2;
        sinkImpactRingRef.current.scale.set(rScale, rScale, rScale);
      }

      // 4. Smooth In-Place Node Position Interpolation (No Teleporting)
      nodeHandlesRef.current.forEach((handle) => {
        handle.currentPos.lerp(handle.targetPos, Math.min(1.0, 0.08 * currentSpeed));
        handle.group.position.set(handle.currentPos.x, handle.baseY, handle.currentPos.z);
        if (handle.diskMesh) {
          handle.diskMesh.position.set(handle.currentPos.x, 0.06, handle.currentPos.z);
        }
        if (handle.diskRingMesh) {
          handle.diskRingMesh.position.set(handle.currentPos.x, 0.07, handle.currentPos.z);
        }
        if (handle.sprite) {
          handle.sprite.position.set(handle.currentPos.x, handle.baseY + (handle.isCH ? 4.8 : 3.6), handle.currentPos.z);
        }
      });

      // 5. Dynamic Laser Communication Beams (Freeze in place when paused)
      laserBeamsRef.current.forEach((beam) => {
        const [startP, endP] = beam.activePhase;
        const isPhaseActive = phase >= startP && phase < endP;
        const beamCoreMat = beam.coreLine.material as THREE.LineBasicMaterial;
        const beamHaloMat = beam.haloLine.material as THREE.LineBasicMaterial;

        if (isPhaseActive) {
          const subPhase = (phase - startP) / (endP - startP);
          const pulse = Math.sin(subPhase * Math.PI);
          beamCoreMat.opacity = Math.max(0.4, pulse * 0.95);
          beamHaloMat.opacity = Math.max(0.2, pulse * 0.65);
          beam.coreLine.visible = true;
          beam.haloLine.visible = true;
        } else {
          beamCoreMat.opacity = 0;
          beamHaloMat.opacity = 0;
          beam.coreLine.visible = false;
          beam.haloLine.visible = false;
        }
      });

      // 6. Multi-Particle Swarm Laser Stream Interpolation (Freeze in place when paused)
      packetStreamsRef.current.forEach((stream) => {
        const [startP, endP] = stream.activePhase;
        const isPhaseActive = phase >= startP && phase < endP;

        if (isPhaseActive && stream.path.length >= 2) {
          stream.group.visible = true;
          const subProgress = Math.max(0, Math.min(1, (phase - startP) / (endP - startP)));

          stream.particles.forEach((p) => {
            const particleT = Math.max(0, Math.min(1, subProgress + p.offsetT));
            const pathIdx = particleT * (stream.path.length - 1);
            const lowIdx = Math.floor(pathIdx);
            const highIdx = Math.min(stream.path.length - 1, lowIdx + 1);
            const frac = pathIdx - lowIdx;

            const p1 = stream.path[lowIdx];
            const p2 = stream.path[highIdx];
            const px = p1.x + (p2.x - p1.x) * frac + p.lateralX;
            const py = p1.y + (p2.y - p1.y) * frac + p.lateralY;
            const pz = p1.z + (p2.z - p1.z) * frac + p.lateralZ;

            p.mesh.position.set(px, py, pz);
            const scale = Math.sin(particleT * Math.PI) * p.baseScale;
            p.mesh.scale.set(Math.max(0.1, scale), Math.max(0.1, scale), Math.max(0.1, scale));
          });
        } else {
          stream.group.visible = false;
        }
      });

      // 7. Ground Ripples & Particle Pulse Updates
      if (groundRipplesRef.current.length > 0) {
        for (let i = groundRipplesRef.current.length - 1; i >= 0; i--) {
          const r = groundRipplesRef.current[i];
          r.scale += r.speed;
          r.opacity -= 0.025;
          r.mesh.scale.set(r.scale, r.scale, 1);
          (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.opacity);

          if (r.opacity <= 0 || r.scale >= r.maxScale) {
            effectsLayerGroupRef.current?.remove(r.mesh);
            groundRipplesRef.current.splice(i, 1);
          }
        }
      }

      if (aggregationPulsesRef.current.length > 0) {
        for (let i = aggregationPulsesRef.current.length - 1; i >= 0; i--) {
          const p = aggregationPulsesRef.current[i];
          p.scale += p.speed;
          p.opacity -= 0.03;
          p.mesh.scale.set(p.scale, p.scale, p.scale);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.opacity);

          if (p.opacity <= 0 || p.scale >= p.maxScale) {
            effectsLayerGroupRef.current?.remove(p.mesh);
            aggregationPulsesRef.current.splice(i, 1);
          }
        }
      }

      // 8. EMP Shockwave Expansion
      if (empShockwavesRef.current.length > 0) {
        for (let i = empShockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = empShockwavesRef.current[i];
          sw.currentRadius += sw.speed;
          sw.opacity -= 0.02;
          const currentScale = sw.currentRadius;
          sw.mesh.scale.set(currentScale, currentScale, currentScale);
          (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sw.opacity);

          if (sw.opacity <= 0 || sw.currentRadius >= sw.maxRadius) {
            effectsLayerGroupRef.current?.remove(sw.mesh);
            empShockwavesRef.current.splice(i, 1);
          }
        }
      }

      // 9. Update Selection Beacon Position
      if (selectionBeaconRef.current) {
        const curSel = selectedNodeRef.current;
        if (curSel) {
          const sHandle = nodeHandlesRef.current.get(curSel.node_id);
          if (sHandle) {
            selectionBeaconRef.current.position.set(sHandle.currentPos.x, 0, sHandle.currentPos.z);
            selectionBeaconRef.current.visible = true;
          }
        } else {
          selectionBeaconRef.current.visible = false;
        }
      }

      // 10. Update Layer Visibilities
      if (coverageLayerGroupRef.current) {
        coverageLayerGroupRef.current.visible = currentShowDisks && (currentVisMode === 'full' || currentVisMode === 'coverage');
      }
      if (voronoiLayerGroupRef.current) {
        voronoiLayerGroupRef.current.visible = (currentVisMode === 'full' || currentVisMode === 'voronoi' || voronoiMode === '3d');
      }
      if (routingLayerGroupRef.current) {
        routingLayerGroupRef.current.visible = (currentVisMode === 'full' || currentVisMode === 'routing');
      }
      if (packetsLayerGroupRef.current) {
        packetsLayerGroupRef.current.visible = (currentVisMode === 'full' || currentVisMode === 'routing');
      }
      if (labelsLayerGroupRef.current) {
        labelsLayerGroupRef.current.visible = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sink3DPos, createCornerSprite, createTextSprite, triggerArrivalRipple, triggerAggregationPulse, to3DPos, voronoiMode]);

  // -------------------------------------------------------------
  // 2. PERSISTENT SENSOR NODE HARDWARE INITIALIZATION / SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    const nodesGroup = nodesLayerGroupRef.current;
    const coverageGroup = coverageLayerGroupRef.current;
    const labelsGroup = labelsLayerGroupRef.current;
    if (!nodesGroup || !coverageGroup || !labelsGroup || nodes.length === 0) return;

    // Standard Geometries
    const baseCylinderGeo = new THREE.CylinderGeometry(0.9, 1.15, 0.55, 16);
    const ledDomeGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const antennaMastGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
    const antennaBeaconGeo = new THREE.SphereGeometry(0.24, 8, 8);
    
    // Cluster Head Geometries
    const chBaseGeo = new THREE.CylinderGeometry(1.35, 1.65, 0.85, 16);
    const chLedGeo = new THREE.SphereGeometry(0.95, 20, 20);
    const chMastGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.4, 8);
    const chBeaconGeo = new THREE.SphereGeometry(0.42, 12, 12);
    const chCrownGeo = new THREE.RingGeometry(1.8, 2.4, 6);

    // Sensing Disk Geometries (Subtle Translucent Disks & Thin Rings)
    const Rs3D = sensingRad * (100 / W);
    const sensingDiskGeo = new THREE.CircleGeometry(Rs3D, 36);
    sensingDiskGeo.rotateX(-Math.PI / 2);
    const sensingRingGeo = new THREE.RingGeometry(Rs3D - 0.25, Rs3D, 48);
    sensingRingGeo.rotateX(-Math.PI / 2);

    const currentNodeIds = new Set(nodes.map(n => n.node_id));

    // Remove any handles for nodes no longer in scenario
    nodeHandlesRef.current.forEach((handle, id) => {
      if (!currentNodeIds.has(id)) {
        nodesGroup.remove(handle.group);
        coverageGroup.remove(handle.diskMesh);
        coverageGroup.remove(handle.diskRingMesh);
        labelsGroup.remove(handle.sprite);
        nodeHandlesRef.current.delete(id);
      }
    });

    // Create or update handles for each node
    nodes.forEach((node) => {
      const isCH = activeClusterHeads.includes(node.node_id);
      const targetPos = to3DPos(node.x, node.y, isCH ? 2.0 : 0.8);
      const isSelected = selectedNode?.node_id === node.node_id;

      let handle = nodeHandlesRef.current.get(node.node_id);

      if (!handle) {
        // Create 3D Sensor Hardware Group
        const deviceGroup = new THREE.Group();
        deviceGroup.position.copy(targetPos);

        // 1. Polymer Casing
        const casingMat = new THREE.MeshStandardMaterial({
          color: !node.isAlive ? 0x1E293B : isSelected ? 0x00E5FF : 0x0A1424,
          metalness: 0.85,
          roughness: 0.25
        });
        const casingMesh = new THREE.Mesh(isCH ? chBaseGeo : baseCylinderGeo, casingMat);
        casingMesh.castShadow = true;
        deviceGroup.add(casingMesh);

        // 2. Glowing LED Core
        const ledMat = new THREE.MeshStandardMaterial({
          color: isCH ? 0xF59E0B : 0x00E5FF,
          emissive: isCH ? 0xF59E0B : 0x00E5FF,
          emissiveIntensity: !node.isAlive ? 0.0 : isCH ? 2.0 : 1.2,
          roughness: 0.15,
          metalness: 0.5
        });
        const ledMesh = new THREE.Mesh(isCH ? chLedGeo : ledDomeGeo, ledMat);
        ledMesh.position.y = isCH ? 0.75 : 0.45;
        deviceGroup.add(ledMesh);

        // 3. Antenna Mast & Beacon
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x1C3150, metalness: 0.9 });
        const mastMesh = new THREE.Mesh(isCH ? chMastGeo : antennaMastGeo, mastMat);
        mastMesh.position.y = isCH ? 1.85 : 1.15;
        deviceGroup.add(mastMesh);

        const beaconMat = new THREE.MeshBasicMaterial({ color: isCH ? 0xF59E0B : 0x00E5FF });
        const beaconMesh = new THREE.Mesh(isCH ? chBeaconGeo : antennaBeaconGeo, beaconMat);
        beaconMesh.position.y = isCH ? 3.0 : 1.85;
        deviceGroup.add(beaconMesh);

        // 4. Cluster Head Gold Crown Beacon
        const crownMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
        const chCrownMesh = new THREE.Mesh(chCrownGeo, crownMat);
        chCrownMesh.rotation.x = -Math.PI / 2;
        chCrownMesh.position.y = 0.25;
        chCrownMesh.visible = isCH && node.isAlive;
        deviceGroup.add(chCrownMesh);

        deviceGroup.userData = { node: node, isCH: isCH };
        nodesGroup.add(deviceGroup);

        // 5. Translucent Sensing Disks (Subtle, non-obtrusive)
        const diskColor = isCH ? 0xF59E0B : 0x00E5FF;
        const diskMat = new THREE.MeshBasicMaterial({
          color: diskColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.06,
          depthWrite: false
        });
        const diskMesh = new THREE.Mesh(sensingDiskGeo, diskMat);
        diskMesh.position.set(targetPos.x, 0.06, targetPos.z);
        coverageGroup.add(diskMesh);

        const ringMat = new THREE.MeshBasicMaterial({
          color: diskColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.18
        });
        const diskRingMesh = new THREE.Mesh(sensingRingGeo, ringMat);
        diskRingMesh.position.set(targetPos.x, 0.07, targetPos.z);
        coverageGroup.add(diskRingMesh);

        // 6. Node ID Sprite Label [N17]
        const sprite = createTextSprite(`[N${node.node_id}]`, isCH ? '#F59E0B' : '#00E5FF');
        sprite.position.set(targetPos.x, targetPos.y + (isCH ? 4.8 : 3.6), targetPos.z);
        labelsGroup.add(sprite);

        handle = {
          id: node.node_id,
          group: deviceGroup,
          casingMesh,
          ledMesh,
          mastMesh,
          beaconMesh,
          chCrownMesh,
          diskMesh,
          diskRingMesh,
          sprite,
          baseY: targetPos.y,
          currentPos: targetPos.clone(),
          targetPos: targetPos.clone(),
          node,
          isCH,
          txFlashTimer: 0,
          rxFlashTimer: 0
        };

        nodeHandlesRef.current.set(node.node_id, handle);
      } else {
        // Node already exists — update target coordinates for smooth interpolation!
        handle.node = node;
        handle.isCH = isCH;
        handle.baseY = targetPos.y;
        handle.targetPos.copy(targetPos);
        handle.group.userData = { node: node, isCH: isCH };
        if (handle.chCrownMesh) {
          handle.chCrownMesh.visible = isCH && node.isAlive;
        }
      }
    });

  }, [nodes.length, selectedSeed, activeScenario.id, sensingRad, W, to3DPos, createTextSprite]);

  // -------------------------------------------------------------
  // 3. IN-PLACE NODE VISUAL STATE & ANN HEATMAP SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    // Map ANN predictions by Node ID for fast classification
    const predMap = new Map();
    if (annInferenceResult?.predictions) {
      annInferenceResult.predictions.forEach(p => predMap.set(p.nodeId, p));
    }

    nodes.forEach((node) => {
      const handle = nodeHandlesRef.current.get(node.node_id);
      if (!handle) return;

      const isCH = activeClusterHeads.includes(node.node_id);
      const isSelected = selectedNode?.node_id === node.node_id;
      const isSleep = selectedOptimizer === 'ann_greedy' && node.final_state === 'SLEEP';

      handle.node = node;
      handle.isCH = isCH;

      // Color Palette based on State, VisMode, and ANN Heatmap Mode
      let coreColor = 0x00E5FF;
      let emissivePower = 1.2;
      let isDim = false;

      if (!node.isAlive) {
        coreColor = 0x334155;
        emissivePower = 0.0;
        isDim = true;
      } else if (annHeatmapMode && predMap.has(node.node_id)) {
        const p = predMap.get(node.node_id);
        if (p.overlapRisk >= 0.45) {
          coreColor = 0xEF4444; // RED: High Overlap Risk
          emissivePower = 1.8;
        } else if (p.blindspotRisk >= 0.40) {
          coreColor = 0xA855F7; // PURPLE: Blindspot Risk
          emissivePower = 1.8;
        } else if (p.coverageContribution >= 0.70) {
          coreColor = 0x10B981; // GREEN: Optimal Coverage
          emissivePower = 1.6;
        } else {
          coreColor = 0xF59E0B; // YELLOW: Moderate
          emissivePower = 1.4;
        }
      } else if (isSleep) {
        coreColor = 0x6366F1;
        emissivePower = 0.25;
        isDim = true;
      } else if (isCH) {
        coreColor = 0xF59E0B;
        emissivePower = 2.0;
      } else if (visMode === 'energy') {
        const eRatio = node.currentEnergy / node.energy;
        coreColor = eRatio > 0.6 ? 0x10B981 : eRatio > 0.25 ? 0xF59E0B : 0xEF4444;
        emissivePower = 1.5;
      } else if (node.currentEnergy / node.energy < 0.25) {
        coreColor = 0xF97316;
        emissivePower = 0.8;
      } else if (selectedOptimizer === 'ann_greedy' || selectedOptimizer === 'pso') {
        coreColor = 0x10B981;
        emissivePower = 1.4;
      }

      // Update Casing Material
      const casingMat = handle.casingMesh.material as THREE.MeshStandardMaterial;
      casingMat.color.setHex(isDim ? 0x1E293B : isSelected ? 0x00E5FF : 0x0A1424);

      // Update LED Material
      const ledMat = handle.ledMesh.material as THREE.MeshStandardMaterial;
      ledMat.color.setHex(isSelected ? 0x00E5FF : coreColor);
      ledMat.emissive.setHex(isSelected ? 0x00E5FF : coreColor);
      ledMat.emissiveIntensity = isSelected ? 2.8 : emissivePower;

      // Update Antenna Beacon
      const beaconMat = handle.beaconMesh.material as THREE.MeshBasicMaterial;
      beaconMat.color.setHex(isSelected ? 0x00E5FF : coreColor);

      // Tilted antenna for dead node
      if (!node.isAlive) {
        handle.mastMesh.rotation.z = 0.35;
      } else {
        handle.mastMesh.rotation.z = 0.0;
      }

      // Update CH Crown
      if (handle.chCrownMesh) {
        handle.chCrownMesh.visible = isCH && node.isAlive;
      }

      // Update Disk Material Color
      if (handle.diskMesh && handle.diskRingMesh) {
        const diskColor = isCH ? 0xF59E0B : isSelected ? 0x00E5FF : annHeatmapMode ? coreColor : 0x00E5FF;
        (handle.diskMesh.material as THREE.MeshBasicMaterial).color.setHex(diskColor);
        (handle.diskRingMesh.material as THREE.MeshBasicMaterial).color.setHex(diskColor);
      }
    });
  }, [nodes, activeClusterHeads, selectedNode, selectedOptimizer, visMode, annHeatmapMode, annInferenceResult]);

  // -------------------------------------------------------------
  // 4. PROTOCOL-SPECIFIC LASER BEAMS & PACKET STREAMS SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const routingGroup = routingLayerGroupRef.current;
    const packetsGroup = packetsLayerGroupRef.current;
    if (!routingGroup || !packetsGroup || nodes.length === 0) return;

    routingGroup.clear();
    packetsGroup.clear();
    laserBeamsRef.current = [];
    packetStreamsRef.current = [];

    const chPositionsMap: Record<number, THREE.Vector3> = {};
    const aliveActiveNodes: DynamicNodeState[] = [];

    nodes.forEach((node) => {
      const isCH = activeClusterHeads.includes(node.node_id);
      const isSleep = selectedOptimizer === 'ann_greedy' && node.final_state === 'SLEEP';
      const targetPos = to3DPos(node.x, node.y, isCH ? 2.0 : 0.8);

      if (node.isAlive && !isSleep) {
        aliveActiveNodes.push(node);
        if (isCH) chPositionsMap[node.node_id] = targetPos;
      }
    });

    const chIds = Object.keys(chPositionsMap).map(Number);

    const createLaserPair = (points: THREE.Vector3[], color: number) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const coreMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        linewidth: 2
      });
      const haloMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const coreLine = new THREE.Line(lineGeo, coreMat);
      const haloLine = new THREE.Line(lineGeo, haloMat);
      return { coreLine, haloLine };
    };

    const createPacketParticleStream = (
      points: THREE.Vector3[],
      color: number,
      isUplink: boolean,
      sourceId: number,
      targetId: number | 'sink',
      activePhase: [number, number],
      label: string
    ): DynamicPacketStream => {
      const streamGroup = new THREE.Group();
      streamGroup.visible = false;
      packetsGroup.add(streamGroup);

      const particles: PacketParticleItem[] = [];

      const leadColor = isUplink ? 0xFF4500 : 0xFF2B6D;
      const flankColor1 = isUplink ? 0xFFD700 : 0xFF1493;
      const flankColor2 = isUplink ? 0xFF6B8B : 0xFF3366;
      const midColor = isUplink ? 0xF59E0B : 0xFF0055;
      const tailColor1 = isUplink ? 0xF97316 : 0xFF4081;
      const tailColor2 = isUplink ? 0xFDE047 : 0xFF6B8B;

      const particleConfigs = [
        { radius: isUplink ? 0.65 : 0.48, color: leadColor, offsetT: 0.0, lx: 0, ly: 0, lz: 0 },
        { radius: isUplink ? 0.46 : 0.36, color: flankColor1, offsetT: -0.04, lx: 0.22, ly: 0.18, lz: 0.08 },
        { radius: isUplink ? 0.46 : 0.36, color: flankColor2, offsetT: -0.05, lx: -0.22, ly: -0.16, lz: -0.08 },
        { radius: isUplink ? 0.40 : 0.30, color: midColor, offsetT: -0.09, lx: 0.10, ly: -0.12, lz: 0.14 },
        { radius: isUplink ? 0.32 : 0.24, color: tailColor1, offsetT: -0.14, lx: -0.12, ly: 0.10, lz: -0.10 },
        { radius: isUplink ? 0.25 : 0.18, color: tailColor2, offsetT: -0.19, lx: 0.06, ly: 0.06, lz: 0.04 },
      ];

      particleConfigs.forEach((cfg) => {
        const geo = new THREE.SphereGeometry(cfg.radius, 12, 12);
        const mat = new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(geo, mat);
        streamGroup.add(mesh);

        particles.push({
          mesh,
          offsetT: cfg.offsetT,
          lateralX: cfg.lx,
          lateralY: cfg.ly,
          lateralZ: cfg.lz,
          baseScale: 1.0
        });
      });

      const targetPos = targetId === 'sink' ? sink3DPos : (chPositionsMap[targetId as number] || points[points.length - 1]);

      return {
        group: streamGroup,
        particles,
        path: points,
        color,
        sourceId,
        targetId,
        targetPos,
        isUplink,
        activePhase,
        label
      };
    };

    if (selectedProtocol === 'pegasis') {
      // 1. PEGASIS PROTOCOL: Sequential Greedy Chain & Chain Hop Flow
      if (aliveActiveNodes.length > 1) {
        const chainNodes = [...aliveActiveNodes].sort((a, b) => a.x - b.x);
        const chainPoints: THREE.Vector3[] = chainNodes.map(n => to3DPos(n.x, n.y, 1.2));
        const numHops = chainPoints.length - 1;

        for (let i = 0; i < numHops; i++) {
          const p1 = chainPoints[i];
          const p2 = chainPoints[i + 1];
          const curve = new THREE.QuadraticBezierCurve3(
            p1,
            new THREE.Vector3((p1.x + p2.x) / 2, Math.min(6, p1.distanceTo(p2) * 0.2 + 2), (p1.z + p2.z) / 2),
            p2
          );
          const points = curve.getPoints(16);
          const { coreLine, haloLine } = createLaserPair(points, 0xFF2B6D);
          routingGroup.add(coreLine);
          routingGroup.add(haloLine);

          const hopStart = 0.22 + (i / numHops) * 0.45;
          const hopEnd = 0.22 + ((i + 1) / numHops) * 0.45;

          laserBeamsRef.current.push({
            coreLine,
            haloLine,
            points,
            sourceId: chainNodes[i].node_id,
            targetId: chainNodes[i + 1].node_id,
            isUplink: false,
            activePhase: [hopStart, hopEnd],
            label: `Chain Hop: N${chainNodes[i].node_id} → N${chainNodes[i + 1].node_id}`
          });

          const stream = createPacketParticleStream(
            points,
            0xFF2B6D,
            false,
            chainNodes[i].node_id,
            chainNodes[i + 1].node_id,
            [hopStart, hopEnd],
            `Chain Packet Hop ${i + 1}/${numHops}`
          );
          packetStreamsRef.current.push(stream);
        }

        // Leader connects to Sink
        const leaderNode = chainNodes[currentRound % chainNodes.length] || chainNodes[0];
        const leaderPos = to3DPos(leaderNode.x, leaderNode.y, 2.5);
        const leaderCurve = new THREE.QuadraticBezierCurve3(
          leaderPos,
          new THREE.Vector3((leaderPos.x + sink3DPos.x) / 2, 22, (leaderPos.z + sink3DPos.z) / 2),
          sink3DPos
        );
        const leaderPoints = leaderCurve.getPoints(24);
        const { coreLine, haloLine } = createLaserPair(leaderPoints, 0xF59E0B);
        routingGroup.add(coreLine);
        routingGroup.add(haloLine);

        laserBeamsRef.current.push({
          coreLine,
          haloLine,
          points: leaderPoints,
          sourceId: leaderNode.node_id,
          targetId: 'sink',
          isUplink: true,
          activePhase: [0.67, 0.88],
          label: `Chain Leader N${leaderNode.node_id} → Base Station`
        });

        const leaderStream = createPacketParticleStream(
          leaderPoints,
          0xF59E0B,
          true,
          leaderNode.node_id,
          'sink',
          [0.67, 0.88],
          'Aggregated Chain Super-Packet → Sink'
        );
        packetStreamsRef.current.push(leaderStream);
      }
    } else {
      // 2. CLUSTER HEAD ROUTING (LEACH / HYBRID / PSO-HYBRID / ANN-PSO)
      if (chIds.length > 0) {
        aliveActiveNodes.forEach((node) => {
          if (!activeClusterHeads.includes(node.node_id)) {
            let nearestCHId = chIds[0];
            let minDist = Infinity;
            chIds.forEach((cid) => {
              const chPos = chPositionsMap[cid];
              if (chPos) {
                const nodePos = to3DPos(node.x, node.y, 0.8);
                const d = nodePos.distanceTo(chPos);
                if (d < minDist) {
                  minDist = d;
                  nearestCHId = cid;
                }
              }
            });

            const sourcePos = to3DPos(node.x, node.y, 0.8);
            const chPos = chPositionsMap[nearestCHId];
            if (chPos) {
              const curve = new THREE.QuadraticBezierCurve3(
                sourcePos,
                new THREE.Vector3((sourcePos.x + chPos.x) / 2, Math.min(8, minDist * 0.25 + 2), (sourcePos.z + chPos.z) / 2),
                chPos
              );
              const points = curve.getPoints(18);
              const { coreLine, haloLine } = createLaserPair(points, 0xFF2B6D);
              routingGroup.add(coreLine);
              routingGroup.add(haloLine);

              laserBeamsRef.current.push({
                coreLine,
                haloLine,
                points,
                sourceId: node.node_id,
                targetId: nearestCHId,
                isUplink: false,
                activePhase: [0.22, 0.45],
                label: `Member N${node.node_id} → CH #${nearestCHId}`
              });

              const stream = createPacketParticleStream(
                points,
                0xFF2B6D,
                false,
                node.node_id,
                nearestCHId,
                [0.22, 0.45],
                `Telemetry Packet: N${node.node_id} → CH #${nearestCHId}`
              );
              packetStreamsRef.current.push(stream);
            }
          }
        });

        chIds.forEach((chId) => {
          const chPos = chPositionsMap[chId];
          if (!chPos) return;

          const curve = new THREE.QuadraticBezierCurve3(
            chPos,
            new THREE.Vector3((chPos.x + sink3DPos.x) / 2, 24, (chPos.z + sink3DPos.z) / 2),
            sink3DPos
          );
          const points = curve.getPoints(24);
          const { coreLine, haloLine } = createLaserPair(points, 0xF59E0B);
          routingGroup.add(coreLine);
          routingGroup.add(haloLine);

          laserBeamsRef.current.push({
            coreLine,
            haloLine,
            points,
            sourceId: chId,
            targetId: 'sink',
            isUplink: true,
            activePhase: [0.67, 0.88],
            label: `Swarm Gateway Relay: CH #${chId} → Base Station`
          });

          const chStream = createPacketParticleStream(
            points,
            0xF59E0B,
            true,
            chId,
            'sink',
            [0.67, 0.88],
            `Multi-Hop Aggregated Super-Packet (CH${chId} → Base Station)`
          );
          packetStreamsRef.current.push(chStream);
        });
      }
    }
  }, [selectedProtocol, activeClusterHeads, nodes, selectedSeed, to3DPos, sink3DPos, currentRound]);

  // -------------------------------------------------------------
  // 5. VORONOI CELL BOUNDARIES SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const voronoiGroup = voronoiLayerGroupRef.current;
    if (!voronoiGroup) return;

    voronoiGroup.clear();

    if (voronoiPolygons && voronoiPolygons.length > 0) {
      const fenceMat = new THREE.MeshBasicMaterial({
        color: 0x8B5CF6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.04,
        depthWrite: false
      });

      const fenceTopLineMat = new THREE.LineBasicMaterial({
        color: 0x8B5CF6,
        transparent: true,
        opacity: 0.35
      });

      voronoiPolygons.forEach((vp) => {
        if (vp.polygon.length >= 3) {
          const isCellSelected = selectedNode?.node_id === vp.nodeId;
          const polyPoints = vp.polygon;
          for (let i = 0; i < polyPoints.length; i++) {
            const pt1 = polyPoints[i];
            const pt2 = polyPoints[(i + 1) % polyPoints.length];

            const p1 = to3DPos(pt1[0], pt1[1], 0);
            const p2 = to3DPos(pt2[0], pt2[1], 0);
            const p1Top = to3DPos(pt1[0], pt1[1], isCellSelected ? 4.5 : 2.0);
            const p2Top = to3DPos(pt2[0], pt2[1], isCellSelected ? 4.5 : 2.0);

            const wallGeo = new THREE.BufferGeometry();
            const vertices = new Float32Array([
              p1.x, p1.y, p1.z,
              p2.x, p2.y, p2.z,
              p2Top.x, p2Top.y, p2Top.z,

              p1.x, p1.y, p1.z,
              p2Top.x, p2Top.y, p2Top.z,
              p1Top.x, p1Top.y, p1Top.z
            ]);
            wallGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            wallGeo.computeVertexNormals();
            const wallMesh = new THREE.Mesh(wallGeo, fenceMat);
            voronoiGroup.add(wallMesh);

            const topGeo = new THREE.BufferGeometry().setFromPoints([p1Top, p2Top]);
            const topLine = new THREE.Line(topGeo, fenceTopLineMat);
            voronoiGroup.add(topLine);
          }
        }
      });
    }
  }, [voronoiPolygons, to3DPos, selectedNode]);

  // -------------------------------------------------------------
  // 6. ANN MOVEMENT RECOMMENDATION ARROWS SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const annVectorsGroup = annVectorsLayerGroupRef.current;
    if (!annVectorsGroup) return;

    annVectorsGroup.clear();

    if ((showANNMoveVectors || isOptimizing) && annInferenceResult?.predictions) {
      annInferenceResult.predictions.forEach((pred) => {
        const handle = nodeHandlesRef.current.get(pred.nodeId);
        if (!handle || !handle.node.isAlive) return;

        const origin3D = new THREE.Vector3(handle.currentPos.x, 1.8, handle.currentPos.z);
        const dir3D = new THREE.Vector3(
          (pred.recommendedMoveX / W) * 100,
          0,
          -((pred.recommendedMoveY / H) * 100)
        );
        const mag = dir3D.length();

        if (mag > 0.4) {
          dir3D.normalize();
          const arrowLen = Math.min(7.5, mag * 2.2);
          const arrowColor = pred.optimizationPriority === 'HIGH' ? 0xF43F5E : pred.optimizationPriority === 'MEDIUM' ? 0xF59E0B : 0x00E5FF;
          const arrow = new THREE.ArrowHelper(dir3D, origin3D, arrowLen, arrowColor, 1.2, 0.6);
          annVectorsGroup.add(arrow);
        }
      });
    }
  }, [showANNMoveVectors, isOptimizing, annInferenceResult, W, H]);

  // -------------------------------------------------------------
  // 7. GROUND OVERLAP CONCENTRATION HEATMAP SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const overlapGroup = overlapConcentrationLayerGroupRef.current;
    if (!overlapGroup) return;

    overlapGroup.clear();

    if (showOverlapConcentration || visMode === 'coverage') {
      const aliveNodes = nodes.filter(n => n.isAlive);
      const gridSize = 16;
      const stepX = W / gridSize;
      const stepY = H / gridSize;
      const rSensing = sensingRad;

      const patchGeo = new THREE.PlaneGeometry(stepX * (100 / W) * 0.95, stepY * (100 / H) * 0.95);
      patchGeo.rotateX(-Math.PI / 2);

      for (let ix = 0; ix < gridSize; ix++) {
        for (let iy = 0; iy < gridSize; iy++) {
          const gx = (ix + 0.5) * stepX;
          const gy = (iy + 0.5) * stepY;

          let coverCount = 0;
          for (let n = 0; n < aliveNodes.length; n++) {
            const dist = Math.sqrt((aliveNodes[n].x - gx) ** 2 + (aliveNodes[n].y - gy) ** 2);
            if (dist <= rSensing) {
              coverCount++;
            }
          }

          if (coverCount >= 2) {
            // Overlap detected at this spatial patch
            const colorHex = coverCount >= 3 ? 0xEF4444 : 0xF59E0B;
            const patchMat = new THREE.MeshBasicMaterial({
              color: colorHex,
              transparent: true,
              opacity: Math.min(0.45, 0.12 * coverCount),
              side: THREE.DoubleSide,
              depthWrite: false
            });
            const patchMesh = new THREE.Mesh(patchGeo, patchMat);
            const p3D = to3DPos(gx, gy, 0.04);
            patchMesh.position.set(p3D.x, 0.04, p3D.z);
            overlapGroup.add(patchMesh);
          }
        }
      }
    }
  }, [showOverlapConcentration, visMode, nodes, sensingRad, W, H, to3DPos]);

  // -------------------------------------------------------------
  // 8. GROUND BLINDSPOT HOLES MAP SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const blindspotGroup = blindspotHolesLayerGroupRef.current;
    if (!blindspotGroup) return;

    blindspotGroup.clear();

    if (showBlindspotHoles) {
      const aliveNodes = nodes.filter(n => n.isAlive);
      const gridSize = 18;
      const stepX = W / gridSize;
      const stepY = H / gridSize;
      const rSensing = sensingRad;

      const holeRingGeo = new THREE.RingGeometry(1.6, 2.4, 24);
      holeRingGeo.rotateX(-Math.PI / 2);
      const holeMat = new THREE.MeshBasicMaterial({
        color: 0xA855F7,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      for (let ix = 0; ix < gridSize; ix++) {
        for (let iy = 0; iy < gridSize; iy++) {
          const gx = (ix + 0.5) * stepX;
          const gy = (iy + 0.5) * stepY;

          let isCovered = false;
          for (let n = 0; n < aliveNodes.length; n++) {
            const dist = Math.sqrt((aliveNodes[n].x - gx) ** 2 + (aliveNodes[n].y - gy) ** 2);
            if (dist <= rSensing) {
              isCovered = true;
              break;
            }
          }

          if (!isCovered) {
            const ringMesh = new THREE.Mesh(holeRingGeo, holeMat);
            const p3D = to3DPos(gx, gy, 0.05);
            ringMesh.position.set(p3D.x, 0.05, p3D.z);
            blindspotGroup.add(ringMesh);
          }
        }
      }
    }
  }, [showBlindspotHoles, nodes, sensingRad, W, H, to3DPos]);

  // -------------------------------------------------------------
  // 9. EA-VVF-MOPSO FORCE VECTORS SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const forcesGroup = forcesLayerGroupRef.current;
    if (!forcesGroup) return;

    forcesGroup.clear();

    if (isOptimizing && activeForceVectors && activeForceVectors.length > 0) {
      activeForceVectors.forEach((fv) => {
        const origin3D = to3DPos(fv.origin[0], fv.origin[1], 1.2);
        const dir3D = new THREE.Vector3((fv.fx / W) * 100, 0, -((fv.fy / H) * 100));
        const len = Math.min(8, dir3D.length() * 2.5);
        if (len > 0.3) {
          dir3D.normalize();
          const arrowHelper = new THREE.ArrowHelper(dir3D, origin3D, len, 0x10B981, 1.2, 0.6);
          forcesGroup.add(arrowHelper);
        }
      });
    }
  }, [isOptimizing, activeForceVectors, to3DPos, W, H]);

  // -------------------------------------------------------------
  // 9b. OBSTACLES 3D RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    const group = obstaclesLayerGroupRef.current;
    if (!group) return;
    group.clear();

    if (obstaclePreset === 'central_lake' || obstaclePreset === 'central-lake') {
      const waterGeo = new THREE.CylinderGeometry(16, 16, 0.4, 48);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284C7,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.75
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(0, 0.2, 0);
      group.add(waterMesh);

      const rimGeo = new THREE.RingGeometry(15.8, 16.6, 48);
      rimGeo.rotateX(-Math.PI / 2);
      const rimMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(0, 0.42, 0);
      group.add(rim);

      const label = createTextSprite('🌊 CENTRAL LAKE RESERVOIR', '#38BDF8');
      label.position.set(0, 4.5, 0);
      label.scale.set(10, 5, 1);
      group.add(label);
    } else if (obstaclePreset === 'dual_walls' || obstaclePreset === 'dual-walls') {
      const wallGeo = new THREE.BoxGeometry(3.5, 7.0, 36);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.5 });
      
      const wallA = new THREE.Mesh(wallGeo, wallMat);
      wallA.position.set(-16, 3.5, 0);
      group.add(wallA);

      const wallB = new THREE.Mesh(wallGeo, wallMat);
      wallB.position.set(16, 3.5, 0);
      group.add(wallB);

      const labelA = createTextSprite('🚧 CONCRETE WALL ALPHA', '#F59E0B');
      labelA.position.set(-16, 8.5, 0);
      labelA.scale.set(8, 4, 1);
      group.add(labelA);

      const labelB = createTextSprite('🚧 CONCRETE WALL BETA', '#F59E0B');
      labelB.position.set(16, 8.5, 0);
      labelB.scale.set(8, 4, 1);
      group.add(labelB);
    } else if (obstaclePreset === 'perimeter_basins' || obstaclePreset === 'corner-zones') {
      const basinCoords = [
        { x: -30, z: -30, label: 'BASIN SECTOR NW' },
        { x: 30, z: -30, label: 'BASIN SECTOR NE' },
        { x: -30, z: 30, label: 'BASIN SECTOR SW' },
        { x: 30, z: 30, label: 'BASIN SECTOR SE' },
      ];
      basinCoords.forEach(b => {
        const bGeo = new THREE.CylinderGeometry(10, 10, 0.3, 32);
        const bMat = new THREE.MeshStandardMaterial({ color: 0x854D0E, roughness: 0.9, metalness: 0.3, transparent: true, opacity: 0.7 });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(b.x, 0.15, b.z);
        group.add(bMesh);

        const bLabel = createTextSprite(`⚠️ ${b.label}`, '#EAB308');
        bLabel.position.set(b.x, 3.2, b.z);
        bLabel.scale.set(7, 3.5, 1);
        group.add(bLabel);
      });
    }
  }, [obstaclePreset, createTextSprite]);

  // -------------------------------------------------------------
  // 9c. POINTS OF INTEREST (POI) 3D RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    const group = poiLayerGroupRef.current;
    if (!group) return;
    group.clear();

    if (poiPreset === 'none') return;

    const poiList = (poiPreset === 'quad_hotspots' || poiPreset === 'high-value-assets')
      ? [
          { id: 'POI-1', x: -25, z: 25, label: '🎯 POI-1 (Critical Core)' },
          { id: 'POI-2', x: 25, z: 25, label: '🎯 POI-2 (Telemetry Hub)' },
          { id: 'POI-3', x: -25, z: -25, label: '🎯 POI-3 (Infra Node)' },
          { id: 'POI-4', x: 25, z: -25, label: '🎯 POI-4 (Perimeter Zone)' }
        ]
      : (poiPreset === 'perimeter_sentinel' || poiPreset === 'perimeter-patrol')
      ? [
          { id: 'SEN-N', x: 0, z: -40, label: '🛡️ SENTINEL NORTH' },
          { id: 'SEN-S', x: 0, z: 40, label: '🛡️ SENTINEL SOUTH' },
          { id: 'SEN-E', x: 40, z: 0, label: '🛡️ SENTINEL EAST' },
          { id: 'SEN-W', x: -40, z: 0, label: '🛡️ SENTINEL WEST' }
        ]
      : [
          { id: 'POI-CORE', x: 0, z: 0, label: '🎯 PRIMARY STRATEGIC TARGET' }
        ];

    poiList.forEach(poi => {
      const diaGeo = new THREE.OctahedronGeometry(1.4, 0);
      const diaMat = new THREE.MeshStandardMaterial({
        color: 0xEC4899,
        emissive: 0xEC4899,
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.8
      });
      const diaMesh = new THREE.Mesh(diaGeo, diaMat);
      diaMesh.position.set(poi.x, 4.0, poi.z);
      group.add(diaMesh);

      const ringGeo = new THREE.RingGeometry(1.2, 2.2, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xEC4899, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(poi.x, 0.12, poi.z);
      group.add(ringMesh);

      const beamGeo = new THREE.CylinderGeometry(0.1, 0.2, 12, 16);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xF472B6, transparent: true, opacity: 0.35 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(poi.x, 6.0, poi.z);
      group.add(beamMesh);

      const sprite = createTextSprite(poi.label, '#EC4899');
      sprite.position.set(poi.x, 9.5, poi.z);
      sprite.scale.set(8, 4, 1);
      group.add(sprite);
    });
  }, [poiPreset, createTextSprite]);

  // -------------------------------------------------------------
  // 9d. RF JAMMER 3D RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    const group = jammerLayerGroupRef.current;
    if (!group) return;
    group.clear();

    if (jammerPreset === 'none') return;

    const jammerPositions = (jammerPreset === 'single_broadband' || jammerPreset === 'central-jammer')
      ? [{ x: 0, z: 0, radius: 24, label: '⚡ HIGH-POWER BROADBAND RF JAMMER (-18dB SNR)' }]
      : [
          { x: -22, z: 16, radius: 16, label: '⚡ RF JAMMER ALPHA' },
          { x: 22, z: -16, radius: 16, label: '⚡ RF JAMMER BETA' }
        ];

    jammerPositions.forEach(j => {
      const domeGeo = new THREE.SphereGeometry(j.radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xF43F5E,
        emissive: 0xBE123C,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.22,
        wireframe: true,
        side: THREE.DoubleSide
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.set(j.x, 0, j.z);
      group.add(domeMesh);

      const mastGeo = new THREE.CylinderGeometry(0.6, 1.2, 6, 16);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x881337, metalness: 0.8, roughness: 0.3 });
      const mastMesh = new THREE.Mesh(mastGeo, mastMat);
      mastMesh.position.set(j.x, 3.0, j.z);
      group.add(mastMesh);

      const tipGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xFF0033, emissive: 0xFF0033, emissiveIntensity: 2.5 });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.set(j.x, 6.2, j.z);
      group.add(tipMesh);

      const sprite = createTextSprite(j.label, '#F43F5E');
      sprite.position.set(j.x, 9.5, j.z);
      sprite.scale.set(10, 5, 1);
      group.add(sprite);
    });
  }, [jammerPreset, createTextSprite]);

  // -------------------------------------------------------------
  // 10. 3D RAYCASTING, DRAG-AND-DROP & HOVER / CLICK INTERACTION
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), cameraRef.current);

    const meshObjects: THREE.Object3D[] = [];
    nodeHandlesRef.current.forEach((h) => {
      h.group.children.forEach((c) => meshObjects.push(c));
    });

    const intersects = raycaster.intersectObjects(meshObjects);

    if (intersects.length > 0) {
      const parentGroup = intersects[0].object.parent;
      if (parentGroup && parentGroup.userData && parentGroup.userData.node) {
        const hitNode = parentGroup.userData.node as DynamicNodeState;

        if (toolMode === 'relocate') {
          isDraggingRef.current = true;
          draggedNodeIdRef.current = hitNode.node_id;
          if (controlsRef.current) controlsRef.current.enabled = false;
          soundFX.playClickSound();
          setDragBadge({
            x: hitNode.x,
            y: hitNode.y,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top
          });
          return;
        } else if (toolMode === 'inspect') {
          setSelectedNode(hitNode);
          setIsDrawerOpen(true);
          soundFX.playClickSound();
          return;
        } else if (toolMode === 'inject') {
          injectEnergyToNode(hitNode.node_id, 0.25);
          soundFX.playClickSound();
          return;
        } else if (toolMode === 'remove') {
          removeNode(hitNode.node_id);
          soundFX.playClickSound();
          return;
        }
      }
    }

    // If clicking ground in 'inject' mode:
    if (toolMode === 'inject') {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const fieldX = Math.round((((hitPoint.x / 100) + 0.5) * W) * 10) / 10;
        const fieldY = Math.round((((-hitPoint.z / 100) + 0.5) * H) * 10) / 10;
        if (fieldX >= 2 && fieldX <= W - 2 && fieldY >= 2 && fieldY <= H - 2) {
          injectNewNode(fieldX, fieldY, 'normal');
          triggerArrivalRipple(hitPoint, 0x10B981);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseNormRef.current = { x: nx, y: ny };

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), cameraRef.current);

    // If dragging a node:
    if (isDraggingRef.current && draggedNodeIdRef.current !== null) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const clampedSceneX = Math.max(-48, Math.min(48, hitPoint.x));
        const clampedSceneZ = Math.max(-48, Math.min(48, hitPoint.z));
        const fieldX = Math.max(2, Math.min(W - 2, ((clampedSceneX / 100) + 0.5) * W));
        const fieldY = Math.max(2, Math.min(H - 2, ((-clampedSceneZ / 100) + 0.5) * H));

        const handle = nodeHandlesRef.current.get(draggedNodeIdRef.current);
        if (handle) {
          handle.group.position.set(clampedSceneX, handle.baseY, clampedSceneZ);
          if (handle.diskMesh) handle.diskMesh.position.set(clampedSceneX, 0.06, clampedSceneZ);
          if (handle.diskRingMesh) handle.diskRingMesh.position.set(clampedSceneX, 0.07, clampedSceneZ);
          if (handle.sprite) handle.sprite.position.set(clampedSceneX, handle.baseY + 4.0, clampedSceneZ);
        }

        setDragBadge({
          x: Number(fieldX.toFixed(1)),
          y: Number(fieldY.toFixed(1)),
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top
        });
        relocateNode(draggedNodeIdRef.current, fieldX, fieldY);
      }
      return;
    }

    // Hover detection
    if (nodeHandlesRef.current.size > 0) {
      const meshObjects: THREE.Object3D[] = [];
      nodeHandlesRef.current.forEach((h) => {
        h.group.children.forEach((c) => meshObjects.push(c));
      });

      const intersects = raycaster.intersectObjects(meshObjects);

      if (intersects.length > 0) {
        const parentGroup = intersects[0].object.parent;
        if (parentGroup && parentGroup.userData && parentGroup.userData.node) {
          const hovered = parentGroup.userData.node as DynamicNodeState;
          if (hoveredNode?.node_id !== hovered.node_id) {
            soundFX.playHoverSound();
          }
          setHoveredNode(hovered);
          setHoverScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          containerRef.current.style.cursor = toolMode === 'relocate' ? 'grab' : 'pointer';

          if (hoverHighlightMeshRef.current) {
            hoverHighlightMeshRef.current.position.set(parentGroup.position.x, 0.14, parentGroup.position.z);
            hoverHighlightMeshRef.current.visible = true;
          }
          return;
        }
      }
    }

    if (hoveredNode !== null) {
      setHoveredNode(null);
      setHoverScreenPos(null);
      if (hoverHighlightMeshRef.current) {
        hoverHighlightMeshRef.current.visible = false;
      }
    }
    containerRef.current.style.cursor = toolMode === 'inject' ? 'crosshair' : 'default';
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      draggedNodeIdRef.current = null;
      setDragBadge(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
      soundFX.playClickSound();
    }
  };

  const handlePointerLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      draggedNodeIdRef.current = null;
      setDragBadge(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
    mouseNormRef.current = { x: 0, y: 0 };
    setHoveredNode(null);
    setHoverScreenPos(null);
    if (hoverHighlightMeshRef.current) {
      hoverHighlightMeshRef.current.visible = false;
    }
  };

  // Camera Presets
  const setCameraPreset = (preset: CameraMode) => {
    soundFX.playClickSound();
    setActiveCamPreset(preset);
    setIs360Rotating(preset === 'orbit');
    if (!cameraRef.current || !controlsRef.current) return;

    if (preset === 'perspective' || preset === 'reset') {
      targetCameraPosRef.current.set(-46, 68, 96);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'top') {
      targetCameraPosRef.current.set(0, 155, 0.01);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'sink') {
      targetCameraPosRef.current.set(0, 24, -135);
      controlsRef.current.target.set(0, 2, 0);
    } else if (preset === 'orbit') {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.8;
    }
  };

  // Regional EMP Blast
  const handleTriggerEMPBlast = () => {
    soundFX.playOptimizationSweep();

    if (effectsLayerGroupRef.current) {
      const shockGeo = new THREE.RingGeometry(0.8, 1.8, 48);
      shockGeo.rotateX(-Math.PI / 2);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0xF43F5E,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const shockMesh = new THREE.Mesh(shockGeo, shockMat);
      shockMesh.position.set(0, 0.25, 0);
      effectsLayerGroupRef.current.add(shockMesh);

      empShockwavesRef.current.push({
        mesh: shockMesh,
        currentRadius: 1,
        maxRadius: 28,
        opacity: 0.95,
        speed: 1.2
      });
    }

    const centerX = W / 2;
    const centerY = H / 2;
    let affectedCount = 0;

    nodes.forEach((n) => {
      const dist = Math.sqrt((n.x - centerX) ** 2 + (n.y - centerY) ** 2);
      if (dist <= 25 && n.isAlive) {
        affectedCount++;
        injectEnergyToNode(n.node_id, -0.25);
      }
    });

    const bannerMsg = `💥 Regional EMP Blast: Neutralized ${affectedCount} Sensors in R=25m Perimeter!`;
    setEmpBannerText(bannerMsg);

    if (empBannerTimerRef.current) clearTimeout(empBannerTimerRef.current);
    empBannerTimerRef.current = setTimeout(() => {
      setEmpBannerText(null);
    }, 4500);
  };

  const handleStepForwardEvent = () => {
    soundFX.playClickSound();
    const currentIdx = EVENT_STAGES.findIndex(s => roundPhaseTimerRef.current >= s.startP && roundPhaseTimerRef.current < s.endP);
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;

    if (safeIdx < EVENT_STAGES.length - 1) {
      const nextStage = EVENT_STAGES[safeIdx + 1];
      roundPhaseTimerRef.current = nextStage.startP + 0.005;
      setActiveEventIndex(safeIdx + 1);
    } else {
      roundPhaseTimerRef.current = 0.0;
      setActiveEventIndex(0);
      stepForward(1);
    }
  };

  const handleStepBackwardEvent = () => {
    soundFX.playClickSound();
    const currentIdx = EVENT_STAGES.findIndex(s => roundPhaseTimerRef.current >= s.startP && roundPhaseTimerRef.current < s.endP);
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;

    if (safeIdx > 0) {
      const prevStage = EVENT_STAGES[safeIdx - 1];
      roundPhaseTimerRef.current = prevStage.startP + 0.005;
      setActiveEventIndex(safeIdx - 1);
    } else {
      const lastStage = EVENT_STAGES[EVENT_STAGES.length - 1];
      roundPhaseTimerRef.current = lastStage.startP + 0.005;
      setActiveEventIndex(EVENT_STAGES.length - 1);
      stepBackward(1);
    }
  };

  const handleApplySliders = (newN = nodeCount, newRs = sensingRad, newRc = commRad, newE0 = initialEnergy, newRounds = maxRounds) => {
    saveCustomScenario({
      ...activeScenario,
      sensorCount: newN,
      sensingRadius: newRs,
      commRadius: newRc,
      initialEnergy: newE0,
      simulationRounds: newRounds
    });
  };

  const handleExecuteOptimization = () => {
    soundFX.playOptimizationSweep();
    executeOptimization();
  };

  const handleRunANN = () => {
    soundFX.playANNScanSound();
    runANNInference();
  };

  const handleToggleStream = () => {
    soundFX.playClickSound();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleResetExperiment = () => {
    soundFX.playResetSound();
    roundPhaseTimerRef.current = 0;
    restart();
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const activeStageInfo = EVENT_STAGES[activeEventIndex] || EVENT_STAGES[0];

  const protocolNameMap: Record<RoutingProtocol, string> = {
    leach: 'LEACH',
    pegasis: 'PEGASIS',
    hybrid: 'HYBRID',
    pso_hybrid: 'PSO-HYBRID',
    ann_pso_hybrid: 'ANN-PSO'
  };

  return (
    <div 
      ref={wrapperRef}
      className={`w-full font-mono text-xs relative ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#050811] overflow-hidden p-3' : 'space-y-4'
      }`}
    >
      {/* 2-Column Hero Layout Matching Reference Video */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* ======================================================= */}
        {/* LEFT / CENTER: SCIENTIFIC 3D DIGITAL TWIN VIEWPORT      */}
        {/* ======================================================= */}
        <div className={`${isPresentationMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'} relative flex flex-col justify-between rounded-3xl border border-[#1C3150] bg-[#050811] overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'h-full' : isPresentationMode ? 'min-h-[640px] h-[calc(100vh-140px)]' : 'min-h-[580px] h-[calc(100vh-220px)] max-h-[720px]'
        }`}>
          
          {/* Top Floating Badge Bar */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none">
            
            {/* Top-Left: Spatial Field & Sink Coordinates Capsule */}
            <div className="flex items-center space-x-2 pointer-events-auto bg-[#070E1A]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#1C3150] shadow-xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] text-cyan-300 font-mono tracking-wide">
                100m &times; 100m SPATIAL FIELD &bull; SINK ({activeScenario.sinkX}, {activeScenario.sinkY})
              </span>
            </div>

            {/* Top-Right: Sound, 60 FPS, & Fullscreen */}
            <div className="flex items-center space-x-2 pointer-events-auto">
              <button
                onClick={() => {
                  toggleAudio();
                }}
                className={`p-1.5 px-2.5 rounded-full backdrop-blur-md border font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xl text-[10px] ${
                  isAudioEnabled 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                    : 'bg-[#070E1A]/85 border-[#1C3150] text-slate-400'
                }`}
                title={isAudioEnabled ? 'Mute Scientific Audio' : 'Unmute Audio'}
              >
                {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isAudioEnabled ? 'AUDIO ON' : 'MUTED'}</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setIsPresentationMode(!isPresentationMode);
                }}
                className={`p-1.5 px-2.5 rounded-full backdrop-blur-md border font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xl text-[10px] ${
                  isPresentationMode
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-[#070E1A]/85 border-[#1C3150] text-slate-400 hover:text-white'
                }`}
                title="Toggle Presentation Mode"
              >
                <span>{isPresentationMode ? 'EXIT PRESENTATION' : 'PRESENTATION MODE'}</span>
              </button>

              <div className="bg-[#070E1A]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#1C3150] shadow-xl text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
                60 FPS &bull; HARDWARE ACCELERATED
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-full bg-[#070E1A]/85 backdrop-blur-md border border-[#1C3150] text-slate-400 hover:text-white transition-all cursor-pointer shadow-xl"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>

          {/* Top Center: Prominent Live Event HUD Banner (Synchronized Event Timeline) */}
          {!(isResearchDemoActive || isOptimizing) && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center max-w-[95%] sm:max-w-2xl w-full px-2">
              <div className="bg-[#070E1A]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl px-4 py-2 shadow-2xl w-full flex flex-col gap-1">
                
                {/* Upper line: Round & Event Name */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold text-[11px] border border-cyan-500/30 font-mono">
                      ROUND {currentRound}
                    </span>
                    <span className="text-white font-extrabold text-xs sm:text-sm tracking-wide font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      EVENT: {activeStageInfo.name.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isPlaying && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        PAUSED (FROZEN)
                      </span>
                    )}
                    <span className="text-[10px] text-cyan-400 font-bold font-mono">
                      STAGE 0{activeStageInfo.stageNumber}/08 ({eventProgressPct}%)
                    </span>
                  </div>
                </div>

                {/* Middle line: Dynamic Event Action Detail */}
                <div className="text-[11px] text-slate-300 font-sans truncate">
                  {activeStageInfo.stageNumber === 1 && `Swarm / Multi-objective evaluation: Selecting energy-rich Cluster Heads`}
                  {activeStageInfo.stageNumber === 2 && `Calculating euclidean distances & forming active cluster links`}
                  {activeStageInfo.stageNumber === 3 && `Member sensors transmitting telemetry packets to nearest Cluster Head`}
                  {activeStageInfo.stageNumber === 4 && `Cluster Heads receive packets & register telemetry into buffer`}
                  {activeStageInfo.stageNumber === 5 && `Cluster Heads fuse and compress multiple sensor packets into super-packet`}
                  {activeStageInfo.stageNumber === 6 && `Cluster Heads firing long-range directional laser uplink to Base Station`}
                  {activeStageInfo.stageNumber === 7 && `Sink received & verified telemetry data at coordinates (${activeScenario.sinkX}, ${activeScenario.sinkY})`}
                  {activeStageInfo.stageNumber === 8 && `First-order radio energy dissipation applied to active nodes`}
                </div>

                {/* Bottom line: 8 Discrete Stage Sequence Indicators */}
                <div className="grid grid-cols-8 gap-1 pt-1 border-t border-[#1C3150]/60">
                  {EVENT_STAGES.map((st, i) => (
                    <button
                      key={st.stageNumber}
                      onClick={() => {
                        soundFX.playClickSound();
                        roundPhaseTimerRef.current = st.startP + 0.005;
                        setActiveEventIndex(i);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === activeEventIndex
                          ? 'bg-cyan-400 shadow-md shadow-cyan-400/50'
                          : i < activeEventIndex
                          ? 'bg-cyan-700/60'
                          : 'bg-slate-800'
                      }`}
                      title={`Stage ${st.stageNumber}: ${st.name}`}
                    />
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* Floating Research Demo Progress Banner */}
          {(isResearchDemoActive || isOptimizing) && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-[#070E1A]/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl px-4 py-2 shadow-2xl flex items-center space-x-3 text-xs animate-fadeIn max-w-[90%] sm:max-w-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-cyan-300 uppercase tracking-wider text-[10px]">
                    {isResearchDemoActive ? `RESEARCH DEMO (PHASE ${researchDemoStep}/18)` : `PSO ITERATION ${currentOptIteration}/15`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 truncate">
                  {researchDemoNarrative || 'Executing ANN-Guided Spatial Swarm Optimization...'}
                </p>
              </div>
              {isResearchDemoActive && (
                <button
                  onClick={() => stopResearchDemo()}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-[10px] font-bold cursor-pointer transition-all shrink-0"
                >
                  STOP
                </button>
              )}
            </div>
          )}

          {/* Left Vertical Tool Dock (Inspect, Relocate, Inject, Remove) */}
          <div className="absolute left-3.5 top-16 z-20 flex flex-col space-y-1.5 pointer-events-auto bg-[#070E1A]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-[#1C3150] shadow-2xl">
            {/* 1. Inspect */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setToolMode('inspect');
              }}
              className={`p-2 rounded-xl font-bold flex items-center space-x-2 transition-all text-xs cursor-pointer ${
                toolMode === 'inspect'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Inspect Mode: Click any sensor to inspect telemetry"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Inspect</span>
            </button>

            {/* 2. Relocate */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setToolMode('relocate');
              }}
              className={`p-2 rounded-xl font-bold flex items-center space-x-2 transition-all text-xs cursor-pointer ${
                toolMode === 'relocate'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Relocate Mode: Click any sensor to reposition"
            >
              <Move className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline">Relocate</span>
            </button>

            {/* 3. Inject */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setToolMode('inject');
              }}
              className={`p-2 rounded-xl font-bold flex items-center space-x-2 transition-all text-xs cursor-pointer ${
                toolMode === 'inject'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Inject Mode: Click any sensor to inject +0.2J battery energy"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Inject</span>
            </button>

            {/* 4. Remove / Disable */}
            <button
              onClick={() => {
                soundFX.playClickSound();
                setToolMode('remove');
              }}
              className={`p-2 rounded-xl font-bold flex items-center space-x-2 transition-all text-xs cursor-pointer ${
                toolMode === 'remove'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/60 shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Remove Mode: Click any sensor to toggle active/sleep/dead state"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Remove</span>
            </button>
          </div>

          {/* Left View Mode Selector */}
          <div className="absolute left-3.5 top-56 z-20 flex flex-col space-y-1 pointer-events-auto bg-[#070E1A]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-[#1C3150] shadow-2xl">
            <span className="text-[9px] uppercase font-bold text-slate-400 px-1 pt-0.5 tracking-wider text-center">
              View Mode
            </span>
            {(['full', 'network', 'coverage', 'routing', 'energy', 'voronoi'] as VisMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  soundFX.playClickSound();
                  setVisMode(mode);
                }}
                className={`px-2 py-1 rounded-xl font-bold uppercase transition-all text-[9.5px] cursor-pointer text-left ${
                  visMode === mode
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Manual Modification Indicator */}
          {isManuallyModified && (
            <div className="absolute top-3 left-3.5 z-20 pointer-events-auto bg-amber-500/20 border border-amber-400/60 rounded-xl px-3 py-1 text-[10px] font-mono font-bold text-amber-300 flex items-center space-x-1.5 backdrop-blur-md shadow-lg shadow-amber-500/10">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>INTERACTIVE MODIFICATION ACTIVE</span>
            </div>
          )}

          {/* 3D Canvas Viewport */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="w-full h-full relative z-0 cursor-grab active:cursor-grabbing overflow-hidden select-none"
          />

          {/* Real-Time Floating Drag Coordinate HUD Badge */}
          {dragBadge && (
            <div 
              id="drag-coord-badge"
              className="absolute pointer-events-none z-50 bg-slate-900/95 border border-cyan-400 text-cyan-300 px-3 py-1.5 rounded-lg shadow-xl shadow-cyan-950/80 backdrop-blur-md text-xs font-mono font-bold flex items-center space-x-2 animate-pulse"
              style={{ left: `${dragBadge.screenX + 16}px`, top: `${dragBadge.screenY - 24}px` }}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] text-slate-400 uppercase">REPOSITIONING:</span>
              <span className="text-white font-extrabold">X: {dragBadge.x.toFixed(1)}m | Y: {dragBadge.y.toFixed(1)}m</span>
            </div>
          )}

          {/* Slide-Out Telemetry Drawer for Selected Node */}
          {selectedNode && isDrawerOpen && (
            <div className="absolute right-3.5 top-16 bottom-16 w-80 z-40 pointer-events-auto bg-[#070E1A]/95 backdrop-blur-2xl border border-cyan-500/50 rounded-3xl p-4 shadow-2xl shadow-cyan-950/80 flex flex-col justify-between font-mono text-xs animate-fadeIn">
              {/* Drawer Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-extrabold text-cyan-300 font-mono">SENSOR [N{selectedNode.node_id}]</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      activeClusterHeads.includes(selectedNode.node_id)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                        : selectedNode.node_type === 'super'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50'
                        : selectedNode.node_type === 'advanced'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    }`}>
                      {activeClusterHeads.includes(selectedNode.node_id) ? 'CLUSTER HEAD' : `${selectedNode.node_type} NODE`}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Battery Residual Energy Bar */}
                <div className="p-2.5 rounded-2xl bg-[#050912] border border-[#1C3150] space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Residual Energy:</span>
                    <span className="text-cyan-300 font-extrabold">{selectedNode.currentEnergy.toFixed(3)} J / {selectedNode.energy.toFixed(3)} J</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedNode.currentEnergy / selectedNode.energy > 0.5
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          : selectedNode.currentEnergy / selectedNode.energy > 0.2
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-600'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (selectedNode.currentEnergy / selectedNode.energy) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 text-right">
                    {((selectedNode.currentEnergy / selectedNode.energy) * 100).toFixed(1)}% Capacity
                  </div>
                </div>

                {/* Sensor Spatial Diagnostics */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">Spatial Coords (X, Y):</span>
                    <span className="text-white font-bold">{selectedNode.x.toFixed(2)}m, {selectedNode.y.toFixed(2)}m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">Distance to Base Station:</span>
                    <span className="text-amber-400 font-bold">{selectedNode.sink_distance.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">Active Neighbors (Rc=30m):</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.neighbors} nodes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">Coverage Contribution:</span>
                    <span className="text-emerald-400 font-bold">{(selectedNode.coverage_contribution * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">Overlap Ratio:</span>
                    <span className="text-rose-400 font-bold">{(selectedNode.overlap_ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1C3150]/60">
                    <span className="text-slate-400">ANN Classification:</span>
                    <span className="text-cyan-300 font-bold">{selectedNode.final_state}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Operational Status:</span>
                    <span className={`font-bold ${selectedNode.isAlive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedNode.isAlive ? 'ONLINE / TRANSMITTING' : 'DEAD / DEPLETED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Sensor Actions */}
              <div className="space-y-1.5 pt-3 border-t border-[#1C3150]">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => injectEnergyToNode(selectedNode.node_id, 0.25)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold text-[10px] cursor-pointer transition-all flex items-center justify-center space-x-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+0.25J Charge</span>
                  </button>

                  <button
                    onClick={() => toggleNodeState(selectedNode.node_id)}
                    className="py-2 px-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300 font-bold text-[10px] cursor-pointer transition-all flex items-center justify-center space-x-1"
                  >
                    <span>Toggle Sleep</span>
                  </button>
                </div>

                <button
                  onClick={() => removeNode(selectedNode.node_id)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-300 font-bold text-[10px] cursor-pointer transition-all flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Sensor Node</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Compact ANN Coverage Predictor HUD Card */}
          <div className="absolute top-16 right-3.5 z-20 pointer-events-auto bg-[#070E1A]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3 shadow-2xl text-[11px] font-mono space-y-2 min-w-[210px] hidden sm:block">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1C3150]">
              <span className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>ANN PREDICTOR</span>
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isANNRunning || isOptimizing
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
              }`}>
                {isANNRunning ? 'INFERRING' : isOptimizing ? 'SWARM OPT' : 'ACTIVE'}
              </span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Input:</span>
                <span className="text-cyan-300 font-bold">10-D Spatial Tensor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coverage Pred:</span>
                <span className="text-emerald-400 font-bold">
                  {annInferenceResult ? `${annInferenceResult.predictedCoveragePct.toFixed(2)}%` : '94.72%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Overlap Pred:</span>
                <span className="text-rose-400 font-bold">
                  {annInferenceResult ? `${annInferenceResult.predictedOverlapPct.toFixed(2)}%` : '21.38%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blindspot Risk:</span>
                <span className="text-purple-400 font-bold">
                  {annInferenceResult ? `${annInferenceResult.predictedBlindspotPct.toFixed(2)}%` : '3.17%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-cyan-400 font-bold">
                  {annInferenceResult ? annInferenceResult.confidence.toFixed(2) : '0.91'}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Before vs After Result Comparison Card */}
          {beforeAfterMetrics && (
            <div className="absolute top-64 right-3.5 z-20 pointer-events-auto bg-[#070E1A]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl text-[10px] font-mono space-y-1.5 min-w-[210px] hidden sm:block animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-[#1C3150]">
                <span className="font-extrabold text-emerald-300 flex items-center gap-1 text-[11px]">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>ANN+PSO RESULT</span>
                </span>
                <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  CONVERGED
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Coverage:</span>
                  <span className="text-emerald-400 font-bold">
                    {beforeAfterMetrics.beforeCoverage.toFixed(1)}% &rarr; {beforeAfterMetrics.afterCoverage.toFixed(1)}% ({beforeAfterMetrics.deltaCoverage >= 0 ? '+' : ''}{beforeAfterMetrics.deltaCoverage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Overlap:</span>
                  <span className="text-rose-300 font-bold">
                    {beforeAfterMetrics.beforeOverlap.toFixed(1)}% &rarr; {beforeAfterMetrics.afterOverlap.toFixed(1)}% ({beforeAfterMetrics.deltaOverlap.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Blindspots:</span>
                  <span className="text-purple-300 font-bold">
                    {beforeAfterMetrics.beforeBlindspots.toFixed(1)}% &rarr; {beforeAfterMetrics.afterBlindspots.toFixed(1)}% ({beforeAfterMetrics.deltaBlindspots.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[9px] pt-0.5 border-t border-[#1C3150]/60">
                  <span>Net Displacement:</span>
                  <span className="text-amber-300 font-bold">{beforeAfterMetrics.displacementEnergyCost.toFixed(1)}m</span>
                </div>
              </div>
            </div>
          )}

          {/* Floating 3D Hover Tooltip */}
          {hoveredNode && hoverScreenPos && (
            <div
              className="absolute z-30 pointer-events-none bg-[#070E1A]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3 shadow-2xl text-xs font-mono space-y-1 min-w-[220px] animate-fadeIn"
              style={{
                left: Math.min(hoverScreenPos.x + 15, (containerRef.current?.clientWidth || 500) - 240),
                top: Math.max(15, hoverScreenPos.y - 100)
              }}
            >
              <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                <span className="font-extrabold text-cyan-300">NODE #{hoveredNode.node_id}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  activeClusterHeads.includes(hoveredNode.node_id)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {activeClusterHeads.includes(hoveredNode.node_id) ? 'Cluster Head' : hoveredNode.node_type}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Coordinates:</span>
                <span className="text-white font-bold">({hoveredNode.x.toFixed(1)}m, {hoveredNode.y.toFixed(1)}m)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Energy:</span>
                <span className="text-cyan-400 font-bold">{hoveredNode.currentEnergy.toFixed(3)} J</span>
              </div>
            </div>
          )}

          {/* Bottom Floating Camera & Visual Layer Overlays */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="flex items-center space-x-1.5 bg-[#070E1A]/90 backdrop-blur-xl p-1.5 rounded-full border border-[#1C3150] shadow-2xl text-xs flex-wrap justify-center">
              {/* 1. Perspective View */}
              <button
                onClick={() => setCameraPreset('perspective')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  activeCamPreset === 'perspective' && !is360Rotating
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Elevated 3/4 Perspective"
              >
                Perspective
              </button>

              {/* 2. Top-Down View */}
              <button
                onClick={() => setCameraPreset('top')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  activeCamPreset === 'top' && !is360Rotating
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Top-Down Planar View"
              >
                Top-Down
              </button>

              {/* 3. Cinematic Sink View */}
              <button
                onClick={() => setCameraPreset('sink')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  activeCamPreset === 'sink' && !is360Rotating
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Sink Perspective"
              >
                Sink View
              </button>

              {/* 4. ↻ 360° Motion Orbit */}
              <button
                onClick={() => setCameraPreset('orbit')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  activeCamPreset === 'orbit' || is360Rotating
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle Cinematic 360° Orbit"
              >
                ↻ 360°
              </button>

              {/* 5. ANN Node Heatmap Toggle */}
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setAnnHeatmapMode(!annHeatmapMode);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  annHeatmapMode
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle ANN Prediction Node Colors (Green/Yellow/Red/Purple)"
              >
                ANN Heatmap
              </button>

              {/* 6. ANN Vectors Toggle */}
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setShowANNMoveVectors(!showANNMoveVectors);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  showANNMoveVectors
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle ANN Movement Recommendation Vectors"
              >
                ANN Vectors
              </button>

              {/* 7. Overlap Concentration Heatmap Toggle */}
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setShowOverlapConcentration(!showOverlapConcentration);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  showOverlapConcentration
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/60 shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle Ground Overlap Concentration Heatmap"
              >
                Overlap Map
              </button>

              {/* 8. Blindspot Holes Map Toggle */}
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setShowBlindspotHoles(!showBlindspotHoles);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  showBlindspotHoles
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 shadow-md shadow-purple-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle Unmonitored Blindspot Holes Map"
              >
                Blindspots
              </button>

              {/* 9. Disk Bubbles Toggle */}
              <button
                onClick={() => {
                  soundFX.playClickSound();
                  setShowDiskBubbles(!showDiskBubbles);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                  showDiskBubbles
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Toggle Translucent Sensing Range Disks"
              >
                Sensing Disks
              </button>
            </div>
          </div>

          {/* Bottom Floating Presentation Control Bar (Visible in Presentation Mode) */}
          {isPresentationMode && (
            <div className="absolute bottom-4 left-3.5 right-3.5 z-30 pointer-events-auto flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-[#070E1A]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl">
              
              {/* Left: Playback Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStepBackwardEvent}
                  className="p-2 px-2.5 rounded-xl bg-[#050912] border border-[#1C3150] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                  title="Step Backward 1 Event Stage"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">PREV</span>
                </button>

                <button
                  onClick={handleToggleStream}
                  className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all text-xs cursor-pointer shadow-lg active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25'
                  }`}
                >
                  <span>{isPlaying ? 'PAUSE TIMELINE' : 'STREAM SIMULATION'}</span>
                </button>

                <button
                  onClick={handleStepForwardEvent}
                  className="p-2 px-3 rounded-xl bg-[#050912] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center space-x-1"
                  title="Step Forward Exactly 1 Event Stage"
                >
                  <span className="text-[10px] font-bold">STEP EVENT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Center: Live Research Metrics HUD */}
              <div className="flex items-center space-x-3 text-[11px] font-mono hidden md:flex">
                <div className="px-2.5 py-1 rounded-xl bg-[#0B1220] border border-[#1C3150]">
                  <span className="text-slate-500 text-[9px] uppercase block font-bold">Coverage</span>
                  <span className="text-cyan-300 font-extrabold">{telemetry.currentCoveragePct.toFixed(1)}%</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#0B1220] border border-[#1C3150]">
                  <span className="text-slate-500 text-[9px] uppercase block font-bold">Overlap</span>
                  <span className="text-amber-400 font-extrabold">{telemetry.currentOverlapPct.toFixed(1)}%</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#0B1220] border border-[#1C3150]">
                  <span className="text-slate-500 text-[9px] uppercase block font-bold">Avg Battery</span>
                  <span className="text-emerald-400 font-extrabold">{telemetry.avgResidualEnergy.toFixed(3)} J</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#0B1220] border border-[#1C3150]">
                  <span className="text-slate-500 text-[9px] uppercase block font-bold">Round</span>
                  <span className="text-white font-extrabold">R{currentRound} ({protocolNameMap[selectedProtocol]})</span>
                </div>
              </div>

              {/* Right: Presentation Speed Bar & Research Demo */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">SPEED:</span>
                <div className="flex items-center bg-[#0B1220] rounded-xl border border-[#1C3150] p-0.5">
                  {[0.25, 0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        soundFX.playClickSound();
                        setPlaybackSpeed(spd);
                      }}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500 text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => startResearchDemo()}
                  disabled={isResearchDemoActive || isOptimizing}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-[10px] cursor-pointer shadow hover:opacity-95 transition-all"
                >
                  {isResearchDemoActive ? 'DEMO ACTIVE...' : 'RUN RESEARCH DEMO'}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* ======================================================= */}
        {/* RIGHT: SIMULATION CONTROL WORKBENCH                     */}
        {/* ======================================================= */}
        {!isPresentationMode && (
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-between lab-card rounded-3xl p-4 sm:p-5 border border-[#1C3150] bg-[#070E1A]/95 shadow-2xl space-y-4 overflow-y-auto max-h-[720px] relative">
            
            {/* Top Button: RESEARCH DEMO (18 STEPS) */}
            <div>
              <button
                onClick={() => startResearchDemo()}
                disabled={isResearchDemoActive || isOptimizing}
                className={`w-full py-3 px-4 rounded-2xl font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-95 text-xs ${
                  isResearchDemoActive
                    ? 'bg-emerald-600 text-white border border-emerald-400 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                <Compass className="w-4 h-4 text-slate-950" />
                <span>{isResearchDemoActive ? `DEMO IN PROGRESS (STEP ${researchDemoStep}/18)...` : 'RESEARCH DEMO (18 STEPS)'}</span>
              </button>
            </div>

            <div className="w-full h-px bg-[#1C3150]/60" />

            {/* ===================================================== */}
            {/* PHASE 1: ANN + PSO SPATIAL OPTIMIZATION               */}
            {/* ===================================================== */}
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  PHASE 1: ANN + PSO SPATIAL SWARM
                </span>
              </div>

              {/* Run ANN Inference Button */}
              <button
                onClick={handleRunANN}
                disabled={isANNRunning || isOptimizing}
                className="w-full py-2 px-3 rounded-xl bg-[#0B1220] hover:bg-[#1C2B40] border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isANNRunning ? 'Inferring 10-D Features...' : 'Run ANN Inference'}</span>
              </button>

              {/* Blue Button: Execute ANN + PSO Optimization */}
              <button
                onClick={handleExecuteOptimization}
                onMouseEnter={() => setHoveredHudCard('phase1')}
                onMouseLeave={() => setHoveredHudCard(null)}
                disabled={isOptimizing}
                className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer shadow-lg active:scale-95 ${
                  isOptimizing
                    ? 'bg-blue-700/60 text-blue-200 border border-blue-500/40 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isOptimizing ? `Optimizing Swarm (Iter ${currentOptIteration}/15)...` : 'Execute ANN + PSO Optimization'}</span>
              </button>

              {/* Floating HUD Card for Phase 1 */}
              {hoveredHudCard === 'phase1' && (
                <div className="hidden lg:block absolute right-[102%] top-0 w-80 p-4 rounded-2xl bg-[#070E1A]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl space-y-2 text-xs font-mono z-40 animate-fadeIn pointer-events-none">
                  <div className="flex items-center justify-between pb-1 border-b border-[#1C3150]">
                    <span className="font-bold text-white text-xs">ANN-Guided Spatial Swarm</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
                      ANN + PSO HYBRID
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    <span className="text-slate-500 font-bold">PIPELINE: </span>
                    <span className="text-cyan-300 font-semibold">10-D Features &rarr; MLP &rarr; Pareto Swarm &rarr; Repositioning</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    ANN predicts coverage contribution and overlap risk for each node. Virtual forces and PSO particle dynamics migrate nodes to fill unmonitored blindspots while reducing redundant overlap.
                  </p>
                  <div className="p-2 rounded-xl bg-[#050912] border border-[#1C3150] text-[10px] text-cyan-300 font-mono text-center">
                    F = wC&middot;C - wO&middot;O - wB&middot;B - wD&middot;D + wE&middot;E
                  </div>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-[#1C3150]/60" />

            {/* ===================================================== */}
            {/* PHASE 2: DATA ROUTING DYNAMICS                        */}
            {/* ===================================================== */}
            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  PHASE 2: ENERGY-AWARE ROUTING
                </span>
              </div>

              {/* Protocol Selector Dropdown */}
              <div>
                <select
                  value={selectedProtocol}
                  onChange={(e) => {
                    soundFX.playClickSound();
                    setSelectedProtocol(e.target.value as RoutingProtocol);
                  }}
                  className="w-full bg-[#050912] border border-[#1C3150] text-slate-200 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                >
                  <option value="pso_hybrid">PSO-Hybrid Multi-Hop Swarm (Recommended)</option>
                  <option value="leach">LEACH Protocol (Direct Cluster Relay)</option>
                  <option value="pegasis">PEGASIS Protocol (Chain Hop)</option>
                  <option value="hybrid">Hybrid LEACH-PEGASIS Protocol</option>
                </select>
              </div>

              {/* Stream and Step Controls */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleStepBackwardEvent}
                  className="p-2.5 rounded-xl bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  title="Step Backward 1 Event Stage (-1 Step)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Green Stream Button */}
                <button
                  onClick={handleToggleStream}
                  onMouseEnter={() => setHoveredHudCard('phase2')}
                  onMouseLeave={() => setHoveredHudCard(null)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer shadow-lg active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25'
                  }`}
                >
                  <span>{isPlaying ? 'Pause Multi-Hop Stream' : 'Resume Multi-Hop Stream'}</span>
                </button>

                <button
                  onClick={handleStepForwardEvent}
                  className="p-2.5 px-3 rounded-xl bg-[#050912] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center space-x-1"
                  title="Step Forward Exactly 1 Event Stage (+1 Step)"
                >
                  <span className="text-[10px] font-bold">STEP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Round & Node Counter */}
              <div className="text-center py-1 space-y-0.5">
                <div className="text-xs font-bold text-slate-200 tracking-wide">
                  Round {currentRound} ({protocolNameMap[selectedProtocol] || 'PSO-HYBRID'}) &bull; {telemetry.activeNodes}/{telemetry.totalNodes} Active
                </div>
                <div className="text-[10px] text-cyan-400">
                  Stage 0{activeStageInfo.stageNumber}/08: {activeStageInfo.name} ({eventProgressPct}%)
                </div>
              </div>

              {/* Trigger Regional EMP Blast Button */}
              <button
                onClick={handleTriggerEMPBlast}
                className="w-full py-2 px-3 rounded-xl bg-[#2A1329] hover:bg-[#3D1A3B] border border-rose-500/30 text-rose-300 font-bold flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Trigger Regional EMP Blast</span>
              </button>

              {/* Dark Slate Button: Reset to Initial Distribution */}
              <button
                onClick={handleResetExperiment}
                className="w-full py-2 px-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-[#1C3150] text-slate-300 font-bold flex items-center justify-center space-x-1.5 transition-all text-xs cursor-pointer"
              >
                <span>Reset to Initial Distribution</span>
              </button>
            </div>

            <div className="w-full h-px bg-[#1C3150]/60" />

            {/* Seed Selector & Playback Speed Controls */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">Seed:</span>
                <div className="flex items-center space-x-1">
                  {[42, 43, 123, 456].map((sd) => (
                    <button
                      key={sd}
                      onClick={() => {
                        soundFX.playClickSound();
                        setSelectedSeed(sd);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                        selectedSeed === sd
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white'
                      }`}
                    >
                      {sd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">Speed:</span>
                <div className="flex items-center space-x-1">
                  {[0.25, 0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        soundFX.playClickSound();
                        setPlaybackSpeed(spd);
                      }}
                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition-all cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white bg-[#050912] border border-[#1C3150]'
                      }`}
                      title={spd === 0.25 ? 'Genuinely Slow Presentation Speed' : `${spd}x Speed`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Physical Parameters Drawer */}
            <div className="pt-1">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-full py-1.5 px-3 rounded-xl bg-[#050912] border border-[#1C3150] text-slate-400 hover:text-white flex items-center justify-between text-[10px] font-bold cursor-pointer transition-colors"
              >
                <span>{isDrawerOpen ? 'Hide Physical Sliders' : 'Physical Sliders (N, Rs, Rc)'}</span>
                <Sliders className="w-3 h-3 text-cyan-400" />
              </button>

              {isDrawerOpen && (
                <div className="p-3 rounded-2xl bg-[#050912] border border-[#1C3150] space-y-2 animate-fadeIn text-[10px] mt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sensors (N):</span>
                      <span className="font-bold text-cyan-300">{nodeCount}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={150}
                      step={5}
                      value={nodeCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNodeCount(val);
                        handleApplySliders(val, sensingRad, commRad, initialEnergy, maxRounds);
                      }}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sensing Radius (Rs):</span>
                      <span className="font-bold text-cyan-300">{sensingRad}m</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={35}
                      step={1}
                      value={sensingRad}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSensingRad(val);
                        handleApplySliders(nodeCount, val, commRad, initialEnergy, maxRounds);
                      }}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Floating EMP Feedback Toast */}
      {empBannerText && (
        <div className="fixed bottom-6 right-6 z-50 p-3 px-4 rounded-2xl bg-[#070E1A]/95 backdrop-blur-xl border border-rose-500/40 shadow-2xl text-xs font-mono text-rose-300 flex items-center space-x-2 animate-bounce">
          <span>{empBannerText}</span>
        </div>
      )}

    </div>
  );
};
