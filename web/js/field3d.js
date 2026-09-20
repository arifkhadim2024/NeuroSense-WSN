/**
 * Three.js 3D Field Topology Viewport Module.
 * Renders nodes, sensing disks, 3D links with arrowheads, moving packets, obstacles, jammers, and Sink.
 */

import { State } from "./state.js";
import {
  MESH_COLORS, createBaseStationGroup, createDeadCrossMesh, createThickLinkMesh,
  createArrowHeadMesh, createSensingDiskGroup, createObstacleMeshes, createJammerMeshes, createTextSprite
} from "./field_mesh.js";

let scene, camera, renderer, controls, container;
let nodeMeshes = [], diskMeshes = [], chLabels = [];
let linkGroup = null, arrowGroup = null, packetGroup = null, obstacleGroup = null, jammerGroup = null;
let sinkFlashMesh = null, dragPlane, raycaster, mouse;
let isDragging = false, selectedNode = null, autoOrbit = false, activePackets = [];

export const ViewOptions = { links: true, arrows: true, packets: true, disks: true, labels: true };

export function init3DField(containerId = "threejs-canvas-container") {
  container = document.getElementById(containerId);
  if (!container) return;
  const w = container.clientWidth || 800, h = container.clientHeight || 580;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090E);

  camera = new THREE.PerspectiveCamera(40, w / h, 1, 2000);
  camera.position.set(50, 145, 195);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;
  controls.target.set(50, 0, 65); controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(50, 160, 100); scene.add(dirLight);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0B132B, transparent: true, opacity: 0.5, depthWrite: false }));
  floor.position.set(50, 0.01, 50); scene.add(floor);

  const grid = new THREE.GridHelper(100, 20, 0x06B6D4, 0x1E293B);
  grid.position.set(50, 0.05, 50); scene.add(grid);

  const guideGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(50, 0.1, 100), new THREE.Vector3(50, 0.1, 150)]);
  scene.add(new THREE.Line(guideGeo, new THREE.LineBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.5 })));

  dragPlane = new THREE.Mesh(new THREE.PlaneGeometry(350, 350).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ visible: false }));
  dragPlane.position.set(50, 0, 75); scene.add(dragPlane);

  const bs = createBaseStationGroup(50, 150);
  scene.add(bs.group);
  sinkFlashMesh = bs.flashMesh;

  linkGroup = new THREE.Group(); scene.add(linkGroup);
  arrowGroup = new THREE.Group(); scene.add(arrowGroup);
  packetGroup = new THREE.Group(); scene.add(packetGroup);
  obstacleGroup = new THREE.Group(); scene.add(obstacleGroup);
  jammerGroup = new THREE.Group(); scene.add(jammerGroup);

  raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
  setupInteractions();
  window.addEventListener("resize", onWindowResize);

  State.subscribe((event) => {
    if (event === "nodes_changed") { renderObstaclesAndJammers(); renderNodes(); }
  });

  renderObstaclesAndJammers();
  renderNodes();
  animate();
}

export function flashSink() { if (sinkFlashMesh) sinkFlashMesh.material.opacity = 0.85; }

export function renderObstaclesAndJammers() {
  if (!obstacleGroup || !jammerGroup) return;
  while (obstacleGroup.children.length > 0) obstacleGroup.remove(obstacleGroup.children[0]);
  while (jammerGroup.children.length > 0) jammerGroup.remove(jammerGroup.children[0]);
  const obs = createObstacleMeshes(State.obstaclePreset);
  if (obs.children.length > 0) obstacleGroup.add(obs);
  const jammers = createJammerMeshes(State.jammerPreset);
  if (jammers.children.length > 0) jammerGroup.add(jammers);
}

export function renderNodes() {
  if (!scene) return;
  [...nodeMeshes, ...diskMeshes, ...chLabels].forEach((m) => scene.remove(m));
  nodeMeshes = []; diskMeshes = []; chLabels = [];

  const sphereGeo = new THREE.SphereGeometry(1.8, 16, 16);
  State.nodes.forEach((node) => {
    let colorHex = MESH_COLORS.ACTIVE;
    if (node.state === "DEAD" || node.energy <= 0) colorHex = MESH_COLORS.DEAD;
    else if (node.role === "CH") colorHex = MESH_COLORS.CH;
    else if (node.state === "SLEEP") colorHex = MESH_COLORS.SLEEP;

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex, roughness: 0.2, metalness: 0.5, emissive: colorHex,
      emissiveIntensity: node.role === "CH" ? 0.7 : (node.state === "SLEEP" ? 0.05 : 0.3)
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.set(node.x, 1.8, node.y); mesh.renderOrder = 10; mesh.userData = { nodeId: node.id, nodeData: node };
    scene.add(mesh); nodeMeshes.push(mesh);

    if (node.state === "DEAD" || node.energy <= 0) {
      const cross = createDeadCrossMesh(node.x, node.y); scene.add(cross); nodeMeshes.push(cross);
    } else if (node.state === "ACTIVE" && ViewOptions.disks) {
      const disk = createSensingDiskGroup(node.x, node.y, node.sensing_radius || State.sensingRadius);
      scene.add(disk); diskMeshes.push(disk);
    }
    if (node.role === "CH" && node.state !== "DEAD" && ViewOptions.labels) {
      const lbl = createTextSprite("CH", "#F59E0B");
      lbl.position.set(node.x, 6.0, node.y); lbl.scale.set(6, 2, 1); scene.add(lbl); chLabels.push(lbl);
    }
  });
}

