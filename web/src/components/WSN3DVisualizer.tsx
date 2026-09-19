import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Play, Pause, RotateCcw, Settings2, Sparkles, Brain,
  Maximize2, Minimize2, Eye, Activity, Radio,
  Layers, Hexagon, GitBranch, Zap, ShieldCheck
} from 'lucide-react';
import { useWSNSimulation } from '../context/SimulationContext';
import { NodeInspectorModal } from './NodeInspectorModal';
import { soundFX } from '../utils/soundEffects';
import { TiltCard3D } from './TiltCard3D';
import type { DynamicNodeState, RoutingProtocol, OptimizationAlgorithm, CameraMode } from '../types/wsn';

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
    play,
    pause,
    restart,
    selectedProtocol,
    setSelectedProtocol,
    selectedOptimizer,
    setSelectedOptimizer,
    executeOptimization,
    isOptimizing,
    currentOptIteration,
    telemetry,
    saveCustomScenario,
    selectScenario
  } = useWSNSimulation();

  // 3D Canvas & Camera State
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number>(0);

  // Camera & Layer Visibility Toggles
  const [activeCamPreset, setActiveCamPreset] = useState<CameraMode>('perspective');
  const [is360Rotating, setIs360Rotating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layer Visibility Filters
  const [showCoverage, setShowCoverage] = useState<boolean>(true);
  const [showCommLinks, setShowCommLinks] = useState<boolean>(true);
  const [showRoutingPaths, setShowRoutingPaths] = useState<boolean>(true);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showTerrain, setShowTerrain] = useState<boolean>(true);
  const [showEnergyState, setShowEnergyState] = useState<boolean>(true);

  // Mouse Parallax & 3D Hover Tooltip State
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);
  const mouseNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-45, 65, 95));

  // Access UI mode, Presentation mode, and Story mode from context
  const {
    uiMode,
    isPresentationMode,
    setIsPresentationMode,
    storyStep,
    isStoryPlaying,
    setIsStoryPlaying,
    startStoryMode,
    stopStoryMode,
    nextStoryStep,
    prevStoryStep
  } = useWSNSimulation();

  // 12-Step Story Tour Definitions
  const storyStepsInfo = useMemo(() => [
    {
      step: 1,
      title: 'Sensor Field Spatial Deployment',
      subtitle: 'Step 01 / 12 • Physical Deployment',
      explanation: '100 heterogeneous sensor devices are distributed across the 100m × 100m terrain with initial battery reserves (E0 = 0.5 J).',
      cam: 'perspective' as CameraMode
    },
    {
      step: 2,
      title: 'Sensing Range Volumetric Coverage',
      subtitle: 'Step 02 / 12 • Baseline Sensing',
      explanation: 'Each active sensor emits an omnidirectional sensing radius (Rs = 20m), establishing 93.73% initial spatial field coverage.',
      cam: 'top' as CameraMode
    },
    {
      step: 3,
      title: 'Redundant Overlap Detection',
      subtitle: 'Step 03 / 12 • Overlap Penalty',
      explanation: 'Random spatial scattering produces severe 82.51% sensing overlap redundancy in dense regions, wasting battery power.',
      cam: 'isometric' as CameraMode
    },
    {
      step: 4,
      title: 'ANN 6-Feature Classifier Evaluation',
      subtitle: 'Step 04 / 12 • Neural Classification',
      explanation: 'Multilayer Perceptron (MLP) evaluates residual energy, sink distance, node degree, and overlap to classify redundant sensors.',
      cam: 'perspective' as CameraMode
    },
    {
      step: 5,
      title: 'Dynamic Sleep Scheduling',
      subtitle: 'Step 05 / 12 • Zero-Drain Sleep',
      explanation: '44 redundant sensors transition into low-power sleep mode, completely eliminating unnecessary idle sensing drain.',
      cam: 'isometric' as CameraMode
    },
    {
      step: 6,
      title: 'Coverage Preservation Guarantee (Δ ≤ 1.0%)',
      subtitle: 'Step 06 / 12 • Strict Coverage Retention',
      explanation: 'Active network retains 92.73% coverage (strictly within the Δ ≤ 1.0% tolerance boundary) with only 56 active sensors.',
      cam: 'top' as CameraMode
    },
    {
      step: 7,
      title: 'Multi-Objective PSO Optimization',
      subtitle: 'Step 07 / 12 • Swarm Metaheuristics',
      explanation: 'Particle Swarm Optimization evaluates multi-objective fitness balancing battery reserves, sink distance, and cluster density.',
      cam: 'isometric' as CameraMode
    },
    {
      step: 8,
      title: 'Voronoi Cluster Formation',
      subtitle: 'Step 08 / 12 • Spatial Partitioning',
      explanation: 'Field is partitioned into Voronoi territorial cells with dynamic Cluster Heads selected for minimum intra-cluster distance.',
      cam: 'perspective' as CameraMode
    },
    {
      step: 9,
      title: 'Multi-Hop Routing Path Construction',
      subtitle: 'Step 09 / 12 • Routing Topology',
      explanation: 'Hybrid intra-cluster chains and inter-cluster multi-hop relay links are established toward the Base Station.',
      cam: 'isometric' as CameraMode
    },
    {
      step: 10,
      title: 'Autonomous Data Packet Streaming',
      subtitle: 'Step 10 / 12 • Data Telemetry',
      explanation: 'Active sensors transmit 4000-bit data packets to Cluster Heads, which aggregate and stream telemetry directly to the Sink tower.',
      cam: 'sink' as CameraMode
    },
    {
      step: 11,
      title: 'First-Order Radio Model Dissipation',
      subtitle: 'Step 11 / 12 • Energy Consumption',
      explanation: 'Radio dissipation physics consumes energy proportional to transmission distance squared (free space) or d^4 (multipath fading).',
      cam: 'perspective' as CameraMode
    },
    {
      step: 12,
      title: 'Network Lifetime Extension (FND at 425 Rounds)',
      subtitle: 'Step 12 / 12 • Empirical Lifetime',
      explanation: 'First Node Dead (FND) is extended from 144.67 rounds (LEACH) to 425.33 rounds (+194.01% lifetime extension!), surviving 1000 rounds.',
      cam: 'perspective' as CameraMode
    }
  ], []);

  // Live Slider local states
  const [nodeCount, setNodeCount] = useState<number>(activeScenario.sensorCount || 70);
  const [sensingRad, setSensingRad] = useState<number>(activeScenario.sensingRadius || 19);
  const [commRad, setCommRad] = useState<number>(activeScenario.commRadius || 37);

  // Additional Simulation Parameters
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

  // Mesh refs for dynamic updates
  const nodeGroupsRef = useRef<THREE.Group[]>([]);
  const diskBubbleMeshesRef = useRef<THREE.Mesh[]>([]);
  const energyRingsRef = useRef<THREE.Mesh[]>([]);
  const linksGroupRef = useRef<THREE.Group | null>(null);
  const routingGroupRef = useRef<THREE.Group | null>(null);
  const packetsGroupRef = useRef<THREE.Group | null>(null);
  const packetObjectsRef = useRef<{ mesh: THREE.Mesh; path: THREE.Vector3[]; progress: number; speed: number }[]>([]);
  const hoverHighlightMeshRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const clustersGroupRef = useRef<THREE.Group | null>(null);

  // Coordinate mapper from scenario space (0..W, 0..H) to 3D scene (-50..50)
  const W = activeScenario.fieldWidth || 100;
  const H = activeScenario.fieldHeight || 100;

  // Terrain height function for realistic subtle elevation
  const getTerrainElevation = useCallback((x: number, z: number): number => {
    return Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.8 + Math.sin(x * 0.1) * 0.5;
  }, []);

  const to3DPos = useCallback((x: number, y: number, heightOffset = 0): THREE.Vector3 => {
    const sceneX = ((x / W) - 0.5) * 100;
    const sceneZ = -(((y / H) - 0.5) * 100);
    const groundY = getTerrainElevation(sceneX, sceneZ);
    return new THREE.Vector3(sceneX, groundY + heightOffset, sceneZ);
  }, [W, H, getTerrainElevation]);

  const sink3DPos = useMemo(() => {
    const sx = ((activeScenario.sinkX / W) - 0.5) * 100;
    const sz = -(((activeScenario.sinkY / H) - 0.5) * 100);
    return new THREE.Vector3(sx, 16, sz);
  }, [activeScenario, W, H]);

  // -----------------------------------------------------------------
  // 1. THREE.JS INITIALIZATION & SCENE SETUP
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene with Midnight Blue Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050912);
    scene.fog = new THREE.FogExp2(0x050912, 0.0035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1200);
    camera.position.set(-45, 65, 95);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 15;
    controls.maxDistance = 320;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting (Midnight Blue Ambient + Cyan Directional + Violet Rim Light)
    const ambientLight = new THREE.AmbientLight(0x0e1c31, 2.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00E5FF, 1.6);
    dirLight.position.set(45, 90, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const violetRim = new THREE.DirectionalLight(0x8B5CF6, 1.3);
    violetRim.position.set(-50, 70, -60);
    scene.add(violetRim);

    // Realistic 3D Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(100, 100, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, getTerrainElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x091426,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Technical Coordinate Subgrid
    const gridHelper = new THREE.GridHelper(100, 20, 0x00E5FF, 0x1C3150);
    gridHelper.position.set(0, 0.08, 0);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Outer Perimeter Boundary Box
    const rimGeo = new THREE.BoxGeometry(100.4, 0.5, 100.4);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, wireframe: true, transparent: true, opacity: 0.3 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, 0.25, 0);
    scene.add(rimMesh);

    // Futuristic Base Station / Sink Tower
    const bsGroup = new THREE.Group();
    bsGroup.position.copy(sink3DPos);

    const pylonGeo = new THREE.CylinderGeometry(1.5, 3.8, 16, 12);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x0B162A, metalness: 0.9, roughness: 0.2 });
    const pylonMesh = new THREE.Mesh(pylonGeo, pylonMat);
    pylonMesh.position.y = -6;
    pylonMesh.castShadow = true;
    bsGroup.add(pylonMesh);

    const coreGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({ 
      color: 0x00E5FF, 
      emissive: 0x00E5FF, 
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 2.5;
    bsGroup.add(coreMesh);

    const radarDishGeo = new THREE.TorusGeometry(3.6, 0.35, 12, 32);
    const radarDishMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, metalness: 0.8, roughness: 0.2 });
    const radarDish = new THREE.Mesh(radarDishGeo, radarDishMat);
    radarDish.rotation.x = Math.PI / 4;
    radarDish.position.y = 3.2;
    bsGroup.add(radarDish);

    const mastGeo = new THREE.CylinderGeometry(0.25, 0.25, 8, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x1C3150, metalness: 0.9 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 8.5;
    bsGroup.add(mast);

    const beaconTipGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const beaconTipMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const beaconTip = new THREE.Mesh(beaconTipGeo, beaconTipMat);
    beaconTip.position.y = 12.8;
    bsGroup.add(beaconTip);

    const skyBeamGeo = new THREE.CylinderGeometry(0.35, 0.8, sink3DPos.y + 35, 16);
    const skyBeamMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const skyBeam = new THREE.Mesh(skyBeamGeo, skyBeamMat);
    skyBeam.position.set(0, -(sink3DPos.y + 35) / 2 + 12.8, 0);
    bsGroup.add(skyBeam);

    const impactRingGeo = new THREE.RingGeometry(2.0, 3.4, 32);
    const impactRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const impactRing = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.set(0, -sink3DPos.y + 0.1, 0);
    bsGroup.add(impactRing);

    scene.add(bsGroup);

    // Dynamic Groups for Links, Routing, Clusters, Packets
    const linksGroup = new THREE.Group();
    scene.add(linksGroup);
    linksGroupRef.current = linksGroup;

    const routingGroup = new THREE.Group();
    scene.add(routingGroup);
    routingGroupRef.current = routingGroup;

    const clustersGroup = new THREE.Group();
    scene.add(clustersGroup);
    clustersGroupRef.current = clustersGroup;

    const packetsGroup = new THREE.Group();
    scene.add(packetsGroup);
    packetsGroupRef.current = packetsGroup;

    // 3D Hover Beacon Highlight Group
    const hoverGroup = new THREE.Group();
    const hoverRingGeo = new THREE.RingGeometry(2.2, 2.8, 32);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.y = 0.2;
    hoverGroup.add(hoverRing);

    const hoverBeamGeo = new THREE.CylinderGeometry(0.1, 0.1, 14, 8);
    const hoverBeamMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.6
    });
    const hoverBeam = new THREE.Mesh(hoverBeamGeo, hoverBeamMat);
    hoverBeam.position.y = 7;
    hoverGroup.add(hoverBeam);

    hoverGroup.visible = false;
    scene.add(hoverGroup);
    hoverHighlightMeshRef.current = hoverGroup;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Main Render Loop with Camera Lerp, Mouse Parallax and Flowing Packets
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime() * simSpeed;

      // Radar dish rotation
      radarDish.rotation.z = elapsedTime * 1.5;
      radarDish.rotation.y = elapsedTime * 0.8;

      // Pulse skybeam and ground ring
      skyBeamMat.opacity = 0.4 + Math.sin(elapsedTime * 6) * 0.2;
      impactRing.scale.setScalar(1 + Math.sin(elapsedTime * 4) * 0.15);

      // Camera Smooth Follow & Transitions
      if (controls && camera) {
        if (activeCamPreset === 'follow_packet' && packetObjectsRef.current.length > 0) {
          const leadPkt = packetObjectsRef.current[0].mesh.position;
          targetCameraPosRef.current.set(leadPkt.x - 18, leadPkt.y + 16, leadPkt.z + 24);
          controls.target.lerp(leadPkt, 0.08);
        } else if (activeCamPreset === 'follow_node' && selectedNode) {
          const n3D = to3DPos(selectedNode.x, selectedNode.y, 2);
          targetCameraPosRef.current.set(n3D.x - 14, n3D.y + 12, n3D.z + 18);
          controls.target.lerp(n3D, 0.08);
        } else if (is360Rotating || activeCamPreset === 'orbit') {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 1.8;
        } else {
          controls.autoRotate = false;
        }

        // Smooth camera lerp to target position
        camera.position.lerp(targetCameraPosRef.current, 0.05);

        // Smooth Mouse Parallax Tilt (when not rotating or tracking)
        const mx = mouseNormRef.current.x;
        const my = mouseNormRef.current.y;
        if (!is360Rotating && activeCamPreset !== 'orbit' && activeCamPreset !== 'follow_packet' && activeCamPreset !== 'follow_node') {
          if (Math.abs(mx) > 0.01 || Math.abs(my) > 0.01) {
            camera.position.x += mx * 0.25;
            camera.position.y -= my * 0.2;
          }
        }

        controls.update();
      }

      // Animate flowing packets along multi-hop routes
      if (packetObjectsRef.current.length > 0) {
        packetObjectsRef.current.forEach((pkt) => {
          pkt.progress += pkt.speed * simSpeed;
          if (pkt.progress > 1.0) pkt.progress = 0;

          if (pkt.path.length >= 2) {
            const numSegments = pkt.path.length - 1;
            const segmentProgress = pkt.progress * numSegments;
            const currentSeg = Math.min(Math.floor(segmentProgress), numSegments - 1);
            const segT = segmentProgress - currentSeg;

            const p0 = pkt.path[currentSeg];
            const p1 = pkt.path[currentSeg + 1];
            pkt.mesh.position.lerpVectors(p0, p1, segT);
          }
        });
      }

      // Animate physical sensor device pulse & CH beacons
      nodeGroupsRef.current.forEach((group, i) => {
        if (group && group.userData && group.userData.node) {
          const n = group.userData.node as DynamicNodeState;
          if (n.isAlive) {
            const baseY = group.userData.baseY || 1.0;
            group.position.y = baseY + Math.sin(elapsedTime * 2.5 + i * 0.4) * 0.15;
            if (group.userData.isCH) {
              group.scale.setScalar(1.2 + Math.sin(elapsedTime * 4 + i) * 0.1);
            }
          }
        }
      });

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
  }, [sink3DPos, is360Rotating, activeCamPreset, simSpeed, getTerrainElevation, selectedNode, to3DPos]);

  // -----------------------------------------------------------------
  // 2. REBUILD REALISTIC 3D SENSOR NODES, VOLUMETRIC DOMES, & PROTOCOL ROUTING
  // -----------------------------------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || nodes.length === 0) return;

    // Clear previous meshes
    nodeGroupsRef.current.forEach((g) => scene.remove(g));
    diskBubbleMeshesRef.current.forEach((m) => scene.remove(m));
    energyRingsRef.current.forEach((m) => scene.remove(m));
    nodeGroupsRef.current = [];
    diskBubbleMeshesRef.current = [];
    energyRingsRef.current = [];

    if (linksGroupRef.current) linksGroupRef.current.clear();
    if (routingGroupRef.current) routingGroupRef.current.clear();
    if (clustersGroupRef.current) clustersGroupRef.current.clear();
    if (packetsGroupRef.current) packetsGroupRef.current.clear();
    packetObjectsRef.current = [];

    // Shared Geometries for physical sensor device
    const baseCylinderGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.6, 16);
    const ledDomeGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const antennaMastGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
    const antennaBeaconGeo = new THREE.SphereGeometry(0.25, 8, 8);
    
    // Cluster Head Geometries
    const chBaseGeo = new THREE.CylinderGeometry(1.3, 1.6, 0.9, 16);
    const chLedGeo = new THREE.SphereGeometry(1.0, 20, 20);
    const chMastGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.2, 8);
    const chBeaconGeo = new THREE.SphereGeometry(0.45, 12, 12);

    const diskBubbleGeo = new THREE.SphereGeometry(sensingRad * (100 / W) * 0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const energyRingGeo = new THREE.RingGeometry(1.6, 2.1, 24);

    const chPositionsMap: Record<number, THREE.Vector3> = {};
    const aliveActiveNodes: DynamicNodeState[] = [];

    nodes.forEach((node) => {
      const isCH = activeClusterHeads.includes(node.node_id);
      const isSleep = selectedOptimizer === 'ann_greedy' && node.final_state === 'SLEEP';
      const pos = to3DPos(node.x, node.y, isCH ? 2.2 : 1.0);

      // Palette Colors by State
      let coreColor = 0x00E5FF; // Active: Electric Cyan
      let emissivePower = 1.0;
      let opacity = 1.0;

      if (!node.isAlive) {
        coreColor = 0xEF4444; // Dead: Red
        emissivePower = 0.1;
        opacity = 0.35;
      } else if (isSleep) {
        coreColor = 0x6366F1; // Sleep: Dim Violet / Slate
        emissivePower = 0.25;
        opacity = 0.45;
      } else if (isCH) {
        coreColor = 0xF59E0B; // Cluster Head: Gold / Amber
        emissivePower = 1.8;
      } else if (node.currentEnergy / node.energy < 0.25) {
        coreColor = 0xF97316; // Low Energy: Orange
        emissivePower = 0.7;
      }

      // Create Physical Sensor Device Group
      const deviceGroup = new THREE.Group();
      deviceGroup.position.copy(pos);

      // 1. Metallic Base Casing
      const casingMat = new THREE.MeshStandardMaterial({
        color: 0x0D1626,
        metalness: 0.85,
        roughness: 0.25,
        transparent: isSleep || !node.isAlive,
        opacity: opacity
      });
      const casingMesh = new THREE.Mesh(isCH ? chBaseGeo : baseCylinderGeo, casingMat);
      casingMesh.castShadow = true;
      deviceGroup.add(casingMesh);

      // 2. Central Glowing LED Core
      const ledMat = new THREE.MeshStandardMaterial({
        color: coreColor,
        emissive: coreColor,
        emissiveIntensity: emissivePower,
        roughness: 0.15,
        metalness: 0.5,
        transparent: isSleep || !node.isAlive,
        opacity: opacity
      });
      const ledMesh = new THREE.Mesh(isCH ? chLedGeo : ledDomeGeo, ledMat);
      ledMesh.position.y = isCH ? 0.7 : 0.45;
      deviceGroup.add(ledMesh);

      // 3. Antenna Pin & Beacon Light
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x1C3150, metalness: 0.9 });
      const mastMesh = new THREE.Mesh(isCH ? chMastGeo : antennaMastGeo, mastMat);
      mastMesh.position.y = isCH ? 1.8 : 1.1;
      deviceGroup.add(mastMesh);

      const beaconMat = new THREE.MeshBasicMaterial({ color: coreColor });
      const beaconMesh = new THREE.Mesh(isCH ? chBeaconGeo : antennaBeaconGeo, beaconMat);
      beaconMesh.position.y = isCH ? 2.9 : 1.8;
      deviceGroup.add(beaconMesh);

      deviceGroup.userData = {
        node: node,
        isCH: isCH,
        baseY: pos.y
      };

      scene.add(deviceGroup);
      nodeGroupsRef.current.push(deviceGroup);

      if (node.isAlive && !isSleep) {
        aliveActiveNodes.push(node);
        if (isCH) chPositionsMap[node.node_id] = pos;
      }

      // Energy Ring Indicator
      if (showEnergyState && node.isAlive) {
        const eRatio = node.currentEnergy / node.energy;
        const ringColor = eRatio > 0.6 ? 0x10B981 : eRatio > 0.25 ? 0xF59E0B : 0xEF4444;
        const ringMat = new THREE.MeshBasicMaterial({
          color: ringColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(energyRingGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(pos.x, pos.y + 0.1, pos.z);
        scene.add(ringMesh);
        energyRingsRef.current.push(ringMesh);
      }

      // Volumetric Translucent Sensing Domes
      if (showCoverage && node.isAlive && !isSleep) {
        const domeMat = new THREE.MeshBasicMaterial({
          color: isCH ? 0x8B5CF6 : 0x00E5FF,
          transparent: true,
          opacity: isCH ? 0.14 : 0.075,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const domeMesh = new THREE.Mesh(diskBubbleGeo, domeMat);
        domeMesh.position.set(pos.x, pos.y - 0.9, pos.z);
        scene.add(domeMesh);
        diskBubbleMeshesRef.current.push(domeMesh);
      }
    });

    // -------------------------------------------------------------
    // PROTOCOL-SPECIFIC ROUTING TOPOLOGY & ANIMATED FLOW
    // -------------------------------------------------------------
    const chIds = Object.keys(chPositionsMap).map(Number);

    if (selectedProtocol === 'pegasis') {
      // -----------------------------------------------------------
      // PEGASIS PROTOCOL: Sequential Greedy Chain
      // -----------------------------------------------------------
      if (showCommLinks && linksGroupRef.current && aliveActiveNodes.length > 1) {
        const chainNodes = [...aliveActiveNodes].sort((a, b) => a.x - b.x);
        const chainPoints: THREE.Vector3[] = chainNodes.map(n => to3DPos(n.x, n.y, 1.2));
        
        for (let i = 0; i < chainPoints.length - 1; i++) {
          const p1 = chainPoints[i];
          const p2 = chainPoints[i + 1];
          const curve = new THREE.QuadraticBezierCurve3(
            p1,
            new THREE.Vector3((p1.x + p2.x) / 2, Math.min(6, p1.distanceTo(p2) * 0.2 + 2), (p1.z + p2.z) / 2),
            p2
          );
          const points = curve.getPoints(12);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xFACC15, transparent: true, opacity: 0.6 });
          const line = new THREE.Line(lineGeo, lineMat);
          linksGroupRef.current?.add(line);
        }

        // Leader connects directly to Sink
        const leaderNode = chainNodes[currentRound % chainNodes.length] || chainNodes[0];
        const leaderPos = to3DPos(leaderNode.x, leaderNode.y, 2.5);
        const leaderCurve = new THREE.QuadraticBezierCurve3(
          leaderPos,
          new THREE.Vector3((leaderPos.x + sink3DPos.x) / 2, 22, (leaderPos.z + sink3DPos.z) / 2),
          sink3DPos
        );
        const leaderPoints = leaderCurve.getPoints(24);
        const leaderLineGeo = new THREE.BufferGeometry().setFromPoints(leaderPoints);
        const leaderLineMat = new THREE.LineBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.9 });
        const leaderLine = new THREE.Line(leaderLineGeo, leaderLineMat);
        routingGroupRef.current?.add(leaderLine);

        // Chain Hop Packets
        if (showRoutingPaths && packetsGroupRef.current) {
          const pktGeo = new THREE.SphereGeometry(0.8, 12, 12);
          const pktMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
          const pktMesh = new THREE.Mesh(pktGeo, pktMat);
          packetsGroupRef.current?.add(pktMesh);

          packetObjectsRef.current.push({
            mesh: pktMesh,
            path: [...chainPoints, sink3DPos],
            progress: 0,
            speed: 0.008
          });
        }
      }

    } else if (selectedProtocol === 'leach') {
      // -----------------------------------------------------------
      // LEACH PROTOCOL: Direct Member -> CH and CH -> Sink
      // -----------------------------------------------------------
      if (showCommLinks && linksGroupRef.current && aliveActiveNodes.length > 0 && chIds.length > 0) {
        aliveActiveNodes.forEach((node) => {
          if (!chIds.includes(node.node_id)) {
            const nodePos = to3DPos(node.x, node.y, 1.0);
            let closestCHPos = chPositionsMap[chIds[0]];
            let minDist = nodePos.distanceTo(closestCHPos);

            chIds.forEach((chId) => {
              const chPos = chPositionsMap[chId];
              const d = nodePos.distanceTo(chPos);
              if (d < minDist) {
                minDist = d;
                closestCHPos = chPos;
              }
            });

            const curve = new THREE.QuadraticBezierCurve3(
              nodePos,
              new THREE.Vector3((nodePos.x + closestCHPos.x) / 2, Math.min(8, minDist * 0.15 + 2), (nodePos.z + closestCHPos.z) / 2),
              closestCHPos
            );
            const points = curve.getPoints(16);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.4 });
            const line = new THREE.Line(lineGeo, lineMat);
            linksGroupRef.current?.add(line);
          }
        });

        // Direct CH to Sink lines
        chIds.forEach((chId) => {
          const chPos = chPositionsMap[chId];
          const curve = new THREE.QuadraticBezierCurve3(
            chPos,
            new THREE.Vector3((chPos.x + sink3DPos.x) / 2, 22, (chPos.z + sink3DPos.z) / 2),
            sink3DPos
          );
          const points = curve.getPoints(24);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.9 });
          const line = new THREE.Line(lineGeo, lineMat);
          routingGroupRef.current?.add(line);

          if (showRoutingPaths && packetsGroupRef.current) {
            const chPktGeo = new THREE.SphereGeometry(0.8, 12, 12);
            const chPktMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
            const chPktMesh = new THREE.Mesh(chPktGeo, chPktMat);
            packetsGroupRef.current?.add(chPktMesh);

            packetObjectsRef.current.push({
              mesh: chPktMesh,
              path: points,
              progress: Math.random(),
              speed: 0.015
            });
          }
        });
      }

    } else {
      // -----------------------------------------------------------
      // PROPOSED: ANN + PSO-HYBRID (Intra-Cluster Chain + Multi-Hop CH Relay)
      // -----------------------------------------------------------
      if (showCommLinks && linksGroupRef.current && aliveActiveNodes.length > 0) {
        aliveActiveNodes.forEach((node) => {
          if (!chIds.includes(node.node_id) && chIds.length > 0) {
            const nodePos = to3DPos(node.x, node.y, 1.0);
            let closestCHPos = chPositionsMap[chIds[0]];
            let minDist = nodePos.distanceTo(closestCHPos);

            chIds.forEach((chId) => {
              const chPos = chPositionsMap[chId];
              const d = nodePos.distanceTo(chPos);
              if (d < minDist) {
                minDist = d;
                closestCHPos = chPos;
              }
            });

            const curve = new THREE.QuadraticBezierCurve3(
              nodePos,
              new THREE.Vector3((nodePos.x + closestCHPos.x) / 2, Math.min(8, minDist * 0.15 + 2), (nodePos.z + closestCHPos.z) / 2),
              closestCHPos
            );
            const points = curve.getPoints(16);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0x00E5FF,
              transparent: true,
              opacity: 0.35
            });
            const line = new THREE.Line(lineGeo, lineMat);
            linksGroupRef.current?.add(line);

            if (showRoutingPaths && Math.random() < 0.5) {
              const pktGeo = new THREE.SphereGeometry(0.45, 8, 8);
              const pktMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
              const pktMesh = new THREE.Mesh(pktGeo, pktMat);
              packetsGroupRef.current?.add(pktMesh);

              packetObjectsRef.current.push({
                mesh: pktMesh,
                path: points,
                progress: Math.random(),
                speed: 0.01 + Math.random() * 0.005
              });
            }
          }
        });
      }

      // Multi-Hop Routing Paths (Cluster Heads to Base Station)
      if (showRoutingPaths && routingGroupRef.current && chIds.length > 0) {
        chIds.forEach((chId) => {
          const chPos = chPositionsMap[chId];
          const curve = new THREE.QuadraticBezierCurve3(
            chPos,
            new THREE.Vector3((chPos.x + sink3DPos.x) / 2, 22, (chPos.z + sink3DPos.z) / 2),
            sink3DPos
          );
          const points = curve.getPoints(24);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xF59E0B,
            transparent: true,
            opacity: 0.85
          });
          const line = new THREE.Line(lineGeo, lineMat);
          routingGroupRef.current?.add(line);

          const chPktGeo = new THREE.SphereGeometry(0.8, 12, 12);
          const chPktMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
          const chPktMesh = new THREE.Mesh(chPktGeo, chPktMat);
          packetsGroupRef.current?.add(chPktMesh);

          packetObjectsRef.current.push({
            mesh: chPktMesh,
            path: points,
            progress: Math.random(),
            speed: 0.014 + Math.random() * 0.006
          });
        });
      }

      // Voronoi Cluster Boundaries
      if (showClusters && clustersGroupRef.current && chIds.length > 0) {
        chIds.forEach((chId) => {
          const chPos = chPositionsMap[chId];
          const clusterRingGeo = new THREE.RingGeometry(8, 12, 6);
          const clusterRingMat = new THREE.MeshBasicMaterial({
            color: 0x8B5CF6,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.15
          });
          const clusterRing = new THREE.Mesh(clusterRingGeo, clusterRingMat);
          clusterRing.rotation.x = -Math.PI / 2;
          clusterRing.position.set(chPos.x, 0.15, chPos.z);
          clustersGroupRef.current?.add(clusterRing);
        });
      }
    }

    // Toggle Terrain & Grid visibility
    if (terrainMeshRef.current) terrainMeshRef.current.visible = showTerrain;
    if (gridHelperRef.current) gridHelperRef.current.visible = showTerrain;

  }, [
    nodes, activeClusterHeads, showCoverage, showCommLinks, showRoutingPaths, 
    showClusters, showTerrain, showEnergyState, selectedOptimizer, selectedProtocol, 
    sensingRad, to3DPos, sink3DPos, W, currentRound
  ]);

  // -----------------------------------------------------------------
  // 3. 3D MOUSE MOVE & RAYCASTING INTERACTION
  // -----------------------------------------------------------------
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseNormRef.current = { x: nx, y: ny };

    // Raycast on sensor device groups
    if (nodeGroupsRef.current.length > 0) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), cameraRef.current);
      
      const meshObjects: THREE.Object3D[] = [];
      nodeGroupsRef.current.forEach((g) => {
        g.children.forEach((c) => meshObjects.push(c));
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
          containerRef.current.style.cursor = 'pointer';

          if (hoverHighlightMeshRef.current) {
            hoverHighlightMeshRef.current.position.set(parentGroup.position.x, 0.1, parentGroup.position.z);
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
    containerRef.current.style.cursor = 'default';
  };

  const handlePointerLeave = () => {
    mouseNormRef.current = { x: 0, y: 0 };
    setHoveredNode(null);
    setHoverScreenPos(null);
    if (hoverHighlightMeshRef.current) {
      hoverHighlightMeshRef.current.visible = false;
    }
  };

  const handleClick = () => {
    if (hoveredNode) {
      soundFX.playClickSound();
      setSelectedNode(hoveredNode);
    }
  };

  // -----------------------------------------------------------------
  // 4. 7 CAMERA CONTROLLER PRESETS
  // -----------------------------------------------------------------
  const setCameraPreset = (preset: CameraMode) => {
    soundFX.playClickSound();
    setActiveCamPreset(preset);
    setIs360Rotating(preset === 'orbit');
    if (!cameraRef.current || !controlsRef.current) return;

    if (preset === 'perspective' || preset === 'reset') {
      targetCameraPosRef.current.set(-45, 65, 95);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'top') {
      targetCameraPosRef.current.set(0, 155, 0.01);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'isometric') {
      targetCameraPosRef.current.set(75, 75, 75);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'sink') {
      targetCameraPosRef.current.set(sink3DPos.x, sink3DPos.y + 22, sink3DPos.z + 38);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'orbit') {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 2.0;
    } else if (preset === 'follow_packet') {
      if (packetObjectsRef.current.length > 0) {
        const lead = packetObjectsRef.current[0].mesh.position;
        targetCameraPosRef.current.set(lead.x - 18, lead.y + 16, lead.z + 24);
        controlsRef.current.target.copy(lead);
      }
    } else if (preset === 'follow_node') {
      if (selectedNode) {
        const n3D = to3DPos(selectedNode.x, selectedNode.y, 2);
        targetCameraPosRef.current.set(n3D.x - 14, n3D.y + 12, n3D.z + 18);
        controlsRef.current.target.copy(n3D);
      }
    }
  };

  // -----------------------------------------------------------------
  // 5. SIMULATION ACTIONS
  // -----------------------------------------------------------------
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

  const handleToggleStream = () => {
    soundFX.playClickSound();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleResetDistribution = () => {
    soundFX.playResetSound();
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

  // 8-Step Simulation Story Workflow State
  const workflowSteps = [
    { num: '01', name: 'Node Deployment', desc: 'Spatial field distribution (N=100)', icon: Layers, progress: 100 },
    { num: '02', name: 'ANN Classification', desc: 'Predicting redundant overlap states', icon: Brain, progress: selectedOptimizer === 'ann_greedy' ? 100 : 0 },
    { num: '03', name: 'Coverage Optimization', desc: 'Greedy pruning bounded Δ ≤ 1.0%', icon: ShieldCheck, progress: selectedOptimizer === 'ann_greedy' ? 100 : 0 },
    { num: '04', name: 'Cluster Formation', desc: 'Multi-objective PSO CH election', icon: Hexagon, progress: activeClusterHeads.length > 0 ? 100 : 0 },
    { num: '05', name: 'Routing Setup', desc: 'Hybrid intra-cluster chains & relays', icon: GitBranch, progress: activeClusterHeads.length > 0 ? 100 : 0 },
    { num: '06', name: 'Data Transmission', desc: 'Streaming packets to Base Station', icon: Radio, progress: isPlaying ? 100 : currentRound > 0 ? 75 : 0 },
    { num: '07', name: 'Energy Consumption', desc: 'First-Order Radio Model physics', icon: Zap, progress: currentRound > 0 ? Math.min(100, Math.round((currentRound / maxRounds) * 100)) : 0 },
    { num: '08', name: 'Network Lifetime', desc: 'FND / HND / LND mission horizon', icon: Activity, progress: currentRound > 0 ? Math.min(100, Math.round((currentRound / (telemetry.lastNodeDeadRound || maxRounds)) * 100)) : 0 }
  ];

  const currentStoryInfo = storyStep ? storyStepsInfo[storyStep - 1] : null;

  return (
    <div 
      ref={wrapperRef}
      className={`w-full font-mono text-xs space-y-6 ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 bg-[#050912] overflow-y-auto' : ''
      }`}
    >
      {/* 12-Step Story Mode (Explain Simulation) Presentation Banner */}
      {storyStep !== null && currentStoryInfo && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0B1220] via-[#0D1626] to-[#0B1220] border-2 border-cyan-500/50 shadow-2xl shadow-cyan-950/40 animate-fadeIn space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                {currentStoryInfo.subtitle}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {currentStoryInfo.title}
              </h2>
            </div>

            {/* Story Controller Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={prevStoryStep}
                className="px-2.5 py-1 rounded-xl bg-[#070B14] border border-[#1C3150] text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ◀ Prev
              </button>
              <button
                onClick={() => setIsStoryPlaying(!isStoryPlaying)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  isStoryPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                }`}
              >
                {isStoryPlaying ? 'Pause Tour' : 'Play Tour'}
              </button>
              <button
                onClick={nextStoryStep}
                className="px-2.5 py-1 rounded-xl bg-[#070B14] border border-[#1C3150] text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Next ▶
              </button>
              <button
                onClick={stopStoryMode}
                className="px-2.5 py-1 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
              >
                Exit Tour ✕
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cyan-200 font-sans leading-relaxed">
            {currentStoryInfo.explanation}
          </p>

          {/* Story Progress Bar */}
          <div className="w-full bg-[#070B14] h-1.5 rounded-full overflow-hidden border border-[#1C3150]/50">
            <div 
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(storyStep / 12) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Protocol Explanation Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#1C3150] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold text-white uppercase tracking-wider">
            Active Protocol: <span className="text-cyan-400">{selectedProtocol.toUpperCase()}</span>
          </span>
        </div>
        <p className="text-slate-300 text-xs font-sans max-w-4xl leading-relaxed">
          {selectedProtocol === 'pso_hybrid' && (
            <span><strong>Proposed ANN + PSO-Hybrid:</strong> 44% redundant nodes sleep (zero drain), Voronoi clustering forms optimal load-balanced cells, with intra-cluster chains and multi-hop CH relays to Sink.</span>
          )}
          {selectedProtocol === 'pegasis' && (
            <span><strong>PEGASIS Protocol:</strong> Forms a single greedy sequential communication chain across active sensors. Data hops neighbor-to-neighbor to the round leader, which beams to the Base Station.</span>
          )}
          {selectedProtocol === 'leach' && (
            <span><strong>LEACH Protocol:</strong> Cluster Heads are elected randomly. Non-CH sensors transmit directly to their nearest Cluster Head, which aggregate and transmit directly to the Sink.</span>
          )}
        </p>
      </div>

      {/* Title & Research Subtitle */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
            <span>Field Topology &amp; Cluster Deployment</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              uiMode === 'beginner'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            }`}>
              {uiMode === 'beginner' ? 'BEGINNER MODE' : 'RESEARCH MODE'}
            </span>
          </h1>

          {/* Presentation Mode & Explain Tour Trigger Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={startStoryMode}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:opacity-95 transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain Simulation (12 Steps)</span>
            </button>
            <button
              onClick={() => setIsPresentationMode(!isPresentationMode)}
              className={`px-3.5 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                isPresentationMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30'
                  : 'bg-[#0D1626] text-slate-300 border-[#1C3150] hover:text-white'
              }`}
            >
              {isPresentationMode ? 'Exit Presentation' : 'Presentation Mode'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Realistic 3D Cyber-Physical Digital Twin featuring physical sensor devices, volumetric translucent coverage domes, multi-hop routing paths, and Base Station relay.
        </p>
      </div>

      {/* Main 2-Column Showcase (3D Viewport on Left + Parameters Panel on Right) */}
      <div className={`grid grid-cols-1 ${isPresentationMode ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6 items-start`}>
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 3D DIGITAL TWIN VIEWPORT (8 cols or 12 cols in Pres Mode) */}
        {/* ========================================================= */}
        <div className={isPresentationMode ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
          
          <TiltCard3D 
            intensity={3}
            className="rounded-3xl border border-[#1C3150] bg-[#070B14] shadow-2xl overflow-hidden relative group"
          >
            {/* Top Overlay: Spatial Coordinates Badge & Fullscreen */}
            <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
              
              {/* Dynamic Field Information Badge */}
              <div className="px-3.5 py-1.5 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 font-bold flex items-center space-x-2 text-[11px] shadow-lg pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>{W}m × {H}m SPATIAL FIELD • N = {telemetry.totalNodes} • Rs = {sensingRad}m • Rc = {commRad}m • Sink ({activeScenario.sinkX}, {activeScenario.sinkY})</span>
              </div>

              {/* Top-Right FPS & Fullscreen Badge */}
              <div className="flex items-center space-x-2 pointer-events-auto">
                <div className="px-3 py-1.5 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-[#1C3150] text-slate-400 font-bold text-[10px] tracking-wider uppercase shadow-lg">
                  60 FPS • THREE.JS 3D ENGINE
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-[#1C3150] text-slate-400 hover:text-white transition-all shadow-lg cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 3D Canvas Viewport */}
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onClick={handleClick}
              className={`w-full ${isPresentationMode ? 'h-[650px] sm:h-[720px]' : 'h-[540px] sm:h-[600px]'} relative z-0`}
            />

            {/* Floating 3D Tooltip on Hover */}
            {hoveredNode && hoverScreenPos && (
              <div
                className="absolute z-30 pointer-events-none bg-[#0D1626]/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 shadow-2xl shadow-cyan-500/20 text-xs font-mono space-y-1.5 min-w-[220px] animate-fadeIn"
                style={{
                  left: Math.min(hoverScreenPos.x + 15, (containerRef.current?.clientWidth || 600) - 240),
                  top: Math.max(15, hoverScreenPos.y - 95)
                }}
              >
                <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                  <span className="font-extrabold text-cyan-300">NODE #{hoveredNode.node_id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    activeClusterHeads.includes(hoveredNode.node_id)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : hoveredNode.node_type === 'super'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {activeClusterHeads.includes(hoveredNode.node_id) ? 'Cluster Head' : hoveredNode.node_type}
                  </span>
                </div>
                
                {/* ANN Classification Badge */}
                <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-violet-500/10 border border-violet-500/20 text-[10px]">
                  <span className="text-violet-300 font-bold flex items-center gap-1">
                    <Brain className="w-3 h-3 text-violet-400" /> ANN State:
                  </span>
                  <span className={hoveredNode.final_state === 'SLEEP' ? 'text-violet-300 font-bold' : 'text-cyan-400 font-bold'}>
                    {hoveredNode.final_state === 'SLEEP' ? 'SLEEP (Pruned)' : 'ACTIVE (98.4%)'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Coordinates:</span>
                  <span className="text-white font-bold">({hoveredNode.x.toFixed(1)}m, {hoveredNode.y.toFixed(1)}m)</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Residual Energy:</span>
                  <span className="text-cyan-400 font-bold">{hoveredNode.currentEnergy.toFixed(3)} J</span>
                </div>
                {/* Battery Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(hoveredNode.currentEnergy / hoveredNode.energy) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Status: <strong className={hoveredNode.isAlive ? 'text-emerald-400' : 'text-rose-400'}>{hoveredNode.isAlive ? 'ONLINE' : 'DEAD'}</strong></span>
                  <span>Packets: <strong className="text-cyan-300">{hoveredNode.packetsSent}</strong></span>
                </div>
              </div>
            )}

            {/* Floating 7-Camera Modes & Simulation Controls Dock */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-[#070B14]/90 backdrop-blur-xl border border-[#1C3150] shadow-2xl">
              
              {/* 7 Camera Presets */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setCameraPreset('perspective')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'perspective' && !is360Rotating
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Perspective
                </button>
                <button
                  onClick={() => setCameraPreset('top')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'top' && !is360Rotating
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Top-Down
                </button>
                <button
                  onClick={() => setCameraPreset('isometric')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'isometric' && !is360Rotating
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Isometric
                </button>
                <button
                  onClick={() => setCameraPreset('sink')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'sink' && !is360Rotating
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sink View
                </button>
                <button
                  onClick={() => setCameraPreset('orbit')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'orbit' || is360Rotating
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ↻ 360° Orbit
                </button>
                <button
                  onClick={() => setCameraPreset('follow_packet')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'follow_packet'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Follow Packet
                </button>
                <button
                  onClick={() => setCameraPreset('follow_node')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    activeCamPreset === 'follow_node'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Follow Node
                </button>
                <button
                  onClick={() => setCameraPreset('reset')}
                  className="px-2 py-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs cursor-pointer"
                  title="Reset Camera"
                >
                  Reset
                </button>
              </div>

              {/* Simulation Player Controls & Speed */}
              <div className="flex items-center space-x-2">
                
                {/* Speed Multipliers */}
                <div className="flex items-center bg-[#0B1220] rounded-xl border border-[#1C3150] p-0.5">
                  {[0.25, 0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        soundFX.playClickSound();
                        setSimSpeed(spd);
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        simSpeed === spd
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Play / Pause */}
                <button
                  onClick={handleToggleStream}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer ${
                    isPlaying 
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20' 
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Run Simulation'}</span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleResetDistribution}
                  className="p-1.5 rounded-xl bg-[#0B1220] border border-[#1C3150] text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </TiltCard3D>

          {/* Floating Layer Visibility Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-[#0B1220] border border-[#1C3150] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Eye className="w-4 h-4" />
              <span>Layer Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showCoverage} 
                  onChange={(e) => setShowCoverage(e.target.checked)}
                  className="rounded border-[#1C3150] accent-cyan-400 cursor-pointer"
                />
                <span>Coverage</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showCommLinks} 
                  onChange={(e) => setShowCommLinks(e.target.checked)}
                  className="rounded border-[#1C3150] accent-cyan-400 cursor-pointer"
                />
                <span>Comm Links</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showRoutingPaths} 
                  onChange={(e) => setShowRoutingPaths(e.target.checked)}
                  className="rounded border-[#1C3150] accent-amber-400 cursor-pointer"
                />
                <span>Routing Paths</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showClusters} 
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="rounded border-[#1C3150] accent-violet-400 cursor-pointer"
                />
                <span>Clusters</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showTerrain} 
                  onChange={(e) => setShowTerrain(e.target.checked)}
                  className="rounded border-[#1C3150] accent-blue-500 cursor-pointer"
                />
                <span>Terrain</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showEnergyState} 
                  onChange={(e) => setShowEnergyState(e.target.checked)}
                  className="rounded border-[#1C3150] accent-emerald-400 cursor-pointer"
                />
                <span>Energy State</span>
              </label>
            </div>
          </div>

          {/* Scientific Legend */}
          <div className="p-3.5 rounded-2xl bg-[#0D1626] border border-[#1C3150] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
              <span>Active Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Sleeping Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              <span>Cluster Head</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Low Energy</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Dead Node</span>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SIMULATION PARAMETERS & TELEMETRY (4 cols)  */}
        {/* ========================================================= */}
        {!isPresentationMode && (
          <div className="lg:col-span-4 space-y-4">
            
            <TiltCard3D 
              intensity={4}
              className="rounded-3xl border border-[#1C3150] bg-[#0B1220]/95 backdrop-blur-xl p-5 shadow-2xl space-y-5 text-slate-300 font-mono"
            >
              {/* Panel Header */}
              <div className="flex items-center space-x-2 pb-3 border-b border-[#1C3150]">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  Simulation Parameters
                </h2>
              </div>

              {/* Scenario Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Deployment Scenario
                </label>
                <select
                  value={activeScenario.id}
                  onChange={(e) => {
                    soundFX.playClickSound();
                    selectScenario(e.target.value);
                  }}
                  className="w-full bg-[#050912] border border-[#1C3150] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                >
                  <option value="sparse">Scenario 1: Sparse Grid (N=30, Rs=10m)</option>
                  <option value="standard">Scenario 2: Standard Benchmark (N=50, Rs=15m)</option>
                  <option value="dense">Scenario 3: High Density Cluster (N=80, Rs=12m)</option>
                  <option value="large_field">Scenario 4: Extended Network Array (N=100, Rs=15m)</option>
                </select>
              </div>

              {/* Optimization Algorithm Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Optimization Algorithm</span>
                  <span className="text-violet-400 font-bold">ANN Powered</span>
                </label>
                <select
                  value={selectedOptimizer}
                  onChange={(e) => {
                    soundFX.playClickSound();
                    setSelectedOptimizer(e.target.value as OptimizationAlgorithm);
                  }}
                  className="w-full bg-[#050912] border border-[#1C3150] rounded-xl px-3 py-2 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                >
                  <option value="ann_greedy">Proposed: ANN + PSO-Hybrid (Deep Sleep Scheduling)</option>
                  <option value="pso">Standard Particle Swarm Optimization (PSO)</option>
                  <option value="vfa">Virtual Force Algorithm (VFA)</option>
                  <option value="random">Random Uniform Baseline</option>
                </select>
              </div>

              {/* Live Parameter Sliders */}
              <div className="space-y-3 pt-1">
                {/* Sensor Nodes (N) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sensor Nodes (N)</span>
                    <span className="font-bold text-cyan-400">{nodeCount}</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    step={5}
                    value={nodeCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNodeCount(val);
                      handleApplySliders(val, sensingRad, commRad, initialEnergy, maxRounds);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Sensing Radius (Rs) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sensing Radius (Rs)</span>
                    <span className="font-bold text-cyan-400">{sensingRad}m</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={28}
                    step={1}
                    value={sensingRad}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSensingRad(val);
                      handleApplySliders(nodeCount, val, commRad, initialEnergy, maxRounds);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Communication Radius (Rc) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Communication Radius (Rc)</span>
                    <span className="font-bold text-cyan-400">{commRad}m</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={55}
                    step={1}
                    value={commRad}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCommRad(val);
                      handleApplySliders(nodeCount, sensingRad, val, initialEnergy, maxRounds);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Initial Energy (E0) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Initial Energy (E0)</span>
                    <span className="font-bold text-cyan-400">{initialEnergy} J</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={initialEnergy}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setInitialEnergy(val);
                      handleApplySliders(nodeCount, sensingRad, commRad, val, maxRounds);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* PHASE 1: ANN OPTIMIZATION BUTTON */}
              <div className="pt-2 space-y-2 border-t border-[#1C3150]">
                <span className="text-[10px] font-bold text-violet-400 tracking-wider uppercase block flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  PHASE 1: ANN CLASSIFICATION &amp; OPTIMIZATION
                </span>
                <button
                  onClick={handleExecuteOptimization}
                  disabled={isOptimizing}
                  className={`w-full py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2 text-xs cursor-pointer ${
                    isOptimizing
                      ? 'bg-violet-600/50 text-white cursor-wait'
                      : 'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:opacity-95 text-white shadow-violet-500/25 active:scale-[0.98]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isOptimizing ? `ANN Optimizing (Iter ${currentOptIteration}/15)...` : 'Execute ANN Sleep Pruning'}</span>
                </button>
              </div>

              {/* PHASE 2: ROUTING SELECTION & STREAM */}
              <div className="pt-2 space-y-2.5 border-t border-[#1C3150]">
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase block">
                  PHASE 2: DATA ROUTING DYNAMICS
                </span>

                {/* Protocol Selector */}
                <select
                  value={selectedProtocol}
                  onChange={(e) => {
                    soundFX.playClickSound();
                    setSelectedProtocol(e.target.value as RoutingProtocol);
                  }}
                  className="w-full bg-[#050912] border border-[#1C3150] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                >
                  <option value="pso_hybrid">Proposed: ANN + Hybrid LEACH-PEGASIS</option>
                  <option value="pegasis">PEGASIS Protocol (Chain Hop)</option>
                  <option value="leach">LEACH Protocol (Direct Cluster Relay)</option>
                </select>

                {/* Resume / Pause Stream Button */}
                <button
                  onClick={handleToggleStream}
                  className={`w-full py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2 text-xs cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-[0.98]'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause Multi-Hop Stream' : 'Resume Multi-Hop Stream'}</span>
                </button>

                {/* Status footer */}
                <div className="text-center text-xs text-slate-300 font-semibold pt-1">
                  Round {currentRound} ({selectedProtocol === 'pso_hybrid' ? 'Hybrid' : selectedProtocol.toUpperCase()}) • {telemetry.activeNodes}/{telemetry.totalNodes} Active
                </div>
              </div>

            </TiltCard3D>

            {/* Real-time Network Physical Telemetry Card */}
            <TiltCard3D 
              intensity={4}
              className="rounded-3xl border border-[#1C3150] bg-[#0D1626] p-4 shadow-xl space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1C3150]">
                <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Physical Metrics
                </span>
                <span className="text-[10px] text-slate-400">First-Order Physics</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Residual Energy</span>
                  <span className="text-cyan-400 font-bold">{telemetry.avgResidualEnergy.toFixed(3)} J</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Coverage</span>
                  <span className="text-cyan-300 font-bold">{telemetry.currentCoveragePct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Overlap Redundancy</span>
                  <span className="text-violet-400 font-bold">{telemetry.currentOverlapPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Packets Delivered</span>
                  <span className="text-amber-400 font-bold">{telemetry.packetsReceived.toLocaleString()}</span>
                </div>
              </div>
            </TiltCard3D>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* BOTTOM WORKFLOW: 8-STEP SIMULATION STORY PIPELINE        */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between font-mono text-xs pb-1 border-b border-[#1C3150]">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Simulation Pipeline &amp; Execution Workflow
            </h3>
          </div>
          <span className="text-slate-400 text-[11px]">
            Autonomous Dynamic Progression
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.progress === 100;
            return (
              <TiltCard3D
                key={idx}
                intensity={6}
                playAudioOnHover={true}
                className={`rounded-2xl p-3 border ${
                  isCompleted 
                    ? 'border-cyan-500/40 bg-[#0D1626]' 
                    : 'border-[#1C3150] bg-[#070B14]'
                } flex flex-col justify-between space-y-2 shadow-lg group hover:border-cyan-500/40 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    isCompleted ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.num}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCompleted ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>

                <div>
                  <div className="font-bold text-white text-[11px] truncate">
                    {step.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5 font-sans">
                    {step.desc}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      </div>

      {/* Node Inspector Modal */}
      {selectedNode && (
        <NodeInspectorModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