export function renderFrame(frame, protocol = "ann_pso_hybrid", animatePackets = true) {
  if (!frame || !scene) return;
  const states = frame.states || [], energies = frame.energy || [], links = frame.links || [];

  State.nodes.forEach((n, idx) => {
    if (idx < states.length) {
      const code = states[idx];
      n.state = (code === 0) ? "DEAD" : (code === 1 ? "SLEEP" : "ACTIVE");
      n.role = (code === 3 || code === 4) ? "CH" : "MEMBER";
      n.energy = energies[idx] !== undefined ? energies[idx] : n.energy;
    }
  });

  renderNodes();
  renderRoutingLinksAndArrows(links);
  if (animatePackets && links.length > 0 && ViewOptions.packets) spawnPacketsForLinks(links);
}

function renderRoutingLinksAndArrows(links) {
  if (!linkGroup || !arrowGroup) return;
  while (linkGroup.children.length > 0) linkGroup.remove(linkGroup.children[0]);
  while (arrowGroup.children.length > 0) arrowGroup.remove(arrowGroup.children[0]);
  if (!links || links.length === 0 || !ViewOptions.links) return;

  const nodeMap = new Map(State.nodes.map((n) => [n.id, n]));
  const sinkPos = new THREE.Vector3(50, 22, 150);

  links.forEach(([srcId, dstId, kind]) => {
    const srcNode = nodeMap.get(srcId);
    if (!srcNode) return;
    const srcPos = new THREE.Vector3(srcNode.x, 1.8, srcNode.y);
    const dstPos = (dstId === -1) ? sinkPos : (nodeMap.get(dstId) ? new THREE.Vector3(nodeMap.get(dstId).x, 1.8, nodeMap.get(dstId).y) : null);
    if (!dstPos) return;

    let color = MESH_COLORS.MEMBER;
    if (kind === 1) color = MESH_COLORS.CHAIN;
    else if (kind === 2) color = MESH_COLORS.SINK_RELAY;
    else if (kind === 3) color = MESH_COLORS.RELAY;

    linkGroup.add(createThickLinkMesh(srcPos, dstPos, color, kind === 2 ? 0.35 : 0.22));
    if (ViewOptions.arrows) arrowGroup.add(createArrowHeadMesh(srcPos, dstPos, color));
  });
}

function spawnPacketsForLinks(links) {
  const nodeMap = new Map(State.nodes.map((n) => [n.id, n]));
  const sinkPos = new THREE.Vector3(50, 22, 150);
  const maxNew = Math.min(links.length, 120 - activePackets.length);

  for (let i = 0; i < maxNew; i++) {
    const [srcId, dstId] = links[i];
    const srcNode = nodeMap.get(srcId);
    if (!srcNode) continue;
    const srcPos = new THREE.Vector3(srcNode.x, 1.8, srcNode.y);
    const dstPos = (dstId === -1) ? sinkPos : (nodeMap.get(dstId) ? new THREE.Vector3(nodeMap.get(dstId).x, 1.8, nodeMap.get(dstId).y) : null);
    if (!dstPos) continue;

    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38BDF8, depthTest: false }));
    pMesh.position.copy(srcPos); pMesh.renderOrder = 25; packetGroup.add(pMesh);
    activePackets.push({ mesh: pMesh, src: srcPos, dst: dstPos, progress: 0.0, speed: 0.045 + Math.random() * 0.02, isToSink: (dstId === -1) });
  }
}

function setupInteractions() {
  const dom = renderer.domElement;
  dom.addEventListener("mousemove", (e) => {
    const rect = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging && selectedNode && State.activeTool === "relocate") {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(dragPlane);
      if (intersects.length > 0) {
        selectedNode.x = Math.max(2, Math.min(98, Math.round(intersects[0].point.x * 10) / 10));
        selectedNode.y = Math.max(2, Math.min(98, Math.round(intersects[0].point.z * 10) / 10));
        renderNodes();
      }
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes);
    const tooltip = document.getElementById("node-3d-tooltip");
    if (intersects.length > 0) {
      const node = intersects[0].object.userData.nodeData;
      if (tooltip && node) {
        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX + 14}px`; tooltip.style.top = `${e.clientY - 30}px`;
        const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setT("tt-node-id", `Sensor Node #${node.id}`);
        setT("tt-node-role", `${node.role || 'Member'} (${node.state})`);
        setT("tt-node-pos", `(${node.x}m, ${node.y}m)`);
        setT("tt-node-battery", `${(node.energy || 0.5).toFixed(4)} J`);
        setT("tt-node-dist", `${Math.hypot(node.x - 50, node.y - 150).toFixed(1)} m`);
        setT("tt-node-rs", `Rs = ${node.sensing_radius || State.sensingRadius}m`);
      }
    } else if (tooltip) tooltip.style.display = "none";
  });

  dom.addEventListener("mousedown", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes);
    if (State.activeTool === "relocate" && intersects.length > 0) {
      isDragging = true; selectedNode = intersects[0].object.userData.nodeData; controls.enabled = false;
    } else if (State.activeTool === "delete" && intersects.length > 0) {
      State.setNodes(State.nodes.filter((n) => n.id !== intersects[0].object.userData.nodeId));
    } else if (State.activeTool === "inject") {
      const gInt = raycaster.intersectObject(dragPlane);
      if (gInt.length > 0) {
        const pt = gInt[0].point, newId = State.nodes.length > 0 ? Math.max(...State.nodes.map((n) => n.id)) + 1 : 0;
        State.nodes.push({ id: newId, x: Math.round(pt.x * 10) / 10, y: Math.round(pt.z * 10) / 10, initial_energy: 0.5, energy: 0.5, type: "normal", sensing_radius: State.sensingRadius, comm_radius: State.commRadius, state: "ACTIVE", role: "MEMBER" });
        State.setNodes([...State.nodes]);
      }
    }
  });

  window.addEventListener("mouseup", () => { if (isDragging) { isDragging = false; controls.enabled = true; State.setNodes([...State.nodes]); } });
}

export function setCameraView(viewName) {
  if (!camera || !controls) return;
  autoOrbit = false;
  const orbitBtn = document.getElementById("btn-toggle-orbit");
  if (orbitBtn) { orbitBtn.classList.remove("active"); orbitBtn.textContent = "360° Motion"; }
  if (viewName === "top") camera.position.set(50, 190, 65.01);
  else if (viewName === "sink") camera.position.set(50, 40, 200);
  else camera.position.set(50, 145, 195);
  controls.target.set(50, 0, 65); controls.update();
}

export function toggleOrbitCam() {
  autoOrbit = !autoOrbit;
  const orbitBtn = document.getElementById("btn-toggle-orbit");
  if (orbitBtn) { orbitBtn.classList.toggle("active", autoOrbit); orbitBtn.textContent = autoOrbit ? "360° Rotating" : "360° Motion"; }
  return autoOrbit;
}
export function toggleSensingBubbles() { ViewOptions.disks = !ViewOptions.disks; renderNodes(); return ViewOptions.disks; }
export function updateLayerVisibility(layer, isVisible) {
  if (layer in ViewOptions) {
    ViewOptions[layer] = isVisible;
    if (layer === "disks" || layer === "labels") renderNodes();
    if (layer === "links" || layer === "arrows") {
      if (linkGroup) linkGroup.visible = ViewOptions.links;
      if (arrowGroup) arrowGroup.visible = ViewOptions.arrows;
    }
  }
}

function onWindowResize() {
  if (!container || !camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) { controls.autoRotate = autoOrbit; controls.autoRotateSpeed = 1.2; controls.update(); }

  for (let i = activePackets.length - 1; i >= 0; i--) {
    const p = activePackets[i];
    p.progress += p.speed;
    if (p.progress >= 1.0) {
      if (p.isToSink) flashSink();
      packetGroup.remove(p.mesh); activePackets.splice(i, 1);
    } else {
      p.mesh.position.lerpVectors(p.src, p.dst, p.progress);
    }
  }

  if (sinkFlashMesh && sinkFlashMesh.material && sinkFlashMesh.material.opacity > 0) {
    sinkFlashMesh.material.opacity = Math.max(0, sinkFlashMesh.material.opacity - 0.06);
  }
  if (renderer && scene && camera) renderer.render(scene, camera);
}
